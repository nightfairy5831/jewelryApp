<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $addresses = Address::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'label' => 'nullable|string|max:50',
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:50',
            'postal_code' => 'required|string|max:20',
            'country' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();

        // Check if this is the first address
        $isFirst = !Address::where('user_id', $user->id)->exists();

        $address = Address::create([
            'user_id' => $user->id,
            'label' => $request->label,
            'street' => $request->street,
            'city' => $request->city,
            'state' => $request->state,
            'postal_code' => $request->postal_code,
            'country' => $request->country ?? 'Brazil',
            'is_default' => $isFirst,
        ]);

        return response()->json([
            'message' => 'Endereço adicionado',
            'address' => $address,
        ], 201);
    }

    public function destroy($id)
    {
        $user = Auth::user();

        $address = Address::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json(['error' => 'Endereço não encontrado'], 404);
        }

        $wasDefault = $address->is_default;
        $address->delete();

        // If deleted address was default, set another as default
        if ($wasDefault) {
            $newDefault = Address::where('user_id', $user->id)->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }

        return response()->json(['message' => 'Endereço removido']);
    }

    public function setDefault($id)
    {
        $user = Auth::user();

        $address = Address::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json(['error' => 'Endereço não encontrado'], 404);
        }

        // Remove default from all other addresses
        Address::where('user_id', $user->id)
            ->where('id', '!=', $id)
            ->update(['is_default' => false]);

        $address->update(['is_default' => true]);

        return response()->json([
            'message' => 'Endereço padrão atualizado',
            'address' => $address->fresh(),
        ]);
    }
}
