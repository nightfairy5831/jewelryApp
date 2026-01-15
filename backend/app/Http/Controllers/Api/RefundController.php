<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RefundRequest;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RefundController extends Controller
{
    /**
     * Buyer creates a refund request
     */
    public function store(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'reason' => 'required|in:defective_product,wrong_item,not_as_described,changed_mind,late_delivery,other',
            'description' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();
        $payment = Payment::with(['order', 'seller'])->findOrFail($request->payment_id);

        // Verify buyer owns this payment's order
        if ($payment->order->buyer_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check payment is completed (can only refund completed payments)
        if ($payment->status !== 'completed') {
            return response()->json(['error' => 'Only completed payments can be refunded'], 400);
        }

        // Check if refund request already exists
        $existingRequest = RefundRequest::where('payment_id', $payment->id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingRequest) {
            return response()->json(['error' => 'A refund request already exists for this payment'], 400);
        }

        $refundRequest = RefundRequest::create([
            'payment_id' => $payment->id,
            'buyer_id' => $user->id,
            'seller_id' => $payment->seller_id,
            'reason' => $request->reason,
            'description' => $request->description,
            'status' => 'pending',
        ]);

        Log::info('Refund request created', [
            'refund_request_id' => $refundRequest->id,
            'payment_id' => $payment->id,
            'buyer_id' => $user->id,
            'seller_id' => $payment->seller_id,
        ]);

        return response()->json([
            'message' => 'Refund request submitted successfully',
            'refund_request' => $this->formatRefundRequest($refundRequest->load(['payment', 'seller'])),
        ], 201);
    }

    /**
     * Buyer gets their refund requests
     */
    public function buyerIndex()
    {
        $user = Auth::user();

        $requests = RefundRequest::with(['payment.order', 'seller'])
            ->where('buyer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'refund_requests' => $requests->map(fn($r) => $this->formatRefundRequest($r)),
        ]);
    }

    /**
     * Seller gets refund requests for their payments
     */
    public function sellerIndex()
    {
        $user = Auth::user();

        $requests = RefundRequest::with(['payment.order', 'buyer'])
            ->where('seller_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'refund_requests' => $requests->map(fn($r) => $this->formatRefundRequestForSeller($r)),
        ]);
    }

    /**
     * Seller approves a refund request
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'response' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $refundRequest = RefundRequest::with(['payment.seller'])
            ->where('seller_id', $user->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $refundRequest->approve($request->response);

        // Process the actual refund via Mercado Pago
        $result = $this->processRefund($refundRequest);

        if (!$result['success']) {
            // Revert approval if refund fails
            $refundRequest->update(['status' => 'pending', 'responded_at' => null]);
            return response()->json([
                'error' => 'Failed to process refund',
                'details' => $result['error'],
            ], 400);
        }

        $refundRequest->markAsRefunded();

        Log::info('Refund approved and processed', [
            'refund_request_id' => $refundRequest->id,
            'seller_id' => $user->id,
            'return_platform_fee' => $refundRequest->return_platform_fee,
        ]);

        return response()->json([
            'message' => 'Refund approved and processed successfully',
            'refund_request' => $this->formatRefundRequestForSeller($refundRequest->fresh(['payment', 'buyer'])),
        ]);
    }

    /**
     * Seller rejects a refund request
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'response' => 'required|string|max:500',
        ]);

        $user = Auth::user();
        $refundRequest = RefundRequest::with(['payment'])
            ->where('seller_id', $user->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $refundRequest->reject($request->response);

        Log::info('Refund rejected', [
            'refund_request_id' => $refundRequest->id,
            'seller_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Refund request rejected',
            'refund_request' => $this->formatRefundRequestForSeller($refundRequest->fresh(['payment', 'buyer'])),
        ]);
    }

    /**
     * Process refund via Mercado Pago
     */
    private function processRefund(RefundRequest $refundRequest): array
    {
        $payment = $refundRequest->payment;
        $seller = $payment->seller;

        if (!$payment->mp_payment_id) {
            return ['success' => false, 'error' => 'No Mercado Pago payment ID found'];
        }

        if (!$seller || !$seller->mercadopago_access_token) {
            return ['success' => false, 'error' => 'Seller Mercado Pago not connected'];
        }

        try {
            $response = Http::withToken($seller->mercadopago_access_token)
                ->post("https://api.mercadopago.com/v1/payments/{$payment->mp_payment_id}/refunds", [
                    'amount' => (float) $payment->amount,
                ]);

            if (!$response->successful()) {
                Log::error('MP refund failed', [
                    'payment_id' => $payment->id,
                    'response' => $response->json(),
                ]);
                return ['success' => false, 'error' => $response->json()];
            }

            $refundData = $response->json();

            // Update payment status
            $payment->update([
                'status' => 'refunded',
                'gateway_response' => array_merge(
                    $payment->gateway_response ?? [],
                    ['refund' => $refundData, 'return_platform_fee' => $refundRequest->return_platform_fee]
                ),
            ]);

            return ['success' => true, 'refund' => $refundData];

        } catch (\Exception $e) {
            Log::error('Refund processing error', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function formatRefundRequest(RefundRequest $request): array
    {
        return [
            'id' => $request->id,
            'payment_id' => $request->payment_id,
            'order_number' => $request->payment->order->order_number ?? null,
            'seller_name' => $request->seller->name ?? 'Unknown',
            'amount' => $request->payment->amount,
            'reason' => $request->reason,
            'description' => $request->description,
            'status' => $request->status,
            'seller_response' => $request->seller_response,
            'responded_at' => $request->responded_at?->toIso8601String(),
            'refunded_at' => $request->refunded_at?->toIso8601String(),
            'created_at' => $request->created_at->toIso8601String(),
        ];
    }

    private function formatRefundRequestForSeller(RefundRequest $request): array
    {
        return [
            'id' => $request->id,
            'payment_id' => $request->payment_id,
            'order_number' => $request->payment->order->order_number ?? null,
            'buyer_name' => $request->buyer->name ?? 'Unknown',
            'buyer_email' => $request->buyer->email ?? null,
            'amount' => $request->payment->amount,
            'application_fee' => $request->payment->application_fee,
            'reason' => $request->reason,
            'description' => $request->description,
            'status' => $request->status,
            'return_platform_fee' => $request->return_platform_fee,
            'seller_response' => $request->seller_response,
            'responded_at' => $request->responded_at?->toIso8601String(),
            'refunded_at' => $request->refunded_at?->toIso8601String(),
            'created_at' => $request->created_at->toIso8601String(),
        ];
    }
}
