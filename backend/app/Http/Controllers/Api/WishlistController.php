<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    // Get user's wishlist
    public function index()
    {
        $user = Auth::user();

        $wishlist = Wishlist::where('user_id', $user->id)
            ->with('product')
            ->get();

        return response()->json($wishlist);
    }

    // Add product to wishlist
    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $user = Auth::user();
        $product = Product::findOrFail($request->product_id);

        // Check if already in wishlist
        $exists = Wishlist::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Product already in wishlist'], 200);
        }

        $wishlistItem = Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        $wishlistItem->load('product');

        return response()->json([
            'message' => 'Product added to wishlist',
            'wishlist_item' => $wishlistItem,
        ], 201);
    }

    // Remove product from wishlist
    public function remove($productId)
    {
        $user = Auth::user();

        $wishlistItem = Wishlist::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if (!$wishlistItem) {
            return response()->json(['error' => 'Product not in wishlist'], 404);
        }

        $wishlistItem->delete();

        return response()->json([
            'message' => 'Product removed from wishlist',
        ]);
    }

    // Clear entire wishlist
    public function clear()
    {
        $user = Auth::user();

        Wishlist::where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Wishlist cleared',
        ]);
    }
}
