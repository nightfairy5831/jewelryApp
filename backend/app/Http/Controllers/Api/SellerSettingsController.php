<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SellerSettingsController extends Controller
{
    /**
     * Get OAuth URL for seller to connect Mercado Pago
     */
    public function getOAuthUrl()
    {
        $user = Auth::user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Only sellers can connect Mercado Pago'], 403);
        }

        $mode = config('services.mercadopago.mode');

        // In sandbox mode, return mode without OAuth URL
        if ($mode === 'sandbox') {
            return response()->json([
                'mode' => 'sandbox',
                'oauth_url' => null,
            ]);
        }

        // Production mode - return OAuth URL
        $params = http_build_query([
            'client_id' => config('services.mercadopago.client_id'),
            'response_type' => 'code',
            'platform_id' => 'mp',
            'redirect_uri' => config('services.mercadopago.redirect_uri'),
            'state' => $user->id,
        ]);

        return response()->json([
            'mode' => 'production',
            'oauth_url' => "https://auth.mercadopago.com.br/authorization?{$params}",
        ]);
    }

    /**
     * Handle OAuth callback from Mercado Pago
     */
    public function handleOAuthCallback(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'state' => 'required|integer',
        ]);

        $userId = $request->state;
        $user = \App\Models\User::findOrFail($userId);

        try {
            $response = Http::asForm()->post('https://api.mercadopago.com/oauth/token', [
                'client_id' => config('services.mercadopago.client_id'),
                'client_secret' => config('services.mercadopago.client_secret'),
                'grant_type' => 'authorization_code',
                'code' => $request->code,
                'redirect_uri' => config('services.mercadopago.redirect_uri'),
            ]);

            if (!$response->successful()) {
                Log::error('MercadoPago OAuth failed', ['response' => $response->json()]);
                return response()->json(['error' => 'Failed to connect Mercado Pago'], 400);
            }

            $data = $response->json();

            $user->update([
                'mercadopago_connected' => true,
                'mercadopago_user_id' => $data['user_id'],
                'mercadopago_access_token' => $data['access_token'],
                'mercadopago_refresh_token' => $data['refresh_token'],
            ]);

            Log::info('Seller connected MercadoPago', [
                'seller_id' => $user->id,
                'mp_user_id' => $data['user_id'],
            ]);

            // Redirect to app with success
            return redirect('perfectjewel://mercadopago-success');

        } catch (\Exception $e) {
            Log::error('MercadoPago OAuth error', ['error' => $e->getMessage()]);
            return redirect('perfectjewel://mercadopago-error');
        }
    }

    /**
     * Disconnect Mercado Pago account
     */
    public function disconnect()
    {
        $user = Auth::user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Only sellers can manage Mercado Pago'], 403);
        }

        $user->update([
            'mercadopago_connected' => false,
            'mercadopago_user_id' => null,
            'mercadopago_access_token' => null,
            'mercadopago_refresh_token' => null,
        ]);

        return response()->json(['message' => 'Mercado Pago disconnected']);
    }

    /**
     * Get Mercado Pago connection status
     */
    public function getStatus()
    {
        $user = Auth::user();

        return response()->json([
            'connected' => $user->mercadopago_connected && $user->mercadopago_user_id,
            'user_id' => $user->mercadopago_user_id,
        ]);
    }

    /**
     * Connect Mercado Pago using access token directly (sandbox mode)
     */
    public function connectWithToken(Request $request)
    {
        $user = Auth::user();

        if (!$user->isSeller()) {
            return response()->json(['error' => 'Only sellers can connect Mercado Pago'], 403);
        }

        $request->validate([
            'access_token' => 'required|string',
        ]);

        try {
            // Validate token by calling MP API to get user info
            $response = Http::withToken($request->access_token)
                ->get('https://api.mercadopago.com/users/me');

            if (!$response->successful()) {
                Log::error('MercadoPago token validation failed', ['response' => $response->json()]);
                return response()->json(['error' => 'Invalid access token'], 400);
            }

            $mpUser = $response->json();

            // Save token to database
            $user->update([
                'mercadopago_connected' => true,
                'mercadopago_user_id' => $mpUser['id'],
                'mercadopago_access_token' => $request->access_token,
                'mercadopago_refresh_token' => null, // No refresh token in manual flow
            ]);

            Log::info('Seller connected MercadoPago with token', [
                'seller_id' => $user->id,
                'mp_user_id' => $mpUser['id'],
            ]);

            return response()->json([
                'message' => 'Mercado Pago connected successfully',
                'connected' => true,
                'user_id' => $mpUser['id'],
            ]);

        } catch (\Exception $e) {
            Log::error('MercadoPago token connection error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to connect Mercado Pago'], 500);
        }
    }
}
