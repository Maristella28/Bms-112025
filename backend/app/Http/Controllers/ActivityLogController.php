<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Resident;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    /**
     * Get paginated activity logs with filtering
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // Only admins and staff can view activity logs
            if ($user->role !== 'admin' && $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $filters = $request->only([
                'user_id',
                'action',
                'model_type',
                'date_from',
                'date_to',
                'search',
                'user_type',
                'page',
                'per_page'
            ]);

            $logs = ActivityLogService::getLogs($filters);
            $counts = ActivityLogService::getCounts($filters);

            return response()->json([
                'logs' => $logs,
                'filters' => $filters,
                'counts' => $counts,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching activity logs: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'filters' => $request->all()
            ]);
            return response()->json([
                'message' => 'Error fetching activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific activity log
     */
    public function show($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin' && $user->role !== 'staff') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = ActivityLog::with('user')->findOrFail($id);

        return response()->json(['log' => $log]);
    }

    /**
     * Get activity log statistics
     */
    public function statistics(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin' && $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $dateFrom = $request->get('date_from', now()->subDays(30));
            $dateTo = $request->get('date_to', now());

        $stats = [
            'total_logs' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'login_count' => ActivityLog::where('action', 'login')->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'user_registrations' => ActivityLog::where('action', 'created')->where('model_type', 'App\Models\User')->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'resident_updates' => ActivityLog::where('action', 'updated')->where('model_type', 'App\Models\Resident')->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'admin_actions' => ActivityLog::where('action', 'like', 'admin.%')->whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'top_actions' => ActivityLog::selectRaw('action, COUNT(*) as count')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get(),
            'active_users' => ActivityLog::with('user')
                ->selectRaw('user_id, COUNT(*) as activity_count')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->whereNotNull('user_id')
                ->groupBy('user_id')
                ->orderBy('activity_count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($log) {
                    return [
                        'user_id' => $log->user_id,
                        'activity_count' => $log->activity_count,
                        'user' => $log->user,
                    ];
                }),
        ];

            return response()->json(['statistics' => $stats]);
        } catch (\Exception $e) {
            \Log::error('Error fetching statistics: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available filter options
     */
    public function filters()
    {
        $user = Auth::user();

        \Log::info('Filters method accessed', [
            'user_id' => $user->id ?? null,
            'user_role' => $user->role ?? null,
        ]);

        if ($user->role !== 'admin' && $user->role !== 'staff') {
            \Log::warning('Unauthorized access to filters method', [
                'user_id' => $user->id ?? null,
                'user_role' => $user->role ?? null,
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $filters = [
                'actions' => ActivityLog::select('action')->distinct()->pluck('action')->filter()->values(),
                'model_types' => ActivityLog::select('model_type')->distinct()->whereNotNull('model_type')->pluck('model_type')->filter()->values(),
                'users' => ActivityLog::with('user:id,name,email')
                    ->select('user_id')
                    ->distinct()
                    ->whereNotNull('user_id')
                    ->get()
                    ->pluck('user')
                    ->filter()
                    ->values(),
            ];

            \Log::info('Filters method response', [
                'filters' => $filters,
            ]);

            return response()->json(['filters' => $filters]);
        } catch (\Exception $e) {
            \Log::error('Error fetching filter options: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching filter options',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export activity logs (basic implementation)
     */
    public function export(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin' && $user->role !== 'staff') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $filters = $request->only([
            'user_id',
            'action',
            'model_type',
            'date_from',
            'date_to',
            'search'
        ]);

        $logs = ActivityLogService::getLogs(array_merge($filters, ['per_page' => 1000]));

        // Log the export action
        ActivityLogService::logAdminAction('export_activity_logs', "Admin exported activity logs", $request);

        return response()->json([
            'message' => 'Export data prepared',
            'logs' => $logs,
            'exported_at' => now(),
        ]);
    }

    /**
     * Delete old activity logs (cleanup)
     */
    public function cleanup(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin' && $user->role !== 'staff') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = $request->get('days', 90); // Default 90 days
        $deletedCount = ActivityLog::where('created_at', '<', now()->subDays($days))->delete();

        // Log the cleanup action
        ActivityLogService::logAdminAction('cleanup_activity_logs', "Admin deleted {$deletedCount} activity logs older than {$days} days", $request);

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} old activity logs",
            'deleted_count' => $deletedCount,
        ]);
    }

    /**
     * Security alerts (placeholder implementation)
     */
    public function securityAlerts(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' && $user->role !== 'staff') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'alerts' => [],
        ]);
    }

    /**
     * Audit summary (basic metrics)
     */
    public function auditSummary(Request $request)
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin' && $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $dateFrom = $request->get('date_from', now()->subDays(30));
            $dateTo = $request->get('date_to', now());

            $successfulOperations = ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])->count();
            $failedOperations = ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('action', 'like', '%failed%')
                ->count();

            return response()->json([
                'audit_summary' => [
                    'successful_operations' => $successfulOperations,
                    'failed_operations' => $failedOperations,
                    'avg_response_time' => 0,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching audit summary: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching audit summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inactive residents (no login/activity for 1 year)
     */
    public function inactiveResidents(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin' && $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $oneYearAgo = Carbon::now()->subYear();
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 20);

            // Get all user IDs with recent activity (login or profile updates)
            $activeUserIds = ActivityLog::whereIn('action', ['login', 'Resident.Profile.Updated', 'Resident.Updated'])
                ->where('created_at', '>=', $oneYearAgo)
                ->whereNotNull('user_id')
                ->distinct()
                ->pluck('user_id')
                ->toArray();

            // Get residents with user accounts that are NOT in the active list
            $inactiveResidents = Resident::with(['user'])
                ->whereNotNull('user_id');
            
            // Only apply whereNotIn if there are active users, otherwise all residents are inactive
            if (!empty($activeUserIds)) {
                $inactiveResidents = $inactiveResidents->whereNotIn('user_id', $activeUserIds);
            }
                ->select('residents.*')
                ->selectRaw('(
                    SELECT MAX(created_at) 
                    FROM activity_logs 
                    WHERE user_id = residents.user_id 
                    AND action IN ("login", "Resident.Profile.Updated", "Resident.Updated")
                ) as last_activity_date');

            // Get total count before pagination
            $total = $inactiveResidents->count();

            // Apply pagination and get results
            $inactiveResidents = $inactiveResidents->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get()
                ->map(function($resident) use ($oneYearAgo) {
                    $lastActivity = ActivityLog::where('user_id', $resident->user_id)
                        ->whereIn('action', ['login', 'Resident.Profile.Updated', 'Resident.Updated'])
                        ->orderBy('created_at', 'desc')
                        ->first();

                    $lastActivityDate = $lastActivity 
                        ? Carbon::parse($lastActivity->created_at)
                        : Carbon::parse($resident->created_at);

                    $daysInactive = $lastActivityDate->diffInDays(Carbon::now());

                    return [
                        'id' => $resident->id,
                        'resident_id' => $resident->resident_id,
                        'first_name' => $resident->first_name,
                        'middle_name' => $resident->middle_name,
                        'last_name' => $resident->last_name,
                        'name_suffix' => $resident->name_suffix,
                        'email' => $resident->email,
                        'contact_number' => $resident->contact_number,
                        'full_name' => trim("{$resident->first_name} {$resident->middle_name} {$resident->last_name} {$resident->name_suffix}"),
                        'user_id' => $resident->user_id,
                        'last_activity_date' => $lastActivityDate->toDateTimeString(),
                        'days_inactive' => $daysInactive,
                        'for_review' => $resident->for_review ?? false,
                        'user' => $resident->user ? [
                            'id' => $resident->user->id,
                            'name' => $resident->user->name,
                            'email' => $resident->user->email,
                        ] : null,
                    ];
                })
                ->sortByDesc('days_inactive')
                ->values();

            return response()->json([
                'inactive_residents' => $inactiveResidents,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching inactive residents: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching inactive residents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Flag residents as "For Review" based on inactivity
     */
    public function flagInactiveResidents(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin' && $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $oneYearAgo = Carbon::now()->subYear();
            $flaggedCount = 0;

            // Get all residents with user accounts
            $residents = Resident::with('user')
                ->whereHas('user')
                ->get();

            foreach ($residents as $resident) {
                if (!$resident->user_id) continue;

                // Check last activity (login or profile update)
                $lastActivity = ActivityLog::where('user_id', $resident->user_id)
                    ->whereIn('action', ['login', 'Resident.Profile.Updated', 'Resident.Updated'])
                    ->orderBy('created_at', 'desc')
                    ->first();

                $shouldFlag = false;
                $lastActivityDate = null;

                if ($lastActivity) {
                    $lastActivityDate = Carbon::parse($lastActivity->created_at);
                    $shouldFlag = $lastActivityDate->lt($oneYearAgo);
                } else {
                    // No activity logs at all - check creation date
                    $createdDate = Carbon::parse($resident->created_at);
                    $shouldFlag = $createdDate->lt($oneYearAgo);
                    $lastActivityDate = $createdDate;
                }

                if ($shouldFlag && !$resident->for_review) {
                    $resident->for_review = true;
                    $resident->save();
                    $flaggedCount++;
                }
            }

            // Log the action
            ActivityLogService::logAdminAction(
                'flag_inactive_residents',
                "Admin flagged {$flaggedCount} inactive residents for review",
                $request
            );

            return response()->json([
                'message' => "Successfully flagged {$flaggedCount} residents for review",
                'flagged_count' => $flaggedCount,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error flagging inactive residents: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error flagging inactive residents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get count of residents flagged for review
     */
    public function flaggedResidentsCount()
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin' && $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $count = Resident::where('for_review', true)->count();

            return response()->json([
                'flagged_count' => $count,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching flagged residents count: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching flagged residents count',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
