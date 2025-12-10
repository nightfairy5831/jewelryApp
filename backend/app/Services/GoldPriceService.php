<?php

namespace App\Services;

use App\Models\GoldPrice;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoldPriceService
{
    public function fetchAndUpdate(): array
    {
        try {
            $prices = $this->fetchGoldPrice();

            $previous = GoldPrice::latest('scraped_at')->first();

            $goldPrice = GoldPrice::create([
                'price_per_gram' => $prices['price_gram_24k'],
                'price_gram_24k' => $prices['price_gram_24k'],
                'price_gram_22k' => $prices['price_gram_22k'],
                'price_gram_21k' => $prices['price_gram_21k'],
                'price_gram_20k' => $prices['price_gram_20k'],
                'price_gram_18k' => $prices['price_gram_18k'],
                'price_gram_16k' => $prices['price_gram_16k'],
                'price_gram_14k' => $prices['price_gram_14k'],
                'price_gram_10k' => $prices['price_gram_10k'],
                'currency' => 'USD',
                'source' => 'mock_api',
                'scraped_at' => now(),
            ]);

            $this->cleanupOldPrices();

            $this->updateProductPrices($goldPrice);

            $changePercent = 0;
            if ($previous) {
                $changePercent = (($goldPrice->price_gram_24k - $previous->price_gram_24k) / $previous->price_gram_24k) * 100;
            }

            return [
                'success' => true,
                'price' => $goldPrice->price_gram_24k,
                'change_percent' => round($changePercent, 2),
                'previous_price' => $previous?->price_gram_24k,
            ];

        } catch (\Exception $e) {
            Log::error('Gold price fetch failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function cleanupOldPrices(): void
    {
        // Keep only the last 10 gold prices
        $keepIds = GoldPrice::latest('scraped_at')
            ->limit(10)
            ->pluck('id');

        GoldPrice::whereNotIn('id', $keepIds)->delete();
    }

    /**
     * Test fetch gold price from GoldAPI.io (one-time fetch for testing)
     *
     * @return array
     */
    public function testFetchGoldPrice(): array
    {
        try {
            $apiKey = env('GOLDAPI_KEY');

            if (!$apiKey) {
                return [
                    'success' => false,
                    'error' => 'GOLDAPI_KEY not configured in .env file',
                ];
            }

            $response = Http::withHeaders([
                'x-access-token' => $apiKey,
            ])->timeout(10)->get('https://www.goldapi.io/api/XAU/USD');

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success' => true,
                    'price_gram_24k' => $data['price_gram_24k'] ?? null,
                    'price_gram_22k' => $data['price_gram_22k'] ?? null,
                    'price_gram_21k' => $data['price_gram_21k'] ?? null,
                    'price_gram_20k' => $data['price_gram_20k'] ?? null,
                    'price_gram_18k' => $data['price_gram_18k'] ?? null,
                    'price_gram_16k' => $data['price_gram_16k'] ?? null,
                    'price_gram_14k' => $data['price_gram_14k'] ?? null,
                    'price_gram_10k' => $data['price_gram_10k'] ?? null,
                    'currency' => 'USD',
                    'metal' => $data['metal'] ?? 'XAU',
                    'timestamp' => $data['timestamp'] ?? now()->timestamp,
                    'date' => isset($data['timestamp']) ? date('Y-m-d H:i:s', $data['timestamp']) : now()->toDateTimeString(),
                    'raw_response' => $data,
                ];
            }

            return [
                'success' => false,
                'error' => 'API request failed',
                'status_code' => $response->status(),
                'message' => $response->body(),
            ];

        } catch (\Exception $e) {
            Log::error('GoldAPI test fetch error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Exception occurred',
                'message' => $e->getMessage(),
            ];
        }
    }

    public function saveGoldPriceFromApi(array $apiResult): void
    {
        GoldPrice::create([
            'price_per_gram' => $apiResult['price_gram_24k'],
            'price_gram_24k' => $apiResult['price_gram_24k'],
            'price_gram_22k' => $apiResult['price_gram_22k'],
            'price_gram_21k' => $apiResult['price_gram_21k'],
            'price_gram_20k' => $apiResult['price_gram_20k'],
            'price_gram_18k' => $apiResult['price_gram_18k'],
            'price_gram_16k' => $apiResult['price_gram_16k'],
            'price_gram_14k' => $apiResult['price_gram_14k'],
            'price_gram_10k' => $apiResult['price_gram_10k'],
            'currency' => $apiResult['currency'],
            'source' => 'goldapi',
            'scraped_at' => now(),
        ]);

        $this->cleanupOldPrices();
    }

    public function testFetchConversionRate(): array
    {
        try {
            $apiKey = env('EXCHANGERATE_API_KEY');

            if (!$apiKey) {
                return [
                    'success' => false,
                    'error' => 'EXCHANGERATE_API_KEY not configured in .env file',
                ];
            }

            $response = Http::timeout(10)->get('https://api.exchangerate.host/convert', [
                'access_key' => $apiKey,
                'from' => 'USD',
                'to' => 'BRL',
                'amount' => 1,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['success']) && $data['success'] === false) {
                    return [
                        'success' => false,
                        'error' => $data['error']['type'] ?? 'API Error',
                        'message' => $data['error']['info'] ?? 'Unknown error',
                        'raw_response' => $data,
                    ];
                }

                $rate = $data['result'] ?? $data['info']['rate'] ?? null;

                return [
                    'success' => true,
                    'from' => 'USD',
                    'to' => 'BRL',
                    'rate' => $rate,
                    'date' => $data['date'] ?? now()->toDateString(),
                    'raw_response' => $data,
                ];
            }

            return [
                'success' => false,
                'error' => 'API request failed',
                'status_code' => $response->status(),
                'message' => $response->body(),
            ];

        } catch (\Exception $e) {
            Log::error('ExchangeRate test fetch error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Exception occurred',
                'message' => $e->getMessage(),
            ];
        }
    }

    private function fetchGoldPrice(): array
    {
        $apiKey = env('GOLDAPI_KEY');

        if (!$apiKey) {
            return $this->generateMockGoldPrices();
        }

        try {
            $response = Http::withHeaders([
                'x-access-token' => $apiKey,
            ])->timeout(10)->get('https://www.goldapi.io/api/XAU/USD');

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'price_gram_24k' => $data['price_gram_24k'] ?? null,
                    'price_gram_22k' => $data['price_gram_22k'] ?? null,
                    'price_gram_21k' => $data['price_gram_21k'] ?? null,
                    'price_gram_20k' => $data['price_gram_20k'] ?? null,
                    'price_gram_18k' => $data['price_gram_18k'] ?? null,
                    'price_gram_16k' => $data['price_gram_16k'] ?? null,
                    'price_gram_14k' => $data['price_gram_14k'] ?? null,
                    'price_gram_10k' => $data['price_gram_10k'] ?? null,
                ];
            }

            Log::warning('GoldAPI request failed, using mock price');
            return $this->generateMockGoldPrices();

        } catch (\Exception $e) {
            Log::error('GoldAPI fetch error: ' . $e->getMessage());
            return $this->generateMockGoldPrices();
        }
    }

    private function generateMockGoldPrices(): array
    {
        // Get the last gold price to create realistic variations
        $lastPrice = GoldPrice::latest('scraped_at')->first();

        // Base price: use last price or default to $132.22
        $basePrice24k = $lastPrice ? $lastPrice->price_gram_24k : 132.22;

        // Generate random variation between -$5.00 and +$5.00 (same as seeder)
        $variation = rand(-500, 500) / 100;
        $price24k = round($basePrice24k + $variation, 2);

        return [
            'price_gram_24k' => $price24k,
            'price_gram_22k' => round($price24k * 0.9167, 2),
            'price_gram_21k' => round($price24k * 0.875, 2),
            'price_gram_20k' => round($price24k * 0.8333, 2),
            'price_gram_18k' => round($price24k * 0.75, 2),
            'price_gram_16k' => round($price24k * 0.6667, 2),
            'price_gram_14k' => round($price24k * 0.5833, 2),
            'price_gram_10k' => round($price24k * 0.4167, 2),
        ];
    }

    private function updateProductPrices(GoldPrice $goldPrice): void
    {
        Product::where('status', 'approved')
            ->where('is_active', true)
            ->chunk(100, function ($products) use ($goldPrice) {
                foreach ($products as $product) {
                    $newPrice = $product->calculateCurrentPrice($goldPrice);
                    $product->update(['current_price' => $newPrice]);
                }
            });
    }
}
