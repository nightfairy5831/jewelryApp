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
        // Update sellers with NULL seller_status based on their current state
        DB::statement("
            UPDATE users
            SET seller_status = CASE
                WHEN role = 'seller' AND seller_approved = 1 THEN 'approved'
                WHEN role = 'seller' AND seller_approved = 0 AND seller_requested_at IS NOT NULL THEN 'pending'
                WHEN role = 'seller' AND seller_approved = 0 THEN 'pending'
                ELSE seller_status
            END
            WHERE role = 'seller' AND seller_status IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data migration
        // The seller_status column will remain
    }
};
