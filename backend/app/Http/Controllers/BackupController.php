<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Services\ActivityLogService;

class BackupController extends Controller
{
    /**
     * Test endpoint to verify controller is accessible
     */
    public function test()
    {
        return response()->json([
            'success' => true,
            'message' => 'BackupController is working',
            'timestamp' => now()->toDateTimeString()
        ]);
    }

    /**
     * Run backup manually
     */
    public function runBackup(Request $request)
    {
        try {
            $type = $request->input('type', 'all'); // all, database, storage, config
            
            // Run backup command
            Artisan::call('backup:run', [
                '--type' => $type
            ]);

            $output = Artisan::output();

            // Log activity (wrap in try-catch to prevent backup failure if logging fails)
            try {
                ActivityLogService::logAdminAction('backup_created', 'Manual backup created', $request);
            } catch (\Exception $logError) {
                \Log::warning('Failed to log backup activity: ' . $logError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully',
                'output' => $output,
                'timestamp' => now()->toDateTimeString()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Backup failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all backups
     */
    public function listBackups(Request $request)
    {
        \Log::info('BackupController::listBackups called');
        try {
            // Ensure storage path exists
            $storagePath = storage_path();
            if (!is_dir($storagePath)) {
                throw new \Exception('Storage path does not exist: ' . $storagePath);
            }
            
            $backupDir = storage_path('backups');
            \Log::info('Backup directory: ' . $backupDir);
            
            // Create directory if it doesn't exist
            if (!file_exists($backupDir)) {
                try {
                    if (!mkdir($backupDir, 0755, true)) {
                        \Log::error('Failed to create backup directory: ' . $backupDir);
                        return response()->json([
                            'success' => true,
                            'backups' => [],
                            'total' => 0,
                            'page' => 1,
                            'per_page' => 20,
                            'total_pages' => 0
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error('Error creating backup directory: ' . $e->getMessage());
                    return response()->json([
                        'success' => true,
                        'backups' => [],
                        'total' => 0,
                        'page' => 1,
                        'per_page' => 20,
                        'total_pages' => 0
                    ]);
                }
            }
            
            // Check if directory is readable
            if (!is_readable($backupDir)) {
                \Log::warning('Backup directory is not readable: ' . $backupDir);
                return response()->json([
                    'success' => true,
                    'backups' => [],
                    'total' => 0,
                    'page' => 1,
                    'per_page' => 20,
                    'total_pages' => 0
                ]);
            }

            $backups = [];
            $files = glob($backupDir . '/*');
            
            // Handle case where glob returns false
            if ($files === false) {
                $files = [];
            }

            foreach ($files as $file) {
                if (is_file($file) && is_readable($file)) {
                    try {
                        $filename = basename($file);
                        
                        // Determine backup type
                        $type = 'unknown';
                        if (strpos($filename, 'db_backup_') === 0) {
                            $type = 'database';
                        } elseif (strpos($filename, 'storage_backup_') === 0) {
                            $type = 'storage';
                        } elseif (strpos($filename, 'config_backup_') === 0) {
                            $type = 'config';
                        }

                        // Extract timestamp from filename
                        $timestamp = null;
                        if (preg_match('/(\d{8}_\d{6})/', $filename, $matches)) {
                            try {
                                $timestamp = Carbon::createFromFormat('Ymd_His', $matches[1]);
                            } catch (\Exception $e) {
                                // If timestamp parsing fails, use filemtime
                                $timestamp = null;
                            }
                        }

                        $fileSize = filesize($file);
                        $fileMtime = filemtime($file);
                        
                        $backups[] = [
                            'id' => md5($file),
                            'filename' => $filename,
                            'type' => $type,
                            'size' => $fileSize,
                            'size_formatted' => $this->formatBytes($fileSize),
                            'path' => $file,
                            'created_at' => $timestamp ? $timestamp->toDateTimeString() : date('Y-m-d H:i:s', $fileMtime),
                            'modified_at' => date('Y-m-d H:i:s', $fileMtime),
                            'timestamp' => $fileMtime
                        ];
                    } catch (\Exception $e) {
                        // Skip files that can't be processed
                        \Log::warning('Skipping backup file: ' . $file . ' - ' . $e->getMessage());
                        continue;
                    }
                }
            }

            // Sort by modified timestamp (latest first)
            usort($backups, function($a, $b) {
                return $b['timestamp'] - $a['timestamp'];
            });

            // Apply pagination if needed
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 20);
            $total = count($backups);
            $offset = ($page - 1) * $perPage;
            $paginatedBackups = array_slice($backups, $offset, $perPage);

            return response()->json([
                'success' => true,
                'backups' => $paginatedBackups,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage)
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to list backups', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty list instead of 500 error to prevent UI issues
            return response()->json([
                'success' => true,
                'backups' => [],
                'total' => 0,
                'page' => 1,
                'per_page' => 20,
                'total_pages' => 0,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get backup statistics
     */
    public function getStatistics(Request $request)
    {
        \Log::info('BackupController::getStatistics called');
        try {
            // Ensure storage path exists
            $storagePath = storage_path();
            if (!is_dir($storagePath)) {
                throw new \Exception('Storage path does not exist: ' . $storagePath);
            }
            
            $backupDir = storage_path('backups');
            \Log::info('Backup directory: ' . $backupDir);
            
            // Create directory if it doesn't exist
            if (!file_exists($backupDir)) {
                try {
                    if (!mkdir($backupDir, 0755, true)) {
                        \Log::error('Failed to create backup directory: ' . $backupDir);
                    }
                } catch (\Exception $e) {
                    \Log::error('Error creating backup directory: ' . $e->getMessage());
                }
            }
            
            // Return empty statistics if directory doesn't exist or isn't readable
            if (!file_exists($backupDir) || !is_readable($backupDir)) {
                return response()->json([
                    'success' => true,
                    'statistics' => [
                        'total_backups' => 0,
                        'total_size' => 0,
                        'total_size_formatted' => '0 B',
                        'database_backups' => 0,
                        'storage_backups' => 0,
                        'config_backups' => 0,
                        'latest_backup' => null,
                        'oldest_backup' => null
                    ]
                ]);
            }

            $files = glob($backupDir . '/*');
            
            // Handle case where glob returns false
            if ($files === false) {
                $files = [];
            }
            
            $totalSize = 0;
            $databaseCount = 0;
            $storageCount = 0;
            $configCount = 0;
            $timestamps = [];

            foreach ($files as $file) {
                if (is_file($file) && is_readable($file)) {
                    try {
                        $fileSize = filesize($file);
                        $totalSize += $fileSize;
                        $filename = basename($file);
                        
                        if (strpos($filename, 'db_backup_') === 0) {
                            $databaseCount++;
                        } elseif (strpos($filename, 'storage_backup_') === 0) {
                            $storageCount++;
                        } elseif (strpos($filename, 'config_backup_') === 0) {
                            $configCount++;
                        }
                        
                        $timestamps[] = filemtime($file);
                    } catch (\Exception $e) {
                        // Skip files that can't be processed
                        \Log::warning('Skipping backup file in statistics: ' . $file . ' - ' . $e->getMessage());
                        continue;
                    }
                }
            }

            $latestBackup = !empty($timestamps) ? date('Y-m-d H:i:s', max($timestamps)) : null;
            $oldestBackup = !empty($timestamps) ? date('Y-m-d H:i:s', min($timestamps)) : null;

            // Count only actual files (not directories)
            $fileCount = 0;
            foreach ($files as $file) {
                if (is_file($file)) {
                    $fileCount++;
                }
            }
            
            return response()->json([
                'success' => true,
                'statistics' => [
                    'total_backups' => $fileCount,
                    'total_size' => $totalSize,
                    'total_size_formatted' => $this->formatBytes($totalSize),
                    'database_backups' => $databaseCount,
                    'storage_backups' => $storageCount,
                    'config_backups' => $configCount,
                    'latest_backup' => $latestBackup,
                    'oldest_backup' => $oldestBackup
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to get backup statistics', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty statistics on error instead of 500
            return response()->json([
                'success' => true,
                'statistics' => [
                    'total_backups' => 0,
                    'total_size' => 0,
                    'total_size_formatted' => '0 B',
                    'database_backups' => 0,
                    'storage_backups' => 0,
                    'config_backups' => 0,
                    'latest_backup' => null,
                    'oldest_backup' => null
                ]
            ]);
        }
    }

    /**
     * Delete a backup file
     */
    public function deleteBackup(Request $request, $id)
    {
        try {
            $backupDir = storage_path('backups');
            $files = glob($backupDir . '/*');
            
            foreach ($files as $file) {
                if (md5($file) === $id) {
                    if (unlink($file)) {
                        // Log activity (wrap in try-catch to prevent failure if logging fails)
                        try {
                            ActivityLogService::logAdminAction('backup_deleted', 'Backup file deleted: ' . basename($file), $request);
                        } catch (\Exception $logError) {
                            \Log::warning('Failed to log backup deletion: ' . $logError->getMessage());
                        }
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Backup deleted successfully'
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Backup file not found'
            ], 404);

        } catch (\Exception $e) {
            \Log::error('Failed to delete backup: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        // Handle null or invalid input
        if (!is_numeric($bytes) || $bytes < 0) {
            return '0 B';
        }
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        
        // Handle zero bytes
        if ($bytes == 0) {
            return '0 B';
        }
        
        $pow = floor(log($bytes) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

