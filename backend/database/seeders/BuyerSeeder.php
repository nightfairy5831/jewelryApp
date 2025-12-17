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
                'email' => 'jastinmax888@gmail.com',
                'phone' => '(11) 91234-5678',
            ],
            [
                'name' => 'Patricia Lima',
                'email' => 'nightfairy5831@gmail.com',
                'phone' => '(21) 98765-4321',
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
