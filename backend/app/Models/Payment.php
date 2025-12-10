<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'payment_method',
        'amount',
        'status',
        'transaction_id',
        'gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'json',
        'paid_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function markAsCompleted($transactionId = null, $gatewayResponse = null)
    {
        $this->update([
            'status' => 'completed',
            'transaction_id' => $transactionId,
            'gateway_response' => $gatewayResponse,
            'paid_at' => now(),
        ]);

        // Mark order as paid and release stock reservation (permanently sold)
        $this->order->markAsPaid();
        $this->order->update(['stock_reserved' => false]);
    }

    public function markAsFailed($gatewayResponse = null)
    {
        $this->update([
            'status' => 'failed',
            'gateway_response' => $gatewayResponse,
        ]);
    }
}
