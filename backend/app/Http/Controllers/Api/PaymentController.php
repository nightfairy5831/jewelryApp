<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Create payment using Destination Charges (per-seller charges with application_fee)
     *
     * Flow:
     * 1. Buyer enters card info once
     * 2. For each seller: create card_token + payment using seller's credentials
     * 3. Platform receives application_fee automatically
     * 4. Seller is merchant of record (handles disputes)
     */
    public function createIntent(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:orders,id',
                'payment_method' => 'required|in:credit_card,pix',
                // Card details required for credit_card
                'card_number' => 'required_if:payment_method,credit_card|string',
                'expiration_month' => 'required_if:payment_method,credit_card|string',
                'expiration_year' => 'required_if:payment_method,credit_card|string',
                'security_code' => 'required_if:payment_method,credit_card|string',
                'cardholder_name' => 'required_if:payment_method,credit_card|string',
                'cardholder_document' => 'nullable|string', // CPF
            ]);

            $user = Auth::user();
            $order = Order::where('buyer_id', $user->id)
                ->with(['buyer', 'items.seller', 'items.product'])
                ->findOrFail($request->order_id);

            // Check if order already has completed payments
            $existingCompleted = Payment::where('order_id', $order->id)
                ->where('status', 'completed')
                ->exists();

            if ($existingCompleted) {
                return response()->json(['error' => 'Order already has completed payments'], 400);
            }

            // Delete any pending/failed payments for retry
            Payment::where('order_id', $order->id)
                ->whereIn('status', ['pending', 'failed'])
                ->delete();

            $paymentMethod = $request->payment_method;
            $buyer = $order->buyer;

            Log::info('Processing payment request', [
                'order_id' => $order->id,
                'buyer_id' => $buyer->id,
                'payment_method' => $paymentMethod,
                'items_count' => $order->items->count(),
            ]);

            // Group items by seller
            $sellerGroups = $order->items->groupBy('seller_id');

            // Validate all sellers have MP connected
            foreach ($sellerGroups as $sellerId => $items) {
                $seller = User::find($sellerId);
                if (!$seller || !$seller->mercadopago_access_token) {
                    $sellerName = $seller ? $seller->name : "ID: {$sellerId}";
                    return response()->json([
                        'error' => "Seller '{$sellerName}' has not connected their Mercado Pago account. Please contact the seller.",
                    ], 400);
                }
            }

            $paymentsData = [];
            $allSuccess = true;

            DB::beginTransaction();

            // Distribute shipping cost proportionally across sellers
            $totalProductAmount = $order->items->sum('total_price');
            $shippingAmount = (float) ($order->shipping_amount ?? 0);

            foreach ($sellerGroups as $sellerId => $items) {
                $seller = User::find($sellerId);
                $sellerProductAmount = $items->sum('total_price');

                // Proportional shipping share for this seller's items
                $sellerShippingShare = $totalProductAmount > 0
                    ? round($shippingAmount * ($sellerProductAmount / $totalProductAmount), 2)
                    : 0;

                // Total charge = products + shipping share
                $sellerAmount = $sellerProductAmount + $sellerShippingShare;

                // Application fee = platform commission + shipping (platform keeps shipping)
                $feeRate = $paymentMethod === 'pix' ? 0.08 : 0.10;
                $applicationFee = round($sellerProductAmount * $feeRate, 2) + $sellerShippingShare;

                // Create payment record for this seller
                $payment = Payment::create([
                    'order_id' => $order->id,
                    'seller_id' => $sellerId,
                    'payment_method' => $paymentMethod,
                    'amount' => $sellerAmount,
                    'application_fee' => $applicationFee,
                    'status' => 'pending',
                ]);

                if ($paymentMethod === 'credit_card') {
                    $result = $this->processCardPayment(
                        $payment,
                        $seller,
                        $buyer,
                        $order,
                        $request,
                        $sellerAmount,
                        $applicationFee
                    );
                } else {
                    // PIX payment
                    $result = $this->processPixPayment(
                        $payment,
                        $seller,
                        $buyer,
                        $order,
                        $sellerAmount,
                        $applicationFee
                    );
                }

                if (!$result['success']) {
                    $allSuccess = false;
                    $payment->update([
                        'status' => 'failed',
                        'gateway_response' => $result['error'],
                    ]);

                    // Return error immediately with details from Mercado Pago
                    DB::commit();
                    $mpError = $result['error'];
                    $errorMessage = 'Payment failed';

                    // Extract meaningful error message from MP response
                    if (is_array($mpError)) {
                        if (isset($mpError['message'])) {
                            $errorMessage = $mpError['message'];
                        } elseif (isset($mpError['error'])) {
                            $errorMessage = $mpError['error'];
                        } elseif (isset($mpError['cause']) && is_array($mpError['cause']) && count($mpError['cause']) > 0) {
                            $errorMessage = $mpError['cause'][0]['description'] ?? $mpError['cause'][0]['code'] ?? 'Payment processing error';
                        }
                    } elseif (is_string($mpError)) {
                        $errorMessage = $mpError;
                    }

                    Log::error('Payment failed - returning error to client', [
                        'seller_id' => $sellerId,
                        'mp_error' => $mpError,
                        'error_message' => $errorMessage,
                    ]);

                    return response()->json([
                        'error' => $errorMessage,
                        'mp_error' => config('app.debug') ? $mpError : null,
                        'seller_name' => $seller->name,
                    ], 400);
                }

                $paymentsData[] = [
                    'payment_id' => $payment->id,
                    'seller_id' => $sellerId,
                    'seller_name' => $seller->name,
                    'amount' => $sellerAmount,
                    'application_fee' => $applicationFee,
                    'status' => $payment->fresh()->status,
                    'pix_qr_code' => $result['pix_qr_code'] ?? null,
                    'pix_qr_code_base64' => $result['pix_qr_code_base64'] ?? null,
                    'init_point' => $result['init_point'] ?? null,
                ];
            }

            DB::commit();

            // Check overall status
            $allPayments = Payment::where('order_id', $order->id)->get();
            $orderStatus = $allPayments->every(fn($p) => $p->status === 'completed')
                ? 'completed'
                : ($allPayments->contains(fn($p) => $p->status === 'failed') ? 'partial_failure' : 'pending');

            Log::info('Destination charges created', [
                'order_id' => $order->id,
                'payment_method' => $paymentMethod,
                'seller_count' => count($sellerGroups),
                'status' => $orderStatus,
            ]);

            return response()->json([
                'order_id' => $order->id,
                'status' => $orderStatus,
                'payment_method' => $paymentMethod,
                'payments' => $paymentsData,
                'total_amount' => $order->total_amount,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment creation failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => config('app.debug') ? $e->getMessage() : 'Failed to create payment',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred while processing your payment',
                'debug' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null,
            ], 500);
        }
    }

    /**
     * Process credit card payment using seller's credentials
     */
    private function processCardPayment($payment, $seller, $buyer, $order, $request, $amount, $applicationFee)
    {
        try {
            $sellerToken = $seller->mercadopago_access_token;

            // Step 1: Create card token using seller's credentials
            $cardTokenResponse = Http::withToken($sellerToken)
                ->post('https://api.mercadopago.com/v1/card_tokens', [
                    'card_number' => str_replace(' ', '', $request->card_number),
                    'expiration_month' => $request->expiration_month,
                    'expiration_year' => $request->expiration_year,
                    'security_code' => $request->security_code,
                    'cardholder' => [
                        'name' => $request->cardholder_name,
                        'identification' => [
                            'type' => 'CPF',
                            'number' => $request->cardholder_document ?? '',
                        ],
                    ],
                ]);

            if (!$cardTokenResponse->successful()) {
                Log::error('Card token creation failed', [
                    'seller_id' => $seller->id,
                    'response' => $cardTokenResponse->json(),
                ]);
                return [
                    'success' => false,
                    'error' => $cardTokenResponse->json(),
                ];
            }

            $cardToken = $cardTokenResponse->json();
            $payment->update(['card_token_id' => $cardToken['id']]);

            // Step 2: Create payment with application_fee using seller's credentials
            $paymentData = [
                'token' => $cardToken['id'],
                'transaction_amount' => (float) $amount,
                'description' => "Order #{$order->order_number} - {$seller->name}",
                'installments' => 1,
                'payment_method_id' => $this->detectCardBrand($request->card_number),
                'payer' => [
                    'email' => $buyer->email,
                    'first_name' => explode(' ', $buyer->name)[0],
                    'last_name' => explode(' ', $buyer->name)[1] ?? '',
                ],
                'statement_descriptor' => 'ALIANCA NOBRE',
                'notification_url' => config('app.url') . '/api/payments/webhook',
                'external_reference' => "payment_{$payment->id}",
                'metadata' => [
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'seller_id' => $seller->id,
                    'application_fee' => $applicationFee, // Store fee in metadata for tracking
                ],
            ];

            // Only include application_fee if marketplace mode is enabled
            $marketplaceEnabled = config('services.mercadopago.marketplace_enabled', false);
            if ($marketplaceEnabled && $applicationFee > 0) {
                $paymentData['application_fee'] = (float) $applicationFee;
            }

            // Generate idempotency key to prevent duplicate payments
            $idempotencyKey = 'card_' . $payment->id . '_' . $order->id . '_' . time();

            $mpPaymentResponse = Http::withToken($sellerToken)
                ->withHeaders([
                    'X-Idempotency-Key' => $idempotencyKey,
                ])
                ->post('https://api.mercadopago.com/v1/payments', $paymentData);

            if (!$mpPaymentResponse->successful()) {
                Log::error('MP payment creation failed', [
                    'seller_id' => $seller->id,
                    'response' => $mpPaymentResponse->json(),
                ]);
                return [
                    'success' => false,
                    'error' => $mpPaymentResponse->json(),
                ];
            }

            $mpPayment = $mpPaymentResponse->json();

            $payment->update([
                'mp_payment_id' => $mpPayment['id'],
                'gateway_response' => $mpPayment,
                'status' => $mpPayment['status'] === 'approved' ? 'completed' : 'pending',
                'paid_at' => $mpPayment['status'] === 'approved' ? now() : null,
            ]);

            // If approved, check if all payments complete
            if ($mpPayment['status'] === 'approved') {
                $this->checkOrderCompletion($order);
            }

            Log::info('Card payment processed', [
                'payment_id' => $payment->id,
                'mp_payment_id' => $mpPayment['id'],
                'status' => $mpPayment['status'],
                'seller_id' => $seller->id,
            ]);

            return [
                'success' => true,
                'mp_payment' => $mpPayment,
            ];

        } catch (\Exception $e) {
            Log::error('Card payment error', [
                'seller_id' => $seller->id,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Process PIX payment using seller's credentials
     */
    private function processPixPayment($payment, $seller, $buyer, $order, $amount, $applicationFee)
    {
        try {
            $sellerToken = $seller->mercadopago_access_token;

            $paymentData = [
                'transaction_amount' => (float) $amount,
                'description' => "Order #{$order->order_number} - {$seller->name}",
                'payment_method_id' => 'pix',
                'payer' => [
                    'email' => $buyer->email,
                    'first_name' => explode(' ', $buyer->name)[0],
                    'last_name' => explode(' ', $buyer->name)[1] ?? '',
                ],
                'notification_url' => config('app.url') . '/api/payments/webhook',
                'external_reference' => "payment_{$payment->id}",
                'metadata' => [
                    'payment_id' => $payment->id,
                    'order_id' => $order->id,
                    'seller_id' => $seller->id,
                    'application_fee' => $applicationFee, // Store fee in metadata for tracking
                ],
            ];

            // Only include application_fee if marketplace mode is enabled
            // application_fee requires marketplace OAuth setup in Mercado Pago
            $marketplaceEnabled = config('services.mercadopago.marketplace_enabled', false);
            if ($marketplaceEnabled && $applicationFee > 0) {
                $paymentData['application_fee'] = (float) $applicationFee;
            }

            // Generate idempotency key to prevent duplicate payments
            $idempotencyKey = 'pix_' . $payment->id . '_' . $order->id . '_' . time();

            Log::info('Sending PIX payment request to MP', [
                'seller_id' => $seller->id,
                'payment_data' => $paymentData,
                'token_prefix' => substr($sellerToken, 0, 20) . '...',
                'idempotency_key' => $idempotencyKey,
            ]);

            $mpPaymentResponse = Http::withToken($sellerToken)
                ->withHeaders([
                    'X-Idempotency-Key' => $idempotencyKey,
                ])
                ->post('https://api.mercadopago.com/v1/payments', $paymentData);

            if (!$mpPaymentResponse->successful()) {
                Log::error('PIX payment creation failed', [
                    'seller_id' => $seller->id,
                    'http_status' => $mpPaymentResponse->status(),
                    'response' => $mpPaymentResponse->json(),
                    'response_body' => $mpPaymentResponse->body(),
                ]);
                return [
                    'success' => false,
                    'error' => $mpPaymentResponse->json(),
                ];
            }

            $mpPayment = $mpPaymentResponse->json();

            $payment->update([
                'mp_payment_id' => $mpPayment['id'],
                'gateway_response' => $mpPayment,
                'status' => 'pending', // PIX is always pending until paid
            ]);

            // Extract PIX data
            $pixData = $mpPayment['point_of_interaction']['transaction_data'] ?? null;

            Log::info('PIX payment created', [
                'payment_id' => $payment->id,
                'mp_payment_id' => $mpPayment['id'],
                'seller_id' => $seller->id,
            ]);

            return [
                'success' => true,
                'mp_payment' => $mpPayment,
                'pix_qr_code' => $pixData['qr_code'] ?? null,
                'pix_qr_code_base64' => $pixData['qr_code_base64'] ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('PIX payment error', [
                'seller_id' => $seller->id,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Detect card brand from card number
     */
    private function detectCardBrand($cardNumber)
    {
        $number = preg_replace('/\D/', '', $cardNumber);

        if (preg_match('/^4/', $number)) return 'visa';
        if (preg_match('/^5[1-5]/', $number)) return 'master';
        if (preg_match('/^3[47]/', $number)) return 'amex';
        if (preg_match('/^6(?:011|5)/', $number)) return 'discover';
        if (preg_match('/^(?:2131|1800|35)/', $number)) return 'jcb';
        if (preg_match('/^3(?:0[0-5]|[68])/', $number)) return 'diners';
        if (preg_match('/^606282|^3841(?:[0|4|6]{1})0/', $number)) return 'hipercard';
        if (preg_match('/^(636368|438935|504175|451416|636297)/', $number)) return 'elo';

        return 'visa'; // Default
    }

    /**
     * Check if all payments for order are complete
     */
    private function checkOrderCompletion($order)
    {
        $allPayments = Payment::where('order_id', $order->id)->get();
        $allCompleted = $allPayments->every(fn($p) => $p->status === 'completed');

        if ($allCompleted) {
            $order->markAsPaid();
            $order->update(['stock_reserved' => false]);

            Log::info('Order fully paid via destination charges', [
                'order_id' => $order->id,
                'payment_count' => $allPayments->count(),
            ]);
        }
    }

    /**
     * Webhook handler - receives notifications from seller's MP accounts
     */
    public function webhook(Request $request)
    {
        try {
            Log::info('MercadoPago webhook received', ['data' => $request->all()]);

            if ($request->input('type') !== 'payment') {
                return response()->json(['status' => 'ignored']);
            }

            $mpPaymentId = $request->input('data.id');
            if (!$mpPaymentId) {
                return response()->json(['status' => 'error'], 400);
            }

            // Find payment by mp_payment_id
            $payment = Payment::where('mp_payment_id', $mpPaymentId)->first();

            if (!$payment) {
                // Try to find by external_reference from any seller
                // We need to query MP to get the external_reference
                Log::warning('Payment not found by mp_payment_id, checking sellers', [
                    'mp_payment_id' => $mpPaymentId,
                ]);

                // Query platform's token first to get external_reference
                $platformToken = config('services.mercadopago.access_token');
                $response = Http::withToken($platformToken)
                    ->get("https://api.mercadopago.com/v1/payments/{$mpPaymentId}");

                if ($response->successful()) {
                    $mpPayment = $response->json();
                    $externalRef = $mpPayment['external_reference'] ?? '';

                    if (preg_match('/payment_(\d+)/', $externalRef, $matches)) {
                        $payment = Payment::find($matches[1]);
                    }
                }

                if (!$payment) {
                    Log::error('Payment not found', ['mp_payment_id' => $mpPaymentId]);
                    return response()->json(['status' => 'not_found'], 404);
                }
            }

            // Get payment details using seller's token
            $seller = $payment->seller;
            $sellerToken = $seller ? $seller->mercadopago_access_token : config('services.mercadopago.access_token');

            $response = Http::withToken($sellerToken)
                ->get("https://api.mercadopago.com/v1/payments/{$mpPaymentId}");

            if (!$response->successful()) {
                Log::error('Failed to fetch MP payment', ['id' => $mpPaymentId]);
                return response()->json(['status' => 'error'], 400);
            }

            $mpPayment = $response->json();
            $status = $mpPayment['status'];

            Log::info("Webhook payment status: {$status}", [
                'payment_id' => $payment->id,
                'mp_payment_id' => $mpPaymentId,
                'seller_id' => $payment->seller_id,
            ]);

            if ($status === 'approved') {
                $payment->markAsCompleted($mpPaymentId, $mpPayment);
            } elseif (in_array($status, ['rejected', 'cancelled'])) {
                $payment->markAsFailed($mpPayment);
            }

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('Webhook error: ' . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }

    /**
     * Get payment status for an order
     */
    public function status($id)
    {
        $user = Auth::user();

        // Get all payments for this order
        $payments = Payment::with(['seller'])
            ->whereHas('order', fn($q) => $q->where('buyer_id', $user->id))
            ->where('order_id', $id)
            ->get();

        if ($payments->isEmpty()) {
            return response()->json(['error' => 'No payments found'], 404);
        }

        $order = Order::find($id);

        return response()->json([
            'order_id' => $id,
            'order_status' => $order->status,
            'payments' => $payments->map(fn($p) => [
                'id' => $p->id,
                'seller_id' => $p->seller_id,
                'seller_name' => $p->seller->name ?? 'Unknown',
                'amount' => $p->amount,
                'application_fee' => $p->application_fee,
                'status' => $p->status,
                'payment_method' => $p->payment_method,
                'paid_at' => $p->paid_at,
            ]),
            'all_completed' => $payments->every(fn($p) => $p->status === 'completed'),
        ]);
    }

    /**
     * Retry failed payment for a specific seller
     */
    public function retry(Request $request, $id)
    {
        $user = Auth::user();

        $payment = Payment::with(['order', 'seller'])
            ->whereHas('order', fn($q) => $q->where('buyer_id', $user->id))
            ->findOrFail($id);

        if ($payment->status !== 'failed') {
            return response()->json(['error' => 'Only failed payments can be retried'], 400);
        }

        // Reset payment for retry
        $payment->update([
            'status' => 'pending',
            'mp_payment_id' => null,
            'card_token_id' => null,
            'gateway_response' => null,
        ]);

        return response()->json([
            'message' => 'Payment reset for retry',
            'payment_id' => $payment->id,
            'order_id' => $payment->order_id,
        ]);
    }

}
