<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // Get reviews for a specific product
    public function index($productId)
    {
        $product = Product::findOrFail($productId);

        $reviews = Review::with('buyer:id,name')
            ->where('product_id', $productId)
            ->latest()
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'buyer_name' => $review->buyer->name,
                    'rating' => (float) $review->rating,
                    'description' => $review->description,
                    'image' => $review->image,
                    'created_at' => $review->created_at->format('Y-m-d'),
                ];
            });

        // Calculate average rating
        $averageRating = $reviews->count() > 0
            ? round($reviews->avg('rating'), 1)
            : 0;

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => $averageRating,
            'total_reviews' => $reviews->count(),
        ]);
    }

    // Create a new review (buyer only)
    public function store(Request $request, $productId)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'buyer') {
            return response()->json(['error' => 'Only buyers can create reviews'], 403);
        }

        $request->validate([
            'rating' => 'required|numeric|min:1|max:5',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|url',
        ]);

        $product = Product::findOrFail($productId);

        // Check if user already reviewed this product
        $existingReview = Review::where('product_id', $productId)
            ->where('buyer_id', $user->id)
            ->first();

        if ($existingReview) {
            return response()->json(['error' => 'You have already reviewed this product'], 400);
        }

        $review = Review::create([
            'product_id' => $productId,
            'buyer_id' => $user->id,
            'rating' => $request->rating,
            'description' => $request->description,
            'image' => $request->image,
        ]);

        return response()->json([
            'message' => 'Review created successfully',
            'review' => $review,
        ], 201);
    }
}
