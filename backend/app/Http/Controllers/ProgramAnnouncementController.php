<?php

namespace App\Http\Controllers;

use App\Models\ProgramAnnouncement;
use App\Models\Program;
use App\Models\User;
use App\Notifications\ProgramAnnouncementCreatedNotification;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProgramAnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProgramAnnouncement::with('program');

        // Filter by program if provided
        if ($request->has('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter published announcements for residents
        if ($request->has('published_only') && $request->published_only) {
            $query->published();
        }

        $announcements = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $announcements
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        // Convert is_urgent to proper boolean before validation
        $requestData = $request->all();
        if (isset($requestData['is_urgent'])) {
            // Convert various formats to boolean
            $isUrgent = $requestData['is_urgent'];
            if (is_string($isUrgent)) {
                $isUrgent = in_array(strtolower($isUrgent), ['1', 'true', 'on', 'yes'], true);
            }
            $requestData['is_urgent'] = (bool) $isUrgent;
        } else {
            $requestData['is_urgent'] = false;
        }
        
        $validator = Validator::make($requestData, [
            'program_id' => 'required|exists:programs,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'in:draft,published,archived',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'is_urgent' => 'boolean',
            'target_audience' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $announcement = ProgramAnnouncement::create($requestData);
        
        // Log program announcement creation
        $user = Auth::user();
        if ($user) {
            try {
            ActivityLogService::logCreated($announcement, $request);
            } catch (\Exception $e) {
                Log::warning('Failed to log announcement creation', ['error' => $e->getMessage()]);
            }
        }

        // Send notifications to all residents when announcement is published
        // Since ProgramAnnouncementCreatedNotification implements ShouldQueue,
        // notifications will be queued automatically and won't block the response
        $isPublished = ($requestData['status'] ?? 'draft') === 'published';
        if ($isPublished) {
            // Dispatch notifications to run after response is sent
            // This prevents blocking the request while sending emails
            $announcementId = $announcement->id;
            app()->terminating(function() use ($announcementId) {
                try {
                    $announcement = ProgramAnnouncement::find($announcementId);
                    if ($announcement) {
                        $controller = new self();
                        $reflection = new \ReflectionClass($controller);
                        $method = $reflection->getMethod('notifyAllResidents');
                        $method->setAccessible(true);
                        $method->invoke($controller, $announcement);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send notifications after response', [
                        'announcement_id' => $announcementId,
                        'error' => $e->getMessage()
                    ]);
                }
            });
        }

        return response()->json([
            'success' => true,
            'message' => $isPublished 
                ? 'Announcement created and published successfully! Notifications are being sent in the background.' 
                : 'Announcement created successfully!',
            'data' => $announcement->load('program')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $announcement = ProgramAnnouncement::with('program')->find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $announcement
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $announcement = ProgramAnnouncement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        // Convert is_urgent to proper boolean before validation
        $requestData = $request->all();
        if (isset($requestData['is_urgent'])) {
            // Convert various formats to boolean
            $isUrgent = $requestData['is_urgent'];
            if (is_string($isUrgent)) {
                $isUrgent = in_array(strtolower($isUrgent), ['1', 'true', 'on', 'yes'], true);
            }
            $requestData['is_urgent'] = (bool) $isUrgent;
        }
        
        $validator = Validator::make($requestData, [
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'status' => 'sometimes|in:draft,published,archived',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
            'is_urgent' => 'sometimes|boolean',
            'target_audience' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldValues = $announcement->getOriginal();
        $announcement->update($requestData);
        
        // Log program announcement update
        $user = Auth::user();
        if ($user) {
            ActivityLogService::logUpdated($announcement, $oldValues, $request);
        }

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully',
            'data' => $announcement->load('program')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $announcement = ProgramAnnouncement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        // Log program announcement deletion
        $user = Auth::user();
        if ($user) {
            ActivityLogService::logDeleted($announcement, request());
        }
        
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully'
        ]);
    }

    /**
     * Publish an announcement
     */
    public function publish(string $id): JsonResponse
    {
        $announcement = ProgramAnnouncement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found'
            ], 404);
        }

        $announcement->update([
            'status' => 'published',
            'published_at' => now()
        ]);

        // Send notifications to all residents when announcement is published
        $this->notifyAllResidents($announcement);

        return response()->json([
            'success' => true,
            'message' => 'Announcement published successfully',
            'data' => $announcement->load('program')
        ]);
    }

    /**
     * Send notification to all residents about new program announcement
     */
    private function notifyAllResidents(ProgramAnnouncement $programAnnouncement)
    {
        try {
            // Get all resident users (role = 'resident' or 'residents')
            $residentUsers = User::whereIn('role', ['resident', 'residents'])
                ->whereNotNull('email')
                ->get();

            $notification = new ProgramAnnouncementCreatedNotification($programAnnouncement);
            
            foreach ($residentUsers as $user) {
                try {
                    $user->notify($notification);
                } catch (\Exception $e) {
                    Log::warning('Failed to send program announcement notification to user', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Program announcement notifications sent to all residents', [
                'program_announcement_id' => $programAnnouncement->id,
                'recipients_count' => $residentUsers->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send program announcement notifications to residents', [
                'program_announcement_id' => $programAnnouncement->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get announcements for residents dashboard
     */
    public function getForResidents(Request $request): JsonResponse
    {
        $announcements = ProgramAnnouncement::published()
            ->with('program')
            ->orderBy('is_urgent', 'desc')
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $announcements
        ]);
    }
}
