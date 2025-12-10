<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\GoldPriceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings');
    }

    public function testGoldApi(GoldPriceService $goldPriceService)
    {
        $result = $goldPriceService->testFetchGoldPrice();

        if ($result['success']) {
            $goldPriceService->saveGoldPriceFromApi($result);
        }

        return response()->json($result);
    }

    public function testConversionApi(GoldPriceService $goldPriceService)
    {
        $result = $goldPriceService->testFetchConversionRate();
        return response()->json($result);
    }
}
