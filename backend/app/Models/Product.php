<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{

    protected $fillable = [
        'seller_id',
        'name',
        'description',
        'base_price',
        'current_price',
        'gold_weight_grams',
        'gold_karat',
        'material',
        'initial_gold_price',
        'category',
        'subcategory',
        'filling',
        'is_gemstone',
        'images',
        'videos',
        'model_3d_url',
        'model_3d_type',
        'stock_quantity',
        'is_active',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'current_price' => 'decimal:2',
        'gold_weight_grams' => 'decimal:3',
        'initial_gold_price' => 'decimal:2',
        'images' => 'json',
        'videos' => 'json',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function approve($adminId)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $adminId,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    public function reject($adminId, $reason)
    {
        $this->update([
            'status' => 'rejected',
            'approved_by' => $adminId,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function calculateCurrentPrice(GoldPrice $goldPrice)
    {
        // Non-gold materials (Outros) don't have price fluctuations
        if ($this->material === 'Outros') {
            return $this->base_price;
        }

        // Only 18k and 10k gold have price fluctuations based on gold weight
        if (!in_array($this->material, ['Ouro 18K', 'Ouro 10K'])) {
            return $this->base_price;
        }

        if (!$this->initial_gold_price || $this->initial_gold_price == 0) {
            return $this->base_price;
        }

        // Get the appropriate karat price field
        $karatField = 'price_gram_' . strtolower($this->gold_karat ?? '18k');
        $currentKaratPrice = $goldPrice->$karatField ?? $goldPrice->price_per_gram;

        $priceRatio = $currentKaratPrice / $this->initial_gold_price;
        return round($this->base_price * $priceRatio, 2);
    }
}
