<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $cart->load(['items.product', 'items.seller']);

        $subtotal = $cart->calculateSubtotal();
        $shippingCost = 0; // Can be calculated based on logic
        $taxAmount = 0; // Can be calculated based on logic
        $total = $cart->calculateTotal($shippingCost, $taxAmount);

        return response()->json([
            'cart' => $cart,
            'subtotal' => $subtotal,
            'shipping' => $shippingCost,
            'tax' => $taxAmount,
            'total' => $total,
        ]);
    }

    public function addItem(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $product = Product::findOrFail($request->product_id);

        // Check if product is approved and active
        if ($product->status !== 'approved' || !$product->is_active) {
            return response()->json(['error' => 'Product is not available'], 400);
        }

        // Check stock
        if ($product->stock_quantity < $request->quantity) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // Check if item already exists in cart
        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $product->id)
            ->first();

        if ($cartItem) {
            // Update quantity
            $newQuantity = $cartItem->quantity + $request->quantity;

            if ($product->stock_quantity < $newQuantity) {
                return response()->json(['error' => 'Insufficient stock'], 400);
            }

            $cartItem->update(['quantity' => $newQuantity]);
        } else {
            // Create new cart item
            $cartItem = CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'seller_id' => $product->seller_id,
                'quantity' => $request->quantity,
                'price_at_time_of_add' => $product->current_price,
            ]);
        }

        $cart->load(['items.product', 'items.seller']);

        return response()->json([
            'message' => 'Product added to cart',
            'cart' => $cart,
        ], 201);
    }

    public function updateItem(Request $request, $itemId)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->firstOrFail();
        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('id', $itemId)
            ->firstOrFail();

        // Check stock
        if ($cartItem->product->stock_quantity < $request->quantity) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        $cart->load(['items.product', 'items.seller']);

        return response()->json([
            'message' => 'Cart item updated',
            'cart' => $cart,
        ]);
    }

    public function removeItem($itemId)
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->firstOrFail();

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('id', $itemId)
            ->firstOrFail();

        $cartItem->delete();

        $cart->load(['items.product', 'items.seller']);

        return response()->json([
            'message' => 'Item removed from cart',
            'cart' => $cart,
        ]);
    }

    public function clear()
    {
        $user = Auth::user();
        $cart = Cart::where('user_id', $user->id)->firstOrFail();

        $cart->items()->delete();

        return response()->json([
            'message' => 'Cart cleared',
        ]);
    }
}
