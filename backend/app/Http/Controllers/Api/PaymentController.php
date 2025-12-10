<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;

class PaymentController extends Controller
{
    // Test Mercado Pago API connection
    public function testConnection()
    {
        try {
            $accessToken = config('services.mercadopago.access_token');
            $publicKey = config('services.mercadopago.public_key');

            // Check if credentials are configured
            if (!$accessToken || !$publicKey) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Mercado Pago credentials not configured',
                    'credentials' => [
                        'access_token' => $accessToken ? 'Set' : 'Missing',
                        'public_key' => $publicKey ? 'Set' : 'Missing',
                    ],
                ], 500);
            }

            // Initialize SDK v3
            MercadoPagoConfig::setAccessToken($accessToken);

            // Try to create a test preference using SDK v3
            $client = new PreferenceClient();

            $preferenceData = [
                'items' => [
                    [
                        'title' => 'Test Connection',
                        'quantity' => 1,
                        'unit_price' => 10.00,
                    ]
                ],
                'back_urls' => [
                    'success' => config('app.url') . '/test-success',
                    'failure' => config('app.url') . '/test-failure',
                    'pending' => config('app.url') . '/test-pending',
                ],
                'auto_return' => 'approved',
            ];

            $preference = $client->create($preferenceData);

            // Detect environment: If sandbox_init_point exists, it's test mode
            $isSandbox = isset($preference->sandbox_init_point) && $preference->sandbox_init_point !== null;

            // If we get here, the API is working
            return response()->json([
                'status' => 'success',
                'message' => 'Mercado Pago API connection successful!',
                'sdk_version' => MercadoPagoConfig::$CURRENT_VERSION,
                'environment' => $isSandbox ? 'sandbox' : 'production',
                'credentials' => [
                    'access_token' => substr($accessToken, 0, 20) . '...' . substr($accessToken, -10),
                    'public_key' => substr($publicKey, 0, 20) . '...' . substr($publicKey, -10),
                ],
                'test_preference' => [
                    'id' => $preference->id,
                    'sandbox_init_point' => $preference->sandbox_init_point ?? null,
                    'init_point' => $preference->init_point ?? null,
                ],
            ]);

        } catch (MPApiException $e) {
            Log::error('Mercado Pago API Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Mercado Pago API error: ' . $e->getMessage(),
                'error_code' => $e->getCode(),
            ], 500);
        } catch (\Exception $e) {
            Log::error('Mercado Pago connection test failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Connection test failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // Create payment with Mercado Pago (SDK v3)
    public function createIntent(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:orders,id',
            ]);

            $user = Auth::user();

            Log::info('Creating payment intent', [
                'user_id' => $user->id,
                'order_id' => $request->order_id,
            ]);

            $order = Order::where('buyer_id', $user->id)
                ->findOrFail($request->order_id);

            $payment = Payment::where('order_id', $order->id)->firstOrFail();

            if ($payment->status !== 'pending') {
                return response()->json(['error' => 'Payment already processed'], 400);
            }

            // Initialize Mercado Pago SDK v3
            $accessToken = config('services.mercadopago.access_token');

            if (!$accessToken) {
                Log::error('Mercado Pago access token not configured');
                return response()->json([
                    'message' => 'Payment gateway not configured. Please contact support.'
                ], 500);
            }

            MercadoPagoConfig::setAccessToken($accessToken);

            $client = new PreferenceClient();

            // Build payment methods exclusion based on selected method
            $excludedPaymentTypes = [];
            if ($payment->payment_method === 'pix') {
                $excludedPaymentTypes = [
                    ['id' => 'credit_card'],
                    ['id' => 'debit_card'],
                    ['id' => 'ticket'],
                ];
            } elseif ($payment->payment_method === 'credit_card') {
                $excludedPaymentTypes = [
                    ['id' => 'ticket'],
                ];
            } elseif ($payment->payment_method === 'boleto') {
                $excludedPaymentTypes = [
                    ['id' => 'credit_card'],
                    ['id' => 'debit_card'],
                ];
            }

            // Create preference data
            $preferenceData = [
                'items' => [
                    [
                        'title' => "Order #{$order->order_number}",
                        'quantity' => 1,
                        'unit_price' => (float) $payment->amount,
                    ]
                ],
                'payment_methods' => [
                    'excluded_payment_types' => $excludedPaymentTypes,
                ],
                'external_reference' => (string) $order->id,
                'metadata' => [
                    'order_id' => $order->id,
                    'payment_id' => $payment->id,
                ],
                'notification_url' => config('app.url') . '/api/payments/webhook',
                'back_urls' => [
                    'success' => config('app.url') . '/payment-success',
                    'failure' => config('app.url') . '/payment-failure',
                    'pending' => config('app.url') . '/payment-pending',
                ],
                'auto_return' => 'approved',
            ];

            $preference = $client->create($preferenceData);

            $payment->update([
                'transaction_id' => $preference->id,
                'gateway_response' => [
                    'preference_id' => $preference->id,
                    'init_point' => $preference->init_point,
                    'sandbox_init_point' => $preference->sandbox_init_point,
                ],
            ]);

            return response()->json([
                'preference_id' => $preference->id,
                'init_point' => $preference->init_point,
                'sandbox_init_point' => $preference->sandbox_init_point,
                'payment' => $payment,
            ]);

        } catch (MPApiException $e) {
            Log::error('Mercado Pago payment creation failed', [
                'message' => $e->getMessage(),
                'order_id' => $order->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to create payment: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            Log::error('Payment creation failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Server Error',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while processing your payment'
            ], 500);
        }
    }

    // Mercado Pago webhook handler (IPN) - SDK v3
    public function webhook(Request $request)
    {
        try {
            $type = $request->input('type');

            // Handle payment notification
            if ($type === 'payment') {
                $paymentId = $request->input('data.id');

                if (!$paymentId) {
                    return response()->json(['status' => 'error', 'message' => 'No payment ID'], 400);
                }

                // Get payment info from Mercado Pago using SDK v3
                MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));
                $client = new PaymentClient();
                $mpPayment = $client->get($paymentId);

                if (!$mpPayment) {
                    return response()->json(['status' => 'error', 'message' => 'Payment not found'], 404);
                }

                // Get order from external reference
                $orderId = $mpPayment->external_reference;
                $order = Order::find($orderId);

                if (!$order) {
                    Log::error("Order not found for external reference: {$orderId}");
                    return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
                }

                $payment = Payment::where('order_id', $order->id)->first();

                if (!$payment) {
                    Log::error("Payment record not found for order: {$orderId}");
                    return response()->json(['status' => 'error', 'message' => 'Payment record not found'], 404);
                }

                // Handle payment status
                switch ($mpPayment->status) {
                    case 'approved':
                        $this->handlePaymentSuccess([
                            'id' => $mpPayment->id,
                            'status' => $mpPayment->status,
                            'transaction_id' => $payment->transaction_id,
                        ]);
                        break;

                    case 'rejected':
                    case 'cancelled':
                        $this->handlePaymentFailure([
                            'id' => $mpPayment->id,
                            'status' => $mpPayment->status,
                            'transaction_id' => $payment->transaction_id,
                        ]);
                        break;

                    case 'pending':
                    case 'in_process':
                        // Payment is still processing, do nothing
                        Log::info("Payment {$mpPayment->id} is {$mpPayment->status}");
                        break;
                }
            }

            return response()->json(['status' => 'success']);

        } catch (MPApiException $e) {
            Log::error('Mercado Pago webhook API error', [
                'message' => $e->getMessage(),
                'request' => $request->all(),
            ]);
            return response()->json(['error' => 'Webhook processing failed'], 400);
        } catch (\Exception $e) {
            Log::error('Mercado Pago webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook processing failed'], 400);
        }
    }

    // Handle successful payment
    private function handlePaymentSuccess($paymentIntent)
    {
        $transactionId = $paymentIntent['id'] ?? null;

        $payment = Payment::where('transaction_id', $transactionId)->first();

        if ($payment) {
            $payment->markAsCompleted($transactionId, $paymentIntent);

            Log::info("Payment completed for order #{$payment->order->order_number}");
        }
    }

    // Handle failed payment
    private function handlePaymentFailure($paymentIntent)
    {
        $transactionId = $paymentIntent['id'] ?? null;

        $payment = Payment::where('transaction_id', $transactionId)->first();

        if ($payment) {
            $payment->markAsFailed($paymentIntent);

            Log::warning("Payment failed for order #{$payment->order->order_number}");
        }
    }

    // Get payment status
    public function status($id)
    {
        $user = Auth::user();

        $payment = Payment::with('order')
            ->whereHas('order', function ($query) use ($user) {
                $query->where('buyer_id', $user->id);
            })
            ->findOrFail($id);

        return response()->json($payment);
    }

    // Retry failed payment
    public function retry($id)
    {
        $user = Auth::user();

        $payment = Payment::with('order')
            ->whereHas('order', function ($query) use ($user) {
                $query->where('buyer_id', $user->id);
            })
            ->findOrFail($id);

        if ($payment->status !== 'failed') {
            return response()->json(['error' => 'Only failed payments can be retried'], 400);
        }

        $payment->update(['status' => 'pending']);

        return response()->json([
            'message' => 'Payment retry initiated',
            'payment' => $payment,
        ]);
    }
}
