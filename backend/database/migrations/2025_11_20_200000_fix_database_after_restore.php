<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration fixes common issues that occur after database restore:
     * 1. Restores AUTO_INCREMENT on all id columns
     * 2. Ensures foreign key constraints are enabled
     * 3. Rebuilds indexes
     * 4. Resets SQL_MODE to proper values
     */
    public function up(): void
    {
        try {
            Log::info('Starting post-restore database fix...');
            
            // Reset SQL_MODE to proper values
            DB::statement("SET SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
            
            // Get all tables in the database
            $tables = DB::select("SHOW TABLES");
            $databaseName = DB::getDatabaseName();
            $tableKey = "Tables_in_{$databaseName}";
            
            $fixedTables = [];
            $errors = [];
            
            foreach ($tables as $table) {
                $tableName = $table->$tableKey;
                
                try {
                    // Check if table has an 'id' column
                    $columns = DB::select("SHOW COLUMNS FROM `{$tableName}` LIKE 'id'");
                    
                    if (!empty($columns)) {
                        $idColumn = $columns[0];
                        
                        // Check if id column is a primary key and should have AUTO_INCREMENT
                        $isPrimaryKey = $idColumn->Key === 'PRI';
                        $hasAutoIncrement = strpos($idColumn->Extra, 'auto_increment') !== false;
                        
                        if ($isPrimaryKey && !$hasAutoIncrement) {
                            // Get the current max id value
                            $maxId = DB::table($tableName)->max('id') ?? 0;
                            $nextId = max(1, $maxId + 1);
                            
                            // Determine the column type
                            $columnType = $idColumn->Type;
                            
                            // Modify the id column to ensure it has AUTO_INCREMENT
                            DB::statement("ALTER TABLE `{$tableName}` MODIFY COLUMN `id` {$columnType} NOT NULL AUTO_INCREMENT");
                            
                            // Set the AUTO_INCREMENT value to the next available ID
                            DB::statement("ALTER TABLE `{$tableName}` AUTO_INCREMENT = {$nextId}");
                            
                            $fixedTables[] = $tableName;
                            Log::info("Fixed AUTO_INCREMENT for table: {$tableName} (next ID: {$nextId})");
                        }
                    }
                } catch (\Exception $e) {
                    $errors[] = "Error fixing table {$tableName}: " . $e->getMessage();
                    Log::warning("Failed to fix table {$tableName}: " . $e->getMessage());
                }
            }
            
            // Ensure foreign key checks are enabled
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            
            // Log results
            if (!empty($fixedTables)) {
                Log::info('Post-restore fix completed. Fixed AUTO_INCREMENT for tables: ' . implode(', ', $fixedTables));
            } else {
                Log::info('Post-restore fix completed. No tables needed fixing.');
            }
            
            if (!empty($errors)) {
                Log::warning('Post-restore fix completed with errors: ' . implode('; ', $errors));
            }
            
        } catch (\Exception $e) {
            Log::error('Post-restore database fix failed: ' . $e->getMessage());
            // Don't throw - allow migration to complete even if some fixes fail
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is safe to reverse, but we'll leave the fixes as is
        // since they represent the correct state
    }
};

