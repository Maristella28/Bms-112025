<?php

namespace App\Http\Controllers;

use App\Models\ResidentNotification;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UnifiedNotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated resident (both Laravel notifications and custom notifications)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $resident = Resident::where('user_id', $user->id)->first();

            if (!$resident) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resident profile not found'
                ], 404);
            }

            // OPTIMIZATION: Limit notifications to most recent 50 to improve performance
            // Get Laravel notifications (from database notifications table)
            $laravelNotifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($notification) {
                    $data = $notification->data;
                    return [
                        'id' => $notification->id,
                        'type' => 'laravel_notification',
                        'title' => $this->getNotificationTitle($data),
                        'message' => $this->getNotificationMessage($data, $notification->created_at),
                        'data' => $data,
                        'is_read' => $notification->read_at !== null,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                        'updated_at' => $notification->updated_at,
                        'redirect_path' => $this->getRedirectPath($data),
                    ];
                });

            // Get custom ResidentNotifications
            $customNotifications = ResidentNotification::where('resident_id', $resident->id)
                ->with('program')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($notification) {
                    // Merge notification data with program info
                    $notificationData = array_merge(
                        $notification->data ?? [],
                        [
                            'program_id' => $notification->program_id,
                            'program_name' => $notification->program?->name,
                            'program_type' => $notification->program?->type,
                            'message' => $notification->message, // Preserve original message
                            'type' => $notification->type,
                        ]
                    );
                    
                    // Use custom title if available, otherwise generate category-based title
                    $title = $notification->title ?? $this->getNotificationTitle($notificationData);
                    
                    // Always use getNotificationMessage to enhance with details (it handles custom messages)
                    $message = $this->getNotificationMessage($notificationData, $notification->created_at);
                    
                    // Get redirect path - prioritize redirect_path from data, then calculate
                    $redirectPath = $notificationData['redirect_path'] ?? $this->getRedirectPath($notificationData, 'custom_notification');
                    
                    return [
                        'id' => $notification->id,
                        'type' => 'custom_notification',
                        'title' => $title,
                        'message' => $message,
                        'data' => $notificationData,
                        'is_read' => $notification->is_read,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                        'updated_at' => $notification->updated_at,
                        'redirect_path' => $redirectPath,
                    ];
                });

            // Combine and sort all notifications by created_at
            $allNotifications = $laravelNotifications->concat($customNotifications)
                ->sortByDesc('created_at')
                ->values();

            $unreadCount = $allNotifications->where('is_read', false)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => $allNotifications,
                    'unread_count' => $unreadCount
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = $request->user();
            $resident = Resident::where('user_id', $user->id)->first();

            if (!$resident) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resident profile not found'
                ], 404);
            }

            // Try Laravel notification first
            $laravelNotification = $user->notifications()->find($id);
            if ($laravelNotification) {
                $laravelNotification->markAsRead();
                return response()->json([
                    'success' => true,
                    'message' => 'Notification marked as read'
                ]);
            }

            // Try custom notification
            $customNotification = ResidentNotification::where('id', $id)
                ->where('resident_id', $resident->id)
                ->first();

            if ($customNotification) {
                $customNotification->markAsRead();
                return response()->json([
                    'success' => true,
                    'message' => 'Notification marked as read'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user();
            $resident = Resident::where('user_id', $user->id)->first();

            if (!$resident) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resident profile not found'
                ], 404);
            }

            // Mark all Laravel notifications as read
            $user->unreadNotifications->markAsRead();

            // Mark all custom notifications as read
            ResidentNotification::where('resident_id', $resident->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification title based on data
     * Returns category-based titles (e.g., "Document Request Notification", "Asset Request Notification")
     */
    private function getNotificationTitle($data)
    {
        $notificationType = $data['type'] ?? null;

        // 1. Document Request notifications
        if (isset($data['document_request_id']) || 
            $notificationType === 'document_request_status' ||
            isset($data['document_type']) ||
            isset($data['certification_type'])) {
            return 'Document Request Notification';
        }

        // 2. Asset Request notifications
        if (isset($data['asset_request_id']) || $notificationType === 'asset_request') {
            return 'Asset Request Notification';
        }

        // 3. Asset Payment notifications
        if ($notificationType === 'asset_payment') {
            return 'Asset Payment Notification';
        }

        // 4. Blotter Request notifications
        if (isset($data['blotter_request_id']) || $notificationType === 'blotter_request') {
            return 'Blotter Request Notification';
        }

        // 5. Blotter Appointment notifications
        if (isset($data['appointment_id']) || $notificationType === 'blotter_appointment') {
            return 'Blotter Appointment Notification';
        }

        // 6. Announcement notifications
        if ($notificationType === 'announcement' || isset($data['announcement_id'])) {
            return 'Announcement Notification';
        }

        // 7. Program Announcement notifications
        if ($notificationType === 'program_announcement' || isset($data['program_announcement_id'])) {
            return 'Program Announcement Notification';
        }

        // 8. Project notifications
        if ($notificationType === 'project' || isset($data['project_id'])) {
            return 'Project Update Notification';
        }

        // 9. Benefits/Application Status notifications
        if ($notificationType === 'benefit_update' || 
            $notificationType === 'application_status' || 
            isset($data['submission_id']) || 
            isset($data['benefit_id'])) {
            return 'Benefits Update Notification';
        }

        // 10. Generic program notifications
        if (isset($data['program_id'])) {
            return 'Program Notification';
        }

        // Default fallback
        return 'Notification';
    }

    /**
     * Get notification message with specific details
     * Provides detailed content about the notification event
     */
    private function getNotificationMessage($data, $createdAt)
    {
        // If a custom message is already provided, use it
        if (isset($data['message']) && !empty($data['message'])) {
            $message = $data['message'];
            
            // Enhance message with additional details if available
            $details = [];
            
            // Add document type if available
            if (isset($data['document_type']) || isset($data['certification_type'])) {
                $docType = $data['document_type'] ?? $data['certification_type'] ?? null;
                if ($docType) {
                    $details[] = "Document Type: {$docType}";
                }
            }
            
            // Add status if available
            if (isset($data['status'])) {
                $details[] = "Status: " . ucfirst($data['status']);
            }
            
            // Add request ID if available
            if (isset($data['document_request_id'])) {
                $details[] = "Request #: {$data['document_request_id']}";
            } elseif (isset($data['asset_request_id'])) {
                $details[] = "Request #: {$data['asset_request_id']}";
            } elseif (isset($data['blotter_request_id'])) {
                $details[] = "Request #: {$data['blotter_request_id']}";
            }
            
            // Add formatted date
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            // Append details to message if any
            if (!empty($details)) {
                $message .= "\n\n" . implode("\n", $details);
            }
            
            return $message;
        }

        // Build message from data if no custom message provided
        $notificationType = $data['type'] ?? null;
        $status = $data['status'] ?? null;

        // Document Request notifications
        if (isset($data['document_request_id']) || 
            $notificationType === 'document_request_status' ||
            isset($data['document_type']) ||
            isset($data['certification_type'])) {
            
            $docType = $data['document_type'] ?? $data['certification_type'] ?? 'Document';
            $requestId = $data['document_request_id'] ?? null;
            
            $message = "Your {$docType} request";
            
            if ($status === 'approved') {
                $message = "Great news! Your {$docType} request has been approved and is ready for pickup.";
            } elseif ($status === 'denied' || $status === 'rejected') {
                $message = "Your {$docType} request has been denied.";
                if (isset($data['reason'])) {
                    $message .= " Reason: {$data['reason']}";
                }
            } elseif ($status === 'processing') {
                $message = "Your {$docType} request is currently being processed.";
            } elseif ($status === 'pending') {
                $message = "Your {$docType} request has been submitted and is pending review.";
            } else {
                $message = "Update on your {$docType} request.";
            }
            
            $details = [];
            $details[] = "Document Type: {$docType}";
            if ($status) {
                $details[] = "Status: " . ucfirst($status);
            }
            if ($requestId) {
                $details[] = "Request #: {$requestId}";
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . "\n\n" . implode("\n", $details);
        }

        // Asset Request notifications
        if (isset($data['asset_request_id']) || $notificationType === 'asset_request') {
            $assetName = $data['asset_name'] ?? 'Asset';
            $requestId = $data['asset_request_id'] ?? null;
            
            $message = "Your request for {$assetName}";
            
            if ($status === 'approved') {
                $message = "Your request for {$assetName} has been approved.";
            } elseif ($status === 'denied' || $status === 'rejected') {
                $message = "Your request for {$assetName} has been denied.";
            } elseif ($status === 'processing' || $status === 'in_progress') {
                $message = "Your request for {$assetName} has been processed. Status: In Progress";
            } elseif ($status === 'pending') {
                $message = "Your request for {$assetName} has been submitted and is pending review.";
            } else {
                $message = "Update on your request for {$assetName}.";
            }
            
            $details = [];
            if ($status) {
                $details[] = "Status: " . ucfirst($status);
            }
            if ($requestId) {
                $details[] = "Request #: {$requestId}";
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . (!empty($details) ? "\n\n" . implode("\n", $details) : '');
        }

        // Asset Payment notifications
        if ($notificationType === 'asset_payment') {
            $assetName = $data['asset_name'] ?? 'Asset';
            $amount = isset($data['amount']) ? '₱' . number_format($data['amount'], 2) : null;
            
            $message = "Payment for your {$assetName} request";
            if ($amount) {
                $message .= " of {$amount}";
            }
            $message .= " has been processed successfully.";
            
            $details = [];
            if (isset($data['asset_request_id'])) {
                $details[] = "Request #: {$data['asset_request_id']}";
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . (!empty($details) ? "\n\n" . implode("\n", $details) : '');
        }

        // Blotter Request notifications
        if (isset($data['blotter_request_id']) || $notificationType === 'blotter_request') {
            $requestId = $data['blotter_request_id'] ?? null;
            
            $message = "Update on your blotter request.";
            if ($status === 'approved') {
                $message = "Your blotter request has been approved.";
            } elseif ($status === 'denied') {
                $message = "Your blotter request has been denied.";
            }
            
            $details = [];
            if ($status) {
                $details[] = "Status: " . ucfirst($status);
            }
            if ($requestId) {
                $details[] = "Request #: {$requestId}";
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . (!empty($details) ? "\n\n" . implode("\n", $details) : '');
        }

        // Project notifications
        if ($notificationType === 'project' || isset($data['project_id'])) {
            $projectName = $data['project_name'] ?? 'Project';
            
            $message = "New community {$projectName} project has been posted. Check details in Projects page.";
            
            $details = [];
            if (isset($data['project_id'])) {
                $details[] = "Project ID: {$data['project_id']}";
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . (!empty($details) ? "\n\n" . implode("\n", $details) : '');
        }

        // Announcement notifications
        if ($notificationType === 'announcement' || isset($data['announcement_id'])) {
            $announcementTitle = $data['announcement_title'] ?? 'Announcement';
            $message = "New announcement: {$announcementTitle}";
            
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $message .= "\n\nDate: {$date}";
            }
            
            return $message;
        }

        // Program/Benefits notifications
        if ($notificationType === 'benefit_update' || 
            $notificationType === 'application_status' || 
            isset($data['submission_id']) || 
            isset($data['benefit_id'])) {
            
            $message = "Update on your program application or benefit.";
            if ($status) {
                $message = "Your application status: " . ucfirst($status);
            }
            
            $details = [];
            if (isset($data['program_name'])) {
                $details[] = "Program: {$data['program_name']}";
            }
            if ($status) {
                $details[] = "Status: " . ucfirst($status);
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . (!empty($details) ? "\n\n" . implode("\n", $details) : '');
        }

        // Custom program notifications (with program_id but no specific type)
        if (isset($data['program_id']) || isset($data['program_name'])) {
            $programName = $data['program_name'] ?? 'Program';
            $message = "Update regarding {$programName} program.";
            
            $details = [];
            if (isset($data['program_name'])) {
                $details[] = "Program: {$data['program_name']}";
            }
            if ($status) {
                $details[] = "Status: " . ucfirst($status);
            }
            if ($createdAt) {
                $date = is_string($createdAt) ? $createdAt : $createdAt->format('m/d/Y, g:i:s A');
                $details[] = "Date: {$date}";
            }
            
            return $message . (!empty($details) ? "\n\n" . implode("\n", $details) : '');
        }

        // Default fallback
        return $data['message'] ?? 'New notification';
    }

    /**
     * Get redirect path based on notification data
     * 
     * Maps notification types to their corresponding pages with proper query parameters
     * for highlighting specific items.
     */
    private function getRedirectPath($data, $notificationType = null)
    {
        // Check if action_url is already provided in the data
        if (isset($data['action_url'])) {
            // Convert old action_url format to new route format if needed
            $actionUrl = $data['action_url'];
            if ($actionUrl === '/residents/documents/status' || $actionUrl === '/residents/statusDocumentRequests') {
                // Convert to new simplified format
                return '/residents/requestDocuments?status';
            }
            return $actionUrl;
        }

        // Check for explicit redirect_path in data (highest priority)
        if (isset($data['redirect_path'])) {
            return $data['redirect_path'];
        }

        // Determine redirect path based on notification type and data
        $notificationTypeValue = $data['type'] ?? null;

        // 1. Document Request notifications
        // Redirect to My Document Requests page (requestDocuments with status tab)
        // Check for document request indicators:
        // - document_request_id
        // - type === 'document_request_status'
        // - document_type field (Barangay Clearance, Barangay Business Permit, etc.)
        // - certification_type field
        if (isset($data['document_request_id']) || 
            $notificationTypeValue === 'document_request_status' ||
            isset($data['document_type']) ||
            isset($data['certification_type'])) {
            // Always redirect to requestDocuments page with status parameter
            // Format: /residents/requestDocuments?status
            return '/residents/requestDocuments?status';
        }

        // 2. Asset Request notifications
        // Redirect to Request Assets page (statusAssetRequests)
        if (isset($data['asset_request_id']) || $notificationTypeValue === 'asset_request') {
            $assetRequestId = $data['asset_request_id'] ?? null;
            // Use statusassetrequests (matching actual route, case-sensitive)
            $path = '/residents/statusassetrequests';
            if ($assetRequestId) {
                $path .= '?id=' . $assetRequestId;
            }
            return $path;
        }

        // 3. Asset Payment notifications (redirect to asset requests)
        if ($notificationTypeValue === 'asset_payment') {
            $assetRequestId = $data['asset_request_id'] ?? null;
            $path = '/residents/statusassetrequests';
            if ($assetRequestId) {
                $path .= '?id=' . $assetRequestId;
            }
            return $path;
        }

        // 4. Blotter Request notifications
        if (isset($data['blotter_request_id']) || $notificationTypeValue === 'blotter_request') {
            $blotterRequestId = $data['blotter_request_id'] ?? null;
            $path = '/residents/statusBlotterRequests';
            if ($blotterRequestId) {
                $path .= '?id=' . $blotterRequestId;
            }
            return $path;
        }

        // 5. Blotter Appointment notifications
        // Redirect to Blotter Appointment page
        if (isset($data['appointment_id']) || $notificationTypeValue === 'blotter_appointment') {
            $appointmentId = $data['appointment_id'] ?? null;
            $path = '/residents/statusBlotterRequests';
            if ($appointmentId) {
                $path .= '?id=' . $appointmentId;
            }
            return $path;
        }

        // 6. Dashboard Announcements
        // Redirect to Dashboard → Latest Announcements
        if ($notificationTypeValue === 'announcement' || isset($data['announcement_id'])) {
            $announcementId = $data['announcement_id'] ?? null;
            $path = '/residents/dashboard';
            if ($announcementId) {
                $path .= '?tab=announcements&id=' . $announcementId;
            } else {
                $path .= '?tab=announcements';
            }
            return $path;
        }

        // 7. Available Programs / Program Announcements
        if ($notificationTypeValue === 'program_announcement' || isset($data['program_announcement_id'])) {
            $programAnnouncementId = $data['program_announcement_id'] ?? null;
            $programId = $data['program_id'] ?? null;
            $path = '/residents/dashboard';
            if ($programAnnouncementId) {
                $path .= '?section=programs&announcement=' . $programAnnouncementId . '#announcement-' . $programAnnouncementId;
            } elseif ($programId) {
                $path .= '?section=programs&program=' . $programId . '#program-' . $programId;
            } else {
                $path .= '?section=programs#available-programs';
            }
            return $path;
        }

        // 8. Projects notifications
        // Redirect to Projects page
        if ($notificationTypeValue === 'project' || isset($data['project_id'])) {
            $projectId = $data['project_id'] ?? null;
            $path = '/residents/projects';
            if ($projectId) {
                $path .= '?id=' . $projectId;
            }
            return $path;
        }

        // 9. My Benefits / Program Application Status
        // Redirect to My Benefits page
        if ($notificationTypeValue === 'benefit_update' || 
            $notificationTypeValue === 'application_status' || 
            isset($data['submission_id']) || 
            isset($data['benefit_id'])) {
            $submissionId = $data['submission_id'] ?? null;
            $benefitId = $data['benefit_id'] ?? null;
            // Use myBenefits (actual route) - user requested /residents/benefits but route is /residents/myBenefits
            $path = '/residents/myBenefits';
            if ($submissionId) {
                $path .= '?submission=' . $submissionId;
            } elseif ($benefitId) {
                $path .= '?benefit=' . $benefitId;
            }
            return $path;
        }

        // 10. Custom notifications (program-related) - redirect to enrolled programs
        if ($notificationType === 'custom_notification') {
            // Check for program_notice type specifically
            if (isset($data['type']) && $data['type'] === 'program_notice') {
                $programId = $data['program_id'] ?? null;
                $beneficiaryId = $data['beneficiary_id'] ?? null;
                
                if ($beneficiaryId && $programId) {
                    return '/residents/enrolledPrograms?program=' . $programId . '&beneficiary=' . $beneficiaryId;
                } elseif ($programId) {
                    return '/residents/enrolledPrograms?program=' . $programId;
                }
            }
            
            // For other custom notifications with program_id, redirect to enrolled programs
            if (isset($data['program_id'])) {
                $programId = $data['program_id'];
                $beneficiaryId = $data['beneficiary_id'] ?? null;
                
                if ($beneficiaryId) {
                    return '/residents/enrolledPrograms?program=' . $programId . '&beneficiary=' . $beneficiaryId;
                }
                return '/residents/enrolledPrograms?program=' . $programId;
            }
            // Default for custom notifications
            return '/residents/enrolledPrograms';
        }

        // 11. Generic program notifications
        if (isset($data['program_id']) && !isset($data['program_announcement_id'])) {
            $programId = $data['program_id'];
            $beneficiaryId = $data['beneficiary_id'] ?? null;
            
            if ($beneficiaryId) {
                return '/residents/enrolledPrograms?program=' . $programId . '&beneficiary=' . $beneficiaryId;
            }
            return '/residents/enrolledPrograms?program=' . $programId;
        }

        // Default: no redirect (return null)
        return null;
    }
}
