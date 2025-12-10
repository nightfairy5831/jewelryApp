<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerController extends Controller
{
    /**
     * Display seller management page
     */
    public function index(Request $request)
    {
        $nameSearch = $request->input('name');
        $emailSearch = $request->input('email');
        $statusFilter = $request->input('status');

        // Show only users with role = 'seller'
        $query = User::where('role', 'seller');

        if ($statusFilter && $statusFilter !== 'all') {
            $query->where('seller_status', $statusFilter);
        }

        if ($nameSearch) {
            $query->where('name', 'like', "%{$nameSearch}%");
        }

        if ($emailSearch) {
            $query->where('email', 'like', "%{$emailSearch}%");
        }

        $sellers = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Sellers', [
            'sellers' => $sellers,
            'filters' => [
                'name' => $nameSearch,
                'email' => $emailSearch,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Approve a seller request
     */
    public function approve(User $seller)
    {
        $seller->update([
            'role' => 'seller',
            'seller_status' => 'approved',
            'seller_approved' => true,
            'seller_approved_by' => auth()->id(),
            'seller_approved_at' => now(),
            'seller_requested_at' => null,
            'is_active' => true,
        ]);

        return redirect()
            ->route('admin.sellers.index')
            ->with('success', 'Vendedor aprovado com sucesso!');
    }

    /**
     * Reject a seller request
     */
    public function reject(User $seller)
    {
        $seller->update([
            'role' => 'buyer',
            'seller_status' => 'rejected',
            'seller_approved' => false,
            'seller_requested_at' => null,
            'seller_approved_at' => null,
            'seller_approved_by' => null,
        ]);

        return redirect()
            ->route('admin.sellers.index')
            ->with('success', 'Solicitação rejeitada.');
    }

    /**
     * Deactivate a seller
     */
    public function deactivate(User $seller)
    {
        $seller->update([
            'seller_status' => 'inactive',
            'is_active' => false,
        ]);

        return redirect()
            ->route('admin.sellers.index')
            ->with('success', 'Vendedor desativado com sucesso!');
    }

    /**
     * Activate a seller
     */
    public function activate(User $seller)
    {
        $seller->update([
            'seller_status' => 'approved',
            'is_active' => true,
        ]);

        return redirect()
            ->route('admin.sellers.index')
            ->with('success', 'Vendedor ativado com sucesso!');
    }
}
