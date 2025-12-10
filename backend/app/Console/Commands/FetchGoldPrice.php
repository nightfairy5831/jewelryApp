<?php

namespace App\Console\Commands;

use App\Services\GoldPriceService;
use Illuminate\Console\Command;

class FetchGoldPrice extends Command
{
    protected $signature = 'gold:fetch';
    protected $description = 'Fetch current gold price and update product prices';

    public function handle(GoldPriceService $service)
    {
        $this->info('Fetching gold price...');

        $result = $service->fetchAndUpdate();

        if ($result['success']) {
            $this->info("Gold price updated: R$ {$result['price']}");
            if (isset($result['change_percent'])) {
                $change = $result['change_percent'] >= 0 ? "+{$result['change_percent']}" : $result['change_percent'];
                $this->info("Change: {$change}%");
            }
        } else {
            $this->error("Failed: {$result['error']}");
            return 1;
        }

        return 0;
    }
}
