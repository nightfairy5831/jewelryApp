<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $user;

    /**
     * Create a new event instance.
     */
    public function __construct($order, $user = null)
    {
        $this->order = $order;
        $this->user = $user ?? $order->buyer;
    }
}
