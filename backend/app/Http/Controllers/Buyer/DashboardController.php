<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\GoldPrice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $category = $request->get('category', 'all');
        $subcategory = $request->get('subcategory', 'all');
        $minPrice = $request->get('min_price');
        $maxPrice = $request->get('max_price');

        $query = Product::where('status', 'approved')
            ->where('is_active', true)
            ->with(['seller:id,name'])
            ->latest();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($category !== 'all') {
            $query->where('category', $category);
        }

        if ($subcategory !== 'all') {
            $query->where('subcategory', $subcategory);
        }

        if ($minPrice) {
            $query->where('base_price', '>=', $minPrice);
        }

        if ($maxPrice) {
            $query->where('base_price', '<=', $maxPrice);
        }

        $products = $query->paginate(14)->withQueryString();

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

        return Inertia::render('Buyer/Dashboard', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'subcategory' => $subcategory,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
            ],
        ]);
    }
}
