<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Events\ProductApproved;
use App\Models\Product;
use App\Models\GoldPrice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->get('status', 'all');
        $search = $request->get('search', '');
        $ownerName = $request->get('owner_name', '');
        $category = $request->get('category', 'all');
        $perPage = $request->get('per_page', 14);

        $query = Product::with(['seller'])
            ->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($ownerName) {
            $query->whereHas('seller', function ($q) use ($ownerName) {
                $q->where('name', 'like', "%{$ownerName}%");
            });
        }

        if ($category !== 'all') {
            $query->where('category', $category);
        }

        $products = $query->paginate($perPage)->withQueryString();

        $latestGoldPrice = GoldPrice::getLatest();

        $products->getCollection()->transform(function ($product) use ($latestGoldPrice) {
            if (is_string($product->images)) {
                $product->images = json_decode($product->images, true) ?? [];
            } else {
                $product->images = $product->images ?? [];
            }

            if (is_string($product->videos)) {
                $product->videos = json_decode($product->videos, true) ?? [];
            } else {
                $product->videos = $product->videos ?? [];
            }

            if ($latestGoldPrice) {
                $product->current_price = $product->calculateCurrentPrice($latestGoldPrice);
            }

            return $product;
        });

        return Inertia::render('Admin/Products', [
            'products' => $products,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'owner_name' => $ownerName,
                'category' => $category,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function show($id)
    {
        $product = Product::with(['seller', 'approvedBy'])->findOrFail($id);

        $latestGoldPrice = \App\Models\GoldPrice::getLatest();
        if ($latestGoldPrice) {
            $product->current_price = $product->calculateCurrentPrice($latestGoldPrice);
        }

        return response()->json($product);
    }

    public function approve($id)
    {
        $product = Product::findOrFail($id);
        $product->approve(auth()->id());

        // Calculate current price for the event
        $latestGoldPrice = GoldPrice::getLatest();
        if ($latestGoldPrice) {
            $product->current_price = $product->calculateCurrentPrice($latestGoldPrice);
        }

        // Trigger ProductApproved event - this will automatically queue emails to all buyers
        event(new ProductApproved($product));

        return back()->with('success', 'Produto aprovado com sucesso');
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $product = Product::findOrFail($id);
        $product->reject(auth()->id(), $request->reason);

        return back()->with('success', 'Produto rejeitado');
    }

    public function recover($id)
    {
        $product = Product::findOrFail($id);

        $product->update([
            'status' => 'pending',
            'rejection_reason' => null,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return back()->with('success', 'Produto recuperado para revisão');
    }
}
