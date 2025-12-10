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
        Schema::table('gold_prices', function (Blueprint $table) {
            $table->decimal('price_gram_24k', 10, 2)->nullable()->after('price_per_gram');
            $table->decimal('price_gram_22k', 10, 2)->nullable()->after('price_gram_24k');
            $table->decimal('price_gram_21k', 10, 2)->nullable()->after('price_gram_22k');
            $table->decimal('price_gram_20k', 10, 2)->nullable()->after('price_gram_21k');
            $table->decimal('price_gram_18k', 10, 2)->nullable()->after('price_gram_20k');
            $table->decimal('price_gram_16k', 10, 2)->nullable()->after('price_gram_18k');
            $table->decimal('price_gram_14k', 10, 2)->nullable()->after('price_gram_16k');
            $table->decimal('price_gram_10k', 10, 2)->nullable()->after('price_gram_14k');
            $table->string('currency', 10)->default('USD')->after('source');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gold_prices', function (Blueprint $table) {
            $table->dropColumn([
                'price_gram_24k',
                'price_gram_22k',
                'price_gram_21k',
                'price_gram_20k',
                'price_gram_18k',
                'price_gram_16k',
                'price_gram_14k',
                'price_gram_10k',
                'currency'
            ]);
        });
    }
};
