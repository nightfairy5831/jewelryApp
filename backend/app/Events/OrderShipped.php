<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $user;
    public $trackingNumber;

    /**
     * Create a new event instance.
     */
    public function __construct($order, $user, string $trackingNumber)
    {
        $this->order = $order;
        $this->user = $user;
        $this->trackingNumber = $trackingNumber;
    }
}
