import { useAuth } from '../contexts/AuthContext';
import { 
  hasModuleAccess, 
  hasSubModuleAccess, 
  getFilteredNavigationItems,
  canPerformAction,
  getPermissionSummary
} from '../utils/permissionUtils';

/**
 * Custom hook for permission checking
 * @returns {Object} Permission checking functions and utilities
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  // Get staff permissions from user object
  // Prioritize module_permissions (raw backend format) over permissions (mapped format)
  // This ensures we use the actual backend permissions, not fallback values
  let staffPermissions = user?.module_permissions || user?.permissions || {};
  
  // Debug: Log what permissions we have
  if (user?.role === 'staff') {
    console.log('usePermissions - Staff permissions:', {
      hasModulePermissions: !!user?.module_permissions,
      modulePermissionsKeys: Object.keys(user?.module_permissions || {}),
      hasPermissions: !!user?.permissions,
      permissionsKeys: Object.keys(user?.permissions || {}),
      staffPermissionsKeys: Object.keys(staffPermissions),
      residentsRecords_main_records_edit: staffPermissions['residentsRecords_main_records_edit'],
      residentsRecords_main_records_disable: staffPermissions['residentsRecords_main_records_disable'],
      residentsRecords_main_records_view: staffPermissions['residentsRecords_main_records_view']
    });
  }
  
  // Check if permissions are actually loaded (not just fallback)
  // If module_permissions only has dashboard and permissions only has dashboard, it's likely a fallback
  const isFallback = user?.role === 'staff' && 
    (!staffPermissions || 
     (Object.keys(staffPermissions).length === 1 && staffPermissions.dashboard === true) ||
     (Object.keys(user?.module_permissions || {}).length === 1 && user?.module_permissions?.dashboard === true));
  
  // Only use fallback if permissions are truly not loaded (not just minimal permissions)
  // Don't grant dashboard access if it's just a fallback - wait for real permissions
  if (isFallback && (!user?.module_permissions || Object.keys(user?.module_permissions).length <= 1)) {
    console.log('usePermissions - Permissions not loaded yet, using empty permissions (waiting for backend)');
    staffPermissions = {}; // Don't grant any permissions until loaded
  }
  
  // Reduced logging to prevent console spam
  // console.log('usePermissions - staffPermissions:', staffPermissions);
  // console.log('usePermissions - user:', user);
  
  return {
    /**
     * Check if current user has access to a specific module
     * @param {string} moduleKey - Module key to check
     * @returns {boolean} - Whether the user has access to the module
     */
    hasModuleAccess: (moduleKey) => {
      const result = hasModuleAccess(staffPermissions, moduleKey);
      // Reduced logging to prevent console spam
      // console.log(`hasModuleAccess(${moduleKey}):`, result, 'from permissions:', staffPermissions[moduleKey]);
      return result;
    },
    
    /**
     * Check if current user has access to a specific sub-module
     * @param {string} moduleKey - Module key
     * @param {string} subModuleKey - Sub-module key
     * @returns {boolean} - Whether the user has access to the sub-module
     */
    hasSubModuleAccess: (moduleKey, subModuleKey) => hasSubModuleAccess(staffPermissions, moduleKey, subModuleKey),
    
    /**
     * Check if current user can perform a specific action
     * @param {string} action - Action to check
     * @param {string} moduleKey - Module key
     * @param {string} subModuleKey - Optional sub-module key
     * @returns {boolean} - Whether the user can perform the action
     */
    canPerformAction: (action, moduleKey, subModuleKey = null) => canPerformAction(staffPermissions, action, moduleKey, subModuleKey),
    
    /**
     * Get filtered navigation items based on user permissions
     * @param {Array} navigationItems - Array of navigation items
     * @returns {Array} - Filtered navigation items
     */
    getFilteredNavigationItems: (navigationItems) => getFilteredNavigationItems(navigationItems, staffPermissions),
    
    /**
     * Get permission summary for current user
     * @returns {Object} - Permission summary
     */
    getPermissionSummary: () => getPermissionSummary(staffPermissions),
    
    /**
     * Get raw permissions object
     * @returns {Object} - Raw permissions object
     */
    getPermissions: () => staffPermissions,
    
    /**
     * Check if user is admin (has all permissions or special admin flag)
     * @returns {boolean} - Whether the user is an admin
     */
    isAdmin: () => user?.role === 'admin' || user?.is_admin === true,
    
    /**
     * Check if user is staff
     * @returns {boolean} - Whether the user is staff
     */
    isStaff: () => user?.role === 'staff' || user?.role === 'employee',
    
    /**
     * Check if user is resident
     * @returns {boolean} - Whether the user is a resident
     */
    isResident: () => user?.role === 'resident'
  };
};

export default usePermissions;
