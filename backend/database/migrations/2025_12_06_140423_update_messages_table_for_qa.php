<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old comments table
        Schema::dropIfExists('comments');

        // Delete all existing messages (old format incompatible with new Q&A format)
        DB::table('messages')->truncate();

        // Update messages table for Q&A format
        Schema::table('messages', function (Blueprint $table) {
            // Drop old columns
            $table->dropColumn(['content', 'favorite', 'good', 'bad']);
        });

        Schema::table('messages', function (Blueprint $table) {
            // Rename user_id to from_user_id
            $table->renameColumn('user_id', 'from_user_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            // Add new columns for Q&A
            $table->foreignId('to_user_id')->after('from_user_id')->constrained('users')->onDelete('cascade');
            $table->text('question')->after('to_user_id');
            $table->text('answer')->nullable()->after('question');
            $table->timestamp('answered_at')->nullable()->after('answer');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['to_user_id']);
            $table->dropColumn(['to_user_id', 'question', 'answer', 'answered_at']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->renameColumn('from_user_id', 'user_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->text('content');
            $table->json('favorite')->nullable();
            $table->json('good')->nullable();
            $table->json('bad')->nullable();
        });

        // Recreate comments table
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('message_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
        });
    }
};
