import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { routeConfig } from '../config/routes';

// Create the auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth called outside of AuthProvider. Current context:', context);
    console.error('Stack trace:', new Error().stack);
    throw new Error('useAuth must be used within an AuthProvider. Make sure your component is wrapped with <AuthProvider>.');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize with cached user data if available
    const cachedUser = localStorage.getItem('user');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = React.useRef(false); // OPTIMIZATION: Prevent multiple simultaneous fetches

  // Fetch user profile (only if token exists and no cached data)
  const fetchUser = async (forceRefresh = false) => {
    // OPTIMIZATION: Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('AuthContext: fetchUser already in progress, skipping...');
      return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      setUser(null);
      localStorage.removeItem('user');
      return;
    }

    // Use cached data if available and not forcing refresh
    if (!forceRefresh && user) {
      setIsLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true; // Set flag to prevent concurrent calls
      console.log('AuthContext: Starting fetchUser...');
      // Get basic user info first
      const userRes = await axios.get('/user');
      const baseUser = userRes.data?.user || userRes.data; // backend may return { user: ... }

      console.log('User data from backend:', baseUser);
      console.log('User role from backend:', baseUser.role);
      console.log('User role type:', typeof baseUser.role);
      console.log('User role === "staff":', baseUser.role === 'staff');
      
      // Handle permissions based on role
      console.log('Processing user with role:', baseUser.role);
      
      if (baseUser.role === 'admin') {
        console.log('Setting admin permissions');
        console.log('routeConfig.common:', routeConfig.common);
        // For admin users, get all modules from routeConfig
        const adminPermissions = routeConfig.common.reduce((acc, route) => {
          console.log('Processing route:', route.path, 'module:', route.module);
          acc[route.module] = true;
          return acc;
        }, {});
        
        baseUser.permissions = adminPermissions;
        console.log('Admin permissions set:', baseUser.permissions);
      } else if (baseUser.role === 'staff') {
        console.log('Setting staff permissions for user:', baseUser.name);
        // For staff users, fetch permissions from backend
        try {
          const staffRes = await axios.get('/user/permissions');
          console.log('Staff permissions response:', staffRes.data);

          // Get the module_permissions or fall back to regular permissions
          const staffPermissions = staffRes.data.permissions || {};
          console.log('Raw staff permissions:', staffPermissions);
          
          // Create a mapping from backend permission keys to frontend sidebar module keys
          const permissionMapping = {
            'dashboard': 'dashboard',
            'residentsRecords': 'residents',
            'documentsRecords': 'documents',
            'householdRecords': 'household',
            'blotterRecords': 'blotter',
            'financialTracking': 'treasurer',
            'barangayOfficials': 'officials',
            'staffManagement': 'staff',
            'communicationAnnouncement': 'communication',
            'projectManagement': 'projects',
            'socialServices': 'social_services',
            'disasterEmergency': 'command_center',
            'inventoryAssets': 'inventory',
            'activityLogs': 'logs'
          };

          // Set permissions based on the backend response using the mapping
          // Backend returns flat structure (e.g., residentsRecords: true)
          // Frontend needs nested structure (e.g., residents: { access: true, sub_permissions: {...} })
          baseUser.permissions = {};
          baseUser.module_permissions = {}; // Store raw backend permissions
          
          Object.entries(permissionMapping).forEach(([backendKey, frontendKey]) => {
            const hasPermission = Boolean(staffPermissions[backendKey]);
            console.log(`Mapping ${backendKey} -> ${frontendKey}: ${hasPermission}`);
            
            // Store in both formats for compatibility
            baseUser.permissions[frontendKey] = hasPermission;
            baseUser.module_permissions[backendKey] = hasPermission;
            
            // For residents module, check for nested sub-permissions
            if (backendKey === 'residentsRecords' && hasPermission) {
              // Check for nested permissions like residentsRecords_main_records_edit
              const mainRecordsAccess = Boolean(staffPermissions['residentsRecords_main_records']);
              const mainRecordsEdit = Boolean(staffPermissions['residentsRecords_main_records_edit']);
              const mainRecordsDisable = Boolean(staffPermissions['residentsRecords_main_records_disable']);
              const mainRecordsView = Boolean(staffPermissions['residentsRecords_main_records_view']);
              const verification = Boolean(staffPermissions['residentsRecords_verification']);
              const disabled = Boolean(staffPermissions['residentsRecords_disabled_residents']);
              
              // Convert to nested structure
              baseUser.permissions[frontendKey] = {
                access: hasPermission,
                sub_permissions: {
                  main_records: {
                    access: mainRecordsAccess,
                    sub_permissions: {
                      edit: mainRecordsEdit,
                      disable: mainRecordsDisable,
                      view: mainRecordsView
                    }
                  },
                  verification: verification,
                  disabled_residents: disabled
                }
              };
            }
          });
          
          // Ensure all expected permissions are set (even if false)
          const allExpectedPermissions = [
            'dashboard', 'residents', 'documents', 'household', 'blotter', 
            'treasurer', 'officials', 'staff', 'communication', 'social_services', 
            'command_center', 'projects', 'inventory', 'logs'
          ];
          
          allExpectedPermissions.forEach(permission => {
            if (baseUser.permissions[permission] === undefined) {
              baseUser.permissions[permission] = false;
            }
          });
          
          console.log('Final staff permissions for sidebar:', baseUser.permissions);
          console.log('Available backend permissions:', Object.keys(staffPermissions).filter(k => staffPermissions[k]));
          
          console.log('Staff permissions set:', baseUser.permissions);
        } catch (err) {
          console.error('Error fetching staff permissions:', err);
          // Fallback: Only grant dashboard access if permissions can't be fetched
          baseUser.permissions = {
            dashboard: true
          };
          baseUser.module_permissions = {
            dashboard: true
          };
          console.log('Using minimal fallback permissions (dashboard only):', baseUser.permissions);
        }
      } else {
        console.log('User role not admin or staff, setting default permissions');
        baseUser.permissions = {
          dashboard: true // Default permission
        };
      }
      
      // Force staff permission loading if user has staff role but permissions weren't loaded
      // Only set minimal permissions - don't grant unauthorized access
      if (baseUser.role === 'staff' && (!baseUser.permissions || Object.keys(baseUser.permissions).length <= 1)) {
        console.log('Forcing staff permission refresh...');
        // Only grant dashboard - let the backend permissions be the source of truth
        baseUser.permissions = {
          dashboard: true
        };
        baseUser.module_permissions = {
          dashboard: true
        };
        console.log('Forced minimal staff permissions (dashboard only):', baseUser.permissions);
      }

      // Set user early so UI can render role-specific UI
      setUser(baseUser);
      localStorage.setItem('user', JSON.stringify(baseUser || {}));
      
      console.log('User set in AuthContext:', baseUser);

      // Only fetch resident profile for resident users
      if (baseUser?.role === 'residents') {
        // Add cache-busting parameter to ensure fresh data
        const timestamp = new Date().getTime();
        const profileRes = await axios.get(`/profile?t=${timestamp}`);
        const resident = profileRes.data;
        const userData = { ...baseUser, profile: resident.profile ?? resident };
        
        console.log('AuthContext: Profile data received:', {
          profile_completed: userData.profile?.profile_completed,
          verification_status: userData.profile?.verification_status,
          hasResidencyImage: !!userData.profile?.residency_verification_image,
          hasPhoto: !!(userData.profile?.current_photo || userData.profile?.avatar),
          timestamp: timestamp
        });
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData || {}));
      }

      setIsLoading(false);
    } catch (err) {
      console.error('AuthContext fetchUser error:', err);

      if (err.response?.status === 404) {
        // Profile not found - normal for new users
        try {
          const userRes = await axios.get('/user');
          const baseUser = userRes.data?.user || userRes.data;
          setUser(baseUser);
          localStorage.setItem('user', JSON.stringify(baseUser || {}));
        } catch (userErr) {
          setUser(null);
          localStorage.removeItem('user');
        }
      } else if (err.response?.status === 401) {
        // Unauthorized - token invalid/expired
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    } finally {
      isFetchingRef.current = false; // OPTIMIZATION: Clear flag when done
    }
  };

  // Login
  const login = async (email, password) => {
    console.log('Attempting login for:', email);
    
    try {
      // Get CSRF cookie first for Sanctum
      await axios.get('/sanctum/csrf-cookie');
      
      // Login with credentials
      const res = await axios.post('/login', { email, password });
      console.log('Login response:', res.data);
      
      const token = res.data.token || res.data.access_token;
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('AuthContext login: authToken set in localStorage');
        
        // Clear any existing role/user data
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        
        // OPTIMIZATION: Return user data immediately from login response
        // instead of making additional fetchUser call
        const userData = res.data.user;
        
        // Set basic permissions based on role immediately
        if (userData.role === 'admin') {
          userData.permissions = {
            dashboard: true,
            residents: true,
            documents: true,
            household: true,
            blotter: true,
            treasurer: true,
            officials: true,
            staff: true,
            communication: true,
            projects: true,
            social_services: true,
            command_center: true,
            inventory: true,
            logs: true
          };
        } else if (userData.role === 'staff') {
          // Set minimal default permissions - detailed ones will be fetched from backend
          userData.permissions = {
            dashboard: true
          };
          userData.module_permissions = {
            dashboard: true
          };
        } else {
          userData.permissions = { dashboard: true };
        }
        
        // Store user data immediately
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Only fetch detailed data for residents in background (non-blocking)
        if (userData.role === 'residents') {
          fetchUser(true).catch(err => {
            console.warn('Background user fetch failed:', err);
            // Don't fail login if background fetch fails
          });
        }
        
        return userData;
      } else {
        console.warn('AuthContext login: No token received from backend');
        throw new Error('No authentication token received');
      }
    } catch (error) {
      // If it's a verification error, re-throw it so the Login component can handle it
      if (error?.response?.status === 403 && error?.response?.data?.requires_verification) {
        throw error;
      }
      
      // For other errors, throw them as well
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post('/logout', {});
    } catch (e) {}
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('congratsShownForSession'); // Clear congratulations state
    setUser(null);
  };

  useEffect(() => {
    // Reduced logging to prevent console spam
    // console.log('AuthContext: useEffect triggered, fetching user...');
    fetchUser();
  }, []);

  // Force refresh function for immediate updates
  const forceRefresh = async () => {
    await fetchUser(true); // Force refresh to get fresh data
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, fetchUser, forceRefresh }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export as a default object containing both the hook and provider
const AuthModule = {
  useAuth,
  AuthProvider
};

export default AuthModule;
export { useAuth, AuthProvider };