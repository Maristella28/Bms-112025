<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CheckResidentsColumns extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'residents:check-columns';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if all required columns exist in the residents table for inactive residents functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('========================================');
        $this->info('Residents Table Column Check');
        $this->info('========================================');
        $this->newLine();

        try {
            // Check if residents table exists
            if (!Schema::hasTable('residents')) {
                $this->error("'residents' table does not exist!");
                return 1;
            }
            
            $this->info("✅ 'residents' table exists");
            $this->newLine();
            
            // Required columns for inactive residents functionality
            $requiredColumns = [
                'id' => 'Primary key',
                'user_id' => 'Foreign key to users table',
                'resident_id' => 'Unique resident identifier',
                'first_name' => 'Resident first name',
                'last_name' => 'Resident last name',
                'email' => 'Resident email',
                'created_at' => 'Record creation timestamp',
                'updated_at' => 'Record update timestamp',
            ];
            
            // Optional but recommended columns
            $optionalColumns = [
                'middle_name' => 'Resident middle name',
                'name_suffix' => 'Name suffix (Jr., Sr., etc.)',
                'contact_number' => 'Contact number',
                'mobile_number' => 'Mobile number (alternative)',
                'last_modified' => 'Last modification timestamp',
                'for_review' => 'Flag for review (boolean)',
                'account_status' => 'Account status (active, inactive, suspended, etc.)',
                'verification_status' => 'Verification status',
            ];
            
            $this->info('Checking Required Columns:');
            $this->line('----------------------------------------');
            $allRequiredExist = true;
            foreach ($requiredColumns as $column => $description) {
                if (Schema::hasColumn('residents', $column)) {
                    $this->info("✅ {$column} - {$description}");
                } else {
                    $this->error("❌ {$column} - {$description} - MISSING!");
                    $allRequiredExist = false;
                }
            }
            
            $this->newLine();
            $this->info('Checking Optional Columns:');
            $this->line('----------------------------------------');
            foreach ($optionalColumns as $column => $description) {
                if (Schema::hasColumn('residents', $column)) {
                    $this->info("✅ {$column} - {$description}");
                } else {
                    $this->warn("⚠️  {$column} - {$description} - Not present (optional)");
                }
            }
            
            // Check users table for required columns
            $this->newLine();
            $this->info('Checking Users Table (for relationships):');
            $this->line('----------------------------------------');
            if (Schema::hasTable('users')) {
                $this->info("✅ 'users' table exists");
                
                $userColumns = [
                    'id' => 'Primary key',
                    'name' => 'User name',
                    'email' => 'User email',
                    'residency_status' => 'Residency status',
                    'last_activity_at' => 'Last activity timestamp',
                ];
                
                foreach ($userColumns as $column => $description) {
                    if (Schema::hasColumn('users', $column)) {
                        $this->info("✅ users.{$column} - {$description}");
                    } else {
                        $this->warn("⚠️  users.{$column} - {$description} - Not present");
                    }
                }
            } else {
                $this->error("'users' table does not exist!");
            }
            
            // Check activity_logs table
            $this->newLine();
            $this->info('Checking Activity Logs Table:');
            $this->line('----------------------------------------');
            if (Schema::hasTable('activity_logs')) {
                $this->info("✅ 'activity_logs' table exists");
                
                $logColumns = [
                    'id' => 'Primary key',
                    'user_id' => 'Foreign key to users',
                    'action' => 'Action performed',
                    'description' => 'Action description',
                    'created_at' => 'Log creation timestamp',
                ];
                
                foreach ($logColumns as $column => $description) {
                    if (Schema::hasColumn('activity_logs', $column)) {
                        $this->info("✅ activity_logs.{$column} - {$description}");
                    } else {
                        $this->error("❌ activity_logs.{$column} - {$description} - MISSING!");
                    }
                }
            } else {
                $this->error("'activity_logs' table does not exist!");
            }
            
            // Check relationships
            $this->newLine();
            $this->info('Checking Relationships:');
            $this->line('----------------------------------------');
            
            // Check if foreign key constraint exists
            try {
                $foreignKeys = DB::select("
                    SELECT 
                        CONSTRAINT_NAME,
                        COLUMN_NAME,
                        REFERENCED_TABLE_NAME,
                        REFERENCED_COLUMN_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'residents'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ");
                
                $hasUserForeignKey = false;
                foreach ($foreignKeys as $fk) {
                    if ($fk->COLUMN_NAME === 'user_id' && $fk->REFERENCED_TABLE_NAME === 'users') {
                        $this->info("✅ Foreign key: residents.user_id -> users.id");
                        $hasUserForeignKey = true;
                        break;
                    }
                }
                
                if (!$hasUserForeignKey) {
                    $this->warn("⚠️  Foreign key constraint for residents.user_id -> users.id not found");
                    $this->warn("   (This is okay if using nullable foreign keys)");
                }
            } catch (\Exception $e) {
                $this->warn("⚠️  Could not check foreign keys: " . $e->getMessage());
            }
            
            // Summary
            $this->newLine();
            $this->info('========================================');
            $this->info('Summary');
            $this->info('========================================');
            
            if ($allRequiredExist) {
                $this->info('✅ All required columns exist!');
                $this->info('✅ The inactive residents endpoint should work properly.');
            } else {
                $this->error('❌ Some required columns are missing!');
                $this->error('❌ Please run the missing migrations.');
                return 1;
            }
            
            // Check for data integrity
            $this->newLine();
            $this->info('Checking Data Integrity:');
            $this->line('----------------------------------------');
            
            $residentsWithUsers = DB::table('residents')
                ->whereNotNull('user_id')
                ->count();
            
            $residentsWithoutUsers = DB::table('residents')
                ->whereNull('user_id')
                ->count();
            
            $this->line("Residents with user_id: {$residentsWithUsers}");
            $this->line("Residents without user_id: {$residentsWithoutUsers}");
            
            if ($residentsWithUsers > 0) {
                $this->info('✅ Found residents with user accounts (can check for inactivity)');
            } else {
                $this->warn('⚠️  No residents with user accounts found');
            }
            
            $this->newLine();
            $this->info('========================================');
            $this->info('Check Complete!');
            $this->info('========================================');
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("ERROR: " . $e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
            return 1;
        }
    }
}

