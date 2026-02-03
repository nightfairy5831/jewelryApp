<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Cart;
use App\Services\ShippingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ShippingController extends Controller
{
    private ShippingService $shippingService;

    public function __construct(ShippingService $shippingService)
    {
        $this->shippingService = $shippingService;
    }

    /**
     * Get shipping cost estimate for a postal code and cart items
     */
    public function estimate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'postal_code' => 'required|string',
            'cart_item_ids' => 'nullable|array',
            'cart_item_ids.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->with('items.product')->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['error' => 'Cart is empty'], 400);
        }

        $cartItemIds = $request->cart_item_ids;
        $items = $cart->items;

        if ($cartItemIds && count($cartItemIds) > 0) {
            $items = $items->filter(fn($item) => in_array($item->id, $cartItemIds));
        }

        $itemsData = $items->map(fn($item) => [
            'weight' => $item->product->weight ?? 0.1,
            'price' => $item->price_at_time_of_add,
            'quantity' => $item->quantity,
        ])->values()->toArray();

        $result = $this->shippingService->getShippingQuote(
            $request->postal_code,
            $itemsData
        );

        return response()->json($result);
    }

    /**
     * Seller: Create shipment for an order
     */
    public function createShipment(Request $request, $orderId)
    {
        $user = Auth::user();

        // Find order where seller has items
        $order = Order::whereHas('items', function ($query) use ($user) {
            $query->where('seller_id', $user->id);
        })->find($orderId);

        if (!$order) {
            return response()->json(['error' => 'Pedido não encontrado'], 404);
        }

        // Check order is in accepted status
        if ($order->status !== 'accepted') {
            return response()->json([
                'error' => 'Pedido deve estar aceito para criar envio',
            ], 400);
        }

        // Create shipment via service
        $result = $this->shippingService->createShipment($order);

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        // Update order with shipment data
        $order->update([
            'shipment_id' => $result['shipment_id'],
            'tracking_number' => $result['tracking_number'],
            'shipping_carrier' => $result['carrier'],
            'shipping_label_url' => $result['label_url'],
            'status' => 'shipped',
            'shipped_at' => now(),
        ]);

        return response()->json([
            'message' => 'Envio criado com sucesso',
            'shipment' => [
                'shipment_id' => $result['shipment_id'],
                'tracking_number' => $result['tracking_number'],
                'label_url' => $result['label_url'],
                'carrier' => $result['carrier'],
            ],
            'order' => $order->fresh(),
        ]);
    }

    /**
     * Get tracking info for an order (buyer or seller)
     */
    public function getTracking(Request $request, $orderId)
    {
        $user = Auth::user();

        // Find order - buyer or seller can view tracking
        $order = Order::where(function ($query) use ($user) {
            $query->where('buyer_id', $user->id)
                  ->orWhereHas('items', function ($q) use ($user) {
                      $q->where('seller_id', $user->id);
                  });
        })->find($orderId);

        if (!$order) {
            return response()->json(['error' => 'Pedido não encontrado'], 404);
        }

        if (!$order->tracking_number) {
            return response()->json(['error' => 'Pedido não possui rastreamento'], 400);
        }

        // Get tracking info via service
        $result = $this->shippingService->getTracking($order->tracking_number);

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json([
            'tracking_number' => $result['tracking_number'],
            'carrier' => $result['carrier'],
            'status' => $result['status'],
            'estimated_delivery' => $result['estimated_delivery'],
            'events' => $result['events'],
        ]);
    }
}
