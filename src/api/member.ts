import { toast } from "sonner";
import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export interface Member {
  profilePhoto: any;
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  companyId: string;
  ringColor?: string;
  projects?: Project[];
  active:boolean;
  roleId:string;
}

export interface Project {
  newRole?: string;
  client?: any;
  location?: string;
  description?: string;
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  color?: string;
  assignedTo: string;
  startHour?: number;
  endHour?: number;
  brief: any[];
  logistics: any[];
}

export interface GetMembersByCompanyRequest {
  companyId: string;
  month?: number;
  year?: number;
  week?: number;
  viewType: 'month' | 'week';
}

export interface GetMembersByCompanyResponse {
  success: boolean;
  message: string;
  members: Member[];
  totalCount: number;
  viewType: 'month' | 'week';
  month?: number;
  year?: number;
  week?: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface AvailableMemberRequest {
  companyId: string;
  startDate: string;
  endDate: string;
  startHour: number;
  endHour: number;
  excludeProjectId?: string;
}

export interface Conflict {
  projectId: string;
  projectName: string;
  startDate: string;
  endDate: string;
  startHour: string;
  endHour: string;
  conflictType: "date_and_time" | "date_only";
}

export interface AvailableMember {
  ringColor: any;
  profilePhoto: any;
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  availabilityStatus: "fully_available" | "partially_available" | "unavailable";
  conflicts: Conflict[];
}

export interface AvailableMembersData {
  availableMembers: AvailableMember[];
  totalFullyAvailable: number;
  totalPartiallyAvailable: number;
  totalUnavailable: number;
  totalMembers: number;
  dateRange: {
    startDate: string;
    endDate: string;
    startHour: string;
    endHour: string;
  };
}

export interface AvailableMembersResponse {
  success: boolean;
  message?: string;
  data?: AvailableMembersData;
  errors?: any;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

interface AddMemberRequest {
  name: string;
  email: string;
  role?: string;
  roleId?: string;
  companyId: string;
  phone?:string;
  countryCode?: string;
  location?: string;
  bio?: string;
  skills?: string[];
}

interface AddMemberResponse {
  success: boolean;
  member?: {
    id: string;
    name: string;
    email: string;
    role: string;
    projects?: any[];
  };
  message?: string;
  errors?: any;
  statusCode?: number;
}

export interface UpdateRingColorRequest {
  ringColor: string;
}

export interface UpdateRingColorResponse {
  success: boolean;
  message: string;
  member?: Member;
}
// Add to your existing interfaces
export interface ToggleMemberStatusResponse {
  success: boolean;
  message: string;
  member?: Member;
  newStatus: boolean;
}


export async function addMember(request: AddMemberRequest): Promise<AddMemberResponse> {
  try {
    const token = localStorage.getItem("auth-token");
    
    const response = await apiFetch(`${baseUrl}/member/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Company-ID": request.companyId,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    return {
      success: response.ok,
      member: data.member,
      message: data.message,
      errors: data.errors,
      statusCode: response.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error",
      errors: error,
    };
  }
}

// Get members by company ID with month/week view support
export async function getMembersByCompanyId(
  companyId: string,
  params: {
    viewType: 'day' | 'month' | 'week';
    month?: number;
    year?: number;
    week?: number;
    memberId?: string;
  }
): Promise<ApiResponse<GetMembersByCompanyResponse>> {
  try {
    const token = localStorage.getItem('auth-token');

    const requestBody: GetMembersByCompanyRequest = {
      companyId,
      viewType: params.viewType === 'day' ? 'month' : params.viewType,
      ...(params.viewType === 'month' && {
        month: params.month,
        year: params.year
      }),
      ...(params.viewType === 'week' && {
        week: params.week,
        year: params.year
      }),
      ...(params.viewType === 'day' && {
        month: params.month,
        year: params.year
      }),
      ...(params.memberId && { memberId: params.memberId }) // Add memberId if provided
    };

    const response = await apiFetch(`${baseUrl}/member/by-company`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    // console.log("🚀 ~ getMembersByCompanyId ~ data:", data);

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data: data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

// Update member by ID
export async function updateMember(
  memberId: string,
  updates: Partial<Member>
): Promise<ApiResponse<Member>> {
  try {
    const token = localStorage.getItem('auth-token');

    const response = await apiFetch(`${baseUrl}/member/update/${memberId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    // console.log("🚀 ~ updateMember ~ data:", data);

    if (!response.ok) {
      return { success: false, message: data.message, errors: data.errors };
    }

    return { success: true, data: data.member || data };
  } catch (error: any) {
    return { success: false, message: error.message || "Network error" };
  }
}

// Get available members by date range


export async function getAvailableMembers(
  request: AvailableMemberRequest
): Promise<AvailableMembersResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    const response = await apiFetch(`${baseUrl}/member/available`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    // console.log("🚀 ~ getAvailableMembers ~ data:", data);

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch available members',
        errors: data.errors
      };
    }

    return {
      success: true,
      data: data.data || data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error"
    };
  }
}

export function isMemberAvailable(
  member: AvailableMember,
  includeConflicted: boolean = false
): boolean {
  if (includeConflicted) {
    return true;
  }
  return !member.conflicts || member.conflicts.length === 0;
}

export function formatConflicts(conflicts: Conflict[]): string {
  return conflicts.map(conflict =>
    `${conflict.projectName} (${conflict.startDate} to ${conflict.endDate})`
  ).join(', ');
}

export interface UpdateMemberProfileRequest {
  name: string;
  role: string;
  phone: string;
  location: string;
  bio: string;
  skills: string; // JSON string
  profilePhoto: string;
}

export interface UpdateMemberProfileResponse {
  success: boolean;
  message?: string;
  member?: any;
}

export interface UploadPhotoResponse {
  success: boolean;
  message?: string;
  profilePhotoPath?: string;
}

export interface RemovePhotoResponse {
  success: boolean;
  message?: string;
  member?: any;
}

export async function updateMemberProfile(
  memberId: string,
  data: UpdateMemberProfileRequest
): Promise<UpdateMemberProfileResponse> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/member/update/${memberId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update member profile");
    }

