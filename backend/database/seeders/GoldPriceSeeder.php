<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\GoldPrice;
use Carbon\Carbon;

class GoldPriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        GoldPrice::truncate();

        // Base price in BRL (converted from ~$132.22 USD at ~5.0 rate)
        $basePrice24k = 661.10;

        for ($i = 9; $i >= 0; $i--) {
            $variation = rand(-2500, 2500) / 100; // Adjusted for BRL
            $price24k = round($basePrice24k + $variation, 2);

            GoldPrice::create([
                'price_per_gram' => $price24k,
                'price_gram_24k' => $price24k,
                'price_gram_22k' => round($price24k * 0.9167, 2),
                'price_gram_21k' => round($price24k * 0.875, 2),
                'price_gram_20k' => round($price24k * 0.8333, 2),
                'price_gram_18k' => round($price24k * 0.75, 2),
                'price_gram_16k' => round($price24k * 0.6667, 2),
                'price_gram_14k' => round($price24k * 0.5833, 2),
                'price_gram_10k' => round($price24k * 0.4167, 2),
                'currency' => 'BRL',
                'source' => 'mock_api',
                'scraped_at' => Carbon::now()->subHours($i),
            ]);
        }
    }
}
