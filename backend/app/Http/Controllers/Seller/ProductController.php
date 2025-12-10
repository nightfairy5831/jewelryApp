<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\GoldPrice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $status = $request->get('status', 'all');
        $search = $request->get('search', '');

        $query = Product::where('seller_id', $user->id)->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $products = $query->paginate(20)->withQueryString();

        // Parse images/videos JSON
        $products->getCollection()->transform(function ($product) {
            if (is_string($product->images)) {
                $product->images = json_decode($product->images, true) ?? [];
            }
            if (is_string($product->videos)) {
                $product->videos = json_decode($product->videos, true) ?? [];
            }
            return $product;
        });

        return Inertia::render('Seller/Products', [
            'products' => $products,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Seller/ProductCreate');
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'subcategory' => 'nullable|string',
            'gold_weight_grams' => 'required|numeric|min:0.001',
            'gold_karat' => 'required|in:18k,22k,24k',
            'base_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'images' => 'nullable|array',
            'model_3d_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Get current gold price
        $latestGoldPrice = GoldPrice::getLatest();
        $currentGoldPrice = $latestGoldPrice?->price_gram_18k ?? 99.17;

        $product = Product::create([
            'seller_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'subcategory' => $request->subcategory,
            'gold_weight_grams' => $request->gold_weight_grams,
            'gold_karat' => $request->gold_karat,
            'base_price' => $request->base_price,
            'current_price' => $request->base_price,
            'initial_gold_price' => $currentGoldPrice,
            'stock_quantity' => $request->stock_quantity,
            'images' => json_encode($request->images ?? []),
            'model_3d_url' => $request->model_3d_url,
            'status' => 'pending',
            'is_active' => true,
        ]);

        return redirect()->route('seller.products.index')
            ->with('success', 'Produto criado com sucesso! Aguardando aprovacao do administrador.');
    }

    public function edit($id)
    {
        $user = auth()->user();
        $product = Product::where('seller_id', $user->id)->findOrFail($id);

        // Parse images/videos JSON
        if (is_string($product->images)) {
            $product->images = json_decode($product->images, true) ?? [];
        }
        if (is_string($product->videos)) {
            $product->videos = json_decode($product->videos, true) ?? [];
        }

        return Inertia::render('Seller/ProductEdit', [
            'product' => $product,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $product = Product::where('seller_id', $user->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category' => 'sometimes|string',
            'subcategory' => 'nullable|string',
            'gold_weight_grams' => 'sometimes|numeric|min:0.001',
            'gold_karat' => 'sometimes|in:18k,22k,24k',
            'base_price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'images' => 'nullable|array',
            'model_3d_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $updateData = $request->only([
            'name', 'description', 'category', 'subcategory',
            'gold_weight_grams', 'gold_karat', 'base_price',
            'stock_quantity', 'model_3d_url'
        ]);

        if ($request->has('images')) {
            $updateData['images'] = json_encode($request->images);
        }

        // If product was approved and is being edited, set it back to pending for re-review
        if ($product->isApproved()) {
            $updateData['status'] = 'pending';
        }

        $product->update($updateData);

        return redirect()->route('seller.products.index')
            ->with('success', 'Produto atualizado com sucesso!');
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $product = Product::where('seller_id', $user->id)->findOrFail($id);

        $product->delete();

        return redirect()->route('seller.products.index')
            ->with('success', 'Produto excluido com sucesso.');
    }
}
