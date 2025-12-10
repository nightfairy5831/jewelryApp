<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoldPrice;
use Illuminate\Http\Request;

class GoldPriceController extends Controller
{
    public function getCurrentPrice()
    {
        $latest = GoldPrice::getLatest();

        if (!$latest) {
            return response()->json([
                'success' => false,
                'message' => 'No gold price data available',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'price' => (float) $latest->price_per_gram,
                'price_24k' => (float) $latest->price_gram_24k,
                'price_22k' => (float) $latest->price_gram_22k,
                'price_21k' => (float) $latest->price_gram_21k,
                'price_20k' => (float) $latest->price_gram_20k,
                'price_18k' => (float) $latest->price_gram_18k,
                'price_16k' => (float) $latest->price_gram_16k,
                'price_14k' => (float) $latest->price_gram_14k,
                'price_10k' => (float) $latest->price_gram_10k,
                'source' => $latest->source,
                'updated_at' => $latest->scraped_at->toISOString(),
            ],
        ]);
    }
}
