<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds columns needed for marketplace/destination charges payment model
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Add seller_id for per-seller payments (destination charges)
            if (!Schema::hasColumn('payments', 'seller_id')) {
                $table->foreignId('seller_id')->nullable()->after('order_id')->constrained('users')->onDelete('set null');
            }

            // Add application_fee for marketplace fee tracking
            if (!Schema::hasColumn('payments', 'application_fee')) {
                $table->decimal('application_fee', 10, 2)->default(0)->after('amount');
            }

            // Add mp_payment_id for Mercado Pago payment ID
            if (!Schema::hasColumn('payments', 'mp_payment_id')) {
                $table->string('mp_payment_id')->nullable()->after('status');
            }

            // Add card_token_id for card payment tracking
            if (!Schema::hasColumn('payments', 'card_token_id')) {
                $table->string('card_token_id')->nullable()->after('mp_payment_id');
            }
        });

        // Remove old columns that are no longer used (if they exist)
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'product_amount')) {
                $table->dropColumn('product_amount');
            }
            if (Schema::hasColumn('payments', 'platform_fee')) {
                $table->dropColumn('platform_fee');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'seller_id')) {
                $table->dropForeign(['seller_id']);
                $table->dropColumn('seller_id');
            }
            if (Schema::hasColumn('payments', 'application_fee')) {
                $table->dropColumn('application_fee');
            }
            if (Schema::hasColumn('payments', 'mp_payment_id')) {
                $table->dropColumn('mp_payment_id');
            }
            if (Schema::hasColumn('payments', 'card_token_id')) {
                $table->dropColumn('card_token_id');
            }
        });

        // Restore old columns
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'product_amount')) {
                $table->decimal('product_amount', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('payments', 'platform_fee')) {
                $table->decimal('platform_fee', 10, 2)->default(0);
            }
        });
    }
};
