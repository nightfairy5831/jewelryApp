<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed all tables in correct order
        $this->call([
            // 1. Email templates (independent)
            EmailTemplateSeeder::class,

            // 2. Users (SuperAdmin, Sellers, and Buyers)
            SuperAdminSeeder::class,
            SellerSeeder::class,
            BuyerSeeder::class,

            // 3. Gold prices (independent)
            GoldPriceSeeder::class,
            // 4. Products (depends on sellers, gold prices, categories)
            ProductSeeder::class,
            // 5. Messages (depends on users)
            MessageSeeder::class,
        ]);

        echo "\n✅ All seeders completed successfully!\n";
    }
}
