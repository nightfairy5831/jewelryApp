<?php

namespace App\Providers;

use App\Jobs\SendEmailJob;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ========================================
        // EMAIL EVENT LISTENERS
        // ========================================

        // 1. Welcome Email - Sent when user registers
        Event::listen(Registered::class, function (Registered $event) {
            SendEmailJob::dispatch(
                'welcome',
                $event->user->email,
                [
                    'userName' => $event->user->name,
                    'userEmail' => $event->user->email,
                ],
                [
                    'user_id' => $event->user->id,
                    'event' => 'user_registered',
                ]
            );
        });

        // 2. Purchase Confirmation Email - Sent when order is created
        Event::listen(\App\Events\OrderCreated::class, function ($event) {
            SendEmailJob::dispatch(
                'purchase',
                $event->user->email,
                [
                    'userName' => $event->user->name,
                    'orderNumber' => $event->order->order_number ?? '#' . $event->order->id,
                    'totalAmount' => 'R$ ' . number_format($event->order->total_amount ?? 0, 2, ',', '.'),
                ],
                [
                    'order_id' => $event->order->id,
                    'user_id' => $event->user->id,
                    'event' => 'order_created',
                ]
            );
        });

        // 3. New Product Alert Email - Sent when product is approved
        Event::listen(\App\Events\ProductApproved::class, function ($event) {
            // Get first image from the product
            $productImage = '';
            if (is_array($event->product->images) && count($event->product->images) > 0) {
                $productImage = $event->product->images[0];
            }

            // 3a. Send approval notification to the product owner (seller)
            $seller = $event->product->seller;
            if ($seller && $seller->is_active) {
                SendEmailJob::dispatch(
                    'product_approved_seller',
                    $seller->email,
                    [
                        'sellerName' => $seller->name,
                        'productName' => $event->product->name,
                        'productPrice' => 'R$ ' . number_format($event->product->current_price, 2, ',', '.'),
                        'productImage' => $productImage,
                    ],
                    [
                        'product_id' => $event->product->id,
                        'seller_id' => $seller->id,
                        'event' => 'product_approved_seller',
                    ]
                );
            }

            // 3b. Send new product alert to all active buyers
            // TODO: Later implement subscriber system with preferences
            $buyers = \App\Models\User::where('role', 'buyer')
                ->where('is_active', true)
                ->get();

            foreach ($buyers as $buyer) {
                SendEmailJob::dispatch(
                    'new_product',
                    $buyer->email,
                    [
                        'productName' => $event->product->name,
                        'productPrice' => 'R$ ' . number_format($event->product->current_price, 2, ',', '.'),
                        'productImage' => $productImage,
                    ],
                    [
                        'product_id' => $event->product->id,
                        'buyer_id' => $buyer->id,
                        'event' => 'product_approved_buyer',
                    ]
                );
            }
        });

        // 4. Shipping Notification Email - Sent when order is shipped
        Event::listen(\App\Events\OrderShipped::class, function ($event) {
            $order = $event->order;
            $buyer = $order->buyer;

            SendEmailJob::dispatch(
                'shipping',
                $buyer->email,
                [
                    'userName' => $buyer->name,
                    'orderNumber' => $order->order_number ?? '#' . $order->id,
                    'trackingNumber' => $order->tracking_number,
                ],
                [
                    'order_id' => $order->id,
                    'user_id' => $buyer->id,
                    'tracking_number' => $order->tracking_number,
                    'event' => 'order_shipped',
                ]
            );
        });
    }
}
