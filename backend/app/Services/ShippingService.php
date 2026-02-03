<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShippingService
{
    private string $baseUrl;
    private ?string $token;
    private string $userId;
    private string $shippingCompanyId;
    private string $defaultModality;

    public function __construct()
    {
        $this->baseUrl = config('services.apponlog.base_url', 'https://apponlog.com.br');
        $this->token = config('services.apponlog.token');
        $this->userId = config('services.apponlog.user_id', '17926');
        $this->shippingCompanyId = config('services.apponlog.shipping_company_id', '132226');
        $this->defaultModality = config('services.apponlog.default_modality', '133');
    }

    /**
     * Get a shipping cost quote based on destination postal code and items
     */
    public function getShippingQuote(string $postalCode, array $items): array
    {
        if (!$this->token) {
            return $this->mockGetShippingQuote($postalCode, $items);
        }

        try {
            $totalWeight = collect($items)->sum(function ($item) {
                return ($item['weight'] ?? 0.1) * ($item['quantity'] ?? 1);
            });
            $totalWeight = max($totalWeight, 0.1);

            $declaredValue = collect($items)->sum(function ($item) {
                return ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
            });

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($this->baseUrl . '/api/cotacao/calcular', [
                'idOperador' => $this->userId,
                'idModalidade' => $this->defaultModality,
                'cepDestino' => preg_replace('/\D/', '', $postalCode),
                'peso' => $totalWeight,
                'valorDeclarado' => $declaredValue,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'shipping_cost' => $data['valor'] ?? $data['vlFrete'] ?? 0,
                    'estimated_days' => $data['prazo'] ?? $data['prazoEntrega'] ?? 7,
                    'carrier' => 'onlog',
                ];
            }

            Log::warning('Onlog shipping quote failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->mockGetShippingQuote($postalCode, $items);

        } catch (\Exception $e) {
            Log::error('Onlog shipping quote error: ' . $e->getMessage());
            return $this->mockGetShippingQuote($postalCode, $items);
        }
    }

    /**
     * Create a shipment for an order
     */
    public function createShipment(Order $order, ?string $modality = null): array
    {
        if (!$this->token) {
            return $this->mockCreateShipment($order);
        }

        try {
            $shippingAddress = json_decode($order->shipping_address, true);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->baseUrl . '/api/pedido/incluir', [
                'idOperador' => $this->userId,
                'idModalidade' => $modality ?? $this->defaultModality,
                'nomeOperador' => $this->shippingCompanyId,
                'nomeDestinatario' => $order->buyer->name,
                'emailDestinatario' => $order->buyer->email,
                'enderecoDestinatario' => $shippingAddress['street'] ?? '',
                'numeroDestinatario' => $shippingAddress['number'] ?? '',
                'complementoDestinatario' => $shippingAddress['complement'] ?? '',
                'bairroDestinatario' => $shippingAddress['neighborhood'] ?? '',
                'cidadeDestinatario' => $shippingAddress['city'] ?? '',
                'estadoDestinatario' => $shippingAddress['state'] ?? '',
                'cepDestinatario' => $shippingAddress['zipcode'] ?? '',
                'numeroNotaFiscal' => $order->order_number,
                'valorDeclarado' => $order->total_amount,
                'peso' => 0.5,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'shipment_id' => $data['idPedido'] ?? null,
                    'tracking_number' => $data['codigoRastreamento'] ?? null,
                    'label_url' => $data['urlEtiqueta'] ?? null,
                    'carrier' => 'onlog',
                ];
            }

            Log::warning('Onlog API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => 'Falha ao criar envio: ' . ($response->json()['data'] ?? $response->status()),
            ];

        } catch (\Exception $e) {
            Log::error('Onlog shipment creation error: ' . $e->getMessage());
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
        if (!$this->token) {
            return $this->mockGetTracking($trackingNumber);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->timeout(15)->get($this->baseUrl . '/api/rastreamento/' . $trackingNumber);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'carrier' => 'onlog',
                    'status' => $data['status'] ?? 'unknown',
                    'estimated_delivery' => $data['previsaoEntrega'] ?? null,
                    'events' => $data['eventos'] ?? [],
                ];
            }

            return [
                'success' => false,
                'error' => 'Falha ao obter rastreamento',
            ];

        } catch (\Exception $e) {
            Log::error('Onlog tracking error: ' . $e->getMessage());
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
        $trackingNumber = 'BR' . rand(100000000, 999999999) . 'ON';

        return [
            'success' => true,
            'shipment_id' => $shipmentId,
            'tracking_number' => $trackingNumber,
            'label_url' => null,
            'carrier' => 'onlog',
        ];
    }

    /**
     * Mock shipping quote for development/testing
     */
    private function mockGetShippingQuote(string $postalCode, array $items): array
    {
        $totalWeight = collect($items)->sum(function ($item) {
            return ($item['weight'] ?? 0.1) * ($item['quantity'] ?? 1);
        });

        $declaredValue = collect($items)->sum(function ($item) {
            return ($item['price'] ?? 0) * ($item['quantity'] ?? 1);
        });

        // Simple mock calculation: base R$5 + R$2 per 100g + 1% of declared value
        $baseCost = 5.00;
        $weightCost = ceil($totalWeight / 0.1) * 2.00;
        $valueCost = $declaredValue * 0.01;
        $shippingCost = round($baseCost + $weightCost + $valueCost, 2);

        return [
            'success' => true,
            'shipping_cost' => $shippingCost,
            'estimated_days' => rand(3, 7),
            'carrier' => 'onlog',
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
            'carrier' => 'onlog',
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
                    'location' => 'Agência Onlog - SP',
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
