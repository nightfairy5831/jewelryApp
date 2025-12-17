<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    // Buyer: Get all orders for authenticated user
    public function index()
    {
        $user = Auth::user();

        $orders = Order::where('buyer_id', $user->id)
            ->with(['items.product', 'items.seller', 'payment'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($orders);
    }

    // Buyer: Get single order details
    public function show($id)
    {
        $user = Auth::user();

        $order = Order::where('buyer_id', $user->id)
            ->where('id', $id)
            ->with(['items.product', 'items.seller', 'payment'])
            ->firstOrFail();

        return response()->json($order);
    }

    // Buyer: Create order from cart
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'shipping_address' => 'required|array',
            'shipping_address.street' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.state' => 'required|string',
            'shipping_address.postal_code' => 'required|string',
            'shipping_address.country' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->with('items.product')->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['error' => 'Cart is empty'], 400);
        }

        // Validate stock for all items
        foreach ($cart->items as $item) {
            if (!$item->product) {
                return response()->json([
                    'error' => 'One or more products in your cart are no longer available'
                ], 400);
            }

            // Check if product is still approved and active
            if ($item->product->status !== 'approved' || !$item->product->is_active) {
                return response()->json([
                    'error' => "Product is no longer available: {$item->product->name}"
                ], 400);
            }

            if ($item->product->stock_quantity < $item->quantity) {
                return response()->json([
                    'error' => "Insufficient stock for product: {$item->product->name}"
                ], 400);
            }
        }

        DB::beginTransaction();
        try {
            // Calculate totals
            $subtotal = $cart->calculateSubtotal();
            $shippingAmount = 0; // Can be calculated based on logic
            $taxAmount = 0; // Can be calculated based on logic
            $totalAmount = $subtotal + $shippingAmount + $taxAmount;

            // Create order with stock reservation (24 hour timeout)
            $order = Order::create([
                'buyer_id' => $user->id,
                'status' => 'pending',
                'total_amount' => $totalAmount,
                'tax_amount' => $taxAmount,
                'shipping_amount' => $shippingAmount,
                'shipping_address' => $request->shipping_address,
                'stock_reserved' => true,
                'reserved_until' => now()->addHours(24),
            ]);

            // Create order items and update stock
            foreach ($cart->items as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'seller_id' => $cartItem->seller_id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->price_at_time_of_add,
                    'total_price' => $cartItem->price_at_time_of_add * $cartItem->quantity,
                ]);

                // Decrease stock
                $cartItem->product->decrement('stock_quantity', $cartItem->quantity);
            }

            // Create payment record (credit_card only)
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_method' => 'credit_card',
                'amount' => $totalAmount,
                'status' => 'pending',
            ]);

            // Clear cart
            $cart->items()->delete();

            DB::commit();

            // Load relationships
            $order->load(['items.product', 'items.seller', 'payment']);

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order,
                'payment' => $payment,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Order creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);
            return response()->json([
                'error' => 'Failed to create order: ' . $e->getMessage(),
                'details' => config('app.debug') ? [
                    'line' => $e->getLine(),
                    'file' => basename($e->getFile()),
                ] : null
            ], 500);
        }
    }

    // Buyer: Cancel order
    public function cancel($id)
    {
        $user = Auth::user();

        $order = Order::where('buyer_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($order->status !== 'pending') {
            return response()->json(['error' => 'Only pending orders can be cancelled'], 400);
        }

        DB::beginTransaction();
        try {
            // Restore stock
            foreach ($order->items as $item) {
                $item->product->increment('stock_quantity', $item->quantity);
            }

            $order->update(['status' => 'cancelled']);

            DB::commit();

            return response()->json([
                'message' => 'Order cancelled successfully',
                'order' => $order,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to cancel order'], 500);
        }
    }

    // Seller: Get all orders for seller's products
    public function sellerOrders()
    {
        $user = Auth::user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Only sellers can access this endpoint'], 403);
        }

        $orders = Order::whereHas('items', function ($query) use ($user) {
            $query->where('seller_id', $user->id);
        })
        ->with(['items' => function ($query) use ($user) {
            $query->where('seller_id', $user->id)->with('product');
        }, 'buyer', 'payment'])
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return response()->json($orders);
    }

    // Seller: Mark order as shipped
    public function markAsShipped(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Only sellers can access this endpoint'], 403);
        }

        $validator = Validator::make($request->all(), [
            'tracking_number' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $order = Order::whereHas('items', function ($query) use ($user) {
            $query->where('seller_id', $user->id);
        })->findOrFail($id);

        if ($order->status !== 'confirmed') {
            return response()->json(['error' => 'Only confirmed orders can be marked as shipped'], 400);
        }

        $order->markAsShipped($request->tracking_number);

        return response()->json([
            'message' => 'Order marked as shipped',
            'order' => $order,
        ]);
    }

    // Get purchased products with review status
    public function purchasedProducts()
    {
        $user = Auth::user();

        $products = OrderItem::whereHas('order', function ($query) use ($user) {
            $query->where('buyer_id', $user->id)
                  ->whereIn('status', ['confirmed', 'shipped']);
        })
        ->with(['product', 'order'])
        ->get()
        ->groupBy('product_id')
        ->map(function ($items) use ($user) {
            $item = $items->first();
            $hasReview = Review::where('product_id', $item->product_id)
                ->where('buyer_id', $user->id)
                ->exists();

            return [
                'product_id' => $item->product_id,
                'product_name' => $item->product->name ?? 'Unknown',
                'product_image' => $item->product->images[0] ?? null,
                'order_number' => $item->order->order_number ?? null,
                'purchased_at' => $item->order->paid_at ?? $item->order->created_at,
                'has_review' => $hasReview,
            ];
        })
        ->values();

        return response()->json($products);
    }
}
