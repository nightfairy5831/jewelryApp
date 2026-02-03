<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // Check if this is a request for seller's own products (via seller_view param or from web dashboard)
        $sellerView = $request->query('seller_view') === 'true';
        $user = Auth::user();

        if ($sellerView && $user && $user->isSeller()) {
            // Seller requesting their own products (for management)
            $products = Product::with('seller')
                ->where('seller_id', $user->id)
                ->latest()
                ->paginate(20);
        } elseif ($user && $user->isAdmin()) {
            // Web App (Admin) - Show all products
            $products = Product::with('seller')->latest()->paginate(20);
        } else {
            // Mobile App (Public/Buyer/Seller browsing) - Show only approved & active products from active sellers
            $products = Product::with('seller')
                ->whereHas('seller', function ($query) {
                    $query->where('is_active', true);
                })
                ->where('status', 'approved')
                ->where('is_active', true)
                ->latest()
                ->paginate(20);
        }

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->isSeller()) {
            return response()->json(['error' => 'Only sellers can create products'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:Male,Female,Wedding Rings,Other',
            'subcategory' => 'required|string',
            'filling' => 'nullable|in:Solid,Hollow,Defense',
            'is_gemstone' => 'nullable|in:Synthetic,Natural,Without Stones',
            'material' => 'required|in:Ouro 18K,Ouro 10K,Outros',
            'gold_weight_grams' => 'required_if:material,Ouro 18K,Ouro 10K|nullable|numeric|min:0',
            'gold_karat' => 'required_if:material,Ouro 18K,Ouro 10K|nullable|in:18k,10k',
            'base_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'images' => 'nullable|json',
            'videos' => 'nullable|json',
            'model_3d_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validate subcategory based on category
        $validSubcategories = [
            'Male' => ['Chains', 'Rings', 'Earrings and Pendants'],
            'Female' => ['Chains', 'Rings', 'Earrings and Pendants'],
            'Wedding Rings' => ['Wedding Anniversary', 'Engagement', 'Marriage'],
            'Other' => ['Perfumes', 'Watches', 'Other'],
        ];

        if (isset($validSubcategories[$request->category])) {
            if (!in_array($request->subcategory, $validSubcategories[$request->category])) {
                return response()->json(['errors' => ['subcategory' => ['Invalid subcategory for the selected category.']]], 422);
            }
        }

        // Get current gold price based on material
        $latestGoldPrice = \App\Models\GoldPrice::getLatest();
        $material = $request->material;

        // Set gold_karat based on material if not provided
        $goldKarat = $request->gold_karat;
        if ($material === 'Ouro 18K' && !$goldKarat) {
            $goldKarat = '18k';
        } elseif ($material === 'Ouro 10K' && !$goldKarat) {
            $goldKarat = '10k';
        }

        // Get initial gold price based on karat (only for gold materials)
        $initialGoldPrice = 0;
        if ($material === 'Ouro 18K') {
            $initialGoldPrice = $latestGoldPrice?->price_gram_18k ?? 99.17;
        } elseif ($material === 'Ouro 10K') {
            $initialGoldPrice = $latestGoldPrice?->price_gram_10k ?? 55.09;
        }

        $product = Product::create([
            'seller_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'subcategory' => $request->subcategory,
            'filling' => $request->filling,
            'is_gemstone' => $request->is_gemstone,
            'material' => $material,
            'gold_weight_grams' => $request->gold_weight_grams,
            'gold_karat' => $goldKarat,
            'base_price' => $request->base_price,
            'current_price' => $request->base_price,
            'initial_gold_price' => $initialGoldPrice,
            'stock_quantity' => $request->stock_quantity,
            'images' => $request->images ?? json_encode([]),
            'videos' => $request->videos ?? json_encode([]),
            'model_3d_url' => $request->model_3d_url,
            'status' => 'pending',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Product created successfully. Awaiting admin approval.',
            'product' => $product,
        ], 201);
    }

    public function show($id)
    {
        $user = Auth::user();
        $product = Product::with(['seller'])->findOrFail($id);

        // Allow viewing if: product is approved, OR user is the seller, OR user is admin
        $canView = $product->isApproved() ||
                   ($user && $product->seller_id === $user->id) ||
                   ($user && $user->isAdmin());

        if (!$canView) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if ($product->seller_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category' => 'sometimes|in:Male,Female,Wedding Rings,Other',
            'subcategory' => 'sometimes|string',
            'filling' => 'nullable|in:Solid,Hollow,Defense',
            'is_gemstone' => 'nullable|in:Synthetic,Natural,Without Stones',
            'material' => 'sometimes|in:Ouro 18K,Ouro 10K,Outros',
            'gold_weight_grams' => 'required_if:material,Ouro 18K,Ouro 10K|nullable|numeric|min:0',
            'gold_karat' => 'required_if:material,Ouro 18K,Ouro 10K|nullable|in:18k,10k',
            'base_price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'images' => 'nullable',
            'videos' => 'nullable',
            'model_3d_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validate subcategory based on category
        if ($request->has('category') && $request->has('subcategory')) {
            $validSubcategories = [
                'Male' => ['Chains', 'Rings', 'Earrings and Pendants'],
                'Female' => ['Chains', 'Rings', 'Earrings and Pendants'],
                'Wedding Rings' => ['Wedding Anniversary', 'Engagement', 'Marriage'],
                'Other' => ['Perfumes', 'Watches', 'Other'],
            ];

            if (isset($validSubcategories[$request->category])) {
                if (!in_array($request->subcategory, $validSubcategories[$request->category])) {
                    return response()->json(['errors' => ['subcategory' => ['Invalid subcategory for the selected category.']]], 422);
                }
            }
        }

        $updateData = $request->only([
            'name', 'description', 'category', 'subcategory',
            'filling', 'is_gemstone', 'material',
            'gold_weight_grams', 'gold_karat', 'base_price',
            'stock_quantity', 'model_3d_url'
        ]);

        // Handle images - can be array or JSON string
        if ($request->has('images')) {
            $images = $request->images;
            if (is_array($images)) {
                $updateData['images'] = json_encode($images);
            } else {
                $updateData['images'] = $images;
            }
        }

        // Handle videos - can be array or JSON string
        if ($request->has('videos')) {
            $videos = $request->videos;
            if (is_array($videos)) {
                $updateData['videos'] = json_encode($videos);
            } else {
                $updateData['videos'] = $videos;
            }
        }

        // If product was approved and is being edited, set it back to pending for re-review
        $wasApproved = $product->isApproved();
        if ($wasApproved) {
            $updateData['status'] = 'pending';
            $updateData['approved_by'] = null;
            $updateData['approved_at'] = null;
        }

        $product->update($updateData);

        $message = $wasApproved
            ? 'Product updated successfully. It has been sent for re-approval.'
            : 'Product updated successfully';

        return response()->json([
            'message' => $message,
            'product' => $product,
            'requires_approval' => $wasApproved,
        ]);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $product = Product::findOrFail($id);

        if ($product->seller_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
