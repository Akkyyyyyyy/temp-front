// src/context/RolesContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Role, RoleWithCounts, CreateRoleRequest, UpdateRoleRequest } from "../api/role";
import { roleApiService } from "../api/role";
import { useAuth } from "./AuthContext";

interface RolesContextType {
  roles: RoleWithCounts[];
  loading: boolean;
  error: string | null;
  currentCompanyId: string | null;
  loadRoles: (companyId?: string) => Promise<void>;
  addRole: (roleData: CreateRoleRequest) => Promise<RoleWithCounts>;
  updateRole: (id: string, roleData: UpdateRoleRequest) => Promise<RoleWithCounts>;
  deleteRole: (id: string, companyId?: string) => Promise<void>;
  refreshRoles: (companyId?: string) => Promise<void>;
  clearError: () => void;
  setCurrentCompany: (companyId: string | null) => void;
  clearRoles: () => void;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<RoleWithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Get company ID from current user
  const getCurrentCompanyId = (): string => {
    if (user?.data.company) {
      return user?.data.company.id;
    }
    
    // Fallback to localStorage if user context not available
    const userData = localStorage.getItem('user-data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.companyId;
      } catch {
        throw new Error('User data not found or invalid');
      }
    }
    throw new Error('User not authenticated');
  };

  const loadRoles = useCallback(async (companyId?: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const targetCompanyId = companyId || currentCompanyId || getCurrentCompanyId();
    
    if (!targetCompanyId) {
      throw new Error('Company ID is required to load roles');
    }

    const rolesData = await roleApiService.getCompanyRoles(targetCompanyId);
    setRoles(rolesData);
    
    // Update current company if explicitly provided
    if (companyId && companyId !== currentCompanyId) {
      setCurrentCompanyId(companyId);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load roles';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, [currentCompanyId]);

  const addRole = async (roleData: CreateRoleRequest): Promise<RoleWithCounts> => {
    try {
      setError(null);
      
      // Ensure companyId is set
      const roleDataWithCompany = {
        ...roleData,
        companyId: roleData.companyId || currentCompanyId || getCurrentCompanyId()
      };

      if (!roleDataWithCompany.companyId) {
        throw new Error('Company ID is required to create a role');
      }

      const newRole = await roleApiService.createRole(roleDataWithCompany);
      
      // Fetch the role with counts
      const rolesData = await roleApiService.getCompanyRoles(roleDataWithCompany.companyId);
      const roleWithCounts = rolesData.find(role => role.id === newRole.id);
      
      if (roleWithCounts) {
        setRoles(prev => [...prev, roleWithCounts]);
        return roleWithCounts;
      }
      
      // Fallback if counts not available
      const fallbackRole: RoleWithCounts = { 
        ...newRole, 
        memberCount: 0, 
        assignmentCount: 0 
      };
      setRoles(prev => [...prev, fallbackRole]);
      return fallbackRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      throw err;
    }
  };

  const updateRole = async (id: string, roleData: UpdateRoleRequest): Promise<RoleWithCounts> => {
    try {
      setError(null);
      
      // Ensure companyId is set
      const roleDataWithCompany = {
        ...roleData,
        companyId: roleData.companyId || currentCompanyId || getCurrentCompanyId()
      };

      if (!roleDataWithCompany.companyId) {
        throw new Error('Company ID is required to update a role');
      }

      const updatedRole = await roleApiService.updateRole(id, roleDataWithCompany);
      
      // Fetch the role with counts
      const rolesData = await roleApiService.getCompanyRoles(roleDataWithCompany.companyId);
      const roleWithCounts = rolesData.find(role => role.id === updatedRole.id);
      
      if (roleWithCounts) {
        setRoles(prev => prev.map(role => 
          role.id === roleWithCounts.id ? roleWithCounts : role
        ));
        return roleWithCounts;
      }
      
      // Fallback if counts not available
      const fallbackRole: RoleWithCounts = { 
        ...updatedRole, 
        memberCount: 0, 
        assignmentCount: 0 
      };
      setRoles(prev => prev.map(role => 
        role.id === fallbackRole.id ? fallbackRole : role
      ));
      return fallbackRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteRole = async (id: string, companyId?: string): Promise<void> => {
    try {
      setError(null);
      
      const targetCompanyId = companyId || currentCompanyId || getCurrentCompanyId();
      
      if (!targetCompanyId) {
        throw new Error('Company ID is required to delete a role');
      }

      await roleApiService.deleteRole(id, targetCompanyId);
      setRoles(prev => prev.filter(role => role.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      throw err;
    }
  };

  const refreshRoles = async (companyId?: string) => {
    await loadRoles(companyId);
  };

  const clearError = () => {
    setError(null);
  };

  const setCurrentCompany = (companyId: string | null) => {
    setCurrentCompanyId(companyId);
  };

  const clearRoles = () => {
    setRoles([]);
    setCurrentCompanyId(null);
  };

  // Load roles for current user's company on mount
  useEffect(() => {
    const loadInitialRoles = async () => {
      try {
        const companyId = getCurrentCompanyId();
        if (companyId) {
          await loadRoles(companyId);
        }
      } catch (err) {
        // Silent fail - user might not be authenticated yet
        console.log('No company ID available for initial role load');
      }
    };

    loadInitialRoles();
  }, []);

  // Auto-update current company when user changes
  useEffect(() => {
    if (user?.data?.id && user?.data?.company?.id !== currentCompanyId) {
      setCurrentCompanyId(currentCompanyId);
      loadRoles(currentCompanyId);
    }
  }, [user?.data]);

  const value: RolesContextType = {
    roles,
    loading,
    error,
    currentCompanyId,
    loadRoles,
    addRole,
    updateRole,
    deleteRole,
    refreshRoles,
    clearError,
    setCurrentCompany,
    clearRoles
  };

  return (
    <RolesContext.Provider value={value}>
      {children}
    </RolesContext.Provider>
  );
};

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
};