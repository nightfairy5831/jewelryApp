<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('description');
            $table->decimal('base_price', 10, 2);
            $table->decimal('current_price', 10, 2);
            $table->decimal('gold_weight_grams', 8, 3)->nullable();
            $table->enum('gold_karat', ['10k', '18k'])->nullable();
            $table->enum('material', ['Ouro 18K', 'Ouro 10K', 'Outros'])->default('Outros');
            $table->decimal('initial_gold_price', 10, 2)->nullable();
            $table->string('category')->nullable();
            $table->string('subcategory')->nullable();
            $table->enum('filling', ['Solid', 'Hollow', 'Defense'])->nullable();
            $table->enum('is_gemstone', ['Synthetic', 'Natural', 'Without Stones'])->nullable();
            $table->json('images')->nullable();
            $table->json('videos')->nullable();
            $table->string('model_3d_url')->nullable();
            $table->enum('model_3d_type', ['glb', 'obj', 'stl'])->nullable();
            $table->integer('stock_quantity')->default(1);
            $table->boolean('is_active')->default(true);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
