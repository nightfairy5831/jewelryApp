<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipment_id')->nullable()->after('tracking_number');
            $table->string('shipping_carrier')->nullable()->after('shipment_id');
            $table->string('shipping_label_url')->nullable()->after('shipping_carrier');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipment_id', 'shipping_carrier', 'shipping_label_url']);
        });
    }
};
