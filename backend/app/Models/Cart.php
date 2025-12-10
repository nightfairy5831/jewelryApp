<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function calculateSubtotal()
    {
        return $this->items->sum(function ($item) {
            return $item->price_at_time_of_add * $item->quantity;
        });
    }

    public function calculateTotal($shippingCost = 0, $taxAmount = 0)
    {
        return $this->calculateSubtotal() + $shippingCost + $taxAmount;
    }
}
