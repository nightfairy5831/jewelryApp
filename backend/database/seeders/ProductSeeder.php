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
        $karats = ['18k', '10k'];

        $fillingOptions = ['Solid', 'Hollow', 'Defense', null];
        $gemstoneOptions = ['Synthetic', 'Natural', 'Without Stones', null];

        foreach ($products as $index => $productData) {
            $seller = $sellers->random();
            $karat = $karats[array_rand($karats)];
            $currentPrice = $productData['price']; // Use price from product data (all under 20)

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
                'base_price' => $productData['price'],
                'current_price' => $currentPrice,
                'gold_weight_grams' => $productData['gold_weight'],
                'gold_karat' => $karat,
                'initial_gold_price' => $currentGoldPrice,
                'category' => $productData['category'],
                'subcategory' => $productData['subcategory'],
                'filling' => $fillingOptions[array_rand($fillingOptions)],
                'is_gemstone' => $gemstoneOptions[array_rand($gemstoneOptions)],
                'images' => json_encode($images),
                'videos' => json_encode([$productData['video']]),
                'model_3d_url' => $productData['model_3d'],
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
        return [
            // Male - Chains (1 product)
            [
                'name' => 'Corrente Grumet Masculina',
                'category' => 'Male',
                'subcategory' => 'Chains',
                'gold_weight' => 3.5,
                'price' => 15.99,
                'image' => 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/34611/34611-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/RocketShip.glb'
            ],

            // Male - Rings (1 product)
            [
                'name' => 'Anel Masculino em Ouro',
                'category' => 'Male',
                'subcategory' => 'Rings',
                'gold_weight' => 2.5,
                'price' => 18.99,
                'image' => 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/5222/5222-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/sphere.glb'
            ],

            // Male - Earrings and Pendants (1 product)
            [
                'name' => 'Brinco Masculino Argola',
                'category' => 'Male',
                'subcategory' => 'Earrings and Pendants',
                'gold_weight' => 1.5,
                'price' => 12.99,
                'image' => 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/32284/32284-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
            ],

            // Female - Chains (1 product)
            [
                'name' => 'Corrente Veneziana Feminina',
                'category' => 'Female',
                'subcategory' => 'Chains',
                'gold_weight' => 2.8,
                'price' => 14.99,
                'image' => 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/34213/34213-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/Horse.glb'
            ],

            // Female - Rings (1 product)
            [
                'name' => 'Anel Solitário Feminino',
                'category' => 'Female',
                'subcategory' => 'Rings',
                'gold_weight' => 2.2,
                'price' => 17.99,
                'image' => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/20877/20877-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/pbr-spheres.glb'
            ],

            // Female - Earrings and Pendants (1 product)
            [
                'name' => 'Brinco Feminino Gota',
                'category' => 'Female',
                'subcategory' => 'Earrings and Pendants',
                'gold_weight' => 1.8,
                'price' => 13.99,
                'image' => 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/2865/2865-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/coffeemat.glb'
            ],

            // Wedding Rings - Wedding Anniversary (1 product)
            [
                'name' => 'Aliança Aniversário Clássica',
                'category' => 'Wedding Rings',
                'subcategory' => 'Wedding Anniversary',
                'gold_weight' => 2.0,
                'price' => 16.99,
                'image' => 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/5182/5182-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb'
            ],

            // Wedding Rings - Engagement (1 product)
            [
                'name' => 'Anel de Noivado Solitário',
                'category' => 'Wedding Rings',
                'subcategory' => 'Engagement',
                'gold_weight' => 2.5,
                'price' => 19.99,
                'image' => 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/5220/5220-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/shishkebab.glb'
            ],

            // Wedding Rings - Marriage (1 product)
            [
                'name' => 'Aliança de Casamento Lisa',
                'category' => 'Wedding Rings',
                'subcategory' => 'Marriage',
                'gold_weight' => 2.0,
                'price' => 15.99,
                'image' => 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/5223/5223-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb'
            ],

            // Other - Perfumes (1 product)
            [
                'name' => 'Perfume Luxo Premium',
                'category' => 'Other',
                'subcategory' => 'Perfumes',
                'gold_weight' => 0,
                'price' => 9.99,
                'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/2861/2861-720.mp4',
                'model_3d' => 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb'
            ],

            // Other - Watches (1 product)
            [
                'name' => 'Relógio Clássico Dourado',
                'category' => 'Other',
                'subcategory' => 'Watches',
                'gold_weight' => 0,
                'price' => 19.99,
                'image' => 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/2862/2862-720.mp4',
                'model_3d' => 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/refs/heads/main/Models/ChronographWatch/glTF-Binary/ChronographWatch.glb'
            ],

            // Other - Other (1 product)
            [
                'name' => 'Porta Joias Elegante',
                'category' => 'Other',
                'subcategory' => 'Other',
                'gold_weight' => 0,
                'price' => 11.99,
                'image' => 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
                'video' => 'https://assets.mixkit.co/videos/51649/51649-720.mp4',
                'model_3d' => 'https://modelviewer.dev/shared-assets/models/alpha-blend-litmus.glb'
            ],
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
