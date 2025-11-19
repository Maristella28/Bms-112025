<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateStaffModulePermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $newPermissions = [
            "dashboard" => true,
            "residentsRecords" => true,
            "documentsRecords" => true,
            "householdRecords" => false,
            "blotterRecords" => false,
            "financialTracking" => false,
            "barangayOfficials" => false,
            "staffManagement" => false,
            "communicationAnnouncement" => false,
            "socialServices" => true,
            "disasterEmergency" => false,
            "projectManagement" => false,
            "inventoryAssets" => false,
            "activityLogs" => true,
            "residentsRecords_main_records" => true,
            "residentsRecords_main_records_edit" => true,
            "residentsRecords_main_records_disable" => true,
            "residentsRecords_main_records_view" => true,
            "residentsRecords_verification" => true,
            "residentsRecords_disabled_residents" => false,
            "documentsRecords_document_requests" => false,
            "documentsRecords_document_records" => false,
            "socialServices_programs" => true,
            "socialServices_beneficiaries" => true,
            "inventoryAssets_asset_management" => false,
            "inventoryAssets_asset_posts_management" => false,
            "inventoryAssets_asset_tracking" => false
        ];

        // Get all staff records
        $staffRecords = Staff::all();

        if ($staffRecords->isEmpty()) {
            $this->command->warn('No staff records found in the database.');
            return;
        }

        $this->command->info('Found ' . $staffRecords->count() . ' staff record(s).');
        $this->command->newLine();

        // Display current permissions for each staff
        foreach ($staffRecords as $staff) {
            $this->command->info("Staff ID: {$staff->id} - {$staff->name} ({$staff->email})");
            $this->command->line("Current module_permissions:");
            $current = $staff->module_permissions ?? [];
            $this->command->line(json_encode($current, JSON_PRETTY_PRINT));
            $this->command->newLine();
        }

        // Auto-update without confirmation (set to false if you want confirmation)
        $autoUpdate = true;
        
        if (!$autoUpdate && !$this->command->confirm('Do you want to update all staff records with the new permissions?', true)) {
            $this->command->info('Update cancelled.');
            return;
        }

        // Update all staff records
        $updated = 0;
        foreach ($staffRecords as $staff) {
            // Use direct DB update to ensure JSON is properly encoded
            $jsonEncoded = json_encode($newPermissions, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            
            DB::table('staff')
                ->where('id', $staff->id)
                ->update([
                    'module_permissions' => $jsonEncoded,
                    'updated_at' => now()
                ]);

            // Refresh the model to verify
            $staff->refresh();
            
            $this->command->info("✓ Updated staff ID {$staff->id} - {$staff->name}");
            $updated++;
        }

        $this->command->newLine();
        $this->command->info("Successfully updated {$updated} staff record(s).");
        
        // Verify the update
        $this->command->newLine();
        $this->command->info('Verifying updates...');
        foreach ($staffRecords as $staff) {
            $staff->refresh();
            $saved = $staff->module_permissions ?? [];
            $this->command->line("Staff ID {$staff->id} - Saved permissions:");
            $this->command->line(json_encode($saved, JSON_PRETTY_PRINT));
            
            // Check if residentsRecords_main_records_view exists
            if (isset($saved['residentsRecords_main_records_view'])) {
                $this->command->info("  ✓ residentsRecords_main_records_view = " . ($saved['residentsRecords_main_records_view'] ? 'true' : 'false'));
            } else {
                $this->command->warn("  ✗ residentsRecords_main_records_view is missing!");
            }
            $this->command->newLine();
        }
    }
}

