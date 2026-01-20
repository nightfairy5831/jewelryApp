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
        // Add cancellation_reason and accepted_at columns
        Schema::table('orders', function (Blueprint $table) {
            $table->text('cancellation_reason')->nullable()->after('tracking_number');
            $table->timestamp('accepted_at')->nullable()->after('paid_at');
        });

        // Update enum to include 'accepted' status
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'accepted', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert any 'accepted' status back to 'confirmed' before removing enum value
        DB::table('orders')->where('status', 'accepted')->update(['status' => 'confirmed']);

        // Revert enum
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['cancellation_reason', 'accepted_at']);
        });
    }
};
