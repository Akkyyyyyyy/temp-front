import { apiFetch } from "./apiClient";
import { ApiResponse } from "./company";
const baseUrl = import.meta.env.VITE_BACKEND_URL;


// Add these interfaces to your existing types
export interface IGetAllProjectsByMemberRequest {
  memberId: string;
  companyId: string;
}

export interface IProjectAssignment {
  id: string;
  name: string;
  color: string;
  startDate: string | null;
  endDate: string | null;
  startHour: number | null;
  endHour: number | null;
  location: string | null;
  description: string | null;
  client: string | null;
  brief: string | null;
  logistics: string | null;
  assignmentRole: string;
  assignedAt: string;
}

export interface IGetAllProjectsByMemberResponse {
  success: boolean;
  message: string;
  projects: IProjectAssignment[];
  totalCount: number;
  member?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Add this function to your existing API functions
export async function getAllProjectsByMember(
  request: IGetAllProjectsByMemberRequest
): Promise<ApiResponse<IGetAllProjectsByMemberResponse>> {
  try {
    const token = localStorage.getItem('auth-token');

    const response = await apiFetch(`${baseUrl}/calendar/get-all-projects-by-member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || 'Failed to fetch projects', 
        errors: data.errors 
      };
    }

    return { 
      success: true, 
      data: data 
    };
  } catch (error: any) {
    console.error("Error fetching projects by member:", error);
    return { 
      success: false, 
      message: error.message || "Network error while fetching projects" 
    };
  }
}