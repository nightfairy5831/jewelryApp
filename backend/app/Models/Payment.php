<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'seller_id',
        'payment_method',
        'amount',
        'application_fee',
        'status',
        'mp_payment_id',
        'card_token_id',
        'transaction_id',
        'gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'application_fee' => 'decimal:2',
        'gateway_response' => 'json',
        'paid_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function markAsCompleted($mpPaymentId = null, $gatewayResponse = null)
    {
        $this->update([
            'status' => 'completed',
            'mp_payment_id' => $mpPaymentId ?? $this->mp_payment_id,
            'gateway_response' => $gatewayResponse,
            'paid_at' => now(),
        ]);

        // Check if ALL payments for this order are completed
        $order = $this->order;
        $allPayments = Payment::where('order_id', $order->id)->get();
        $allCompleted = $allPayments->every(fn($p) => $p->status === 'completed');

        if ($allCompleted) {
            $order->markAsPaid();
            $order->update(['stock_reserved' => false]);
        }
    }

    public function markAsFailed($gatewayResponse = null)
    {
        $this->update([
            'status' => 'failed',
            'gateway_response' => $gatewayResponse,
        ]);
    }
}
