import { EditableBooking } from "@/hooks/useBookingEditor";
import { toast } from "sonner";
import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export interface CheckProjectNameRequest {
  name: string;
  companyId: string;
}

export interface CheckProjectNameResponse {
  success: boolean;
  exists: boolean;
  message?: string;
}

export interface RemoveMemberFromProjectRequest {
  projectId: string;
  memberId: string;
}

export interface RemoveMemberFromProjectResponse {
  success: boolean;
  message: string;
}

export interface IProjectSection {
  id: string;
  type: 'text' | 'list';
  title: string;
  content: string | string[];
  order: number;
}

export interface UpdateProjectSectionRequest {
  projectId: string;
  sectionType: 'brief' | 'logistics';
  sections: IProjectSection[];
}

export interface UpdateProjectSectionResponse {
  success: boolean;
  message: string;
  sections?: IProjectSection[];
}

export interface GetProjectSectionsResponse {
  message: string;
  success: boolean;
  data: {
    brief: IProjectSection[];
    logistics: IProjectSection[];
  };
}

export interface EditProjectRequest {
  projectId: string;
  name?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
  startHour?: number;
  endHour?: number;
  location?: string;
  description?: string;
  client?: {
    name: string;
    email: string;
    mobile: string;
    cc: string;
  } | null;
  isScheduleUpdate?: boolean;
}

export interface EditProjectResponse {
  success: boolean;
  message: string;
  project?: any;
}

export interface DeleteProjectRequest {
  projectId: string;
}

export interface DeleteProjectResponse {
  success: boolean;
  message: string;
}

export interface IAddMemberToProjectRequest {
  projectId: string;
  memberId: string;
  roleId: string;
}

export interface IAddMemberToProjectResponse {
  success: boolean;
  message: string;
}

// Add these interfaces to your existing types
export interface IGetProjectByIdRequest {
  projectId: string;
}

export interface IGetProjectByIdResponse {
  success: boolean;
  message?: string;
  project?: {
    id: string;
    name: string;
    color: string;
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
    location: string;
    description: string;
    client?: {
      name?: string;
      email?: string;
      mobile?: string;
      cc?: string;
    } | null;
    brief: IProjectSection[];
    logistics: IProjectSection[];
    company: {
      id: string;
      name: string;
    };
    assignments: {
      id: string;
      member: {
        id: string;
        name: string;
        email: string;
      };
      role: {
        id: string;
        name: string;
      };
      googleEventId?: string;
    }[];
    createdAt: string;
    updatedAt: string;
  };
}

export async function createProject(booking: Omit<EditableBooking, 'id'>, companyId: string) {
  try {

    // Prepare payload for backend API
    const apiPayload = {
      name: booking.projectName,
      color: booking.color,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startHour: booking.startHour,
      endHour: booking.endHour,
      location: booking.location,
      description: booking.description,
      companyId: companyId,
      assignments: booking.teamAssignments.map(assignment => ({
        memberId: assignment.id,
        roleId: assignment.roleId
      })),
      // Add client data if provided
      ...(booking.client && {
        client: {
          name: booking.client.name,
          mobile: booking.client.mobile,
          email: booking.client.email,
          cc:booking.client.cc
        }
      })
    };

    const token = localStorage.getItem('auth-token');

    // Call the API
    const response = await apiFetch(`${baseUrl}/project/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(apiPayload)
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    toast.error(error);
    return { success: false, message: error.message || "Network error" };
  }
}

export async function getProjectById(
  projectId: string
): Promise<IGetProjectByIdResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: IGetProjectByIdResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch project");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching project"
    };
  }
}


export async function checkProjectName(
  projectName: string
): Promise<CheckProjectNameResponse> {
  try {
    const companyDetails = JSON.parse(localStorage.getItem('companyDetails') || '{}') || {};
    const token = localStorage.getItem('auth-token');

    if (!companyDetails.id) {
      toast.error("Company information not found");
      return { success: false, exists: false, message: "Company information not found" };
    }

    if (!projectName.trim()) {
      return { success: false, exists: false, message: "Project name is required" };
    }

    const payload: CheckProjectNameRequest = {
      name: projectName.trim(),
      companyId: companyDetails.id
    };

    const response = await apiFetch(`${baseUrl}/project/check-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result: CheckProjectNameResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to check project name");
    }

    return result;
  } catch (error: any) {
    console.error("Error checking project name:", error);
    toast.error(error.message || "Network error while checking project name");
    return {
      success: false,
      exists: false,
      message: error.message || "Network error while checking project name"
    };
  }
}

