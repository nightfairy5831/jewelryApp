<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add seller_status column - only for sellers
            $table->enum('seller_status', ['pending', 'approved', 'rejected', 'inactive'])
                ->nullable()
                ->after('role')
                ->comment('Status for seller accounts only. NULL for buyers.');
        });

        // Migrate existing data
        DB::statement("
            UPDATE users
            SET seller_status = CASE
                WHEN role = 'buyer' AND seller_requested_at IS NOT NULL THEN 'pending'
                WHEN role = 'seller' AND seller_approved = true AND is_active = true THEN 'approved'
                WHEN role = 'seller' AND is_active = false THEN 'inactive'
                WHEN role = 'seller' AND seller_approved = false THEN 'pending'
                ELSE NULL
            END
            WHERE role IN ('buyer', 'seller')
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('seller_status');
        });
    }
};
