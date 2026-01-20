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
        'cancellation_reason',
        'paid_at',
        'accepted_at',
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
        'accepted_at' => 'datetime',
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
        // Legacy: returns first payment for backward compatibility
        return $this->hasOne(Payment::class);
    }

    public function payments()
    {
        // New: returns all payments (one per seller in destination charges model)
        return $this->hasMany(Payment::class);
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

    public function acceptOrder()
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
    }

    public function rejectOrder($reason)
    {
        $this->update([
            'status' => 'cancelled',
            'cancellation_reason' => $reason,
        ]);

        // Restore stock when seller rejects
        foreach ($this->items as $item) {
            $item->product->increment('stock_quantity', $item->quantity);
        }
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
