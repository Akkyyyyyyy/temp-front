// src/api/role.ts
export interface Role {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithCounts extends Role {
  memberCount: number;
  assignmentCount: number;
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

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

class RoleApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth-token');
    
    const response = await fetch(`${API_BASE_URL}/roles${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Network error',
        code: 'NETWORK_ERROR'
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Get all roles for a company
  async getCompanyRoles(companyId: string): Promise<RoleWithCounts[]> {
    return this.makeRequest<RoleWithCounts[]>('/company', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    });
  }

  // Get specific role within company
  async getRoleById(id: string, companyId: string): Promise<Role> {
    return this.makeRequest<Role>(`/${id}`, {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    });
  }

  // Create role for a company
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return this.makeRequest<Role>('', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  // Update role within company
  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<Role> {
    return this.makeRequest<Role>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  // Delete role within company
  async deleteRole(id: string, companyId: string): Promise<void> {
    return this.makeRequest<void>(`/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ companyId }),
    });
  }

  // Get role usage within company
  async getRoleUsage(id: string, companyId: string): Promise<{ memberCount: number; assignmentCount: number }> {
    return this.makeRequest<{ memberCount: number; assignmentCount: number }>(`/${id}/usage`, {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    });
  }

  // Utility method to get company ID from current user (if stored in auth)
  private getCurrentCompanyId(): string {
    // This depends on how you store user info - adjust based on your auth setup
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
  }

  // Convenience methods using current user's company
  async getMyCompanyRoles(): Promise<RoleWithCounts[]> {
    const companyId = this.getCurrentCompanyId();
    return this.getCompanyRoles(companyId);
  }

  async getMyRoleById(id: string): Promise<Role> {
    const companyId = this.getCurrentCompanyId();
    return this.getRoleById(id, companyId);
  }

  async createRoleForMyCompany(roleData: Omit<CreateRoleRequest, 'companyId'>): Promise<Role> {
    const companyId = this.getCurrentCompanyId();
    return this.createRole({
      ...roleData,
      companyId
    });
  }

  async updateRoleInMyCompany(id: string, roleData: Omit<UpdateRoleRequest, 'companyId'>): Promise<Role> {
    const companyId = this.getCurrentCompanyId();
    return this.updateRole(id, {
      ...roleData,
      companyId
    });
  }

  async deleteRoleFromMyCompany(id: string): Promise<void> {
    const companyId = this.getCurrentCompanyId();
    return this.deleteRole(id, companyId);
  }

  async getRoleUsageInMyCompany(id: string): Promise<{ memberCount: number; assignmentCount: number }> {
    const companyId = this.getCurrentCompanyId();
    return this.getRoleUsage(id, companyId);
  }

}

export const roleApiService = new RoleApiService();