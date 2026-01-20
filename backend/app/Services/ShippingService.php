<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShippingService
{
    private string $baseUrl;
    private ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.apponlog.base_url', 'https://api.apponlog.com.br');
        $this->apiKey = config('services.apponlog.api_key');
    }

    /**
     * Create a shipment for an order
     */
    public function createShipment(Order $order): array
    {
        // If no API key configured, use mock implementation
        if (!$this->apiKey) {
            return $this->mockCreateShipment($order);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->baseUrl . '/shipments', [
                'reference_id' => $order->order_number,
                'recipient' => [
                    'name' => $order->buyer->name,
                    'email' => $order->buyer->email,
                    'address' => $order->shipping_address,
                ],
                'package' => [
                    'weight' => 0.5, // Default weight in kg
                    'dimensions' => [
                        'length' => 20,
                        'width' => 15,
                        'height' => 5,
                    ],
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'shipment_id' => $data['shipment_id'] ?? null,
                    'tracking_number' => $data['tracking_number'] ?? null,
                    'label_url' => $data['label_url'] ?? null,
                    'carrier' => $data['carrier'] ?? 'apponlog',
                ];
            }

            Log::warning('Apponlog API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => 'Falha ao criar envio: ' . $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('Apponlog shipment creation error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Erro ao conectar com serviço de envio',
            ];
        }
    }

    /**
     * Get tracking information for an order
     */
    public function getTracking(string $trackingNumber): array
    {
        // If no API key configured, use mock implementation
        if (!$this->apiKey) {
            return $this->mockGetTracking($trackingNumber);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->timeout(15)->get($this->baseUrl . '/tracking/' . $trackingNumber);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'carrier' => $data['carrier'] ?? 'apponlog',
                    'status' => $data['status'] ?? 'unknown',
                    'estimated_delivery' => $data['estimated_delivery'] ?? null,
                    'events' => $data['events'] ?? [],
                ];
            }

            return [
                'success' => false,
                'error' => 'Falha ao obter rastreamento',
            ];

        } catch (\Exception $e) {
            Log::error('Apponlog tracking error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Erro ao conectar com serviço de rastreamento',
            ];
        }
    }

    /**
     * Mock shipment creation for development/testing
     */
    private function mockCreateShipment(Order $order): array
    {
        $shipmentId = 'SHP' . strtoupper(Str::random(8));
        $trackingNumber = 'BR' . rand(100000000, 999999999) . 'AP';

        return [
            'success' => true,
            'shipment_id' => $shipmentId,
            'tracking_number' => $trackingNumber,
            'label_url' => null,
            'carrier' => 'apponlog',
        ];
    }

    /**
     * Mock tracking data for development/testing
     */
    private function mockGetTracking(string $trackingNumber): array
    {
        $now = now();

        return [
            'success' => true,
            'tracking_number' => $trackingNumber,
            'carrier' => 'apponlog',
            'status' => 'in_transit',
            'estimated_delivery' => $now->addDays(3)->format('Y-m-d'),
            'events' => [
                [
                    'status' => 'in_transit',
                    'description' => 'Objeto em trânsito - por favor aguarde',
                    'location' => 'Centro de Distribuição - SP',
                    'timestamp' => $now->subHours(2)->toIso8601String(),
                ],
                [
                    'status' => 'posted',
                    'description' => 'Objeto postado',
                    'location' => 'Agência dos Correios - SP',
                    'timestamp' => $now->subDay()->toIso8601String(),
                ],
                [
                    'status' => 'created',
                    'description' => 'Objeto criado',
                    'location' => 'Sistema',
                    'timestamp' => $now->subDays(2)->toIso8601String(),
                ],
            ],
        ];
    }
}
