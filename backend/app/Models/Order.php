<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Events\OrderCreated;
use App\Events\OrderShipped;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'buyer_id',
        'status',
        'total_amount',
        'tax_amount',
        'shipping_amount',
        'shipping_address',
        'tracking_number',
        'paid_at',
        'shipped_at',
        'stock_reserved',
        'reserved_until',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'shipping_address' => 'json',
        'paid_at' => 'datetime',
        'shipped_at' => 'datetime',
        'stock_reserved' => 'boolean',
        'reserved_until' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($order) {
            $order->order_number = self::generateOrderNumber();
        });

        static::created(function ($order) {
            event(new OrderCreated($order));
        });
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function markAsShipped($trackingNumber = null)
    {
        $this->update([
            'status' => 'shipped',
            'tracking_number' => $trackingNumber,
            'shipped_at' => now(),
        ]);

        event(new OrderShipped($this));
    }

    public function markAsPaid()
    {
        $this->update([
            'status' => 'confirmed',
            'paid_at' => now(),
        ]);
    }

    public static function generateOrderNumber()
    {
        $date = now()->format('Ymd');
        $random = str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
        return 'FALA-' . $date . '-' . $random;
    }

    /**
     * Release reserved stock if order is not paid within timeout period
     */
    public function releaseReservedStock()
    {
        if (!$this->stock_reserved) {
            return;
        }

        // Restore stock for all order items
        foreach ($this->items as $item) {
            $item->product->increment('stock_quantity', $item->quantity);
        }

        $this->update([
            'stock_reserved' => false,
            'status' => 'cancelled',
        ]);
    }

    /**
     * Check if stock reservation has expired
     */
    public function isReservationExpired(): bool
    {
        if (!$this->stock_reserved || !$this->reserved_until) {
            return false;
        }

        return now()->isAfter($this->reserved_until);
    }
}
