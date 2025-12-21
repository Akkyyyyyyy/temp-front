import { toast } from "sonner";
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
export interface LockDateRequest {
  companyId: string;
  date: string;
}

export interface UnlockDateRequest {
  companyId: string;
  date: string;
}

export interface LockMultipleDatesRequest {
  companyId: string;
  dates: string[];
}

export interface UnlockMultipleDatesRequest {
  companyId: string;
  dates: string[];
}

export interface ClearLockedDatesRequest {
  companyId: string;
}

export interface GetLockedDatesRequest {
  companyId: string;
  startDate?: string;
  endDate?: string;
}

export interface LockDateResponse {
  success: boolean;
  message: string;
  date: string;
  lockedDates: string[];
  company: {
    id: string;
    name: string;
  };
}

export interface LockedDatesResponse {
  success: boolean;
  message: string;
  lockedDates: string[];
  totalLockedDates: number;
  company: {
    id: string;
    name: string;
  };
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
export async function getCompanies(payload: {
  memberId: string;
}): Promise<ApiResponse<any>> {
  try {
    const response = await apiFetch(`${baseUrl}/company/get-companies`, {
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

export async function uploadCompanyLogo(
  companyId: string,
  file: File
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('companyId', companyId);
    formData.append('photo', file);


    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/company/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to upload photo");
    }

    return result;
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    toast.error(error.message || "Failed to upload profile picture");
    return {
      success: false,
      message: error.message || "Failed to upload profile picture"
    };
  }
}



// Lock a single date
export async function lockDate(payload: LockDateRequest): Promise<ApiResponse<LockDateResponse>> {
  try {
    const response = await apiFetch(`${baseUrl}/company/lock-date`, {
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

// Unlock a single date
export async function unlockDate(payload: UnlockDateRequest): Promise<ApiResponse<LockDateResponse>> {
  try {
    const response = await apiFetch(`${baseUrl}/company/unlock-date`, {
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