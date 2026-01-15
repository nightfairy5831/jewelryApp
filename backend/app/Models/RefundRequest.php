<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RefundRequest extends Model
{
    protected $fillable = [
        'payment_id',
        'buyer_id',
        'seller_id',
        'reason',
        'description',
        'status',
        'return_platform_fee',
        'seller_response',
        'responded_at',
        'refunded_at',
    ];

    protected $casts = [
        'return_platform_fee' => 'boolean',
        'responded_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    // Reasons that warrant returning platform fee
    public const FEE_RETURN_REASONS = [
        'defective_product',
        'wrong_item',
        'not_as_described',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function shouldReturnPlatformFee(): bool
    {
        return in_array($this->reason, self::FEE_RETURN_REASONS);
    }

    public function approve(string $response = null): void
    {
        $this->update([
            'status' => 'approved',
            'seller_response' => $response,
            'responded_at' => now(),
            'return_platform_fee' => $this->shouldReturnPlatformFee(),
        ]);
    }

    public function reject(string $response): void
    {
        $this->update([
            'status' => 'rejected',
            'seller_response' => $response,
            'responded_at' => now(),
        ]);
    }

    public function markAsRefunded(): void
    {
        $this->update([
            'status' => 'refunded',
            'refunded_at' => now(),
        ]);
    }
}
