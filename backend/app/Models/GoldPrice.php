<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoldPrice extends Model
{
    protected $fillable = [
        'price_per_gram',
        'price_gram_24k',
        'price_gram_22k',
        'price_gram_21k',
        'price_gram_20k',
        'price_gram_18k',
        'price_gram_16k',
        'price_gram_14k',
        'price_gram_10k',
        'currency',
        'source',
        'scraped_at',
    ];

    protected $casts = [
        'price_per_gram' => 'decimal:2',
        'price_gram_24k' => 'decimal:2',
        'price_gram_22k' => 'decimal:2',
        'price_gram_21k' => 'decimal:2',
        'price_gram_20k' => 'decimal:2',
        'price_gram_18k' => 'decimal:2',
        'price_gram_16k' => 'decimal:2',
        'price_gram_14k' => 'decimal:2',
        'price_gram_10k' => 'decimal:2',
        'scraped_at' => 'datetime',
    ];

    public static function getLatest()
    {
        return self::latest('scraped_at')->first();
    }

    public static function getHistory($days = 30)
    {
        return self::where('scraped_at', '>=', now()->subDays($days))
            ->orderBy('scraped_at', 'desc')
            ->get();
    }

    public static function getRecentForChart($limit = 10)
    {
        return self::latest('scraped_at')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($price) {
                return [
                    'id' => $price->id,
                    'price' => (float) ($price->price_gram_24k ?? $price->price_per_gram),
                    'price_gram_24k' => (float) ($price->price_gram_24k ?? $price->price_per_gram),
                    'time' => $price->scraped_at->format('H') . 'h',
                    'date' => $price->scraped_at->format('d/m/Y'),
                    'timestamp' => $price->scraped_at->timestamp,
                ];
            });
    }
}
