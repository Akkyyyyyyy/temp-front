import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Payload Interfaces
interface RegisterCompanyPayload {
  name: string;
  email: string;
  password: string;
}

interface RegisterMemberPayload {
  name: string;
  email: string;
  password: string;
  companyId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// Company Auth Functions
export async function registerCompany(payload: RegisterCompanyPayload): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch(`${baseUrl}/company/register`, {
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

// Update your types file
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    isAdmin: boolean;
    userType: "admin" | "member";
    location: string | null;
    company: {
      id: string | null;
      name: string | null;
      email: string;
      country: string | null;
    };
  };
  forceReset?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  forceReset?: boolean;
}

// Update the loginMember function to handle forceReset
export async function loginMember(payload: LoginPayload): Promise<any> {
  try {
    const response = await apiFetch(`${baseUrl}/member/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle force reset case
      if (response.status === 403 && data.forceReset) {
        return { 
          success: false, 
          message: data.message, 
          errors: data.errors,
          forceReset: true 
        };
      }
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data };

  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}



export const requestPasswordReset = async (data: { email: string }) => {
  const response = await apiFetch(`${baseUrl}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data }),
  });
  const res = await response.json();

  return res;
};

export const verifyOTP = async (data: { email: string; otp: string; token: string }) => {
  const response = await apiFetch(`${baseUrl}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data }),
  });
  return await response.json();
};

export const resetPassword = async (data: { token: string; newPassword: string }) => {
  const response = await apiFetch(`${baseUrl}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data }),
  });
  return await response.json();
};

export async function createCompanyByMember(payload: {
  memberId: string;
  companyName: string;
}): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch(`${baseUrl}/company/create-by-member`, {
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

export async function changeCompany(payload: {
  memberId: string;
  companyId: string;
}): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await apiFetch(`${baseUrl}/company/change-company`, {
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