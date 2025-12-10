<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SellerSeeder extends Seeder
{
    public function run(): void
    {
        $sellers = [
            [
                'name' => 'Maria Santos',
                'email' => 'devnight0710@gmail.com',
                'phone' => '(11) 98765-4321',
            ],
            [
                'name' => 'João Silva',
                'email' => 'dollycookie0710@gmail.com',
                'phone' => '(21) 97654-3210',
            ],
            [
                'name' => 'Ana Costa',
                'email' => 'tom8jerry0913@gmail.com',
                'phone' => '(31) 96543-2109',
            ],
        ];

        foreach ($sellers as $sellerData) {
            User::create([
                'name' => $sellerData['name'],
                'email' => $sellerData['email'],
                'phone' => $sellerData['phone'],
                'password' => Hash::make('password123'),
                'role' => 'seller',
                'seller_status' => 'approved',
                'seller_approved' => true,  // Important: must be true for approved sellers
                'seller_approved_at' => now(),
                'is_active' => true,
            ]);
        }

        echo "Created " . count($sellers) . " sellers successfully!\n";
    }
}
