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
        Schema::create('gold_prices', function (Blueprint $table) {
            $table->id();
            $table->decimal('price_per_gram', 10, 2);
            $table->decimal('price_gram_24k', 10, 2)->nullable();
            $table->decimal('price_gram_22k', 10, 2)->nullable();
            $table->decimal('price_gram_21k', 10, 2)->nullable();
            $table->decimal('price_gram_20k', 10, 2)->nullable();
            $table->decimal('price_gram_18k', 10, 2)->nullable();
            $table->decimal('price_gram_16k', 10, 2)->nullable();
            $table->decimal('price_gram_14k', 10, 2)->nullable();
            $table->decimal('price_gram_10k', 10, 2)->nullable();
            $table->string('source')->default('mock_api');
            $table->string('currency', 10)->default('BRL');
            $table->timestamp('scraped_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gold_prices');
    }
};
