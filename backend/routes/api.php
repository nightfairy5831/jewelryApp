<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\GoldPriceController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\SellerController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public product routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Public review routes
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);

// Debug route - TODO: Remove in production
Route::get('/debug/products', function () {
    $maleProducts = \App\Models\Product::where('category', 'Male')->get();
    $activeSellers = \App\Models\User::where('role', 'seller')->where('is_active', true)->get();
    $maleWithActiveSellers = \App\Models\Product::where('category', 'Male')
        ->whereHas('seller', function($q) {
            $q->where('is_active', true);
        })
        ->get();

    return response()->json([
        'total_male_products' => $maleProducts->count(),
        'male_products' => $maleProducts->map(fn($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'seller_id' => $p->seller_id,
            'status' => $p->status,
            'is_active' => $p->is_active,
            'seller_exists' => $p->seller ? true : false,
            'seller_is_active' => $p->seller?->is_active ?? false,
        ]),
        'total_active_sellers' => $activeSellers->count(),
        'active_sellers' => $activeSellers->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'is_active' => $s->is_active,
        ]),
        'male_products_with_active_sellers' => $maleWithActiveSellers->count(),
    ]);
});

// Public gold price routes
Route::get('/gold-price/current', [GoldPriceController::class, 'getCurrentPrice']);

// Mercado Pago webhook (public route - no auth required)
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);

// Test Mercado Pago connection (public route for testing)
Route::get('/payments/test-connection', [PaymentController::class, 'testConnection']);

// Protected routes (require JWT authentication)
Route::middleware('auth:api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/request-seller-role', [AuthController::class, 'requestSellerRole']);

    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Reviews (buyer only)
    Route::post('/products/{productId}/reviews', [ReviewController::class, 'store']);

    // Q&A Messages
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::post('/messages/{id}/answer', [MessageController::class, 'answer']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

    // Cart routes
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/add-item', [CartController::class, 'addItem']);
        Route::put('/update-item/{itemId}', [CartController::class, 'updateItem']);
        Route::delete('/remove-item/{itemId}', [CartController::class, 'removeItem']);
        Route::post('/clear', [CartController::class, 'clear']);
    });

    // Order routes (Buyer)
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::post('/', [OrderController::class, 'store']);
        Route::post('/{id}/cancel', [OrderController::class, 'cancel']);
    });

    // Seller routes
    Route::prefix('seller')->group(function () {
        // Dashboard
        Route::get('/dashboard', [SellerController::class, 'dashboard']);
        Route::get('/analytics', [SellerController::class, 'analytics']);

        // Products
        Route::get('/products', [SellerController::class, 'products']);

        // Orders
        Route::get('/orders', [SellerController::class, 'orders']);
        Route::patch('/orders/{id}/ship', [OrderController::class, 'markAsShipped']);
    });

    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::post('/create-intent', [PaymentController::class, 'createIntent']);
        Route::post('/{id}/retry', [PaymentController::class, 'retry']);
        Route::get('/{id}/status', [PaymentController::class, 'status']);
    });

    // Wishlist routes
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/add', [WishlistController::class, 'add']);
        Route::delete('/{productId}', [WishlistController::class, 'remove']);
        Route::post('/clear', [WishlistController::class, 'clear']);
    });
});