    return result;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    toast.error(error.message || "An error occurred while updating the member profile");
    return {
      success: false,
      message: error.message || "An error occurred while updating the member profile"
    };
  }
}

// Upload profile photo
export async function uploadMemberPhoto(
  memberId: string,
  file: File
): Promise<UploadPhotoResponse> {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('memberId', memberId);

    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/member/upload-photo`, {
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

// Remove profile photo
export async function removeMemberPhoto(
  memberId: string
): Promise<RemovePhotoResponse> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/member/remove-photo/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to remove photo");
    }

    return result;
  } catch (error: any) {
    console.error('Error removing photo:', error);
    toast.error(error.message || "Failed to remove profile picture");
    return {
      success: false,
      message: error.message || "Failed to remove profile picture"
    };
  }
}

export async function updateMemberRingColor(
  memberId: string,
  ringColor: string
): Promise<UpdateRingColorResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    const response = await apiFetch(`${baseUrl}/member/${memberId}/ring-color`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ ringColor }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update ring color");
    }

    toast.success("Ring color updated successfully");
    return {
      success: true,
      message: data.message,
      member: data.member
    };
  } catch (error: any) {
    console.error("Error updating ring color:", error);
    toast.error(error.message || "Failed to update ring color");
    return {
      success: false,
      message: error.message || "Failed to update ring color"
    };
  }
}


// Add this function to your existing API functions
export async function toggleMemberStatus(
  memberId: string
): Promise<ToggleMemberStatusResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    const response = await apiFetch(`${baseUrl}/member/${memberId}/toggle-status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to toggle member status");
    }

    const statusMessage = data.newStatus ? "activated" : "deactivated";
    // toast.success(`Member ${statusMessage} successfully`);

    return {
      success: true,
      message: data.message,
      member: data.member,
      newStatus: data.newStatus
    };
  } catch (error: any) {
    console.error("Error toggling member status:", error);
    toast.error(error.message || "Failed to toggle member status");
    return {
      success: false,
      message: error.message || "Failed to toggle member status",
      newStatus: false
    };
  }
}
