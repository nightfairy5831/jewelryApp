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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->boolean('mercadopago_connected')->default(false);
            $table->string('mercadopago_user_id')->nullable();
            $table->string('mercadopago_access_token')->nullable();
            $table->string('mercadopago_refresh_token')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone', 20)->nullable();
            $table->enum('role', ['buyer', 'seller', 'admin', 'super_admin'])->default('buyer');
            $table->enum('seller_status', ['pending', 'approved', 'rejected', 'inactive'])->nullable()->comment('Status for seller accounts only. NULL for buyers.');
            $table->boolean('seller_approved')->default(false);
            $table->timestamp('seller_requested_at')->nullable();
            $table->foreignId('seller_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('seller_approved_at')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