export async function addMemberToProject(
  request: IAddMemberToProjectRequest
): Promise<IAddMemberToProjectResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim() || !request.memberId?.trim()) {
      toast.error("Project ID and Member ID are required");
      return { success: false, message: "Project ID and Member ID are required" };
    }

    if (!request.roleId?.trim()) {
      toast.error("Role is required");
      return { success: false, message: "Role is required" };
    }

    const response = await apiFetch(`${baseUrl}/project/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: IAddMemberToProjectResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to add member to project");
    }

    if (result.success) {
      toast.success(result.message || "Member added to project successfully");
    } else {
      toast.error(result.message || "Failed to add member to project");
    }

    return result;
  } catch (error: any) {
    console.error("Error adding member to project:", error);
    toast.error(error.message || "Network error while adding member to project");
    return {
      success: false,
      message: error.message || "Network error while adding member to project"
    };
  }
}

export async function removeMemberFromProject(
  request: RemoveMemberFromProjectRequest
): Promise<RemoveMemberFromProjectResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim() || !request.memberId?.trim()) {
      toast.error("Project ID and Member ID are required");
      return { success: false, message: "Project ID and Member ID are required" };
    }

    const response = await apiFetch(`${baseUrl}/project/remove-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: RemoveMemberFromProjectResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to remove member from project");
    }

    if (result.success) {
      toast.success(result.message || "Member removed from project successfully");
    } else {
      toast.error(result.message || "Failed to remove member from project");
    }

    return result;
  } catch (error: any) {
    console.error("Error removing member from project:", error);
    toast.error(error.message || "Network error while removing member from project");
    return {
      success: false,
      message: error.message || "Network error while removing member from project"
    };
  }
}

export async function updateProjectSections(
  request: UpdateProjectSectionRequest
): Promise<UpdateProjectSectionResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { success: false, message: "Project ID is required" };
    }

    if (!['brief', 'logistics'].includes(request.sectionType)) {
      return { success: false, message: "Invalid section type" };
    }

    const response = await apiFetch(`${baseUrl}/project/sections`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: UpdateProjectSectionResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update sections");
    }

    return result;
  } catch (error: any) {
    console.error("Error updating project sections:", error);
    return {
      success: false,
      message: error.message || "Network error while updating sections"
    };
  }
}

export async function getProjectSections(
  projectId: string
): Promise<GetProjectSectionsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    const response = await apiFetch(`${baseUrl}/project/${projectId}/sections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetProjectSectionsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch sections");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project sections:", error);
    throw error;
  }
}

export async function editProject(
  request: EditProjectRequest
): Promise<EditProjectResponse> {
  try {
    const token = localStorage.getItem('auth-token');
    
    if (!request.projectId?.trim()) {
      toast.error("Project ID is required");
      return { success: false, message: "Project ID is required" };
    }

    // Validate dates if provided
    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      if (start > end) {
        toast.error("End date cannot be before start date");
        return { success: false, message: "End date cannot be before start date" };
      }
    }

    // Validate hours if provided
    if (request.startHour !== undefined && request.endHour !== undefined) {
      if (request.startHour < 0 || request.startHour > 24 * 60) {
        toast.error("Start hour out of valid range (0 - 1440 minutes)");
        return { success: false, message: "Start hour out of valid range (0 - 1440 minutes)" };
      }

      if (request.endHour < 0 || request.endHour > 24 * 60) {
        toast.error("End hour out of valid range (0 - 1440 minutes)");
        return { success: false, message: "End hour out of valid range (0 - 1440 minutes)" };
      }

      if (request.startHour >= request.endHour) {
        toast.error("Start hour must be before end hour");
        return { success: false, message: "Start hour must be before end hour" };
      }
    }

    // Validate client data if provided
    if (request.client !== undefined && request.client !== null) {
      if (!request.client.name?.trim()) {
        toast.error("Client name is required");
        return { success: false, message: "Client name is required" };
      }
      if (!request.client.email?.trim()) {
        toast.error("Client email is required");
        return { success: false, message: "Client email is required" };
      }
      if (!request.client.mobile?.trim()) {
        toast.error("Client mobile is required");
        return { success: false, message: "Client mobile is required" };
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.client.email)) {
        toast.error("Please provide a valid client email address");
        return { success: false, message: "Please provide a valid client email address" };
      }

      // Basic mobile validation
      const mobileRegex = /^[+]?[\d\s\-()]+$/;
      if (!mobileRegex.test(request.client.mobile)) {
        toast.error("Please provide a valid client mobile number");
        return { success: false, message: "Please provide a valid client mobile number" };
      }
    }

    const response = await apiFetch(`${baseUrl}/project/edit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: EditProjectResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update project");
    }

    if (result.success) {
      toast.success(result.message || "Project updated successfully");
    } 

    return result;
  } catch (error: any) {
    console.error("Error updating project:", error);
    return {
      success: false,
      message: error.message || "Network error while updating project"
    };
  }
}

export async function deleteProject(
  request: DeleteProjectRequest
): Promise<DeleteProjectResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      toast.error("Project ID is required");
      return { success: false, message: "Project ID is required" };
    }

    const response = await apiFetch(`${baseUrl}/project/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: DeleteProjectResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete project");
    }

    if (result.success) {
      toast.success(result.message || "Project deleted successfully");
    } else {
      toast.error(result.message || "Failed to delete project");
    }

    return result;
  } catch (error: any) {
    console.error("Error deleting project:", error);
    toast.error(error.message || "Network error while deleting project");
    return {
      success: false,
      message: error.message || "Network error while deleting project"
    };
  }
}