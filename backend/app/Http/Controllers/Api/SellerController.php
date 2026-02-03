<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SellerController extends Controller
{
    /**
     * Get seller dashboard analytics
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Unauthorized. Seller access required.'], 403);
        }

        // Product statistics
        $totalProducts = Product::where('seller_id', $user->id)->count();
        $approvedProducts = Product::where('seller_id', $user->id)
            ->where('status', 'approved')
            ->where('is_active', true)
            ->count();
        $pendingProducts = Product::where('seller_id', $user->id)
            ->where('status', 'pending')
            ->count();
        $rejectedProducts = Product::where('seller_id', $user->id)
            ->where('status', 'rejected')
            ->count();

        // Order statistics - only count paid orders (exclude 'pending' and 'cancelled')
        $orderItems = OrderItem::where('seller_id', $user->id)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['confirmed', 'accepted', 'shipped', 'delivered'])
            ->select('order_items.*')
            ->get();
        $totalOrders = $orderItems->pluck('order_id')->unique()->count();
        $totalRevenue = $orderItems->sum('total_price');

        // Order status breakdown - only paid orders
        $ordersByStatus = OrderItem::where('seller_id', $user->id)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['confirmed', 'accepted', 'shipped', 'delivered'])
            ->select('orders.status', DB::raw('count(distinct orders.id) as count'))
            ->groupBy('orders.status')
            ->get()
            ->pluck('count', 'status');

        // Recent products
        $recentProducts = Product::where('seller_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent orders (last 5) - only paid orders
        $recentOrderIds = OrderItem::where('seller_id', $user->id)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['confirmed', 'accepted', 'shipped', 'delivered'])
            ->select('order_items.order_id', DB::raw('MAX(order_items.created_at) as max_created_at'))
            ->groupBy('order_items.order_id')
            ->orderBy('max_created_at', 'desc')
            ->take(5)
            ->pluck('order_items.order_id');

        $recentOrders = Order::whereIn('id', $recentOrderIds)
            ->with(['items' => function ($query) use ($user) {
                $query->where('seller_id', $user->id)->with('product');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'analytics' => [
                'products' => [
                    'total' => $totalProducts,
                    'approved' => $approvedProducts,
                    'pending' => $pendingProducts,
                    'rejected' => $rejectedProducts,
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'revenue' => (float) $totalRevenue,
                    'by_status' => $ordersByStatus,
                ],
            ],
            'recent_products' => $recentProducts,
            'recent_orders' => $recentOrders,
        ]);
    }

    /**
     * Get seller's products with optional filtering
     */
    public function products(Request $request)
    {
        $user = $request->user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Unauthorized. Seller access required.'], 403);
        }

        $query = Product::where('seller_id', $user->id);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by active/inactive
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $products = $query->paginate(20);

        return response()->json($products);
    }

    /**
     * Get seller's orders
     */
    public function orders(Request $request)
    {
        $user = $request->user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Unauthorized. Seller access required.'], 403);
        }

        // Get unique order IDs containing seller's products
        $orderIds = OrderItem::where('seller_id', $user->id)
            ->select('order_id')
            ->groupBy('order_id')
            ->pluck('order_id');

        // Load orders with only seller's items
        // Only show paid orders (exclude 'pending' and 'cancelled')
        $query = Order::whereIn('id', $orderIds)
            ->whereIn('status', ['confirmed', 'accepted', 'shipped', 'delivered'])
            ->with([
                'buyer:id,name,email',
                'items' => function ($query) use ($user) {
                    $query->where('seller_id', $user->id)->with('product:id,name,images');
                },
                'payment:id,order_id,payment_method,status,amount',
            ]);

        // Filter by specific status (still within paid orders only)
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $orders = $query->paginate(20);

        return response()->json($orders);
    }

    /**
     * Get detailed analytics for seller
     */
    public function analytics(Request $request)
    {
        $user = $request->user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Unauthorized. Seller access required.'], 403);
        }

        // Sales by product (top 10) - only from paid orders
        $salesByProduct = OrderItem::where('seller_id', $user->id)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['confirmed', 'accepted', 'shipped', 'delivered'])
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_quantity'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('order_items.product_id')
            ->orderBy('total_revenue', 'desc')
            ->take(10)
            ->with('product:id,name,images')
            ->get();

        // Revenue by month (last 6 months) - only from paid orders
        $revenueByMonth = OrderItem::where('seller_id', $user->id)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['confirmed', 'accepted', 'shipped', 'delivered'])
            ->where('orders.created_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw('YEAR(orders.created_at) as year'),
                DB::raw('MONTH(orders.created_at) as month'),
                DB::raw('SUM(order_items.total_price) as revenue'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count')
            )
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        return response()->json([
            'sales_by_product' => $salesByProduct,
            'revenue_by_month' => $revenueByMonth,
        ]);
    }
}
