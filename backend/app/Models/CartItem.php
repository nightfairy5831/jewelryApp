<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'product_id',
        'seller_id',
        'quantity',
        'price_at_time_of_add',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price_at_time_of_add' => 'decimal:2',
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function getTotalPriceAttribute()
    {
        return $this->price_at_time_of_add * $this->quantity;
    }
}
