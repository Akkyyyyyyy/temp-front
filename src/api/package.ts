import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Payload Interfaces
export interface CreatePackagePayload {
  name: string;
  price: number;
  duration: string;
  isPopular: boolean;
  features?: Record<string, any> | null;
  addons?: Record<string, any> | null;
  status: "active" | "inactive";
  memberId: string;
}

export interface UpdatePackagePayload {
  name?: string;
  price?: number;
  duration?: string;
  isPopular?: boolean;
  features?: Record<string, any> | null;
  addons?: Record<string, any> | null;
  status?: "active" | "inactive";
}

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  isPopular: boolean;
  features: Record<string, any> | null;
  addons: Record<string, any> | null;
  status: "active" | "inactive";
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// Package API Functions
export async function createPackage(payload: CreatePackagePayload): Promise<ApiResponse<{ package: Package }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function getAllPackages(): Promise<ApiResponse<{ packages: Package[] }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package/getAll`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function getPackageById(id: string): Promise<ApiResponse<{ package: Package }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function updatePackage(id: string, payload: UpdatePackagePayload): Promise<ApiResponse<{ package: Package }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function deletePackage(id: string): Promise<ApiResponse<{ package: Package }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

export async function getPackagesByMember(memberId: string): Promise<ApiResponse<{ packages: Package[] }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package/member/${memberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

// Get packages by status
export async function getPackagesByStatus(status: "active" | "inactive"): Promise<ApiResponse<{ packages: Package[] }>> {
  try {
    const response = await apiFetch(`${baseUrl}/package?status=${status}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}