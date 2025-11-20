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
        // Fix the AUTO_INCREMENT on the id column
        // This is needed after database restore when AUTO_INCREMENT property might be lost
        if (Schema::hasTable('activity_logs')) {
            // Get the current max id value to set AUTO_INCREMENT appropriately
            $maxId = DB::table('activity_logs')->max('id') ?? 0;
            $nextId = $maxId + 1;
            
            // Modify the id column to ensure it has AUTO_INCREMENT
            DB::statement("ALTER TABLE `activity_logs` MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
            
            // Set the AUTO_INCREMENT value to the next available ID
            DB::statement("ALTER TABLE `activity_logs` AUTO_INCREMENT = {$nextId}");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is safe to reverse, but we'll leave AUTO_INCREMENT as is
        // since it's the correct state
    }
};

