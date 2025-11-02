import { toast } from "sonner";
import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export interface Role {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithCounts extends Role {
  memberCount?: number;
  assignmentCount?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export interface GetRolesResponse {
  data: any;
  roles: RoleWithCounts[];
  totalCount: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  companyId: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  companyId: string;
}

export async function getRolesByCompanyId(
  companyId: string
): Promise<ApiResponse<GetRolesResponse>> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!companyId?.trim()) {
      return { success: false, message: "Company ID is required" };
    }

    const response = await apiFetch(`${baseUrl}/roles/company`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ companyId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data: data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function createRole(
  request: CreateRoleRequest
): Promise<ApiResponse<Role>> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.name?.trim()) {
      toast.error("Role name is required");
      return { success: false, message: "Role name is required" };
    }

    if (!request.companyId?.trim()) {
      toast.error("Company ID is required");
      return { success: false, message: "Company ID is required" };
    }

    const response = await apiFetch(`${baseUrl}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.message || "Failed to create role");
      return { success: false, message: result.message || "Failed to create role", errors: result.errors };
    }

    toast.success("Role created successfully");
    return { success: true, data: result.role || result };
  } catch (error: any) {
    console.error("Error creating role:", error);
    toast.error(error.message || "Network error while creating role");
    return { success: false, message: error.message || "Network error while creating role" };
  }
}

export async function updateRole(
  roleId: string,
  request: UpdateRoleRequest
): Promise<ApiResponse<Role>> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!roleId?.trim()) {
      toast.error("Role ID is required");
      return { success: false, message: "Role ID is required" };
    }

    if (!request.companyId?.trim()) {
      toast.error("Company ID is required");
      return { success: false, message: "Company ID is required" };
    }

    const response = await apiFetch(`${baseUrl}/roles/update/${roleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.message || "Failed to update role");
      return { success: false, message: result.message || "Failed to update role", errors: result.errors };
    }

    toast.success("Role updated successfully");
    return { success: true, data: result.role || result };
  } catch (error: any) {
    console.error("Error updating role:", error);
    toast.error(error.message || "Network error while updating role");
    return { success: false, message: error.message || "Network error while updating role" };
  }
}

export async function deleteRole(
  roleId: string,
  companyId: string
): Promise<ApiResponse<void>> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!roleId?.trim()) {
      toast.error("Role ID is required");
      return { success: false, message: "Role ID is required" };
    }

    if (!companyId?.trim()) {
      toast.error("Company ID is required");
      return { success: false, message: "Company ID is required" };
    }

    const response = await apiFetch(`${baseUrl}/roles/delete/${roleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ companyId })
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.message || "Failed to delete role");
      return { success: false, message: result.message || "Failed to delete role", errors: result.errors };
    }

    toast.success("Role deleted successfully");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting role:", error);
    toast.error(error.message || "Network error while deleting role");
    return { success: false, message: error.message || "Network error while deleting role" };
  }
}
