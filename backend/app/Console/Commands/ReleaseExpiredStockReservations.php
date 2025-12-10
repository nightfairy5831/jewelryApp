<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

class ReleaseExpiredStockReservations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:release-expired-stock';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Release stock for orders with expired reservations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired stock reservations...');

        // Find orders with expired reservations
        $expiredOrders = Order::where('stock_reserved', true)
            ->where('reserved_until', '<', now())
            ->where('status', 'pending')
            ->get();

        if ($expiredOrders->isEmpty()) {
            $this->info('No expired reservations found.');
            return 0;
        }

        $count = 0;
        foreach ($expiredOrders as $order) {
            $order->releaseReservedStock();
            $count++;
            $this->info("Released stock for order #{$order->order_number}");
        }

        $this->info("Successfully released stock for {$count} expired orders.");
        return 0;
    }
}
