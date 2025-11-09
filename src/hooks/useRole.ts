import { useCallback } from "react";
import { createRole, updateRole as updateRoleApi, deleteRole as deleteRoleApi, RoleWithCounts, CreateRoleRequest, UpdateRoleRequest } from "@/api/role";
import { useAuth } from "@/context/AuthContext";

export function useRole() {
    const { user, roles, loadingRoles, refreshRoles } = useAuth();

    const getCompanyId = useCallback(() => {
        if (!user) return null;
        return user.data?.company?.id;
    }, [user]);

    const addRole = useCallback(async (roleData: Omit<CreateRoleRequest, 'companyId'>) => {
        try {
            const targetCompanyId = getCompanyId();
            
            if (!targetCompanyId) {
                return null;
            }

            const response = await createRole({
                ...roleData,
                companyId: targetCompanyId
            });

            if (response.success && response.data) {
                // Refresh roles from context
                await refreshRoles();
                return response.data;
            }
            
            return null;
        } catch (err) {
            console.error("Error adding role:", err);
            return null;
        }
    }, [getCompanyId, refreshRoles]);

    const updateRole = useCallback(async (roleId: string, roleData: Omit<UpdateRoleRequest, 'companyId'>) => {
        try {
            const targetCompanyId = getCompanyId();
            
            if (!targetCompanyId) {
                return null;
            }

            const response = await updateRoleApi(roleId, {
                ...roleData,
                companyId: targetCompanyId
            });

            if (response.success && response.data) {
                // Refresh roles from context
                await refreshRoles();
                return response.data;
            }
            
            return null;
        } catch (err) {
            console.error("Error updating role:", err);
            return null;
        }
    }, [getCompanyId, refreshRoles]);

    const deleteRole = useCallback(async (roleId: string) => {
        try {
            const targetCompanyId = getCompanyId();
            
            if (!targetCompanyId) {
                return false;
            }

            const response = await deleteRoleApi(roleId, targetCompanyId);

            if (response.success) {
                // Refresh roles from context
                await refreshRoles();
                return true;
            }
            
            return false;
        } catch (err) {
            console.error("Error deleting role:", err);
            return false;
        }
    }, [getCompanyId, refreshRoles]);

    return { 
        roles: roles as RoleWithCounts[], 
        loading: loadingRoles, 
        refresh: refreshRoles, 
        addRole,
        updateRole,
        deleteRole,
    };
}

