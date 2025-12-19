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
use App\Http\Controllers\Api\UploadController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public product routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Public review routes
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);

// Public gold price routes
Route::get('/gold-price/current', [GoldPriceController::class, 'getCurrentPrice']);

// Mercado Pago webhook (public route - no auth required)
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);

// Public Q&A messages (anyone can view)
Route::get('/messages', [MessageController::class, 'index']);

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

    // Q&A Messages (protected)
    Route::get('/messages/my-questions', [MessageController::class, 'myQuestions']);
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
        Route::get('/purchased-products', [OrderController::class, 'purchasedProducts']);
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

    // File upload routes
    Route::prefix('upload')->group(function () {
        Route::post('/r2', [UploadController::class, 'upload']);
        Route::delete('/r2/{key}', [UploadController::class, 'delete'])->where('key', '.*');
    });
});
