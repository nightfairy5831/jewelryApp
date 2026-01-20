<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string|in:buyer,seller',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Default role is buyer, but allow seller registration
        $role = $request->input('role', 'buyer');

        // If seller role is requested, set seller status to pending approval
        $sellerStatus = $role === 'seller' ? 'pending' : null;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => $role,
            'seller_status' => $sellerStatus,
            'seller_requested_at' => $role === 'seller' ? now() : null,
        ]);

        // Trigger Registered event - this will automatically queue welcome email
        event(new Registered($user));

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Login user and return JWT token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = auth()->user();

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active'
            ], 403);
        }

        // Allow sellers to login regardless of approval status
        // They can access their dashboard but certain features may be restricted based on seller_status

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me()
    {
        return response()->json([
            'success' => true,
            'user' => auth()->user()
        ]);
    }

    /**
     * Logout user (invalidate token)
     */
    public function logout()
    {
        auth()->logout();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out'
        ]);
    }

    /**
     * Refresh JWT token
     */
    public function refresh()
    {
        return response()->json([
            'success' => true,
            'token' => auth()->refresh()
        ]);
    }

    /**
     * Request to become a seller
     */
    public function requestSellerRole(Request $request)
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return response()->json([
                'success' => false,
                'message' => 'Only buyers can request seller role'
            ], 400);
        }

        $user->update([
            'seller_requested_at' => now(),
            'seller_status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Seller request submitted successfully. Awaiting admin approval.',
        ]);
    }
}
