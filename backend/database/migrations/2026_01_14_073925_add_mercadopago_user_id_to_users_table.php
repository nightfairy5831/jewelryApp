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
        Schema::table('users', function (Blueprint $table) {
            $table->string('mercadopago_user_id')->nullable()->after('mercadopago_connected');
            $table->string('mercadopago_access_token')->nullable()->after('mercadopago_user_id');
            $table->string('mercadopago_refresh_token')->nullable()->after('mercadopago_access_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['mercadopago_user_id', 'mercadopago_access_token', 'mercadopago_refresh_token']);
        });
    }
};
