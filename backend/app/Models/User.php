<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'seller_status',
        'seller_approved',
        'seller_requested_at',
        'seller_approved_by',
        'seller_approved_at',
        'google_id',
        'avatar_url',
        'is_active',
        'mercadopago_connected',
        'mercadopago_user_id',
        'mercadopago_access_token',
        'mercadopago_refresh_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'mercadopago_access_token',
        'mercadopago_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'seller_approved' => 'boolean',
            'seller_requested_at' => 'datetime',
            'seller_approved_at' => 'datetime',
            'is_active' => 'boolean',
            'mercadopago_connected' => 'boolean',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'seller_status' => $this->seller_status,
            'is_active' => $this->is_active,
        ];
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin' || $this->isSuperAdmin();
    }

    /**
     * Check if user is seller (includes pending sellers)
     */
    public function isSeller(): bool
    {
        return $this->role === 'seller';
    }

    /**
     * Check if seller is approved
     */
    public function isApprovedSeller(): bool
    {
        return $this->role === 'seller' && ($this->seller_approved || $this->seller_status === 'approved');
    }

    /**
     * Check if user is buyer
     */
    public function isBuyer(): bool
    {
        return $this->role === 'buyer';
    }

    /**
     * Check if seller has connected Mercado Pago account
     */
    public function hasMercadoPagoAccount(): bool
    {
        return $this->mercadopago_connected && $this->mercadopago_user_id;
    }

    /**
     * Seller who approved this seller (if applicable)
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'seller_approved_by');
    }
}
