<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SellerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            return redirect()->route('login');
        }

        $user = auth()->user();

        if (!$user->isSeller() && !$user->isAdmin()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Forbidden. Seller access required.'], 403);
            }
            return redirect()->route('login')->with('error', 'Acesso negado. Apenas vendedores aprovados.');
        }

        return $next($request);
    }
}
