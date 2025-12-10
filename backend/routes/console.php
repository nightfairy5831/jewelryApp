<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

$interval = (int) env('GOLD_PRICE_FETCH_INTERVAL', 5);

if ($interval === 1) {
    Schedule::command('gold:fetch')->hourly();
} else {
    Schedule::command('gold:fetch')->cron("0 */{$interval} * * *");
}

// Release expired stock reservations every hour
Schedule::command('orders:release-expired-stock')->hourly();
