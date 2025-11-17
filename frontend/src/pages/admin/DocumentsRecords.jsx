import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useAdminResponsiveLayout } from "../../hooks/useAdminResponsiveLayout";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ClockIcon as RefreshIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  TableCellsIcon,
  QuestionMarkCircleIcon,
  PlayIcon,
  BookOpenIcon,
  LightBulbIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  HomeIcon,
  DocumentCheckIcon,
  GiftIcon,
  ChartBarIcon
} from "@heroicons/react/24/solid";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTestData, getTestDocumentRecords } from '../../testData/documentRecordsTestData';

// Import help components
import DocumentsHelpGuide from "./modules/documents-record/components/DocumentsHelpGuide";
import DocumentsQuickStartGuide from "./modules/documents-record/components/DocumentsQuickStartGuide";
import DocumentsFAQ from "./modules/documents-record/components/DocumentsFAQ";
import DocumentsHelpTooltip, { DocumentsQuickHelpButton, DocumentsHelpIcon, DocumentsFeatureExplanation } from "./modules/documents-record/components/DocumentsHelpTooltip";
import ActionsDropdown from "./modules/documents-record/components/ActionsDropdown";

const StatCard = ({ label, value, icon, iconBg, color, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 flex justify-between items-center group cursor-pointer ${
      isActive ? 'ring-2 ring-green-500 bg-green-50' : ''
    }`}
  >
    <div className="flex-1 min-w-0">
      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{label}</p>
      <p className={`text-lg sm:text-2xl lg:text-3xl font-bold group-hover:scale-105 transition ${color}`}>{value}</p>
    </div>
    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-4">
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-6 bg-gray-200 rounded w-18"></div>
    </td>
    <td className="px-4 py-4">
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-8"></div>
      </div>
    </td>
  </tr>
);

const badge = (text, color, icon = null, size = 'sm') => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium shadow-sm border ${color} ${sizeClasses[size]}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{text}</span>
    </span>
  );
};

const getDocumentTypeColor = (type) => {
  switch (type) {
    case 'Brgy Clearance':
      return 'bg-blue-100 text-blue-800';
    case 'Cedula':
      return 'bg-green-100 text-green-800';
    case 'Brgy Indigency':
      return 'bg-purple-100 text-purple-800';
    case 'Brgy Residency':
      return 'bg-orange-100 text-orange-800';
    case 'Brgy Business Permit':
      return 'bg-pink-100 text-pink-800';
    case 'Brgy Certification':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getDocumentTypeIcon = (type) => {
  switch (type) {
    case 'Brgy Clearance':
      return <DocumentTextIcon className="w-3 h-3" />;
    case 'Cedula':
      return <DocumentIcon className="w-3 h-3" />;
    case 'Brgy Indigency':
      return <AcademicCapIcon className="w-3 h-3" />;
    case 'Brgy Residency':
      return <DocumentIcon className="w-3 h-3" />;
    case 'Brgy Business Permit':
      return <DocumentIcon className="w-3 h-3" />;
    case 'Brgy Certification':
      return <DocumentIcon className="w-3 h-3" />;
    default:
      return <DocumentTextIcon className="w-3 h-3" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Processing':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Approved':
      return <CheckCircleIcon className="w-3 h-3" />;
    case 'Pending':
      return <ClockIcon className="w-3 h-3" />;
    case 'Rejected':
      return <ExclamationTriangleIcon className="w-3 h-3" />;
    case 'Processing':
      return <ClockIcon className="w-3 h-3" />;
    default:
      return <ClockIcon className="w-3 h-3" />;
  }
};

const DocumentsRecords = () => {
  const { user } = useAuth();
  const { mainClasses } = useAdminResponsiveLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default to prevent constant refreshing
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [markingAsFree, setMarkingAsFree] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  
  // Free document confirmation modal state
  const [showFreeConfirmModal, setShowFreeConfirmModal] = useState(false);
  const [freeConfirmRecord, setFreeConfirmRecord] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk actions state
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Help system state
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showFeatureExplanation, setShowFeatureExplanation] = useState(false);
  const [currentFeatureExplanation, setCurrentFeatureExplanation] = useState(null);
  
  // Deny modal state
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyRecord, setDenyRecord] = useState(null);
  const [denyRemarks, setDenyRemarks] = useState('');
  
  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRecord, setApproveRecord] = useState(null);
  const [approvePaymentAmount, setApprovePaymentAmount] = useState('');

  // Payment confirmation modal state
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [paymentConfirmRecord, setPaymentConfirmRecord] = useState(null);

  // Analytics dashboard state - collapsed by default for better UX
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [analyticsViewMode, setAnalyticsViewMode] = useState('simple'); // 'simple' or 'detailed'

  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 means no month selected
  const [selectedQuarter, setSelectedQuarter] = useState(0); // 0 means no quarter selected
  // Initialize activeTab from URL query parameter, default to 'requests'
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'records' ? 'records' : 'requests';
  });
  const [selectedDocumentType, setSelectedDocumentType] = useState('all');
  const [activeDocumentType, setActiveDocumentType] = useState('all'); // For document type tabs

  // Fetch document requests from backend
  const fetchRecords = async (showRefreshIndicator = false, retryCount = 0) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    const maxRetries = 2;
    
    try {
      // Use test data if flag is enabled (similar to backend test_create_admin_user.php)
      if (useTestData) {
        console.log('📊 Using test data for DocumentsRecords component');
        const data = getTestDocumentRecords();
        setRecords(data);
        setFilteredRecords(data);
        setChartData(generateChartData(data, selectedPeriod, selectedYear, selectedMonth));
        setLastRefresh(new Date());

        if (showRefreshIndicator) {
          setToastMessage({
            type: 'success',
            message: '🔄 Test data loaded successfully',
            duration: 2000
          });
        }
      } else {
        // Use appropriate endpoint based on user role
        const endpoint = user?.role === 'staff' ? 'staff/document-requests' : 'document-requests';
        const res = await axiosInstance.get(endpoint);
        console.log('=== DEBUGGING RECEIPT DISPLAY ===');
        console.log('Total records fetched:', res.data.length);
        console.log('Records with paid_document:', res.data.filter(r => r.paid_document).length);
        console.log('Sample paid_document data:', res.data.find(r => r.paid_document)?.paid_document);
        
        // Check specific paid records
        const paidRecords = res.data.filter(r => r.payment_status === 'paid');
        console.log('Paid records count:', paidRecords.length);
        paidRecords.forEach((record, index) => {
          if (index < 3) { // Show first 3 paid records
            console.log(`Paid record ${record.id}:`, {
              payment_status: record.payment_status,
              paid_document: record.paid_document,
              receipt_number: record.paid_document?.receipt_number
            });
          }
        });
        // Map backend data to table format
        const mapped = res.data.map((item) => ({
          id: item.id,
          user: item.user,
          resident: item.resident,
          documentType: item.document_type,
          certificationType: item.certification_type,
          certificationData: item.certification_data,
          status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          requestDate: item.created_at,
          approvedDate: item.status === 'approved' ? item.updated_at : null,
          completedAt: item.completed_at,
          priority: item.priority,
          processingNotes: item.processing_notes,
          estimatedCompletion: item.estimated_completion,
          purpose: item.fields?.purpose || '',
          remarks: item.fields?.remarks || '',
          pdfPath: item.pdf_path || item.pdfPath || null,
          pdf_path: item.pdf_path || item.pdfPath || null, // Keep both for compatibility
          photoPath: item.photo_path,
          photoType: item.photo_type,
          photoMetadata: item.photo_metadata,
          paymentAmount: item.payment_amount,
          paymentStatus: item.payment_status,
          paymentNotes: item.payment_notes,
          paymentApprovedAt: item.payment_approved_at,
          paymentConfirmedAt: item.payment_confirmed_at,
          paymentApprovedBy: item.payment_approved_by,
          paymentConfirmedBy: item.payment_confirmed_by,
          paidDocument: item.paid_document || null, // Use snake_case from backend
        }));
        console.log('=== MAPPED DATA DEBUG ===');
        const paidMappedRecords = mapped.filter(r => r.paymentStatus === 'paid');
        console.log('Mapped paid records count:', paidMappedRecords.length);
        paidMappedRecords.forEach((record, index) => {
          if (index < 3) { // Show first 3 mapped paid records
            console.log(`Mapped paid record ${record.id}:`, {
              paymentStatus: record.paymentStatus,
              paidDocument: record.paidDocument,
              receipt_number: record.paidDocument?.receipt_number,
              pdfPath: record.pdfPath,
              pdf_path: record.pdf_path,
              status: record.status
            });
          }
        });
        setRecords(mapped);
        setFilteredRecords(mapped);
        setChartData(generateChartData(mapped, selectedPeriod, selectedYear, selectedMonth));
        setLastRefresh(new Date());

        if (showRefreshIndicator) {
          setToastMessage({
            type: 'success',
            message: '🔄 Data refreshed successfully',
            duration: 2000
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch document records:', err);
      console.error('Error details:', {
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code,
        message: err.message
      });
      
      // Check if it's a timeout error
      const isTimeoutError = err.code === 'ECONNABORTED' || 
                            err.message?.includes('timeout') || 
                            err.name === 'AxiosError' && err.code === 'ECONNABORTED';
      
      let errorMessage = '❌ Failed to load data: ';
      
      if (isTimeoutError) {
        errorMessage = '⏱️ Request timeout: The server is taking too long to respond. ';
        
        // Retry for timeout errors
        if (retryCount < maxRetries) {
          console.log(`Retrying request after timeout (attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          setToastMessage({
            type: 'loading',
            message: `⏱️ Request timed out. Retrying... (${retryCount + 1}/${maxRetries})`,
            duration: 3000
          });
          
          setTimeout(() => {
            fetchRecords(showRefreshIndicator, retryCount + 1);
          }, 3000 * (retryCount + 1)); // Exponential backoff: 3s, 6s
          return;
        } else {
          errorMessage += 'Please check your connection or try again later. The server may be experiencing high load.';
        }
      } else if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        // Handle specific error cases
        if (status === 403) {
          errorMessage = '🔒 Access denied: You do not have permission to view document records.';
        } else if (status === 401) {
          errorMessage = '🔑 Authentication required: Please log in again.';
        } else if (status === 404) {
          errorMessage = '📄 No document records found.';
        } else if (status >= 500) {
          errorMessage = '🔧 Server error: Please try again later.';
        } else {
          errorMessage += data?.message || `Server error (${status})`;
        }
      } else if (err.request) {
        errorMessage = '🌐 Network error: Please check your internet connection.';
        
        // Retry for network errors
        if (retryCount < maxRetries) {
          console.log(`Retrying request (attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          setToastMessage({
            type: 'loading',
            message: `🌐 Network error. Retrying... (${retryCount + 1}/${maxRetries})`,
            duration: 3000
          });
          
          setTimeout(() => {
            fetchRecords(showRefreshIndicator, retryCount + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
          return;
        }
      } else {
        errorMessage += err.message || 'Unknown error occurred';
      }
      
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 7000
      });
      
      // Set empty records to prevent UI issues
      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRecords();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRecords();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchRecords(true);
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setToastMessage({
      type: 'success',
      message: `Auto-refresh ${!autoRefresh ? 'enabled' : 'disabled'}`,
      duration: 2000
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setCurrentPage(1);
    setToastMessage({
      type: 'success',
      message: '🔍 All filters cleared',
      duration: 2000
    });
  };

  // Pagination utility functions
  const getPaginatedRecords = (records) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return records.slice(startIndex, endIndex);
  };

  const getTotalPages = (records) => {
    return Math.ceil(records.length / itemsPerPage);
  };

  // Bulk actions utility functions
  const handleSelectRecord = (recordId) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    const paginatedRecords = getPaginatedRecords(filteredRecords);
    
    if (selectedRecords.length === paginatedRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(paginatedRecords.map(record => record.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRecords.length === 0) {
      setToastMessage({
        type: 'error',
        message: 'Please select at least one record',
        duration: 3000
      });
      return;
    }

    try {
      switch (action) {
        case 'approve':
          // Bulk approve logic
          setToastMessage({
            type: 'success',
            message: `${selectedRecords.length} records approved successfully`,
            duration: 3000
          });
          break;
        case 'reject':
          // Bulk reject logic
          setToastMessage({
            type: 'success',
            message: `${selectedRecords.length} records rejected successfully`,
            duration: 3000
          });
          break;
        case 'export':
          // Export selected records
          setToastMessage({
            type: 'success',
            message: `Exporting ${selectedRecords.length} records...`,
            duration: 3000
          });
          break;
      }
      
      setSelectedRecords([]);
      setShowBulkActions(false);
    } catch (error) {
      setToastMessage({
        type: 'error',
        message: 'Error performing bulk action',
        duration: 3000
      });
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveDocumentType('all'); // Reset document type filter when switching tabs
    setCurrentPage(1); // Reset to first page when switching tabs
    // Update URL query parameter
    setSearchParams({ tab });
  };

  // Update activeTab when URL query parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'records' || tab === 'requests') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Send notification to resident about approval
  const sendApprovalNotification = async (documentRequest) => {
    try {
      console.log('Sending approval notification to resident:', {
        residentId: documentRequest.user?.id,
        documentType: documentRequest.documentType,
        paymentAmount: documentRequest.paymentAmount,
        status: 'approved'
      });
      
      // Send approval notification via backend API (email + in-app)
      await axiosInstance.post(`/document-requests/${documentRequest.id}/send-approval-notification`);
      
      console.log('✅ Approval notification sent successfully');
    } catch (error) {
      console.error('Failed to send approval notification:', error);
      // Don't throw - notification failure shouldn't break the approval process
    }
  };

  // Generate PDF Receipt (copied from InventoryAssets.jsx)
  const generateReceipt = async (documentRequest, receiptNumber, amount) => {
    try {
      setToastMessage({
        type: 'loading',
        message: 'Generating receipt PDF...',
        duration: 0
      });

      console.log('Generating receipt:', {
        document_request_id: documentRequest.id,
        receipt_number: receiptNumber,
        amount_paid: amount
      });

      // Call backend to generate PDF receipt
      const response = await axiosInstance.post('/document-requests/generate-receipt', {
        document_request_id: documentRequest.id,
        receipt_number: receiptNumber,
        amount_paid: amount
      }, {
        responseType: 'blob'
      }).catch(async (error) => {
        // If error response is a blob (JSON error), parse it
        if (error.response && error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            error.response.data = errorData;
            console.error('Receipt generation error (parsed):', errorData);
          } catch (parseErr) {
            console.error('Failed to parse error response:', parseErr);
            error.response.data = { message: 'Failed to generate receipt PDF' };
          }
        }
        throw error;
      });

      // Check if response is actually an error (JSON error response when expecting blob)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        // This is an error response, parse it
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw {
          response: {
            status: errorData.status || 500,
            data: errorData
          }
        };
      }

      // Validate response is a valid PDF blob
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Received invalid PDF data from server');
      }

      if (response.data.size === 0) {
        throw new Error('Received empty PDF data from server');
      }

      console.log('Receipt PDF generated successfully:', {
        size: response.data.size,
        type: response.data.type,
        contentType: response.headers['content-type']
      });

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToastMessage({
        type: 'success',
        message: `📄 Receipt PDF downloaded successfully!`,
        duration: 3000
      });

    } catch (err) {
      console.error('Error generating receipt PDF:', err);
      console.error('Error details:', {
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = 'Failed to generate receipt PDF. Please try again.';
      
      if (err.response) {
        if (err.response.data) {
          errorMessage = err.response.data.error || err.response.data.message || errorMessage;
        }
        
        // Provide specific error messages based on status
        if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid request. Payment may not be confirmed yet.';
        } else if (err.response.status === 404) {
          errorMessage = 'Receipt template or document not found.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error occurred while generating receipt. Please try again or contact support.';
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setToastMessage({
        type: 'error',
        message: `❌ ${errorMessage}`,
        duration: 5000
      });
    }
  };

  // Download existing receipt PDF
  const handleDownloadReceipt = async (record) => {
    try {
      setToastMessage({
        type: 'loading',
        message: 'Downloading receipt PDF...',
        duration: 0
      });

      // Call backend to download existing receipt PDF
      const response = await axiosInstance.post('/document-requests/download-receipt', {
        document_request_id: record.id,
        receipt_number: record.paidDocument?.receipt_number
      }, {
        responseType: 'blob'
      });

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${record.paidDocument.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToastMessage({
        type: 'success',
        message: `📄 Receipt PDF downloaded successfully!`,
        duration: 3000
      });

    } catch (err) {
      console.error('Error downloading receipt PDF:', err);
      setToastMessage({
        type: 'error',
        message: 'Failed to download receipt PDF. Please try again.',
        duration: 4000
      });
    }
  };

  // Generate receipt for paid documents (copied from InventoryAssets.jsx pattern)
  const handleGenerateReceipt = async (record) => {
    if (!window.confirm(`Are you sure you want to generate receipt for this ${record.documentType} request?`)) return;
    
    setToastMessage({
      type: 'loading',
      message: 'Generating receipt...',
      duration: 0
    });
    
    try {
      // Validate record before making API call
      if (record.status && record.status.toLowerCase() !== 'approved') {
        setToastMessage({
          type: 'error',
          message: 'Document must be approved before generating receipt.',
          duration: 4000
        });
        return;
      }
      
      if (!record.paymentAmount || record.paymentAmount <= 0) {
        setToastMessage({
          type: 'error',
          message: 'No payment amount set for this document.',
          duration: 4000
        });
        return;
      }
      
      if (record.paymentStatus && record.paymentStatus.toLowerCase() === 'paid') {
        setToastMessage({
          type: 'error',
          message: 'Payment has already been confirmed for this document.',
          duration: 4000
        });
        return;
      }
      
      // Make API call to generate receipt
      const response = await axiosInstance.post(`/document-requests/${record.id}/admin-confirm-payment`, {
        payment_method: 'cash',
        notes: 'Receipt generated manually'
      });
      
      // Update local state with payment information
      setRecords(records.map(r => r.id === record.id ? { 
        ...r, 
        paymentStatus: 'paid',
        paidDocument: {
          receipt_number: response.data.receipt_number,
          amount_paid: response.data.amount_paid,
          payment_date: new Date().toISOString()
        }
      } : r));
      
      // Show success message with receipt details
      setToastMessage({
        type: 'success',
        message: `✅ Receipt ${response.data.receipt_number} generated successfully!\nAmount: ₱${response.data.amount_paid}`,
        duration: 4000
      });
      
      // Generate and download receipt PDF
      await generateReceipt(response.data.document_request, response.data.receipt_number, response.data.amount_paid);
      
    } catch (err) {
      console.error('Error generating receipt:', err);
      
      // Get the actual error message from the API response
      let errorMessage = 'Failed to generate receipt. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error_code) {
        switch (err.response.data.error_code) {
          case 'NOT_APPROVED':
            errorMessage = 'Document must be approved before generating receipt.';
            break;
          case 'NO_PAYMENT_AMOUNT':
            errorMessage = 'No payment amount set for this document.';
            break;
          case 'ALREADY_PAID':
            errorMessage = 'Payment has already been confirmed for this document.';
            break;
          default:
            errorMessage = err.response.data.message || errorMessage;
        }
      }
      
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 4000
      });
    }
  };

  // Open payment confirmation modal
  const handleConfirmPayment = (record) => {
    setPaymentConfirmRecord(record);
    setShowPaymentConfirmModal(true);
  };

  // Open free document confirmation modal
  const handleMarkAsFree = (record) => {
    setFreeConfirmRecord(record);
    setShowFreeConfirmModal(true);
  };

  // Process free document after modal confirmation
  const handleFreeConfirm = async () => {
    if (!freeConfirmRecord) return;
    
    // Prevent multiple clicks
    if (markingAsFree === freeConfirmRecord.id) {
      return;
    }
    
    setMarkingAsFree(freeConfirmRecord.id);
    setLoading(true);
    setToastMessage({
      type: 'loading',
      message: 'Processing free document...',
      duration: 0
    });
    
    try {
      // Update payment status directly using PATCH
      // The backend now accepts payment_status in the update method
      const response = await axiosInstance.patch(`/document-requests/${freeConfirmRecord.id}`, {
        status: freeConfirmRecord.status, // Keep the current status (Required field)
        payment_status: 'paid',
        payment_amount: 0,
        payment_notes: 'Free document - no payment required',
        fields: freeConfirmRecord.fields || { purpose: freeConfirmRecord.purpose || '' }
      });
      
      console.log('Free document update response:', response.data);
      
      // Update local state immediately with the response data
      const updatedRecord = response.data;
      setRecords(records.map(r => r.id === freeConfirmRecord.id ? { 
        ...r, 
        paymentStatus: updatedRecord.payment_status || 'paid',
        paymentAmount: updatedRecord.payment_amount || 0,
        status: updatedRecord.status,
        paidDocument: {
          receipt_number: null, // Free documents don't have receipts
          amount_paid: 0,
          payment_date: updatedRecord.payment_date || new Date().toISOString()
        }
      } : r));
      
      // Show success message
      setToastMessage({
        type: 'success',
        message: `✅ Free document processed successfully! Document moved to Document Records.`,
        duration: 4000
      });
      
      // Close modal
      setShowFreeConfirmModal(false);
      const recordId = freeConfirmRecord.id;
      setFreeConfirmRecord(null);
      
      // Refresh records to ensure everything is in sync
      await fetchRecords(false); // Don't show refresh indicator
      
    } catch (err) {
      console.error('Error marking document as free:', err);
      console.error('Error details:', {
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code,
        message: err.message
      });
      
      let errorMessage = 'Failed to process free document.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error_code) {
        switch (err.response.data.error_code) {
          case 'NOT_APPROVED':
            errorMessage = 'Document must be approved or processing before marking as free.';
            break;
          case 'NO_PAYMENT_AMOUNT':
            errorMessage = 'Unable to process free document. Please contact support.';
            break;
          case 'ALREADY_PAID':
            errorMessage = 'This document has already been processed.';
            break;
          default:
            errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Keep modal open on error so user can see the error and try again
      setToastMessage({
        type: 'error',
        message: `❌ ${errorMessage}`,
        duration: 6000
      });
    } finally {
      setMarkingAsFree(null);
      setLoading(false);
    }
  };

  // Process payment after modal confirmation
  const handlePaymentConfirm = async () => {
    if (!paymentConfirmRecord) return;
    
    // Prevent multiple clicks
    if (confirmingPayment === paymentConfirmRecord.id) {
      return;
    }
    
    setConfirmingPayment(paymentConfirmRecord.id);
    setLoading(true);
    setToastMessage({
      type: 'loading',
      message: 'Processing payment...',
      duration: 0
    });
    
    try {
      const response = await axiosInstance.post(`/document-requests/${paymentConfirmRecord.id}/admin-confirm-payment`);
      
      // Update local state with payment information
      setRecords(records.map(r => r.id === paymentConfirmRecord.id ? { 
        ...r, 
        paymentStatus: 'paid',
        paidDocument: {
          receipt_number: response.data.receipt_number,
          amount_paid: response.data.amount_paid,
          payment_date: new Date().toISOString()
        }
      } : r));
      
      // Show success message with receipt details
      setToastMessage({
        type: 'success',
        message: `✅ Payment processed successfully!\nReceipt Number: ${response.data.receipt_number}\nAmount: ₱${response.data.amount_paid}\n📄 Receipt is being generated...`,
        duration: 4000
      });
      
      // Close modal immediately after successful API call (before receipt generation)
      setShowPaymentConfirmModal(false);
      const recordId = paymentConfirmRecord.id;
      setPaymentConfirmRecord(null);
      
      // Generate and download receipt PDF automatically (in background)
      // Use the ID from paymentConfirmRecord since we know it's correct
      // The backend will load the document request fresh with updated payment_status
      // Add a delay and retry mechanism to handle timing issues
      setTimeout(async () => {
        const maxRetries = 3;
        let retryCount = 0;
        let receiptGenerated = false;
        
        while (retryCount < maxRetries && !receiptGenerated) {
          try {
            // Wait before each retry (longer wait for first attempt)
            await new Promise(resolve => setTimeout(resolve, retryCount === 0 ? 1000 : 500));
            
            console.log(`Attempting to generate receipt (attempt ${retryCount + 1}/${maxRetries})...`);
            
            await generateReceipt(
              { id: recordId }, 
              response.data.receipt_number, 
              response.data.amount_paid
            );
            
            receiptGenerated = true;
            console.log('Receipt generated successfully');
            
            // Refresh records to get updated data
            await fetchRecords();
          } catch (receiptErr) {
            retryCount++;
            console.error(`Error generating receipt (attempt ${retryCount}/${maxRetries}):`, receiptErr);
            
            // If it's a payment status error and we haven't exhausted retries, try again
            if (receiptErr.response?.status === 400 && 
                receiptErr.response?.data?.message?.includes('paid') && 
                retryCount < maxRetries) {
              console.log('Payment status not updated yet, retrying...');
              continue;
            }
            
            // If all retries failed, show error but don't block the user
            if (retryCount >= maxRetries) {
              setToastMessage({
                type: 'error',
                message: `⚠️ Payment confirmed but receipt generation failed. You can download it later from the record.`,
                duration: 6000
              });
            }
          }
        }
      }, 100);
      
    } catch (err) {
      console.error('Error confirming payment:', err);
      const errorMessage = err.response?.data?.message || 'Failed to process payment.';
      
      // Keep modal open on error so user can see the error and try again
      setToastMessage({
        type: 'error',
        message: `❌ ${errorMessage}`,
        duration: 5000
      });
    } finally {
      setConfirmingPayment(null);
      setLoading(false);
    }
  };

  // Filter records based on active tab, search, and document type
  useEffect(() => {
    let filtered = records.filter((record) => {
      const name = record.user?.name || record.resident?.first_name + ' ' + record.resident?.last_name || '';
      const id = record.resident?.resident_id || record.user?.id ? `RES-${String(record.user?.id || record.resident?.id).padStart(3, '0')}` : '';
      
      // Search filter
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
        id.toLowerCase().includes(search.toLowerCase()) ||
        record.documentType.toLowerCase().includes(search.toLowerCase());
      
      // Document type filter
      const matchesDocumentType = activeDocumentType === 'all' || record.documentType === activeDocumentType;
      
      // Status filter
      let matchesStatus = true;
      if (selectedStatus) {
        if (selectedStatus === 'paid') {
          matchesStatus = record.paymentStatus === 'paid';
        } else {
          matchesStatus = record.status === selectedStatus;
        }
      }
      
      // Tab-based filtering
      let matchesTab = true;
      if (activeTab === 'requests') {
        // Show all requests (pending, approved, rejected) that are NOT paid
        // When a request is paid, it moves to Document Records tab
        matchesTab = record.paymentStatus !== 'paid';
      } else if (activeTab === 'records') {
        // Show only paid requests that are approved or processing (finalized records)
        matchesTab = record.paymentStatus === 'paid' && (record.status === 'Approved' || record.status === 'Processing');
      }
      
      return matchesSearch && matchesDocumentType && matchesStatus && matchesTab;
    });
    
    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [search, records, activeTab, activeDocumentType, selectedStatus]);

  // Update chart data when records, period, year, or month changes
  useEffect(() => {
    setChartData(generateChartData(records, selectedPeriod, selectedYear, selectedMonth));
  }, [records, selectedPeriod, selectedYear, selectedMonth]);

  const handleShowDetails = (record) => {
    if (selectedRecord?.id === record.id) {
      setSelectedRecord(null);
    } else {
      setSelectedRecord(record);
    }
  };

  const handleEdit = (record) => {
    setEditData({ ...record });
    setShowModal(true);
    setFeedback(null);
  };

  const handleApprove = (record) => {
    setApproveRecord(record);
    setApprovePaymentAmount('');
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    const amount = parseFloat(approvePaymentAmount);
    
    if (isNaN(amount) || amount < 0) {
      setToastMessage({
        type: 'error',
        message: 'Please enter a valid payment amount',
        duration: 3000
      });
      return;
    }
    
    try {
      setLoading(true);
      setToastMessage({
        type: 'loading',
        message: 'Approving request...',
        duration: 2000
      });
      
      await axiosInstance.patch(`/document-requests/${approveRecord.id}`, {
        status: 'approved',
        payment_amount: amount,
        fields: {
          purpose: approveRecord.purpose,
        },
      });
      
      // Send notification if approved with payment (don't fail if this errors)
      if (amount > 0) {
        sendApprovalNotification({ ...approveRecord, paymentAmount: amount }).catch(err => {
          console.warn('Failed to send approval notification:', err);
        });
      }
      
      setToastMessage({
        type: 'success',
        message: `Document #${approveRecord.id} approved successfully!`,
        duration: 3000
      });
      
      // Close modal and refresh
      setShowApproveModal(false);
      setApproveRecord(null);
      setApprovePaymentAmount('');
      await fetchRecords();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to approve request';
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = (record) => {
    setDenyRecord(record);
    setDenyRemarks('');
    setShowDenyModal(true);
  };

  const handleDenyConfirm = async () => {
    if (!denyRemarks.trim()) {
      setToastMessage({
        type: 'error',
        message: 'Please provide a reason for denying this request',
        duration: 3000
      });
      return;
    }
    
    try {
      setLoading(true);
      setToastMessage({
        type: 'loading',
        message: 'Denying request...',
        duration: 2000
      });
      
      await axiosInstance.patch(`/document-requests/${denyRecord.id}`, {
        status: 'rejected',
        fields: {
          purpose: denyRecord.purpose,
          remarks: denyRemarks,
        },
      });
      
      // Send email notification to resident (don't fail if this errors)
      sendDenialNotification(denyRecord, denyRemarks).catch(err => {
        console.warn('Failed to send email notification:', err);
      });
      
      // Send in-app notification (don't fail if this errors)
      sendInAppNotification(denyRecord, denyRemarks).catch(err => {
        console.warn('Failed to send in-app notification:', err);
      });
      
      setToastMessage({
        type: 'success',
        message: `Document #${denyRecord.id} has been denied.`,
        duration: 3000
      });
      
      // Close modal and refresh
      setShowDenyModal(false);
      setDenyRecord(null);
      setDenyRemarks('');
      await fetchRecords();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to deny request';
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  // Send denial notification via email
  const sendDenialNotification = async (record, remarks) => {
    try {
      // Send denial notification via backend API (email + in-app)
      await axiosInstance.post(`/document-requests/${record.id}/send-denial-notification`, {
        reason: remarks
      });
      
      console.log('✅ Denial notification sent successfully');
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw - notification failure shouldn't break the denial process
    }
  };

  // Send in-app notification (now handled by backend, keeping for backwards compatibility)
  const sendInAppNotification = async (record, remarks) => {
    try {
      // In-app notification is now sent together with email via sendDenialNotification
      // This function is kept for backwards compatibility but does nothing
      console.log('✅ In-app notification handled by backend');
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setFeedback({ type: 'loading', message: 'Saving changes...' });
    
    // Validate payment amount when approving
    if (editData.status.toLowerCase() === 'approved' && (!editData.paymentAmount || editData.paymentAmount <= 0)) {
      setFeedback({
        type: 'error',
        message: '❌ Payment amount is required when approving a document request.',
        details: 'Please enter a valid payment amount before approving.'
      });
      setLoading(false);
      return;
    }
    
    try {
      await axiosInstance.patch(`/document-requests/${editData.id}`, {
        status: editData.status.toLowerCase(),
        priority: editData.priority,
        estimated_completion: editData.estimatedCompletion && editData.estimatedCompletion.trim() !== '' ? editData.estimatedCompletion : null,
        payment_amount: editData.paymentAmount || 0,
        payment_notes: editData.paymentNotes || '',
        fields: {
          purpose: editData.purpose,
          remarks: editData.remarks,
        },
      });
      
      setFeedback({
        type: 'success',
        message: editData.status.toLowerCase() === 'approved' 
          ? '✅ Document approved successfully! Payment notification sent to resident.'
          : '✅ Document record updated successfully!',
        details: editData.status.toLowerCase() === 'approved' 
          ? `Document approved with payment amount ₱${editData.paymentAmount}. Resident has been notified and can now make payment.`
          : `Status changed to ${editData.status}. All changes have been saved.`
      });
      
      // Show toast notification
      setToastMessage({
        type: 'success',
        message: `Document #${editData.id} updated successfully`,
        duration: 3000
      });
      
      // Send notification if approved
      if (editData.status.toLowerCase() === 'approved' && editData.paymentAmount > 0) {
        await sendApprovalNotification(editData);
      }
      
      setTimeout(() => {
        setShowModal(false);
        setEditData({});
        setFeedback(null);
      }, 1500);
      
      // Refresh records
      await fetchRecords();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save changes.';
      const errorCode = err.response?.status;
      
      setFeedback({
        type: 'error',
        message: `❌ ${errorMessage}`,
        details: errorCode ? `Error Code: ${errorCode}` : 'Please check your connection and try again.'
      });
      
      setToastMessage({
        type: 'error',
        message: 'Failed to update document record',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusCount = (status) => {
    return records.filter(record => record.status === status).length;
  };

  const getDocumentTypeCount = (documentType) => {
    if (activeTab === 'requests') {
      return records.filter(record => 
        record.documentType === documentType && record.paymentStatus !== 'paid'
      ).length;
    } else {
      return records.filter(record => 
        record.documentType === documentType && 
        record.paymentStatus === 'paid' && 
        record.status === 'Approved'
      ).length;
    }
  };


  const handleGeneratePdf = async (record) => {
    setGeneratingPdf(record.id);
    setToastMessage({
      type: 'loading',
      message: `Generating PDF for ${record.documentType}...`,
      duration: 0
    });
    
    try {
      // Allow PDF generation for Approved or Processing status
      // Processing status might need PDF regeneration if it was lost or never generated
      const recordStatus = (record.status || '').toLowerCase();
      if (recordStatus !== 'approved' && recordStatus !== 'processing') {
        setToastMessage({
          type: 'error',
          message: `❌ Only approved or processing requests can generate PDF. Current status: ${record.status}`,
          duration: 4000
        });
        setGeneratingPdf(null);
        return;
      }
      
      // If status is Processing, we can still generate PDF (regeneration)
      // Update status to Approved first if needed (backend requires Approved status for generation)
      if (recordStatus === 'processing') {
        // Try to generate PDF anyway - backend might allow it
        // If it fails, we'll catch and show appropriate error
      }

      // Check if PDF already exists - but allow regeneration for Processing status
      // This handles cases where PDF file was deleted or corrupted
      const hasPdfPath = record.pdfPath || record.pdf_path;
      if (hasPdfPath && recordStatus === 'processing') {
        // For Processing status, allow regeneration even if PDF path exists
        // This handles cases where PDF file was deleted or corrupted
        console.log('PDF path exists but allowing regeneration for Processing status');
      } else if (hasPdfPath && recordStatus === 'approved') {
        // For Approved status, if PDF exists, suggest using View/Download
        setToastMessage({
          type: 'info',
          message: '📄 PDF already exists. Use "View PDF" or "Download PDF" instead.',
          duration: 3000
        });
        setGeneratingPdf(null);
        return;
      }

      // Generate PDF (backend now allows both Approved and Processing status)
      const response = await axiosInstance.post(`/document-requests/${record.id}/generate-pdf`);
      
      // Get the PDF path from the response (backend returns pdf_path)
      const pdfPath = response.data?.pdf_path || response.data?.pdfPath;
      
      console.log('PDF generation response:', {
        pdf_path: response.data?.pdf_path,
        pdfPath: response.data?.pdfPath,
        fullResponse: response.data,
        recordId: record.id
      });
      
      if (!pdfPath) {
        throw new Error('PDF path not returned from server. PDF may not have been generated successfully.');
      }
      
      // Update status to Processing AFTER PDF generation succeeds (only if it was Approved)
      // If status is already Processing, keep it as Processing
      const currentStatus = (record.status || '').toLowerCase();
      if (currentStatus === 'approved') {
        try {
          await axiosInstance.patch(`/document-requests/${record.id}`, {
            status: 'processing',
            fields: {
              purpose: record.purpose,
            },
          });
        } catch (statusErr) {
          console.warn('Failed to update status to Processing:', statusErr);
          // Don't fail the whole operation if status update fails
        }
      }
      
      // Send notifications to resident (don't fail if this errors)
      sendProcessingNotification(record).catch(err => {
        console.warn('Failed to send processing notification:', err);
      });
      
      // Refresh records FIRST to get the latest data from backend (including pdf_path and updated status)
      await fetchRecords();
      
      // Update local state with PDF path to ensure UI is immediately updated
      // This is a backup in case fetchRecords doesn't return the updated data immediately
      setRecords(prevRecords => prevRecords.map(r => 
        r.id === record.id 
          ? { 
              ...r, 
              pdfPath: pdfPath,
              status: 'Processing' // Status changes to Processing after PDF generation
            }
          : r
      ));
      
      setToastMessage({
        type: 'success',
        message: `🎉 PDF certificate generated successfully! You can now view or download it.`,
        duration: 4000
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        record: record
      });
      
      let errorMessage = 'Failed to generate PDF.';
      
      if (err.response) {
        const errorData = err.response.data;
        errorMessage = errorData?.message || errorData?.error || errorMessage;
        
        // Provide more specific error messages
        if (err.response.status === 400) {
          errorMessage = errorData?.message || 'Invalid request. Please check the document status.';
        } else if (err.response.status === 404) {
          if (errorData?.error_code === 'RESIDENT_NOT_FOUND') {
            errorMessage = '❌ Resident profile not found for this document. The user may not have completed their resident profile. Please contact the administrator.';
          } else {
            errorMessage = errorData?.message || 'Document or resident profile not found.';
          }
        } else if (err.response.status === 500) {
          errorMessage = errorData?.message || errorData?.error || 'Server error occurred while generating PDF. Please check the logs or try again.';
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setToastMessage({
        type: 'error',
        message: `❌ ${errorMessage}`,
        duration: 7000
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  // Send processing notification via email and in-app
  const sendProcessingNotification = async (record) => {
    try {
      // Send processing notification via backend API (email + in-app)
      await axiosInstance.post(`/document-requests/${record.id}/send-processing-notification`);
      
      console.log('✅ Processing notification sent successfully');
    } catch (error) {
      console.error('Failed to send processing notification:', error);
      // Don't throw error, continue with PDF generation
    }
  };

  const handleDownloadPdf = async (record) => {
    // Check if status allows downloading PDF
    const recordStatus = (record.status || '').toLowerCase();
    if (recordStatus !== 'approved' && recordStatus !== 'processing') {
      setToastMessage({
        type: 'error',
        message: `❌ PDF can only be downloaded for approved or processing documents. Current status: ${record.status}`,
        duration: 4000
      });
      return;
    }

    // Validate that PDF exists before attempting to download
    // Check both camelCase and snake_case versions
    const pdfPath = record.pdfPath || record.pdf_path;
    if (!pdfPath) {
      // Try to refresh the record first in case pdfPath wasn't loaded
      console.warn('PDF path missing, attempting to refresh record data...', {
        recordId: record.id,
        status: record.status,
        pdfPath: record.pdfPath
      });
      
      // Refresh this specific record
      try {
        const endpoint = user?.role === 'staff' ? 'staff/document-requests' : 'document-requests';
        const res = await axiosInstance.get(endpoint);
        const updatedRecord = res.data.find(r => r.id === record.id);
        
        if (updatedRecord && (updatedRecord.pdf_path || updatedRecord.pdfPath)) {
          const updatedPdfPath = updatedRecord.pdf_path || updatedRecord.pdfPath;
          // Update the record in local state
          setRecords(records.map(r => 
            r.id === record.id 
              ? { ...r, pdfPath: updatedPdfPath, pdf_path: updatedPdfPath }
              : r
          ));
          
          // Retry with updated record
          return handleDownloadPdf({ 
            ...record, 
            pdfPath: updatedPdfPath, 
            pdf_path: updatedPdfPath 
          });
        }
      } catch (refreshErr) {
        console.error('Failed to refresh record:', refreshErr);
      }
      
      setToastMessage({
        type: 'error',
        message: '❌ PDF not found. Please generate the PDF first.',
        duration: 4000
      });
      return;
    }

    setToastMessage({
      type: 'loading',
      message: 'Preparing download...',
      duration: 0
    });
    
    try {
      // Log request details
      console.log('Downloading PDF for record:', {
        id: record.id,
        documentType: record.documentType,
        userName: record.user?.name,
        pdfPath: pdfPath,
        status: record.status
      });
      
      const response = await axiosInstance.get(`document-requests/${record.id}/download-pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Validate response data
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF data from server');
      }
      
      // Log response details for debugging
      console.log('PDF download response:', {
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        blobSize: response.data.size
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Log blob details
      console.log('Created Blob:', {
        size: blob.size,
        type: blob.type,
        url: url
      });
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${record.documentType}-${record.user?.name || 'certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up URL after a short delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log('Cleaned up Blob URL:', url);
      }, 100);
      
      setToastMessage({
        type: 'success',
        message: `📄 PDF downloaded successfully!`,
        duration: 3000
      });
    } catch (err) {
      console.error('Download PDF error:', err);
      console.error('Error details:', {
        response: err.response,
        request: err.request,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = '❌ Failed to download PDF. ';
      if (err.response) {
        switch (err.response.status) {
          case 404:
            const backendMessage = err.response?.data?.message || err.response?.data?.error_code;
            if (backendMessage === 'PDF_PATH_MISSING' || backendMessage === 'PDF_FILE_MISSING') {
              errorMessage = '❌ PDF file not found. Please generate the PDF first.';
            } else {
              errorMessage += 'Document not found or not yet generated.';
            }
            break;
          case 403:
            errorMessage += 'You do not have permission to download this document.';
            break;
          case 500:
            errorMessage = '❌ Server error occurred while downloading PDF. Please try again or contact support.';
            break;
          default:
            errorMessage += err.response?.data?.message || err.response?.data?.error || 'Please try again.';
        }
        console.error('Response error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      } else if (err.request) {
        errorMessage += 'Network error. Please check your connection.';
        console.error('Network error details:', {
          request: err.request,
          config: err.config
        });
      } else {
        errorMessage += err.message || 'Please try again.';
      }
      
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    }
  };

  const handleViewPdf = async (record) => {
    // Check if status allows viewing PDF
    const recordStatus = (record.status || '').toLowerCase();
    if (recordStatus !== 'approved' && recordStatus !== 'processing') {
      setToastMessage({
        type: 'error',
        message: `❌ PDF can only be viewed for approved or processing documents. Current status: ${record.status}`,
        duration: 4000
      });
      return;
    }

    // Validate that PDF exists before attempting to view
    // Check both camelCase and snake_case versions
    const pdfPath = record.pdfPath || record.pdf_path;
    if (!pdfPath) {
      // Try to refresh the record first in case pdfPath wasn't loaded
      console.warn('PDF path missing, attempting to refresh record data...', {
        recordId: record.id,
        status: record.status,
        pdfPath: record.pdfPath
      });
      
      // Refresh this specific record
      try {
        const endpoint = user?.role === 'staff' ? 'staff/document-requests' : 'document-requests';
        const res = await axiosInstance.get(endpoint);
        const updatedRecord = res.data.find(r => r.id === record.id);
        
        if (updatedRecord && (updatedRecord.pdf_path || updatedRecord.pdfPath)) {
          const updatedPdfPath = updatedRecord.pdf_path || updatedRecord.pdfPath;
          // Update the record in local state
          setRecords(records.map(r => 
            r.id === record.id 
              ? { ...r, pdfPath: updatedPdfPath, pdf_path: updatedPdfPath }
              : r
          ));
          
          // Retry with updated record
          return handleViewPdf({ ...record, pdfPath: updatedPdfPath, pdf_path: updatedPdfPath });
        }
      } catch (refreshErr) {
        console.error('Failed to refresh record:', refreshErr);
      }
      
      setToastMessage({
        type: 'error',
        message: '❌ PDF not found. Please generate the PDF first.',
        duration: 4000
      });
      return;
    }

    setToastMessage({
      type: 'loading',
      message: 'Opening PDF...',
      duration: 0
    });
    
    try {
      // Log request details
      console.log('Opening PDF for record:', {
        id: record.id,
        documentType: record.documentType,
        userName: record.user?.name,
        pdfPath: pdfPath,
        status: record.status
      });
      
      const response = await axiosInstance.get(`document-requests/${record.id}/download-pdf?view=true`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      }).catch(async (error) => {
        // If error response is a blob (JSON error), parse it
        if (error.response && error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            error.response.data = errorData;
          } catch (parseErr) {
            // If parsing fails, use default error message
            error.response.data = { message: 'Failed to download PDF' };
          }
        }
        throw error;
      });
      
      // Check response status
      if (response.status < 200 || response.status >= 300) {
        // Try to parse error from blob if it's an error response
        if (response.data instanceof Blob) {
          try {
            const text = await response.data.text();
            const errorData = JSON.parse(text);
            throw {
              response: {
                status: response.status,
                data: errorData
              }
            };
          } catch (parseErr) {
            throw {
              response: {
                status: response.status,
                data: { message: 'Failed to download PDF' }
              }
            };
          }
        }
      }
      
      // Check content type - if it's JSON, it's an error
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        // This is an error response, parse it
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw {
          response: {
            status: errorData.status || 500,
            data: errorData
          }
        };
      }
      
      // Validate response is a valid PDF blob
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Received invalid PDF data from server');
      }
      
      if (response.data.size === 0) {
        throw new Error('Received empty PDF data from server');
      }
      
      // Log response details
      console.log('PDF view response:', {
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        blobSize: response.data instanceof Blob ? response.data.size : 'unknown',
        blobType: response.data instanceof Blob ? response.data.type : 'not a blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Log blob details
      console.log('Created Blob:', {
        size: blob.size,
        type: blob.type,
        url: url
      });
      
      // Open PDF in new window with improved options
      const pdfWindow = window.open(url, '_blank', 
        'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=yes,menubar=yes');
      
      if (pdfWindow) {
        setToastMessage({
          type: 'success',
          message: `📄 PDF opened successfully!`,
          duration: 3000
        });
      } else {
        throw new Error('Popup window was blocked. Please allow popups for this site.');
      }
      
      // Clean up the URL after a delay to ensure PDF loads
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log('Cleaned up Blob URL:', url);
      }, 1000);
      
    } catch (err) {
      console.error('View PDF error:', err);
      console.error('Error details:', {
        response: err.response,
        request: err.request,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = '❌ Failed to open PDF. ';
      if (err.response) {
        switch (err.response.status) {
          case 404:
            const backendMessage = err.response?.data?.message || err.response?.data?.error_code;
            if (backendMessage === 'PDF_PATH_MISSING' || backendMessage === 'PDF_FILE_MISSING') {
              errorMessage = '❌ PDF file not found. Please generate the PDF first.';
            } else {
              errorMessage += 'Document not found or not yet generated.';
            }
            break;
          case 403:
            errorMessage += 'You do not have permission to view this document.';
            break;
          case 500:
            errorMessage = '❌ Server error occurred while opening PDF. Please try again or contact support.';
            break;
          default:
            errorMessage += err.response?.data?.message || err.response?.data?.error || 'Please try again.';
        }
        console.error('Response error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      } else if (err.request) {
        errorMessage += 'Network error. Please check your connection and try again.';
        console.error('Network error details:', {
          request: err.request,
          config: err.config
        });
      } else if (err.message.includes('blocked')) {
        errorMessage += 'Popup was blocked. Please allow popups and try again.';
      } else {
        errorMessage += err.message || 'Please try again.';
      }
      
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    }
  };

  // Download Excel for paid document records only
  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    setToastMessage({
      type: 'loading',
      message: 'Preparing paid records export...',
      duration: 0
    });
    
    try {
      console.log('Downloading Excel for paid document records');
      
      const response = await axiosInstance.get('/document-requests/export-excel', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      // Validate response data
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty Excel data from server');
      }
      
      // Log response details for debugging
      console.log('Excel download response:', {
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        blobSize: response.data.size
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Log blob details
      console.log('Created Excel Blob:', {
        size: blob.size,
        type: blob.type,
        url: url
      });
      
      const link = document.createElement('a');
      link.href = url;
      const currentDate = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Document_Records_${currentDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up URL after a short delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log('Cleaned up Excel Blob URL:', url);
      }, 100);
      
      setToastMessage({
        type: 'success',
        message: `📊 Paid document records exported successfully!`,
        duration: 3000
      });
    } catch (err) {
      console.error('Download Excel error:', err);
      console.error('Error details:', {
        response: err.response,
        request: err.request,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = '❌ Failed to download Excel file. ';
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage += 'Export endpoint not found.';
            break;
          case 403:
            errorMessage += 'You do not have permission to export data.';
            break;
          case 500:
            errorMessage += 'Server error while generating Excel file.';
            break;
          default:
            errorMessage += err.response?.data?.message || 'Please try again.';
        }
        console.error('Response error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      } else if (err.request) {
        errorMessage += 'Network error. Please check your connection.';
        console.error('Network error details:', {
          request: err.request,
          config: err.config
        });
      } else {
        errorMessage += err.message || 'Please try again.';
      }
      
      setToastMessage({
        type: 'error',
        message: errorMessage,
        duration: 4000
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Generate chart data for document requests based on period, year, and month
  const generateChartData = (records, period = 'all', year = '', month = 0) => {
    const now = new Date();
    let effectiveYear = year ? parseInt(year) : currentYear;
    let effectiveMonth = month;
    let data = [];

    if (period === 'month') {
      if (effectiveMonth === 0) {
        // If no specific month, use current month
        effectiveMonth = now.getMonth() + 1;
      }
      if (isNaN(effectiveYear)) {
        effectiveYear = now.getFullYear();
      }
      // Daily data for selected month and year
      const monthStart = new Date(effectiveYear, effectiveMonth - 1, 1);
      const monthEnd = new Date(effectiveYear, effectiveMonth, 0);
      const dailyData = {};
      records.forEach(record => {
        if (record.requestDate) {
          const date = new Date(record.requestDate);
          if (date >= monthStart && date <= monthEnd) {
            const dayKey = date.toISOString().split('T')[0];
            dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
          }
        }
      });
      // Fill all days of the month
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const date = new Date(effectiveYear, effectiveMonth - 1, day);
        const key = date.toISOString().split('T')[0];
        data.push({
          name: date.getDate().toString(),
          requests: dailyData[key] || 0
        });
      }
    } else if (period === 'year') {
      if (isNaN(effectiveYear)) {
        effectiveYear = currentYear;
      }
      if (effectiveMonth > 0) {
        // Daily data for selected month in the year
        const monthStart = new Date(effectiveYear, effectiveMonth - 1, 1);
        const monthEnd = new Date(effectiveYear, effectiveMonth, 0);
        const dailyData = {};
        records.forEach(record => {
          if (record.requestDate) {
            const date = new Date(record.requestDate);
            if (date >= monthStart && date <= monthEnd) {
              const dayKey = date.toISOString().split('T')[0];
              dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
            }
          }
        });
        // Fill all days of the month
        for (let day = 1; day <= monthEnd.getDate(); day++) {
          const date = new Date(effectiveYear, effectiveMonth - 1, day);
          const key = date.toISOString().split('T')[0];
          data.push({
            name: date.getDate().toString(),
            requests: dailyData[key] || 0
          });
        }
      } else {
        // Monthly data for selected year
        const yearlyData = {};
        records.forEach(record => {
          if (record.requestDate) {
            const date = new Date(record.requestDate);
            if (date.getFullYear() === effectiveYear) {
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              yearlyData[monthKey] = (yearlyData[monthKey] || 0) + 1;
            }
          }
        });
        // Fill all months of the year
        for (let m = 0; m < 12; m++) {
          const date = new Date(effectiveYear, m, 1);
          const key = `${effectiveYear}-${String(m + 1).padStart(2, '0')}`;
          data.push({
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            requests: yearlyData[key] || 0
          });
        }
      }
    } else {
      // All time - last 12 months
      const monthlyData = {};
      records.forEach(record => {
        if (record.requestDate) {
          const date = new Date(record.requestDate);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
        }
      });

      // Get last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        data.push({
          name: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          requests: monthlyData[key] || 0
        });
      }
    }
    return data;
  };

  // Filter records based on selected time period
  const getFilteredRecords = (records, period, year, month, quarter) => {
    if (period === 'all') return records;
    
    const yearNum = year ? parseInt(year) : currentYear;
    const monthNum = month;
    const quarterNum = quarter;
    
    return records.filter(record => {
      if (!record.requestDate) return false;
      const date = new Date(record.requestDate);
      const recordYear = date.getFullYear();
      const recordMonth = date.getMonth() + 1;
      
      if (period === 'quarter') {
        if (quarterNum > 0) {
          const quarterStartMonth = (quarterNum - 1) * 3 + 1;
          const quarterEndMonth = quarterNum * 3;
          return recordYear === yearNum && recordMonth >= quarterStartMonth && recordMonth <= quarterEndMonth;
        } else {
          // If no quarter selected, show all quarters of the selected year
          return recordYear === yearNum;
        }
      } else if (period === 'month') {
        if (monthNum > 0) {
          return recordMonth === monthNum && recordYear === yearNum;
        } else {
          // If no month selected, show current month
          const currentDate = new Date();
          return recordMonth === currentDate.getMonth() + 1 && recordYear === currentDate.getFullYear();
        }
      } else if (period === 'year') {
        if (monthNum > 0) {
          return recordMonth === monthNum && recordYear === yearNum;
        } else {
          return recordYear === yearNum;
        }
      }
      return true;
    });
  };

  // Get filtered records for current selection
  const currentFilteredRecords = getFilteredRecords(records, selectedPeriod, selectedYear, selectedMonth, selectedQuarter);

  // Get most requested document type based on period, year, month, and quarter
  const getMostRequestedDocument = (records, period = 'all', year = '', month = 0, quarter = 0) => {
    const filtered = getFilteredRecords(records, period, year, month, quarter);
    const counts = {};
    filtered.forEach(record => {
      counts[record.documentType] = (counts[record.documentType] || 0) + 1;
    });

    let max = 0;
    let most = Object.keys(counts).length > 0 ? '' : 'N/A';
    for (const [type, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        most = type;
      }
    }
    return { type: most, count: max };
  };

  // Generate suggestions based on current data
  const generateSuggestions = () => {
    const suggestions = [];
    const totalRequests = currentFilteredRecords.length;
    const approvedCount = currentFilteredRecords.filter(r => r.status === 'Approved').length;
    const paidCount = currentFilteredRecords.filter(r => r.paymentStatus === 'paid').length;
    const approvalRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;
    const paymentRate = totalRequests > 0 ? Math.round((paidCount / totalRequests) * 100) : 0;

    // Approval rate suggestions
    if (approvalRate < 50) {
      suggestions.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Approval Rate',
        message: `Your approval rate is ${approvalRate}%. Consider reviewing pending requests more frequently.`,
        action: 'Review pending requests'
      });
    } else if (approvalRate > 80) {
      suggestions.push({
        type: 'success',
        icon: '✅',
        title: 'Excellent Approval Rate',
        message: `Great job! Your approval rate is ${approvalRate}%. Keep up the good work!`,
        action: 'Maintain current pace'
      });
    }

    // Payment rate suggestions
    if (paymentRate < 30) {
      suggestions.push({
        type: 'warning',
        icon: '💰',
        title: 'Low Payment Collection',
        message: `Only ${paymentRate}% of requests are paid. Consider implementing payment reminders.`,
        action: 'Send payment reminders'
      });
    }

    // Processing time suggestions
    const avgProcessingTime = currentFilteredRecords.filter(r => r.status === 'Approved' && r.approvedDate).length > 0 
      ? Math.round(currentFilteredRecords.filter(r => r.status === 'Approved' && r.approvedDate)
          .reduce((acc, r) => {
            const requestDate = new Date(r.requestDate);
            const approvedDate = new Date(r.approvedDate);
            return acc + Math.round((approvedDate - requestDate) / (1000 * 60 * 60 * 24));
          }, 0) / currentFilteredRecords.filter(r => r.status === 'Approved' && r.approvedDate).length)
      : 0;

    if (avgProcessingTime > 7) {
      suggestions.push({
        type: 'info',
        icon: '⏱️',
        title: 'Slow Processing Time',
        message: `Average processing time is ${avgProcessingTime} days. Consider streamlining the approval process.`,
        action: 'Optimize workflow'
      });
    }

    // Document type suggestions
    const mostRequested = getMostRequestedDocument(currentFilteredRecords, selectedPeriod, selectedYear, selectedMonth, selectedQuarter);
    if (mostRequested.type !== 'N/A' && mostRequested.count > 0) {
      suggestions.push({
        type: 'info',
        icon: '📊',
        title: 'Popular Document Type',
        message: `${mostRequested.type} is the most requested (${mostRequested.count} requests). Consider preparing templates.`,
        action: 'Create templates'
      });
    }

    // Revenue suggestions
    const totalRevenue = currentFilteredRecords.reduce((sum, r) => sum + (parseFloat(r.paymentAmount) || 0), 0);
    const paidRevenue = currentFilteredRecords.filter(r => r.paymentStatus === 'paid').reduce((sum, r) => sum + (parseFloat(r.paymentAmount) || 0), 0);
    
    if (totalRevenue > 0 && paidRevenue < totalRevenue * 0.5) {
      suggestions.push({
        type: 'warning',
        icon: '💸',
        title: 'Revenue Collection Issue',
        message: `Only ₱${paidRevenue.toLocaleString()} collected out of ₱${totalRevenue.toLocaleString()} potential revenue.`,
        action: 'Follow up on payments'
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  // Auto-hide toast messages
  React.useEffect(() => {
    if (toastMessage && toastMessage.duration > 0) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, toastMessage.duration);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);


  // Toast Notification Component
  const ToastNotification = ({ message, type, onClose }) => (
    <div className={`fixed top-24 right-6 z-50 max-w-md rounded-xl shadow-2xl border-2 p-4 transition-all duration-500 transform ${
      message ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    } ${
      type === 'success'
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800'
        : type === 'loading'
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800'
        : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
          {type === 'loading' && <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />}
          {type === 'error' && <ExclamationCircleIcon className="w-5 h-5 text-red-600" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{message}</div>
        </div>
        {type !== 'loading' && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <Sidebar />
      
      {/* Toast Notification */}
      {toastMessage && (
        <ToastNotification
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      
      <main className="bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen ml-0 lg:ml-64 pt-20 lg:pt-36 px-4 pb-16 font-sans">
        <div className="w-full max-w-[98%] mx-auto space-y-8 px-2 lg:px-4">
          {/* Enhanced Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-xl mb-4">
              <DocumentTextIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
              Documents & Certificates Records
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Comprehensive management system for barangay document requests and certificate issuance with real-time tracking.
            </p>
            
            {/* Help System Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <DocumentsQuickHelpButton 
                onClick={() => setShowHelpGuide(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm px-4 py-2"
              />
              <button
                onClick={() => setShowQuickStart(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <PlayIcon className="w-4 h-4" />
                Quick Start
              </button>
              <button
                onClick={() => setShowFAQ(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <QuestionMarkCircleIcon className="w-4 h-4" />
                FAQ
              </button>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Requests"
              value={records.length}
              icon={<DocumentTextIcon className="w-6 h-6 text-green-600" />}
              iconBg="bg-green-100"
              color="text-green-600"
            />
            <StatCard
              label="Approved"
              value={getStatusCount('Approved')}
              icon={<CheckCircleIcon className="w-6 h-6 text-emerald-600" />}
              iconBg="bg-emerald-100"
              color="text-emerald-600"
            />
            <StatCard
              label="Pending"
              value={getStatusCount('Pending')}
              icon={<ClockIcon className="w-6 h-6 text-yellow-600" />}
              iconBg="bg-yellow-100"
              color="text-yellow-600"
            />
            <StatCard
              label="Processing"
              value={getStatusCount('Processing')}
              icon={<ClockIcon className="w-6 h-6 text-blue-600" />}
              iconBg="bg-blue-100"
              color="text-blue-600"
            />
          </div>

          {/* Analytics Dashboard Toggle Button */}
          <div className="mb-4 flex justify-center">
            <button
              onClick={() => setShowAnalyticsDashboard(!showAnalyticsDashboard)}
              className="group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <ChartBarIcon className={`w-5 h-5 transition-transform duration-300 ${showAnalyticsDashboard ? 'rotate-180' : ''}`} />
              <span>{showAnalyticsDashboard ? 'Hide Analytics Dashboard' : 'Show Analytics Dashboard'}</span>
              {!showAnalyticsDashboard && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {currentFilteredRecords.length} records
                </span>
              )}
            </button>
          </div>

          {/* Enhanced Analytics Dashboard - Collapsible */}
          {showAnalyticsDashboard && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 animate-fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="truncate">Document Analytics Dashboard</span>
                  </h3>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setAnalyticsViewMode('simple')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        analyticsViewMode === 'simple'
                          ? 'bg-white text-green-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => setAnalyticsViewMode('detailed')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        analyticsViewMode === 'detailed'
                          ? 'bg-white text-green-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mt-2 text-base">Comprehensive insights into document request patterns and performance metrics</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500">Filtered by:</span>
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {selectedPeriod === 'quarter' ? 
                      (selectedQuarter > 0 ? `Q${selectedQuarter} ${selectedYear || currentYear}` : `${selectedYear || currentYear}`) :
                     selectedPeriod === 'month' ? 
                      (selectedMonth > 0 ? `${selectedMonth}/${selectedYear || currentYear}` : 'current month') :
                     selectedPeriod === 'year' ? `${selectedYear || currentYear}` :
                     'All time'} • {currentFilteredRecords.length} records
                  </span>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    if (e.target.value !== 'month' && e.target.value !== 'quarter') setSelectedMonth(0);
                    if (e.target.value !== 'quarter') setSelectedQuarter(0);
                    if (e.target.value === 'all') {
                      setSelectedYear('');
                      setSelectedMonth(0);
                      setSelectedQuarter(0);
                    }
                  }}
                  className="px-4 py-2 border-2 border-gray-200 focus:ring-4 focus:ring-green-100 focus:border-green-500 rounded-xl text-sm font-medium bg-white shadow-sm w-full lg:w-auto"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
                {(selectedPeriod === 'month' || selectedPeriod === 'year' || selectedPeriod === 'quarter') && (
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedMonth(0);
                      setSelectedQuarter(0);
                    }}
                    className="px-4 py-2 border-2 border-gray-200 focus:ring-4 focus:ring-green-100 focus:border-green-500 rounded-xl text-sm font-medium bg-white shadow-sm w-full lg:w-auto"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 16 }, (_, i) => currentYear - 10 + i).map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                )}
                {selectedPeriod === 'quarter' && selectedYear && (
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    className="px-4 py-2 border-2 border-gray-200 focus:ring-4 focus:ring-green-100 focus:border-green-500 rounded-xl text-sm font-medium bg-white shadow-sm w-full lg:w-auto"
                  >
                    <option value={0}>All Quarters</option>
                    {[
                      { value: 1, name: 'Q1 (Jan-Mar)' },
                      { value: 2, name: 'Q2 (Apr-Jun)' },
                      { value: 3, name: 'Q3 (Jul-Sep)' },
                      { value: 4, name: 'Q4 (Oct-Dec)' }
                    ].map(q => (
                      <option key={q.value} value={q.value}>{q.name}</option>
                    ))}
                  </select>
                )}
                {(selectedPeriod === 'month' || selectedPeriod === 'year') && selectedYear && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 border-2 border-gray-200 focus:ring-4 focus:ring-green-100 focus:border-green-500 rounded-xl text-sm font-medium bg-white shadow-sm w-full lg:w-auto"
                  >
                    <option value={0}>All Months</option>
                    {[
                      { value: 1, name: 'January' },
                      { value: 2, name: 'February' },
                      { value: 3, name: 'March' },
                      { value: 4, name: 'April' },
                      { value: 5, name: 'May' },
                      { value: 6, name: 'June' },
                      { value: 7, name: 'July' },
                      { value: 8, name: 'August' },
                      { value: 9, name: 'September' },
                      { value: 10, name: 'October' },
                      { value: 11, name: 'November' },
                      { value: 12, name: 'December' }
                    ].map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                )}
                {(selectedPeriod === 'month' || selectedPeriod === 'year' || selectedPeriod === 'quarter') && !selectedYear && (
                  <select
                    disabled
                    className="px-4 py-2 border-2 border-gray-300 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium cursor-not-allowed w-full lg:w-auto"
                  >
                    <option>Select a year first</option>
                  </select>
                )}
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-green-600 font-medium">Total Requests</p>
                    <p className="text-2xl font-bold text-green-700">{currentFilteredRecords.length}</p>
                    <p className="text-sm text-green-500 mt-1 truncate">
                      {selectedPeriod === 'quarter' ? 
                        (selectedQuarter > 0 ? `Q${selectedQuarter} ${selectedYear || currentYear}` : `${selectedYear || currentYear}`) :
                       selectedPeriod === 'month' ? 
                        (selectedMonth > 0 ? `${selectedMonth}/${selectedYear || currentYear}` : 'current month') :
                       selectedPeriod === 'year' ? `${selectedYear || currentYear}` :
                       'All time'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentFilteredRecords.length / 100) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-600 font-medium">Approval Rate</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {currentFilteredRecords.length > 0 ? Math.round((currentFilteredRecords.filter(r => r.status === 'Approved').length / currentFilteredRecords.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-blue-500 mt-1">{currentFilteredRecords.filter(r => r.status === 'Approved').length} approved</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, currentFilteredRecords.length > 0 ? (currentFilteredRecords.filter(r => r.status === 'Approved').length / currentFilteredRecords.length) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-purple-600 font-medium">Payment Rate</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {currentFilteredRecords.length > 0 ? Math.round((currentFilteredRecords.filter(r => r.paymentStatus === 'paid').length / currentFilteredRecords.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-purple-500 mt-1">{currentFilteredRecords.filter(r => r.paymentStatus === 'paid').length} paid</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, currentFilteredRecords.length > 0 ? (currentFilteredRecords.filter(r => r.paymentStatus === 'paid').length / currentFilteredRecords.length) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-orange-600 font-medium">Processing Time</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {currentFilteredRecords.filter(r => r.status === 'Approved' && r.approvedDate).length > 0 
                        ? Math.round(currentFilteredRecords.filter(r => r.status === 'Approved' && r.approvedDate)
                            .reduce((acc, r) => {
                              const requestDate = new Date(r.requestDate);
                              const approvedDate = new Date(r.approvedDate);
                              return acc + Math.round((approvedDate - requestDate) / (1000 * 60 * 60 * 24));
                            }, 0) / currentFilteredRecords.filter(r => r.status === 'Approved' && r.approvedDate).length)
                        : 0} days
                    </p>
                    <p className="text-sm text-orange-500 mt-1">average</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, 80)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Document Type Distribution - Only in Detailed View */}
            {analyticsViewMode === 'detailed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-emerald-800">Document Type Distribution</h4>
                  <span className="text-emerald-600 text-xl">📊</span>
                </div>
                <div className="space-y-2">
                  {['Brgy Clearance', 'Brgy Indigency', 'Brgy Residency', 'Brgy Business Permit', 'Brgy Certification'].map(type => {
                    const count = currentFilteredRecords.filter(r => r.documentType === type).length;
                    const percentage = currentFilteredRecords.length > 0 ? Math.round((count / currentFilteredRecords.length) * 100) : 0;
                    return (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-emerald-600">{type.replace('Brgy ', '')}</span>
                        <span className="font-semibold text-emerald-800">{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-blue-800">Status Overview</h4>
                  <span className="text-blue-600 text-xl">📈</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Approved</span>
                    <span className="font-semibold text-blue-800">{currentFilteredRecords.filter(r => r.status === 'Approved').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Pending</span>
                    <span className="font-semibold text-blue-800">{currentFilteredRecords.filter(r => r.status === 'Pending').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Processing</span>
                    <span className="font-semibold text-blue-800">{currentFilteredRecords.filter(r => r.status === 'Processing').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Rejected</span>
                    <span className="font-semibold text-blue-800">{currentFilteredRecords.filter(r => r.status === 'Rejected').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-purple-800">Payment Status</h4>
                  <span className="text-purple-600 text-xl">💳</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Paid</span>
                    <span className="font-semibold text-purple-800">{currentFilteredRecords.filter(r => r.paymentStatus === 'paid').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Unpaid</span>
                    <span className="font-semibold text-purple-800">{currentFilteredRecords.filter(r => r.paymentStatus === 'unpaid').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">No Payment</span>
                    <span className="font-semibold text-purple-800">{currentFilteredRecords.filter(r => !r.paymentAmount || r.paymentAmount <= 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Smart Suggestions - Only in Detailed View */}
            {analyticsViewMode === 'detailed' && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Smart Suggestions
                </h4>
                <span className="text-sm text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                  Based on {selectedPeriod === 'quarter' ? 
                    (selectedQuarter > 0 ? `Q${selectedQuarter} ${selectedYear || currentYear}` : `${selectedYear || currentYear}`) :
                   selectedPeriod === 'month' ? 
                    (selectedMonth > 0 ? `${selectedMonth}/${selectedYear || currentYear}` : 'current month') :
                   selectedPeriod === 'year' ? `${selectedYear || currentYear}` :
                   'all time'} data
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generateSuggestions().map((suggestion, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${
                    suggestion.type === 'success' ? 'border-green-200 bg-green-50' :
                    suggestion.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{suggestion.icon}</span>
                      <div className="flex-1">
                        <h5 className={`font-semibold text-sm mb-1 ${
                          suggestion.type === 'success' ? 'text-green-800' :
                          suggestion.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {suggestion.title}
                        </h5>
                        <p className={`text-sm mb-2 ${
                          suggestion.type === 'success' ? 'text-green-700' :
                          suggestion.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                          {suggestion.message}
                        </p>
                        <button className={`text-xs font-medium px-3 py-1 rounded-full ${
                          suggestion.type === 'success' ? 'bg-green-200 text-green-800 hover:bg-green-300' :
                          suggestion.type === 'warning' ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' :
                          'bg-blue-200 text-blue-800 hover:bg-blue-300'
                        } transition-colors`}>
                          {suggestion.action}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {generateSuggestions().length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <span className="text-4xl mb-2 block">🎉</span>
                    <p className="text-gray-600">Great job! No immediate suggestions at this time.</p>
                    <p className="text-sm text-gray-500 mt-1">Keep up the excellent work!</p>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Chart Section - Only in Detailed View */}
            {analyticsViewMode === 'detailed' && (
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800">Request Trends</h4>
                <p className="text-sm text-slate-600">
                  {selectedPeriod === 'month' ? `Daily requests in ${selectedMonth ? `${selectedMonth}/${selectedYear}` : 'current month'}` :
                   selectedPeriod === 'year' ? `Monthly requests in ${selectedYear || currentYear}` :
                   'Requests over the last 12 months'}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            )}

            {/* Financial Overview - Only in Detailed View */}
            {analyticsViewMode === 'detailed' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-emerald-700">
                      ₱{currentFilteredRecords.reduce((sum, r) => sum + (parseFloat(r.paymentAmount) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      {selectedPeriod === 'quarter' ? 
                        (selectedQuarter > 0 ? `Q${selectedQuarter} ${selectedYear || currentYear}` : `${selectedYear || currentYear}`) :
                       selectedPeriod === 'month' ? 
                        (selectedMonth > 0 ? `${selectedMonth}/${selectedYear || currentYear}` : 'current month') :
                       selectedPeriod === 'year' ? `${selectedYear || currentYear}` :
                       'All time'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Paid Amount</p>
                    <p className="text-xl font-bold text-blue-700">
                      ₱{currentFilteredRecords.filter(r => r.paymentStatus === 'paid').reduce((sum, r) => sum + (parseFloat(r.paymentAmount) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">Collected</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending Amount</p>
                    <p className="text-xl font-bold text-yellow-700">
                      ₱{currentFilteredRecords.filter(r => r.paymentStatus === 'unpaid' && r.paymentAmount > 0).reduce((sum, r) => sum + (parseFloat(r.paymentAmount) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-yellow-500 mt-1">Outstanding</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">⏳</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Most Requested Documents - Only in Detailed View */}
            {analyticsViewMode === 'detailed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-green-800">Most Requested (Selected Period)</h4>
                  <span className="text-green-600 text-xl">🏆</span>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-green-900">
                    {getMostRequestedDocument(records, selectedPeriod, selectedYear, selectedMonth, selectedQuarter).type}
                  </p>
                  <p className="text-sm text-green-700">
                    {getMostRequestedDocument(records, selectedPeriod, selectedYear, selectedMonth, selectedQuarter).count} requests
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, currentFilteredRecords.length > 0 ? (getMostRequestedDocument(records, selectedPeriod, selectedYear, selectedMonth, selectedQuarter).count / currentFilteredRecords.length) * 100 : 0)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-blue-800">Most Requested (All Time)</h4>
                  <span className="text-blue-600 text-xl">📈</span>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-blue-900">
                    {getMostRequestedDocument(records, 'all').type}
                  </p>
                  <p className="text-sm text-blue-700">
                    {getMostRequestedDocument(records, 'all').count} requests
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, records.length > 0 ? (getMostRequestedDocument(records, 'all').count / records.length) * 100 : 0)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            )}

          </div>
          )}

          {/* Document Type Filter Cards */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-green-600" />
                Filter by Document Type
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* All Documents Card */}
                <button
                  onClick={() => setActiveDocumentType('all')}
                  className={`group relative p-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                    activeDocumentType === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-xl ring-2 ring-blue-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <DocumentTextIcon className={`w-6 h-6 ${activeDocumentType === 'all' ? 'text-white' : 'text-blue-600'}`} />
                    <span className="text-center">All Documents</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeDocumentType === 'all' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {activeTab === 'requests' 
                        ? records.filter(r => r.paymentStatus !== 'paid').length 
                        : records.filter(r => r.paymentStatus === 'paid' && (r.status === 'Approved' || r.status === 'Processing')).length
                      }
                    </span>
                  </div>
                </button>

                {/* Barangay Clearance Card */}
                <button
                  onClick={() => setActiveDocumentType('Brgy Clearance')}
                  className={`group relative p-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                    activeDocumentType === 'Brgy Clearance'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-500 shadow-xl ring-2 ring-green-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <DocumentTextIcon className={`w-6 h-6 ${activeDocumentType === 'Brgy Clearance' ? 'text-white' : 'text-green-600'}`} />
                    <span className="text-center">Barangay Clearance</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeDocumentType === 'Brgy Clearance' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {records.filter(r => r.documentType === 'Brgy Clearance').length}
                    </span>
                  </div>
                </button>

                {/* Business Permit Card */}
                <button
                  onClick={() => setActiveDocumentType('Brgy Business Permit')}
                  className={`group relative p-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                    activeDocumentType === 'Brgy Business Permit'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-xl ring-2 ring-purple-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <BuildingOfficeIcon className={`w-6 h-6 ${activeDocumentType === 'Brgy Business Permit' ? 'text-white' : 'text-purple-600'}`} />
                    <span className="text-center">Business Permit</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeDocumentType === 'Brgy Business Permit' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {records.filter(r => r.documentType === 'Brgy Business Permit').length}
                    </span>
                  </div>
                </button>

                {/* Certificate of Indigency Card */}
                <button
                  onClick={() => setActiveDocumentType('Brgy Indigency')}
                  className={`group relative p-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                    activeDocumentType === 'Brgy Indigency'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-500 shadow-xl ring-2 ring-orange-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <AcademicCapIcon className={`w-6 h-6 ${activeDocumentType === 'Brgy Indigency' ? 'text-white' : 'text-orange-600'}`} />
                    <span className="text-center">Certificate of Indigency</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeDocumentType === 'Brgy Indigency' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {records.filter(r => r.documentType === 'Brgy Indigency').length}
                    </span>
                  </div>
                </button>

                {/* Certificate of Residency Card */}
                <button
                  onClick={() => setActiveDocumentType('Cedula')}
                  className={`group relative p-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                    activeDocumentType === 'Cedula'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-500 shadow-xl ring-2 ring-emerald-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <HomeIcon className={`w-6 h-6 ${activeDocumentType === 'Cedula' ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="text-center">Cedula</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeDocumentType === 'Cedula' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {records.filter(r => r.documentType === 'Cedula').length}
                    </span>
                  </div>
                </button>

                {/* Barangay Certification Card */}
                <button
                  onClick={() => setActiveDocumentType('Brgy Certification')}
                  className={`group relative p-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                    activeDocumentType === 'Brgy Certification'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-xl ring-2 ring-cyan-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <DocumentCheckIcon className={`w-6 h-6 ${activeDocumentType === 'Brgy Certification' ? 'text-white' : 'text-cyan-600'}`} />
                    <span className="text-center">Barangay Certification</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeDocumentType === 'Brgy Certification' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {records.filter(r => r.documentType === 'Brgy Certification').length}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Enhanced Search Section */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleTabChange('requests')}
                  className={`px-8 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'requests'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                  }`}
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  Document Requests ({records.filter(r => r.paymentStatus !== 'paid').length})
                </button>
                <button
                  onClick={() => handleTabChange('records')}
                  className={`px-8 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === 'records'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                  }`}
                >
                  <DocumentIcon className="w-5 h-5" />
                  Document Records ({records.filter(r => r.paymentStatus === 'paid' && (r.status === 'Approved' || r.status === 'Processing')).length})
                </button>
              </div>

              <div className="flex gap-2 items-center w-full max-w-2xl">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-xl text-sm shadow-sm transition-all duration-300"
                    placeholder="Search document requests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                </div>
                
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="paid">Paid</option>
                  </select>
                  
                  <button 
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>



          {/* Enhanced Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Documents Table
              </h3>
            </div>                          
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                        Resident ID
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                        Full Name
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 hidden lg:table-cell min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-600" />
                        Date Requested
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                        Document Type
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 hidden md:table-cell min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-gray-600" />
                        Amount
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 hidden lg:table-cell min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                        Receipt
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 border-r border-gray-200 hidden sm:table-cell min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                        Payment Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <PencilIcon className="w-4 h-4 text-gray-600" />
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {getPaginatedRecords(filteredRecords).length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-6 animate-fade-in-up">
                          <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                              <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                              <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="text-center max-w-md">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {filteredRecords.length === 0 ? 'No Document Records Found' : 'No Records on This Page'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                              {filteredRecords.length === 0 
                                ? 'There are no document records at the moment. All requests have been processed or are pending review.'
                                : 'Try navigating to a different page or adjusting your filters.'
                              }
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <button
                                onClick={() => handleTabChange('requests')}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                              >
                                <DocumentTextIcon className="w-4 h-4" />
                                View Requests
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getPaginatedRecords(filteredRecords).map((record) => (
                      <React.Fragment key={record.id}>
                        <tr className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 group border-b border-gray-100 hover:border-green-200 hover:shadow-sm animate-fade-in-up">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-mono text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 truncate">
                                {record.resident?.resident_id || (record.user ? `RES-${String(record.user.id).padStart(3, '0')}` : 'N/A')}
                              </span>
                            </div>
                          </td>
                          <td
                            onClick={() => handleShowDetails(record)}
                            className="px-6 py-4 cursor-pointer group-hover:text-blue-600 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 text-sm truncate">
                                  {record.user?.name || (record.resident ? `${record.resident.first_name} ${record.resident.last_name}` : 'N/A')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell"> 
                            <div className="text-slate-700 text-sm font-medium">
                              {formatDate(record.requestDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {badge(record.documentType, getDocumentTypeColor(record.documentType), getDocumentTypeIcon(record.documentType))}
                          </td>
                          <td className="px-6 py-4">
                            {badge(record.status, getStatusColor(record.status), getStatusIcon(record.status))}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            {record.paymentAmount && record.paymentAmount > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                  ₱{parseFloat(record.paymentAmount).toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <GiftIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-blue-600 text-sm font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Free</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            {(() => {
                              console.log(`Record ${record.id} receipt debug:`, {
                                paidDocument: record.paidDocument,
                                receipt_number: record.paidDocument?.receipt_number,
                                paymentStatus: record.paymentStatus,
                                status: record.status,
                                paymentAmount: record.paymentAmount,
                                hasReceiptNumber: !!record.paidDocument?.receipt_number,
                                isApprovedWithPayment: record.status === 'Approved' && record.paymentAmount && record.paymentAmount > 0
                              });
                              return null;
                            })()}
                            {(() => {
                              // Show receipt number if:
                              // 1. Document has a paidDocument with receipt_number (paid documents)
                              // 2. Document is approved and has payment amount but NOT yet paid (ready for payment)
                              const hasReceipt = record.paidDocument?.receipt_number;
                              const isPaid = record.paymentStatus === 'paid';
                              const isApprovedWithPayment = record.status === 'Approved' && record.paymentAmount && record.paymentAmount > 0;
                              
                              if (hasReceipt) {
                                // Show actual receipt number for paid documents
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                      {record.paidDocument.receipt_number}
                                    </div>
                                  </div>
                                );
                              } else if (isPaid && !hasReceipt) {
                                // Payment is marked as paid but receipt number is missing
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <ExclamationCircleIcon className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                                      Paid - No Receipt
                                    </div>
                                  </div>
                                );
                              } else if (isApprovedWithPayment && !isPaid) {
                                // Show "Ready for Payment" for approved documents with payment amount that are NOT paid yet
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <DocumentTextIcon className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div className="text-sm font-bold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                                      Ready for Payment
                                    </div>
                                  </div>
                                );
                              } else {
                                // Show "No receipt" for other cases
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                      <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">No receipt</span>
                                  </div>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            {record.paymentAmount && record.paymentAmount > 0 ? (
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                record.paymentStatus === 'paid' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {record.paymentStatus === 'paid' ? (
                                  <>
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <ClockIcon className="w-4 h-4" />
                                    Unpaid
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <ExclamationCircleIcon className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="text-slate-400 text-sm font-medium">N/A</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <ActionsDropdown
                                record={{
                                  ...record,
                                  pdfPath: record.pdfPath || record.pdf_path || null,
                                  pdf_path: record.pdf_path || record.pdfPath || null
                                }}
                                activeTab={activeTab}
                                onViewDetails={handleShowDetails}
                                onEditRecord={handleEdit}
                                onApprove={handleApprove}
                                onDeny={handleDeny}
                                onConfirmPayment={handleConfirmPayment}
                                onMarkAsFree={handleMarkAsFree}
                                onGeneratePdf={handleGeneratePdf}
                                onViewPdf={handleViewPdf}
                                onDownloadPdf={handleDownloadPdf}
                                onGenerateReceipt={handleGenerateReceipt}
                                onDownloadReceipt={handleDownloadReceipt}
                                confirmingPayment={confirmingPayment}
                                markingAsFree={markingAsFree}
                                generatingPdf={generatingPdf}
                              />
                            </div>
                          </td>
                        </tr>

                        {selectedRecord?.id === record.id && (
                          <tr className="bg-gradient-to-r from-green-50 to-emerald-50">
                            <td colSpan="9" className="px-8 py-8">
                              <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                  {/* Document Information Card */}
                                  <div className="flex-1 space-y-6">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                      <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                                        <DocumentTextIcon className="w-5 h-5" /> Document Information
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div><span className="font-medium text-gray-700">Document Type:</span> <span className="text-gray-900">{selectedRecord.documentType}</span></div>
                                        {selectedRecord.certificationType && (
                                          <div><span className="font-medium text-gray-700">Certification Type:</span> <span className="text-gray-900">{selectedRecord.certificationType}</span></div>
                                        )}
                                        <div><span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{selectedRecord.status}</span></div>
                                        {selectedRecord.priority && (
                                          <div><span className="font-medium text-gray-700">Priority:</span> <span className="text-gray-900 capitalize">{selectedRecord.priority}</span></div>
                                        )}
                                        <div><span className="font-medium text-gray-700">Request Date:</span> <span className="text-gray-900">{formatDate(selectedRecord.requestDate)}</span></div>
                                        <div><span className="font-medium text-gray-700">Approved Date:</span> <span className="text-gray-900">{formatDate(selectedRecord.approvedDate)}</span></div>
                                        {selectedRecord.completedAt && (
                                          <div><span className="font-medium text-gray-700">Completed Date:</span> <span className="text-gray-900">{formatDate(selectedRecord.completedAt)}</span></div>
                                        )}
                                        {selectedRecord.estimatedCompletion && (
                                          <div><span className="font-medium text-gray-700">Estimated Completion:</span> <span className="text-gray-900">{formatDate(selectedRecord.estimatedCompletion)}</span></div>
                                        )}
                                        <div><span className="font-medium text-gray-700">Purpose:</span> <span className="text-gray-900">{selectedRecord.purpose}</span></div>
                                        <div><span className="font-medium text-gray-700">Remarks:</span> <span className="text-gray-900">{selectedRecord.remarks}</span></div>
                                        {selectedRecord.processingNotes && (
                                          <div className="md:col-span-2"><span className="font-medium text-gray-700">Processing Notes:</span> <span className="text-gray-900">{selectedRecord.processingNotes}</span></div>
                                        )}
                                        {selectedRecord.paymentAmount && selectedRecord.paymentAmount > 0 && (
                                          <>
                                            <div><span className="font-medium text-gray-700">Payment Amount:</span> <span className="text-gray-900 font-semibold">₱{parseFloat(selectedRecord.paymentAmount).toFixed(2)}</span></div>
                                            {selectedRecord.paidDocument?.receipt_number && (
                                              <div><span className="font-medium text-gray-700">Receipt Number:</span> <span className="text-gray-900 font-semibold">{selectedRecord.paidDocument.receipt_number}</span></div>
                                            )}
                                            <div><span className="font-medium text-gray-700">Payment Status:</span> 
                                              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedRecord.paymentStatus === 'paid' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-yellow-100 text-yellow-800'
                                              }`}>
                                                {selectedRecord.paymentStatus === 'paid' ? (
                                                  <>
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    Paid
                                                  </>
                                                ) : (
                                                  <>
                                                    <ClockIcon className="w-3 h-3" />
                                                    Unpaid
                                                  </>
                                                )}
                                              </span>
                                            </div>
                                            {selectedRecord.paymentNotes && (
                                              <div className="md:col-span-2"><span className="font-medium text-gray-700">Payment Notes:</span> <span className="text-gray-900">{selectedRecord.paymentNotes}</span></div>
                                            )}
                                            {selectedRecord.paymentApprovedAt && (
                                              <div><span className="font-medium text-gray-700">Payment Approved:</span> <span className="text-gray-900">{formatDate(selectedRecord.paymentApprovedAt)}</span></div>
                                            )}
                                            {selectedRecord.paymentConfirmedAt && (
                                              <div><span className="font-medium text-gray-700">Payment Confirmed:</span> <span className="text-gray-900">{formatDate(selectedRecord.paymentConfirmedAt)}</span></div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Certification-specific data */}
                                      {selectedRecord.certificationData && Object.keys(selectedRecord.certificationData).length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                          <h5 className="text-md font-semibold text-green-800 mb-3">Certification Details</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {selectedRecord.certificationData.child_name && (
                                              <div><span className="font-medium text-gray-700">Child's Name:</span> <span className="text-gray-900">{selectedRecord.certificationData.child_name}</span></div>
                                            )}
                                            {selectedRecord.certificationData.child_birth_date && (
                                              <div><span className="font-medium text-gray-700">Child's Birth Date:</span> <span className="text-gray-900">{formatDate(selectedRecord.certificationData.child_birth_date)}</span></div>
                                            )}
                                            {selectedRecord.certificationData.registration_office && (
                                              <div><span className="font-medium text-gray-700">Registration Office:</span> <span className="text-gray-900">{selectedRecord.certificationData.registration_office}</span></div>
                                            )}
                                            {selectedRecord.certificationData.registration_date && (
                                              <div><span className="font-medium text-gray-700">Registration Date:</span> <span className="text-gray-900">{formatDate(selectedRecord.certificationData.registration_date)}</span></div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>


                                    {/* Resident Information Card */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                        <UserIcon className="w-5 h-5" /> Resident Information
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div><span className="font-medium text-gray-700">Resident ID:</span> <span className="text-gray-900">{selectedRecord.resident?.resident_id || (selectedRecord.user?.id ? `RES-${String(selectedRecord.user.id).padStart(3, '0')}` : 'N/A')}</span></div>
                                        <div><span className="font-medium text-gray-700">Full Name:</span> <span className="text-gray-900">{selectedRecord.user?.name || (selectedRecord.resident ? `${selectedRecord.resident.first_name} ${selectedRecord.resident.middle_name ? selectedRecord.resident.middle_name + ' ' : ''}${selectedRecord.resident.last_name}${selectedRecord.resident.name_suffix ? ' ' + selectedRecord.resident.name_suffix : ''}` : 'N/A')}</span></div>
                                        <div><span className="font-medium text-gray-700">Nationality:</span> <span className="text-gray-900">{selectedRecord.resident?.nationality || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Age:</span> <span className="text-gray-900">{selectedRecord.resident?.age || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Civil Status:</span> <span className="text-gray-900">{selectedRecord.resident?.civil_status || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Gender:</span> <span className="text-gray-900">{selectedRecord.resident?.sex || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Contact Number:</span> <span className="text-gray-900">{selectedRecord.resident?.contact_number || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{selectedRecord.resident?.email || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Address:</span> <span className="text-gray-900">{selectedRecord.resident?.current_address || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Birth Date:</span> <span className="text-gray-900">{selectedRecord.resident?.birth_date ? formatDate(selectedRecord.resident.birth_date) : 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Birth Place:</span> <span className="text-gray-900">{selectedRecord.resident?.birth_place || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Religion:</span> <span className="text-gray-900">{selectedRecord.resident?.religion || 'N/A'}</span></div>
                                        <div><span className="font-medium text-gray-700">Years in Barangay:</span> <span className="text-gray-900">{selectedRecord.resident?.years_in_barangay || 'N/A'}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {!loading && filteredRecords.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} results
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Items per page:</label>
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, getTotalPages(filteredRecords)) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-green-500 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(getTotalPages(filteredRecords), currentPage + 1))}
                      disabled={currentPage === getTotalPages(filteredRecords)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 rounded-3xl shadow-2xl border border-green-200 w-full max-w-4xl max-h-[95vh] overflow-y-auto relative animate-scale-in">
              {/* Enhanced Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-3xl p-6 sticky top-0 z-10 shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <PencilIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        Edit Document Record
                      </h2>
                      <p className="text-green-100 text-sm mt-1">Document #{editData.id || 'N/A'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:text-green-200 transition-colors duration-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-300 rounded-full p-2 hover:bg-white/10"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8 bg-gradient-to-br from-white/90 to-green-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Document Type</label>
                    <select
                      value={editData.documentType || ''}
                      onChange={(e) => setEditData({...editData, documentType: e.target.value})}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      disabled
                    >
                      <option value="">Select Document Type</option>
                      <option value="Brgy Clearance">Brgy Clearance</option>
                      <option value="Cedula">Cedula</option>
                      <option value="Brgy Indigency">Brgy Indigency</option>
                      <option value="Brgy Residency">Brgy Residency</option>
                      <option value="Brgy Business Permit">Brgy Business Permit</option>
                      <option value="Brgy Certification">Brgy Certification</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Status</label>
                    <select
                      value={editData.status || ''}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Select Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Purpose</label>
                    <input
                      type="text"
                      value={editData.purpose || ''}
                      onChange={(e) => setEditData({...editData, purpose: e.target.value})}
                      className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter purpose"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      Payment Amount (₱) 
                      {editData.status?.toLowerCase() === 'approved' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData.paymentAmount || ''}
                      onChange={(e) => setEditData({...editData, paymentAmount: parseFloat(e.target.value) || 0})}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ${
                        editData.status?.toLowerCase() === 'approved' && (!editData.paymentAmount || editData.paymentAmount <= 0)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      placeholder={editData.status?.toLowerCase() === 'approved' ? "Required for approval" : "Enter payment amount"}
                      required={editData.status?.toLowerCase() === 'approved'}
                    />
                    {editData.status?.toLowerCase() === 'approved' && (!editData.paymentAmount || editData.paymentAmount <= 0) && (
                      <p className="text-red-500 text-xs mt-1">Payment amount is required when approving</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3 lg:pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl font-medium transition-all duration-300 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                {feedback && (
                  <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 mt-3 sm:mt-4 border-2 transition-all duration-300 ${
                    feedback.type === 'success'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800'
                      : feedback.type === 'loading'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800'
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {feedback.type === 'success' && <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                        {feedback.type === 'loading' && <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-spin" />}
                        {feedback.type === 'error' && <ExclamationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm sm:text-base">{feedback.message}</div>
                        {feedback.details && (
                          <div className="text-xs sm:text-sm opacity-80 mt-1">{feedback.details}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deny Request Modal */}
        {showDenyModal && denyRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-white via-red-50 to-rose-50 rounded-3xl shadow-2xl border border-red-200 w-full max-w-2xl relative animate-scale-in">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-t-3xl p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        Deny Document Request
                      </h2>
                      <p className="text-red-100 text-sm mt-1">Request #{denyRecord.id} - {denyRecord.documentType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDenyModal(false);
                      setDenyRecord(null);
                      setDenyRemarks('');
                    }}
                    disabled={loading}
                    className="text-white hover:text-red-200 transition-colors duration-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Resident Information */}
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-red-900 mb-2">Document Request Details</h3>
                      <div className="space-y-1 text-sm text-red-800">
                        <p><span className="font-semibold">Resident:</span> {denyRecord.residentName}</p>
                        <p><span className="font-semibold">Document Type:</span> {denyRecord.documentType}</p>
                        <p><span className="font-semibold">Purpose:</span> {denyRecord.purpose || 'N/A'}</p>
                        <p><span className="font-semibold">Date Requested:</span> {denyRecord.requestDate ? new Date(denyRecord.requestDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Reason for Denial <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Please provide a clear explanation. This will be sent to the resident via email and notification.
                  </p>
                  <textarea
                    value={denyRemarks}
                    onChange={(e) => setDenyRemarks(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 min-h-[120px]"
                    placeholder="Example: Incomplete documents submitted. Please provide a valid ID and proof of residency."
                    disabled={loading}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {denyRemarks.length} characters
                    </p>
                    {denyRemarks.length > 0 && denyRemarks.length < 20 && (
                      <p className="text-xs text-orange-600">Please provide more details (at least 20 characters)</p>
                    )}
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> The resident will receive an email and in-app notification with your reason for denial. 
                        Please ensure your explanation is professional and clear.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDenyModal(false);
                      setDenyRecord(null);
                      setDenyRemarks('');
                    }}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDenyConfirm}
                    disabled={loading || !denyRemarks.trim() || denyRemarks.length < 20}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Denying Request...
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Deny Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approve Request Modal */}
        {showApproveModal && approveRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 rounded-3xl shadow-2xl border border-green-200 w-full max-w-2xl relative animate-scale-in">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-3xl p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        Approve Document Request
                      </h2>
                      <p className="text-green-100 text-sm mt-1">Request #{approveRecord.id} - {approveRecord.documentType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setApproveRecord(null);
                      setApprovePaymentAmount('');
                    }}
                    disabled={loading}
                    className="text-white hover:text-green-200 transition-colors duration-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-300 rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Resident Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 mb-2">Document Request Details</h3>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><span className="font-semibold">Resident:</span> {approveRecord.residentName}</p>
                        <p><span className="font-semibold">Document Type:</span> {approveRecord.documentType}</p>
                        <p><span className="font-semibold">Purpose:</span> {approveRecord.purpose || 'N/A'}</p>
                        <p><span className="font-semibold">Date Requested:</span> {approveRecord.requestDate ? new Date(approveRecord.requestDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Amount Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Payment Amount (₱) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Enter the amount the resident needs to pay for this document. Enter 0 for free documents.
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={approvePaymentAmount}
                      onChange={(e) => setApprovePaymentAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      placeholder="0.00"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {approvePaymentAmount && parseFloat(approvePaymentAmount) > 0 && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Payment amount: ₱{parseFloat(approvePaymentAmount).toFixed(2)}
                    </p>
                  )}
                  {approvePaymentAmount && parseFloat(approvePaymentAmount) === 0 && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <InformationCircleIcon className="w-4 h-4" />
                      This will be a free document (no payment required)
                    </p>
                  )}
                </div>

                {/* Common Document Fees (Quick Select) */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Common Document Fees (Quick Select):</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setApprovePaymentAmount('0')}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-all duration-200"
                      disabled={loading}
                    >
                      Free (₱0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovePaymentAmount('50')}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-all duration-200"
                      disabled={loading}
                    >
                      ₱50
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovePaymentAmount('100')}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-all duration-200"
                      disabled={loading}
                    >
                      ₱100
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovePaymentAmount('150')}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-all duration-200"
                      disabled={loading}
                    >
                      ₱150
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovePaymentAmount('200')}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-all duration-200"
                      disabled={loading}
                    >
                      ₱200
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovePaymentAmount('250')}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-all duration-200"
                      disabled={loading}
                    >
                      ₱250
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-emerald-800">
                        <strong>Ready to approve:</strong> The resident will receive an email and in-app notification with payment instructions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setApproveRecord(null);
                      setApprovePaymentAmount('');
                    }}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveConfirm}
                    disabled={loading || approvePaymentAmount === ''}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Approving Request...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Approve Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentConfirmModal && paymentConfirmRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-blue-200 w-full max-w-2xl relative animate-scale-in">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <CurrencyDollarIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        Confirm Payment
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">Request #{paymentConfirmRecord.id} - {paymentConfirmRecord.documentType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentConfirmModal(false);
                      setPaymentConfirmRecord(null);
                    }}
                    disabled={loading}
                    className="text-white hover:text-blue-200 transition-colors duration-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Payment Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 mb-2">Payment Details</h3>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><span className="font-semibold">Resident:</span> {paymentConfirmRecord.residentName}</p>
                        <p><span className="font-semibold">Document Type:</span> {paymentConfirmRecord.documentType}</p>
                        <p><span className="font-semibold">Purpose:</span> {paymentConfirmRecord.purpose || 'N/A'}</p>
                        <p><span className="font-semibold">Date Requested:</span> {paymentConfirmRecord.requestDate ? new Date(paymentConfirmRecord.requestDate).toLocaleDateString() : 'N/A'}</p>
                        <div className="mt-3 pt-3 border-t border-blue-300">
                          <p className="text-lg"><span className="font-semibold">Amount to Pay:</span> <span className="text-2xl font-bold text-blue-900">₱{parseFloat(paymentConfirmRecord.paymentAmount).toFixed(2)}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> By confirming this payment, you acknowledge that the resident has paid the required amount. A receipt will be automatically generated and downloaded.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-emerald-800">
                        <strong>After confirmation:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-emerald-700 mt-2 space-y-1">
                        <li>Payment status will be marked as "Paid"</li>
                        <li>Receipt will be generated automatically</li>
                        <li>Receipt PDF will be downloaded to your computer</li>
                        <li>Resident can download their receipt from their account</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (!loading && confirmingPayment !== paymentConfirmRecord?.id) {
                        setShowPaymentConfirmModal(false);
                        setPaymentConfirmRecord(null);
                      }
                    }}
                    disabled={loading || confirmingPayment === paymentConfirmRecord?.id}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentConfirm}
                    disabled={loading || confirmingPayment === paymentConfirmRecord?.id}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {(loading || confirmingPayment === paymentConfirmRecord?.id) ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CurrencyDollarIcon className="w-5 h-5" />
                        Confirm Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Free Document Confirmation Modal */}
        {showFreeConfirmModal && freeConfirmRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-blue-200 w-full max-w-2xl relative animate-scale-in">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <GiftIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">
                        Mark as Free Document
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">Request #{freeConfirmRecord.id} - {freeConfirmRecord.documentType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowFreeConfirmModal(false);
                      setFreeConfirmRecord(null);
                    }}
                    disabled={loading || markingAsFree === freeConfirmRecord?.id}
                    className="text-white hover:text-blue-200 transition-colors duration-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Document Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 mb-2">Document Request Details</h3>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><span className="font-semibold">Resident:</span> {freeConfirmRecord.user?.name || (freeConfirmRecord.resident ? `${freeConfirmRecord.resident.first_name} ${freeConfirmRecord.resident.last_name}` : 'N/A')}</p>
                        <p><span className="font-semibold">Document Type:</span> {freeConfirmRecord.documentType}</p>
                        <p><span className="font-semibold">Purpose:</span> {freeConfirmRecord.purpose || 'N/A'}</p>
                        <p><span className="font-semibold">Date Requested:</span> {freeConfirmRecord.requestDate ? new Date(freeConfirmRecord.requestDate).toLocaleDateString() : 'N/A'}</p>
                        <div className="mt-3 pt-3 border-t border-blue-300">
                          <p className="text-lg"><span className="font-semibold">Payment Amount:</span> <span className="text-2xl font-bold text-blue-900">₱0.00 (Free)</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Information Message */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-emerald-800">
                        <strong>After confirmation:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-emerald-700 mt-2 space-y-1">
                        <li>Document will be marked as "Paid" (free)</li>
                        <li>Document will move to Document Records tab</li>
                        <li>Resident will be notified that their document is ready</li>
                        <li>No receipt will be generated for free documents</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (!loading && markingAsFree !== freeConfirmRecord?.id) {
                        setShowFreeConfirmModal(false);
                        setFreeConfirmRecord(null);
                      }
                    }}
                    disabled={loading || markingAsFree === freeConfirmRecord?.id}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFreeConfirm}
                    disabled={loading || markingAsFree === freeConfirmRecord?.id}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {(loading || markingAsFree === freeConfirmRecord?.id) ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <GiftIcon className="w-5 h-5" />
                        Mark as Free
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help System Modals */}
        <DocumentsHelpGuide 
          isOpen={showHelpGuide} 
          onClose={() => setShowHelpGuide(false)} 
        />
        
        <DocumentsQuickStartGuide 
          isOpen={showQuickStart} 
          onClose={() => setShowQuickStart(false)}
          onComplete={() => {
            setToastMessage({
              type: 'success',
              message: 'Quick Start Guide completed! You\'re ready to use the documents system.',
              duration: 3000
            });
          }}
        />
        
        <DocumentsFAQ 
          isOpen={showFAQ} 
          onClose={() => setShowFAQ(false)} 
        />
        
        {showFeatureExplanation && currentFeatureExplanation && (
          <DocumentsFeatureExplanation
            title={currentFeatureExplanation.title}
            description={currentFeatureExplanation.description}
            steps={currentFeatureExplanation.steps}
            tips={currentFeatureExplanation.tips}
            onClose={() => {
              setShowFeatureExplanation(false);
              setCurrentFeatureExplanation(null);
            }}
          />
        )}
      </main>
    </>
  );
};

export default DocumentsRecords;