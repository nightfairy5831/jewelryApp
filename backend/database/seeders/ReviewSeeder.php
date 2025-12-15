<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Review;
use App\Models\Product;
use App\Models\User;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $buyers = User::where('role', 'buyer')->get();

        if ($buyers->isEmpty()) {
            echo "No buyers found. Please run BuyerSeeder first.\n";
            return;
        }

        $products = Product::all();

        if ($products->isEmpty()) {
            echo "No products found. Please run ProductSeeder first.\n";
            return;
        }

        $reviewDescriptions = [
            'Produto excelente! Qualidade impecável e acabamento perfeito.',
            'Muito bonito, exatamente como nas fotos. Recomendo!',
            'Entrega rápida e produto de alta qualidade.',
            'Adorei! Superou minhas expectativas.',
            'Produto maravilhoso, muito bem embalado.',
            'Ótima qualidade, vale cada centavo!',
            'Perfeito! Estou muito satisfeita com a compra.',
            'Linda joia, chegou muito bem embalada.',
            'Produto de excelente qualidade, recomendo!',
            'Muito bom, mas esperava um pouco maior.',
            'Bonito, mas a cor é um pouco diferente da foto.',
            'Bom produto pelo preço.',
            null, // Some reviews without description
            null,
        ];

        $reviewImages = [
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
            'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
            null, // Most reviews won't have images
            null,
            null,
            null,
            null,
        ];

        // Create one review per product (42 reviews for 42 products)
        foreach ($products as $product) {
            $buyer = $buyers->random();

            // Random rating between 3.5 and 5.0 (mostly positive reviews)
            $rating = rand(35, 50) / 10;

            Review::create([
                'product_id' => $product->id,
                'buyer_id' => $buyer->id,
                'rating' => $rating,
                'description' => $reviewDescriptions[array_rand($reviewDescriptions)],
                'image' => $reviewImages[array_rand($reviewImages)],
            ]);
        }

        echo "Created " . $products->count() . " reviews successfully!\n";
    }
}
