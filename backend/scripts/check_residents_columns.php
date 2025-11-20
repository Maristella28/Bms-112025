<?php

/**
 * Migration Check Script for Residents Table
 * 
 * This script verifies that all required columns exist in the residents table
 * for the inactive residents endpoint to work properly.
 * 
 * Usage: php artisan tinker < scripts/check_residents_columns.php
 * Or: php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require 'scripts/check_residents_columns.php';"
 */

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "Residents Table Column Check\n";
echo "========================================\n\n";

try {
    // Check if residents table exists
    if (!Schema::hasTable('residents')) {
        echo "❌ ERROR: 'residents' table does not exist!\n";
        exit(1);
    }
    
    echo "✅ 'residents' table exists\n\n";
    
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
    
    echo "Checking Required Columns:\n";
    echo "----------------------------------------\n";
    $allRequiredExist = true;
    foreach ($requiredColumns as $column => $description) {
        if (Schema::hasColumn('residents', $column)) {
            echo "✅ {$column} - {$description}\n";
        } else {
            echo "❌ {$column} - {$description} - MISSING!\n";
            $allRequiredExist = false;
        }
    }
    
    echo "\nChecking Optional Columns:\n";
    echo "----------------------------------------\n";
    foreach ($optionalColumns as $column => $description) {
        if (Schema::hasColumn('residents', $column)) {
            echo "✅ {$column} - {$description}\n";
        } else {
            echo "⚠️  {$column} - {$description} - Not present (optional)\n";
        }
    }
    
    // Check users table for required columns
    echo "\nChecking Users Table (for relationships):\n";
    echo "----------------------------------------\n";
    if (Schema::hasTable('users')) {
        echo "✅ 'users' table exists\n";
        
        $userColumns = [
            'id' => 'Primary key',
            'name' => 'User name',
            'email' => 'User email',
            'residency_status' => 'Residency status',
            'last_activity_at' => 'Last activity timestamp',
        ];
        
        foreach ($userColumns as $column => $description) {
            if (Schema::hasColumn('users', $column)) {
                echo "✅ users.{$column} - {$description}\n";
            } else {
                echo "⚠️  users.{$column} - {$description} - Not present\n";
            }
        }
    } else {
        echo "❌ 'users' table does not exist!\n";
    }
    
    // Check activity_logs table
    echo "\nChecking Activity Logs Table:\n";
    echo "----------------------------------------\n";
    if (Schema::hasTable('activity_logs')) {
        echo "✅ 'activity_logs' table exists\n";
        
        $logColumns = [
            'id' => 'Primary key',
            'user_id' => 'Foreign key to users',
            'action' => 'Action performed',
            'description' => 'Action description',
            'created_at' => 'Log creation timestamp',
        ];
        
        foreach ($logColumns as $column => $description) {
            if (Schema::hasColumn('activity_logs', $column)) {
                echo "✅ activity_logs.{$column} - {$description}\n";
            } else {
                echo "❌ activity_logs.{$column} - {$description} - MISSING!\n";
            }
        }
    } else {
        echo "❌ 'activity_logs' table does not exist!\n";
    }
    
    // Check relationships
    echo "\nChecking Relationships:\n";
    echo "----------------------------------------\n";
    
    // Check if foreign key constraint exists
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
            echo "✅ Foreign key: residents.user_id -> users.id\n";
            $hasUserForeignKey = true;
            break;
        }
    }
    
    if (!$hasUserForeignKey) {
        echo "⚠️  Foreign key constraint for residents.user_id -> users.id not found\n";
        echo "   (This is okay if using nullable foreign keys)\n";
    }
    
    // Summary
    echo "\n========================================\n";
    echo "Summary\n";
    echo "========================================\n";
    
    if ($allRequiredExist) {
        echo "✅ All required columns exist!\n";
        echo "✅ The inactive residents endpoint should work properly.\n";
    } else {
        echo "❌ Some required columns are missing!\n";
        echo "❌ Please run the missing migrations.\n";
        exit(1);
    }
    
    // Check for data integrity
    echo "\nChecking Data Integrity:\n";
    echo "----------------------------------------\n";
    
    $residentsWithUsers = DB::table('residents')
        ->whereNotNull('user_id')
        ->count();
    
    $residentsWithoutUsers = DB::table('residents')
        ->whereNull('user_id')
        ->count();
    
    echo "Residents with user_id: {$residentsWithUsers}\n";
    echo "Residents without user_id: {$residentsWithoutUsers}\n";
    
    if ($residentsWithUsers > 0) {
        echo "✅ Found residents with user accounts (can check for inactivity)\n";
    } else {
        echo "⚠️  No residents with user accounts found\n";
    }
    
    echo "\n========================================\n";
    echo "Check Complete!\n";
    echo "========================================\n";
    
} catch (\Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}

