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
        Schema::create('ring_customizations', function (Blueprint $table) {
            $table->id();
            $table->string('size')->nullable(); // For single rings (Male/Female Rings subcategory)
            $table->string('size_1')->nullable(); // For male ring in wedding rings
            $table->string('name_1')->nullable(); // For male engraving in wedding rings
            $table->string('size_2')->nullable(); // For female ring in wedding rings
            $table->string('name_2')->nullable(); // For female engraving in wedding rings
            $table->timestamps();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('ring_customization_id')->nullable()->constrained()->onDelete('set null')->after('total_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['ring_customization_id']);
            $table->dropColumn('ring_customization_id');
        });

        Schema::dropIfExists('ring_customizations');
    }
};
