<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\User;
use App\Models\GoldPrice;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Get sellers
        $sellers = User::where('role', 'seller')->where('seller_status', 'approved')->get();

        if ($sellers->isEmpty()) {
            echo "No approved sellers found. Please run UserSeeder first.\n";
            return;
        }

        $latestGoldPrice = GoldPrice::getLatest();
        $currentGoldPrice = $latestGoldPrice?->price_gram_18k ?? 99.17;

        $products = $this->getProductsData();
        $descriptions = $this->getDescriptions();
        $karats = ['18k', '18k', '18k', '14k', '14k', '10k'];

        $fillingOptions = ['Solid', 'Hollow', 'Defense', null];
        $gemstoneOptions = ['Synthetic', 'Natural', 'Without Stones', null];

        foreach ($products as $index => $productData) {
            $seller = $sellers->random();
            $karat = $karats[array_rand($karats)];
            $currentPrice = $productData['base_price'];

            // Use the product's specific image URL (each product has unique image)
            $imageUrl = $productData['image'];

            // Use the same image URL three times for each product
            $images = [
                $imageUrl,
                $imageUrl,
                $imageUrl,
            ];

            Product::create([
                'seller_id' => $seller->id,
                'name' => $productData['name'],
                'description' => $descriptions[array_rand($descriptions)],
                'base_price' => $productData['base_price'],
                'current_price' => $currentPrice,
                'gold_weight_grams' => $productData['gold_weight'],
                'gold_karat' => $karat,
                'initial_gold_price' => $currentGoldPrice,
                'category' => $productData['category'],
                'subcategory' => $productData['subcategory'],
                'filling' => $fillingOptions[array_rand($fillingOptions)],
                'is_gemstone' => $gemstoneOptions[array_rand($gemstoneOptions)],
                'images' => json_encode($images),
                // Use GitHub raw URL for 3D model files (no CORS issues)
                'model_3d_url' => 'https://raw.githubusercontent.com/nightmare5831/jewelry_backend/main/public/jewelry.glb',
                'model_3d_type' => 'glb',
                'stock_quantity' => rand(5, 50),
                'is_active' => true,
                'status' => 'approved',
                'approved_by' => 1,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);
        }

        echo "Created " . count($products) . " products successfully!\n";
    }

    private function getProductsData(): array
    {
        $baseUrl = 'https://raw.githubusercontent.com/nightmare5831/jewelry_backend/main/public/assets/';

        return [
            // Male - Chains (4 products) - First one uses GitHub image
            ['name' => 'Corrente Grumet Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 15.0, 'base_price' => 5500.00, 'image' => $baseUrl . 'male-chain.png'],
            ['name' => 'Corrente Cartier Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 12.5, 'base_price' => 4800.00, 'image' => 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400'],
            ['name' => 'Corrente Corda Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 14.0, 'base_price' => 5200.00, 'image' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'],
            ['name' => 'Corrente Figaro Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 13.5, 'base_price' => 5000.00, 'image' => 'https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=400'],

            // Male - Rings (4 products) - First one uses GitHub image
            ['name' => 'Anel Masculino em Ouro 18k', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 5.5, 'base_price' => 2500.00, 'image' => $baseUrl . 'male-ring.png'],
            ['name' => 'Anel Solitário Masculino', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 6.0, 'base_price' => 2800.00, 'image' => 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=400'],
            ['name' => 'Anel Masculino Pedra Ônix', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 7.0, 'base_price' => 3200.00, 'image' => 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400'],
            ['name' => 'Anel Masculino Tradicional', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 5.0, 'base_price' => 2400.00, 'image' => 'https://images.unsplash.com/photo-1589674781759-c0dfcc2d32d8?w=400'],

            // Male - Earrings and Pendants (4 products) - First one uses GitHub image
            ['name' => 'Brinco Masculino Argola', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 3.0, 'base_price' => 1500.00, 'image' => $baseUrl . 'earring.png'],
            ['name' => 'Pingente Masculino Cruz', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 4.5, 'base_price' => 2200.00, 'image' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'],
            ['name' => 'Brinco Masculino Tarraxa', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 2.5, 'base_price' => 1300.00, 'image' => 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'],
            ['name' => 'Pingente Masculino Placa', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 5.0, 'base_price' => 2500.00, 'image' => 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400'],

            // Female - Chains (4 products) - First one uses GitHub image
            ['name' => 'Corrente Veneziana Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 6.0, 'base_price' => 2800.00, 'image' => $baseUrl . 'female-chaing.png'],
            ['name' => 'Corrente Cartier Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 5.5, 'base_price' => 2600.00, 'image' => 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'],
            ['name' => 'Corrente Singapura Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 5.0, 'base_price' => 2400.00, 'image' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'],
            ['name' => 'Corrente Portuguesa Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 6.5, 'base_price' => 3000.00, 'image' => 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400'],

            // Female - Rings (4 products) - First one uses GitHub image
            ['name' => 'Anel Solitário Feminino', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 3.5, 'base_price' => 1800.00, 'image' => $baseUrl . 'femail-ring.png'],
            ['name' => 'Anel Meia Aliança', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 4.0, 'base_price' => 2100.00, 'image' => 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400'],
            ['name' => 'Anel Feminino Diamantes', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 4.5, 'base_price' => 2500.00, 'image' => 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400'],
            ['name' => 'Anel Feminino Delicado', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 3.0, 'base_price' => 1600.00, 'image' => 'https://images.unsplash.com/photo-1590858733144-0f1d7e8f62b8?w=400'],

            // Female - Earrings and Pendants (4 products) - Uses same GitHub image as Male Earrings
            ['name' => 'Brinco Feminino Gota', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 2.5, 'base_price' => 1400.00, 'image' => $baseUrl . 'earring.png'],
            ['name' => 'Pingente Feminino Coração', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 3.0, 'base_price' => 1600.00, 'image' => 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'],
            ['name' => 'Brinco Feminino Argola', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 3.5, 'base_price' => 1800.00, 'image' => 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400'],
            ['name' => 'Pingente Feminino Flor', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 2.8, 'base_price' => 1500.00, 'image' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'],

            // Wedding Rings - Wedding Anniversary (3 products) - First one uses GitHub image
            ['name' => 'Aliança Aniversário Clássica', 'category' => 'Wedding Rings', 'subcategory' => 'Wedding Anniversary', 'gold_weight' => 4.0, 'base_price' => 1900.00, 'image' => $baseUrl . 'wedding anniversary-ring.png'],
            ['name' => 'Aliança Aniversário com Diamantes', 'category' => 'Wedding Rings', 'subcategory' => 'Wedding Anniversary', 'gold_weight' => 5.0, 'base_price' => 2800.00, 'image' => 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400'],
            ['name' => 'Aliança Aniversário Moderna', 'category' => 'Wedding Rings', 'subcategory' => 'Wedding Anniversary', 'gold_weight' => 4.5, 'base_price' => 2400.00, 'image' => 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400'],

            // Wedding Rings - Engagement (3 products) - First one uses GitHub image
            ['name' => 'Anel de Noivado Solitário', 'category' => 'Wedding Rings', 'subcategory' => 'Engagement', 'gold_weight' => 4.5, 'base_price' => 3500.00, 'image' => $baseUrl . 'engagement-ring.png'],
            ['name' => 'Anel de Noivado Halo', 'category' => 'Wedding Rings', 'subcategory' => 'Engagement', 'gold_weight' => 5.5, 'base_price' => 4200.00, 'image' => 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'],
            ['name' => 'Anel de Noivado Luxo', 'category' => 'Wedding Rings', 'subcategory' => 'Engagement', 'gold_weight' => 6.0, 'base_price' => 4800.00, 'image' => 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=400'],

            // Wedding Rings - Marriage (3 products) - First one uses GitHub image
            ['name' => 'Aliança de Casamento Lisa', 'category' => 'Wedding Rings', 'subcategory' => 'Marriage', 'gold_weight' => 4.0, 'base_price' => 2000.00, 'image' => $baseUrl . 'wedding-ring.png'],
            ['name' => 'Aliança de Casamento Trabalhada', 'category' => 'Wedding Rings', 'subcategory' => 'Marriage', 'gold_weight' => 4.5, 'base_price' => 2300.00, 'image' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'],
            ['name' => 'Aliança de Casamento com Pedras', 'category' => 'Wedding Rings', 'subcategory' => 'Marriage', 'gold_weight' => 5.0, 'base_price' => 2700.00, 'image' => 'https://images.unsplash.com/photo-1590858733144-0f1d7e8f62b8?w=400'],

            // Other - Perfumes (3 products) - First one uses GitHub image
            ['name' => 'Perfume Luxo Masculino', 'category' => 'Other', 'subcategory' => 'Perfumes', 'gold_weight' => 0, 'base_price' => 350.00, 'image' => $baseUrl . 'perfumes.png'],
            ['name' => 'Perfume Luxo Feminino', 'category' => 'Other', 'subcategory' => 'Perfumes', 'gold_weight' => 0, 'base_price' => 420.00, 'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400'],
            ['name' => 'Perfume Premium Unissex', 'category' => 'Other', 'subcategory' => 'Perfumes', 'gold_weight' => 0, 'base_price' => 380.00, 'image' => 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400'],

            // Other - Watches (3 products) - First one uses GitHub image
            ['name' => 'Relógio Clássico Dourado', 'category' => 'Other', 'subcategory' => 'Watches', 'gold_weight' => 0, 'base_price' => 2500.00, 'image' => $baseUrl . 'watch.png'],
            ['name' => 'Relógio Esportivo Premium', 'category' => 'Other', 'subcategory' => 'Watches', 'gold_weight' => 0, 'base_price' => 3200.00, 'image' => 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400'],
            ['name' => 'Relógio Social Elegante', 'category' => 'Other', 'subcategory' => 'Watches', 'gold_weight' => 0, 'base_price' => 2800.00, 'image' => 'https://images.unsplash.com/photo-1495704907664-81f74a7efd9b?w=400'],

            // Other - Other (3 products) - First one uses GitHub image
            ['name' => 'Porta Joias Luxo', 'category' => 'Other', 'subcategory' => 'Other', 'gold_weight' => 0, 'base_price' => 180.00, 'image' => $baseUrl . 'other-other.png'],
            ['name' => 'Kit Presente Premium', 'category' => 'Other', 'subcategory' => 'Other', 'gold_weight' => 0, 'base_price' => 250.00, 'image' => 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400'],
            ['name' => 'Estojo para Anéis', 'category' => 'Other', 'subcategory' => 'Other', 'gold_weight' => 0, 'base_price' => 150.00, 'image' => 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400'],
        ];
    }

    private function getDescriptions(): array
    {
        return [
            'Peça em ouro 18k de alta qualidade, produzida com técnicas artesanais.',
            'Joia elegante e sofisticada, perfeita para ocasiões especiais.',
            'Design moderno e atemporal, que combina com qualquer estilo.',
            'Acabamento impecável e detalhes refinados.',
            'Peça única que representa tradição e exclusividade.',
        ];
    }
}
