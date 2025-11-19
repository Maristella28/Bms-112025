import { useAuth } from '../contexts/AuthContext';
import { useEffect, useMemo } from 'react';
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
  const { user, forceRefresh } = useAuth();
  
  // CRITICAL: Always get the LATEST permissions from user object using useMemo
  // This ensures we always use the most up-to-date permissions from the database
  // Prioritize module_permissions (raw backend format) - this is the source of truth from database
  const staffPermissions = useMemo(() => {
    const rawPermissions = user?.module_permissions || user?.permissions || {};
    
    // Normalize all permission values to booleans (handle true, 1, '1', false, 0, '0', etc.)
    // This ensures consistent checking regardless of how values are stored in the database
    const normalizedPermissions = {};
    Object.entries(rawPermissions).forEach(([key, value]) => {
      if (value === true || value === 1 || value === '1' || value === 'true') {
        normalizedPermissions[key] = true;
      } else if (value === false || value === 0 || value === '0' || value === 'false') {
        normalizedPermissions[key] = false;
      } else {
        normalizedPermissions[key] = Boolean(value);
      }
    });
    
    return normalizedPermissions;
  }, [user?.module_permissions, user?.permissions]); // Re-compute when permissions change
  
  // Check if permissions are actually loaded (not just fallback)
  // If module_permissions only has dashboard and permissions only has dashboard, it's likely a fallback
  const isFallback = user?.role === 'staff' && 
    (!staffPermissions || 
     (Object.keys(staffPermissions).length === 1 && staffPermissions.dashboard === true) ||
     (Object.keys(user?.module_permissions || {}).length === 1 && user?.module_permissions?.dashboard === true));
  
  // Only use fallback if permissions are truly not loaded (not just minimal permissions)
  // Don't grant dashboard access if it's just a fallback - wait for real permissions
  // Note: staffPermissions is from useMemo, so we need to create a new object if fallback
  const finalStaffPermissions = (isFallback && (!user?.module_permissions || Object.keys(user?.module_permissions).length <= 1))
    ? {} // Don't grant any permissions until loaded
    : staffPermissions;
  
  // Debug: Log what permissions we have (only for staff users to reduce console spam)
  if (user?.role === 'staff') {
    const modulePerms = user?.module_permissions || {};
    const perms = user?.permissions || {};
    const allResidentsKeys = Object.keys(finalStaffPermissions).filter(k => k.includes('residents'));
    
    console.log('🔍 usePermissions - Staff permissions check:', {
      hasModulePermissions: !!user?.module_permissions,
      modulePermissionsCount: Object.keys(modulePerms).length,
      modulePermissionsKeys: Object.keys(modulePerms),
      hasPermissions: !!user?.permissions,
      permissionsCount: Object.keys(perms).length,
      permissionsKeys: Object.keys(perms),
      staffPermissionsCount: Object.keys(finalStaffPermissions).length,
      staffPermissionsKeys: Object.keys(finalStaffPermissions),
      allResidentsKeys: allResidentsKeys,
      // Check specific residents permissions (normalized)
      residentsRecords_main_records_edit: finalStaffPermissions['residentsRecords_main_records_edit'],
      residentsRecords_main_records_disable: finalStaffPermissions['residentsRecords_main_records_disable'],
      residentsRecords_main_records_view: finalStaffPermissions['residentsRecords_main_records_view'],
      // Check raw values from module_permissions (database source)
      rawEdit: modulePerms['residentsRecords_main_records_edit'],
      rawDisable: modulePerms['residentsRecords_main_records_disable'],
      rawView: modulePerms['residentsRecords_main_records_view'],
      // Check if these are the actual values
      editType: typeof finalStaffPermissions['residentsRecords_main_records_edit'],
      disableType: typeof finalStaffPermissions['residentsRecords_main_records_disable'],
      viewType: typeof finalStaffPermissions['residentsRecords_main_records_view'],
      // Show if permissions are from fallback
      isFallback: isFallback
    });
  }
  
  if (isFallback && (!user?.module_permissions || Object.keys(user?.module_permissions).length <= 1)) {
    console.warn('⚠️ usePermissions - Permissions not loaded yet, using empty permissions (waiting for backend)', {
      modulePermissions: user?.module_permissions,
      permissions: user?.permissions
    });
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
      const result = hasModuleAccess(finalStaffPermissions, moduleKey);
      // Reduced logging to prevent console spam
      // console.log(`hasModuleAccess(${moduleKey}):`, result, 'from permissions:', finalStaffPermissions[moduleKey]);
      return result;
    },
    
    /**
     * Check if current user has access to a specific sub-module
     * @param {string} moduleKey - Module key
     * @param {string} subModuleKey - Sub-module key
     * @returns {boolean} - Whether the user has access to the sub-module
     */
    hasSubModuleAccess: (moduleKey, subModuleKey) => hasSubModuleAccess(finalStaffPermissions, moduleKey, subModuleKey),
    
    /**
     * Check if current user can perform a specific action
     * @param {string} action - Action to check
     * @param {string} moduleKey - Module key
     * @param {string} subModuleKey - Optional sub-module key
     * @returns {boolean} - Whether the user can perform the action
     * 
     * CRITICAL: This function always reads from the latest user.module_permissions
     * to ensure we're checking against the most up-to-date database permissions
     */
    canPerformAction: (action, moduleKey, subModuleKey = null) => {
      // Always get the latest permissions from user object (database source)
      const latestPermissions = user?.module_permissions || user?.permissions || {};
      
      // Normalize permissions to ensure consistent checking
      const normalizedLatestPermissions = {};
      Object.entries(latestPermissions).forEach(([key, value]) => {
        if (value === true || value === 1 || value === '1' || value === 'true') {
          normalizedLatestPermissions[key] = true;
        } else if (value === false || value === 0 || value === '0' || value === 'false') {
          normalizedLatestPermissions[key] = false;
        } else {
          normalizedLatestPermissions[key] = Boolean(value);
        }
      });
      
      // Use the latest permissions for the check
      return canPerformAction(normalizedLatestPermissions, action, moduleKey, subModuleKey);
    },
    
    /**
     * Get filtered navigation items based on user permissions
     * @param {Array} navigationItems - Array of navigation items
     * @returns {Array} - Filtered navigation items
     */
    getFilteredNavigationItems: (navigationItems) => getFilteredNavigationItems(navigationItems, finalStaffPermissions),
    
    /**
     * Get permission summary for current user
     * @returns {Object} - Permission summary
     */
    getPermissionSummary: () => getPermissionSummary(finalStaffPermissions),
    
    /**
     * Get raw permissions object (normalized booleans from module_permissions)
     * @returns {Object} - Raw permissions object directly from database
     */
    getPermissions: () => finalStaffPermissions,
    
    /**
     * Force refresh permissions from backend
     * @returns {Promise<void>} - Promise that resolves when permissions are refreshed
     */
    refreshPermissions: async () => {
      if (forceRefresh) {
        await forceRefresh();
      }
    },
    
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
