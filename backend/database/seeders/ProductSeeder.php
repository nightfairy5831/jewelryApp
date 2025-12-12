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
        $statuses = ['pending', 'approved', 'rejected'];
        $descriptions = $this->getDescriptions();
        $karats = ['18k', '18k', '18k', '14k', '14k', '10k'];

        // Base URL for images - using localhost for development
        $baseUrl = env('APP_URL', 'http://localhost') . '/assets/';

        foreach ($products as $index => $productData) {
            $seller = $sellers->random();
            $status = $statuses[array_rand($statuses)];
            $karat = $karats[array_rand($karats)];
            $currentPrice = $productData['base_price'];

            // Get category-specific image URL
            $imageUrl = $this->getImageForProduct($productData['category'], $productData['subcategory'], $baseUrl);

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
                'images' => json_encode($images),
                // Use GitHub raw URL for 3D model files (no CORS issues)
                'model_3d_url' => 'https://raw.githubusercontent.com/nightmare5831/jewelry_backend/main/public/jewelry.glb',
                'model_3d_type' => 'glb',
                'stock_quantity' => rand(5, 50),
                'is_active' => true,
                'status' => $status,
                'approved_by' => $status !== 'pending' ? 1 : null,
                'approved_at' => $status !== 'pending' ? now() : null,
                'rejection_reason' => $status === 'rejected' ? 'Imagem de baixa qualidade' : null,
            ]);
        }

        echo "Created " . count($products) . " products successfully!\n";
    }

    private function getProductsData(): array
    {
        return [
            // Male - Chains (4 products)
            ['name' => 'Corrente Grumet Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 15.0, 'base_price' => 5500.00],
            ['name' => 'Corrente Cartier Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 12.5, 'base_price' => 4800.00],
            ['name' => 'Corrente Corda Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 14.0, 'base_price' => 5200.00],
            ['name' => 'Corrente Figaro Masculina', 'category' => 'Male', 'subcategory' => 'Chains', 'gold_weight' => 13.5, 'base_price' => 5000.00],

            // Male - Rings (4 products)
            ['name' => 'Anel Masculino em Ouro 18k', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 5.5, 'base_price' => 2500.00],
            ['name' => 'Anel Solitário Masculino', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 6.0, 'base_price' => 2800.00],
            ['name' => 'Anel Masculino Pedra Ônix', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 7.0, 'base_price' => 3200.00],
            ['name' => 'Anel Masculino Tradicional', 'category' => 'Male', 'subcategory' => 'Rings', 'gold_weight' => 5.0, 'base_price' => 2400.00],

            // Male - Earrings and Pendants (4 products)
            ['name' => 'Brinco Masculino Argola', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 3.0, 'base_price' => 1500.00],
            ['name' => 'Pingente Masculino Cruz', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 4.5, 'base_price' => 2200.00],
            ['name' => 'Brinco Masculino Tarraxa', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 2.5, 'base_price' => 1300.00],
            ['name' => 'Pingente Masculino Placa', 'category' => 'Male', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 5.0, 'base_price' => 2500.00],

            // Female - Chains (4 products)
            ['name' => 'Corrente Veneziana Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 6.0, 'base_price' => 2800.00],
            ['name' => 'Corrente Cartier Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 5.5, 'base_price' => 2600.00],
            ['name' => 'Corrente Singapura Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 5.0, 'base_price' => 2400.00],
            ['name' => 'Corrente Portuguesa Feminina', 'category' => 'Female', 'subcategory' => 'Chains', 'gold_weight' => 6.5, 'base_price' => 3000.00],

            // Female - Rings (4 products)
            ['name' => 'Anel Solitário Feminino', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 3.5, 'base_price' => 1800.00],
            ['name' => 'Anel Meia Aliança', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 4.0, 'base_price' => 2100.00],
            ['name' => 'Anel Feminino Diamantes', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 4.5, 'base_price' => 2500.00],
            ['name' => 'Anel Feminino Delicado', 'category' => 'Female', 'subcategory' => 'Rings', 'gold_weight' => 3.0, 'base_price' => 1600.00],

            // Female - Earrings and Pendants (4 products)
            ['name' => 'Brinco Feminino Gota', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 2.5, 'base_price' => 1400.00],
            ['name' => 'Pingente Feminino Coração', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 3.0, 'base_price' => 1600.00],
            ['name' => 'Brinco Feminino Argola', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 3.5, 'base_price' => 1800.00],
            ['name' => 'Pingente Feminino Flor', 'category' => 'Female', 'subcategory' => 'Earrings and Pendants', 'gold_weight' => 2.8, 'base_price' => 1500.00],

            // Wedding Rings - Wedding Anniversary (3 products)
            ['name' => 'Aliança Aniversário Clássica', 'category' => 'Wedding Rings', 'subcategory' => 'Wedding Anniversary', 'gold_weight' => 4.0, 'base_price' => 1900.00],
            ['name' => 'Aliança Aniversário com Diamantes', 'category' => 'Wedding Rings', 'subcategory' => 'Wedding Anniversary', 'gold_weight' => 5.0, 'base_price' => 2800.00],
            ['name' => 'Aliança Aniversário Moderna', 'category' => 'Wedding Rings', 'subcategory' => 'Wedding Anniversary', 'gold_weight' => 4.5, 'base_price' => 2400.00],

            // Wedding Rings - Engagement (3 products)
            ['name' => 'Anel de Noivado Solitário', 'category' => 'Wedding Rings', 'subcategory' => 'Engagement', 'gold_weight' => 4.5, 'base_price' => 3500.00],
            ['name' => 'Anel de Noivado Halo', 'category' => 'Wedding Rings', 'subcategory' => 'Engagement', 'gold_weight' => 5.5, 'base_price' => 4200.00],
            ['name' => 'Anel de Noivado Luxo', 'category' => 'Wedding Rings', 'subcategory' => 'Engagement', 'gold_weight' => 6.0, 'base_price' => 4800.00],

            // Wedding Rings - Marriage (3 products)
            ['name' => 'Aliança de Casamento Lisa', 'category' => 'Wedding Rings', 'subcategory' => 'Marriage', 'gold_weight' => 4.0, 'base_price' => 2000.00],
            ['name' => 'Aliança de Casamento Trabalhada', 'category' => 'Wedding Rings', 'subcategory' => 'Marriage', 'gold_weight' => 4.5, 'base_price' => 2300.00],
            ['name' => 'Aliança de Casamento com Pedras', 'category' => 'Wedding Rings', 'subcategory' => 'Marriage', 'gold_weight' => 5.0, 'base_price' => 2700.00],

            // Other - Perfumes (3 products)
            ['name' => 'Perfume Luxo Masculino', 'category' => 'Other', 'subcategory' => 'Perfumes', 'gold_weight' => 0, 'base_price' => 350.00],
            ['name' => 'Perfume Luxo Feminino', 'category' => 'Other', 'subcategory' => 'Perfumes', 'gold_weight' => 0, 'base_price' => 420.00],
            ['name' => 'Perfume Premium Unissex', 'category' => 'Other', 'subcategory' => 'Perfumes', 'gold_weight' => 0, 'base_price' => 380.00],

            // Other - Watches (3 products)
            ['name' => 'Relógio Clássico Dourado', 'category' => 'Other', 'subcategory' => 'Watches', 'gold_weight' => 0, 'base_price' => 2500.00],
            ['name' => 'Relógio Esportivo Premium', 'category' => 'Other', 'subcategory' => 'Watches', 'gold_weight' => 0, 'base_price' => 3200.00],
            ['name' => 'Relógio Social Elegante', 'category' => 'Other', 'subcategory' => 'Watches', 'gold_weight' => 0, 'base_price' => 2800.00],

            // Other - Other (3 products)
            ['name' => 'Porta Joias Luxo', 'category' => 'Other', 'subcategory' => 'Other', 'gold_weight' => 0, 'base_price' => 180.00],
            ['name' => 'Kit Presente Premium', 'category' => 'Other', 'subcategory' => 'Other', 'gold_weight' => 0, 'base_price' => 250.00],
            ['name' => 'Estojo para Anéis', 'category' => 'Other', 'subcategory' => 'Other', 'gold_weight' => 0, 'base_price' => 150.00],
        ];
    }

    private function getImageForProduct(string $category, string $subcategory, string $baseUrl): string
    {
        // Map category and subcategory to specific image files from assets folder
        // If no local image exists, use an online URL
        $imageMap = [
            'Male' => [
                'Chains' => $baseUrl . 'male-chain.png',
                'Rings' => $baseUrl . 'male-ring.png',
                'Earrings and Pendants' => $baseUrl . 'earring.png',
            ],
            'Female' => [
                'Chains' => $baseUrl . 'female-chaing.png',
                'Rings' => $baseUrl . 'femail-ring.png',
                'Earrings and Pendants' => $baseUrl . 'earring.png',
            ],
            'Wedding Rings' => [
                'Wedding Anniversary' => $baseUrl . 'wedding anniversary-ring.png',
                'Engagement' => $baseUrl . 'engagement-ring.png',
                'Marriage' => $baseUrl . 'wedding-ring.png',
            ],
            'Other' => [
                'Perfumes' => $baseUrl . 'perfumes.png',
                'Watches' => $baseUrl . 'watch.png',
                'Other' => $baseUrl . 'other-other.png',
            ],
        ];

        // Return the mapped image or fallback to online image
        return $imageMap[$category][$subcategory] ?? 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400';
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
