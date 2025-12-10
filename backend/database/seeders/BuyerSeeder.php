<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class BuyerSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = [
            [
                'name' => 'Carlos Oliveira',
                'email' => 'buyer1@test.com',
                'phone' => '(11) 91234-5678',
            ],
            [
                'name' => 'Patricia Lima',
                'email' => 'buyer2@test.com',
                'phone' => '(21) 98765-4321',
            ],
            [
                'name' => 'Roberto Fernandes',
                'email' => 'buyer3@test.com',
                'phone' => '(31) 99876-5432',
            ],
        ];

        foreach ($buyers as $buyerData) {
            User::create([
                'name' => $buyerData['name'],
                'email' => $buyerData['email'],
                'phone' => $buyerData['phone'],
                'password' => Hash::make('password123'),
                'role' => 'buyer',
                'is_active' => true,
            ]);
        }

        echo "Created " . count($buyers) . " buyers successfully!\n";
    }
}
