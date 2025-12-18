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
        Schema::table('products', function (Blueprint $table) {
            $table->enum('filling', ['Solid', 'Hollow', 'Defense'])->nullable()->after('subcategory');
            $table->enum('is_gemstone', ['Synthetic', 'Natural', 'Without Stones'])->nullable()->after('filling');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['filling', 'is_gemstone']);
        });
    }
};
