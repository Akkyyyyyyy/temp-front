import { toast } from "sonner";
import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Checklist Types matching your database schema
export interface IChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  description?: string; // Add optional description
}

// Get Project Checklist Request/Response
export interface GetProjectChecklistRequest {
  projectId: string;
}

export interface GetProjectChecklistResponse {
  success: boolean;
  message?: string;
  checklist?: IChecklistItem[];
}

// Update Project Checklist Request/Response
export interface UpdateProjectChecklistRequest {
  projectId: string;
  checklist: IChecklistItem[];
}

export interface UpdateProjectChecklistResponse {
  success: boolean;
  message: string;
  checklist?: IChecklistItem[];
}

// Assignment Types
export interface Assignment {
  id: string;
  instructions?: string;
  member: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    ringColor?: string;
  };
  role: {
    id: string;
    name: string;
  };
}

export interface GetProjectAssignmentsRequest {
  projectId: string;
}

export interface GetProjectAssignmentsResponse {
  success: boolean;
  message?: string;
  assignments?: Assignment[];
}

export interface UpdateAssignmentInstructionsRequest {
  assignmentId: string;
  instructions: string;
}

export interface UpdateAssignmentInstructionsResponse {
  success: boolean;
  message: string;
  assignment?: Assignment;
}

export interface GetProjectEquipmentsRequest {
  projectId: string;
}

export interface IProjectSection {
  id: string;
  type: 'text' | 'list' | 'nested' | 'item' | 'checklist';
  title: string;
  content: string | string[] | any[];
  order: number;
}
export interface GetProjectEquipmentsResponse {
  success: boolean;
  message?: string;
  equipments?: IProjectSection[];
}

// Update Project Equipments Request/Response
export interface UpdateProjectEquipmentsRequest {
  projectId: string;
  equipments: IProjectSection[];
}

export interface UpdateProjectEquipmentsResponse {
  success: boolean;
  message: string;
  equipments?: IProjectSection[];
}

export interface ProjectDocument {
  title: string;
  filename: string; // S3 key or URL
}

// Get Project Documents Request/Response
export interface GetProjectDocumentsRequest {
  projectId: string;
}

export interface GetProjectDocumentsResponse {
  success: boolean;
  message?: string;
  documents?: ProjectDocument[];
}

// Update Project Documents Request/Response
export interface UpdateProjectDocumentsRequest {
  projectId: string;
  documents: ProjectDocument[];
}

export interface UpdateProjectDocumentsResponse {
  success: boolean;
  message: string;
  documents?: ProjectDocument[];
}

// Upload Project Document Request/Response
export interface UploadProjectDocumentRequest {
  projectId: string;
  file: File;
  title?: string;
}

export interface UploadProjectDocumentResponse {
  success: boolean;
  message?: string;
  document?: ProjectDocument;
}

export interface DeleteProjectDocumentRequest {
  projectId: string;
  filename: string;
}

export interface DeleteProjectDocumentResponse {
  success: boolean;
  message: string;
}

// Delete Multiple Project Documents Request/Response
export interface DeleteProjectDocumentsRequest {
  projectId: string;
  filenames: string[];
}

export interface DeleteProjectDocumentsResponse {
  success: boolean;
  message: string;
}
export interface IReminders {
  weekBefore: boolean;
  dayBefore: boolean;
}

export interface GetProjectRemindersRequest {
  projectId: string;
}

export interface GetProjectRemindersResponse {
  success: boolean;
  message?: string;
  reminders?: IReminders;
}

export interface UpdateProjectRemindersRequest {
  projectId: string;
  reminders: IReminders;
}

export interface UpdateProjectRemindersResponse {
  success: boolean;
  message: string;
  reminders?: IReminders;
}

// Checklist API Functions
export async function getProjectChecklist(
  request: GetProjectChecklistRequest
): Promise<GetProjectChecklistResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/checklist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetProjectChecklistResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch project checklist");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project checklist:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching project checklist"
    };
  }
}

export async function updateProjectChecklist(
  request: UpdateProjectChecklistRequest
): Promise<UpdateProjectChecklistResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!Array.isArray(request.checklist)) {
      return {
        success: false,
        message: "Checklist must be an array"
      };
    }

    // Validate each checklist item
    for (const item of request.checklist) {
      if (!item.title?.trim()) {
        return {
          success: false,
          message: "Checklist item title is required"
        };
      }

      if (typeof item.completed !== 'boolean') {
        return {
          success: false,
          message: "Checklist item completed status must be a boolean"
        };
      }

      // Validate description if provided
      if (item.description !== undefined && item.description !== null) {
        if (typeof item.description !== 'string') {
          return {
            success: false,
            message: "Checklist item description must be a string"
          };
        }
      }
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/checklist`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    const result: UpdateProjectChecklistResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update project checklist");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to update checklist");
    }

    return result;
  } catch (error: any) {
    console.error("Error updating project checklist:", error);
    toast.error(error.message || "Network error while updating checklist");
    return {
      success: false,
      message: error.message || "Network error while updating checklist"
    };
  }
}

// Assignment API Functions
export async function getProjectAssignments(
  request: GetProjectAssignmentsRequest
): Promise<GetProjectAssignmentsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/assignments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetProjectAssignmentsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch project assignments");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project assignments:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching project assignments"
    };
  }
}

export async function updateAssignmentInstructions(
  request: UpdateAssignmentInstructionsRequest
): Promise<UpdateAssignmentInstructionsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.assignmentId?.trim()) {
      return { 
        success: false, 
        message: "Assignment ID is required" 
      };
    }

    if (request.instructions === undefined) {
      return {
        success: false,
        message: "Instructions are required"
      };
    }

    const response = await apiFetch(`${baseUrl}/project/assignment/${request.assignmentId}/instructions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ instructions: request.instructions })
    });

    const result: UpdateAssignmentInstructionsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update assignment instructions");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to update instructions");
    }

    return result;
  } catch (error: any) {
    console.error("Error updating assignment instructions:", error);
    toast.error(error.message || "Network error while updating instructions");
    return {
      success: false,
      message: error.message || "Network error while updating instructions"
    };
  }
}

export async function getProjectEquipments(
  request: GetProjectEquipmentsRequest
): Promise<GetProjectEquipmentsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/equipments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetProjectEquipmentsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch project equipments");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project equipments:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching project equipments"
    };
  }
}

export async function updateProjectEquipments(
  request: UpdateProjectEquipmentsRequest
): Promise<UpdateProjectEquipmentsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!Array.isArray(request.equipments)) {
      return {
        success: false,
        message: "Equipments must be an array"
      };
    }

    // Validate each equipment section
    for (const section of request.equipments) {
      if (!section.id?.trim()) {
        return {
          success: false,
          message: "Equipment section ID is required"
        };
      }

      if (!section.title?.trim()) {
        return {
          success: false,
          message: "Equipment section title is required"
        };
      }

      if (!['text', 'list', 'nested', 'item', 'checklist'].includes(section.type)) {
        return {
          success: false,
          message: "Invalid equipment section type"
        };
      }

      if (section.order === undefined || section.order === null) {
        return {
          success: false,
          message: "Equipment section order is required"
        };
      }

      if (typeof section.order !== 'number' || section.order < 0) {
        return {
          success: false,
          message: "Equipment section order must be a non-negative number"
        };
      }

      // Validate content based on type
      if (section.type === 'text' && typeof section.content !== 'string') {
        return {
          success: false,
          message: "Text type equipment section must have string content"
        };
      }

      if (section.type === 'list' && !Array.isArray(section.content)) {
        return {
          success: false,
          message: "List type equipment section must have array content"
        };
      }

      // For nested types, content should be an array of IProjectSection
      if (section.type === 'nested' && !Array.isArray(section.content)) {
        return {
          success: false,
          message: "Nested type equipment section must have array content"
        };
      }
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/equipments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ equipments: request.equipments })
    });

    const result: UpdateProjectEquipmentsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update project equipments");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to update equipments");
    }

    return result;
  } catch (error: any) {
    console.error("Error updating project equipments:", error);
    toast.error(error.message || "Network error while updating equipments");
    return {
      success: false,
      message: error.message || "Network error while updating equipments"
    };
  }
}

export async function getProjectDocuments(
  request: GetProjectDocumentsRequest
): Promise<GetProjectDocumentsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetProjectDocumentsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch project documents");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project documents:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching project documents"
    };
  }
}

export async function updateProjectDocuments(
  request: UpdateProjectDocumentsRequest
): Promise<UpdateProjectDocumentsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!Array.isArray(request.documents)) {
      return {
        success: false,
        message: "Documents must be an array"
      };
    }

    // Validate each document
    for (const doc of request.documents) {
      if (!doc.title?.trim()) {
        return {
          success: false,
          message: "Each document must have a title"
        };
      }
      if (!doc.filename?.trim()) {
        return {
          success: false,
          message: "Each document must have a filename"
        };
      }
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/documents`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ documents: request.documents })
    });

    const result: UpdateProjectDocumentsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update project documents");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to update documents");
    } else {
      toast.success(result.message || "Documents updated successfully");
    }

    return result;
  } catch (error: any) {
    console.error("Error updating project documents:", error);
    toast.error(error.message || "Network error while updating documents");
    return {
      success: false,
      message: error.message || "Network error while updating documents"
    };
  }
}

export async function uploadProjectDocument(
  request: UploadProjectDocumentRequest
): Promise<UploadProjectDocumentResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!request.file) {
      return {
        success: false,
        message: "File is required"
      };
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.title?.trim()) {
      formData.append('title', request.title.trim());
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData
    });

    const result: UploadProjectDocumentResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to upload document");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to upload document");
    } else {
      toast.success(result.message || "Document uploaded successfully");
    }

    return result;
  } catch (error: any) {
    console.error("Error uploading project document:", error);
    toast.error(error.message || "Network error while uploading document");
    return {
      success: false,
      message: error.message || "Network error while uploading document"
    };
  }
}

// Helper function to delete a document from the documents array
export function deleteDocumentFromArray(
  documents: ProjectDocument[], 
  documentToDelete: ProjectDocument
): ProjectDocument[] {
  return documents.filter(
    doc => doc.filename !== documentToDelete.filename || doc.title !== documentToDelete.title
  );
}

// Helper function to generate download URL using the S3 base URL from environment
export function getDocumentDownloadUrl(document: ProjectDocument): string {
  const s3BaseUrl = import.meta.env.VITE_S3_BASE_URL;
  
  if (document.filename.startsWith('http')) {
    return document.filename;
  }
  
  if (s3BaseUrl && !document.filename.startsWith('http')) {
    // Ensure the base URL ends with a slash and the filename doesn't start with one
    const baseUrl = s3BaseUrl.endsWith('/') ? s3BaseUrl : `${s3BaseUrl}/`;
    const filename = document.filename.startsWith('/') ? document.filename.slice(1) : document.filename;
    
    return `${baseUrl}${filename}`;
  }
  
  // Fallback - return the filename as is
  return document.filename;
}
export function getDocumentDisplayName(document: ProjectDocument): string {
  return document.title || document.filename.split('/').pop() || 'Untitled Document';
}

export function getFileType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const fileTypes: { [key: string]: string } = {
    'pdf': 'PDF',
    'doc': 'Word',
    'docx': 'Word',
    'xls': 'Excel',
    'xlsx': 'Excel',
    'ppt': 'PowerPoint',
    'pptx': 'PowerPoint',
    'txt': 'Text',
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'webp': 'WEBP',
    'zip': 'Archive',
    'rar': 'Archive',
    'mp4': 'Video',
    'mpeg': 'Video',
    'mov': 'Video',
    'avi': 'Video',
    'mkv': 'Video',
    'wmv': 'Video'
  };
  
  return fileTypes[extension] || 'File';
}

export async function deleteProjectDocument(
  request: DeleteProjectDocumentRequest
): Promise<DeleteProjectDocumentResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!request.filename?.trim()) {
      return {
        success: false,
        message: "Filename is required"
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/documents/${encodeURIComponent(request.filename)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: DeleteProjectDocumentResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete document");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to delete document");
    } else {
      toast.success(result.message || "Document deleted successfully");
    }

    return result;
  } catch (error: any) {
    console.error("Error deleting project document:", error);
    toast.error(error.message || "Network error while deleting document");
    return {
      success: false,
      message: error.message || "Network error while deleting document"
    };
  }
}

export async function deleteProjectDocuments(
  request: DeleteProjectDocumentsRequest
): Promise<DeleteProjectDocumentsResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!Array.isArray(request.filenames) || request.filenames.length === 0) {
      return {
        success: false,
        message: "Filenames array is required"
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/documents`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ filenames: request.filenames })
    });

    const result: DeleteProjectDocumentsResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete documents");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to delete documents");
    } else {
      toast.success(result.message || "Documents deleted successfully");
    }

    return result;
  } catch (error: any) {
    console.error("Error deleting project documents:", error);
    toast.error(error.message || "Network error while deleting documents");
    return {
      success: false,
      message: error.message || "Network error while deleting documents"
    };
  }
}
// Reminder API Functions
export async function getProjectReminders(
  request: GetProjectRemindersRequest
): Promise<GetProjectRemindersResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/reminders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetProjectRemindersResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch project reminders");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching project reminders:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching project reminders"
    };
  }
}

export async function updateProjectReminders(
  request: UpdateProjectRemindersRequest
): Promise<UpdateProjectRemindersResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return { 
        success: false, 
        message: "Project ID is required" 
      };
    }

    if (!request.reminders || typeof request.reminders !== 'object') {
      return {
        success: false,
        message: "Reminders object is required"
      };
    }

    // Validate reminders structure
    if (typeof request.reminders.weekBefore !== 'boolean') {
      return {
        success: false,
        message: "weekBefore must be a boolean"
      };
    }

    if (typeof request.reminders.dayBefore !== 'boolean') {
      return {
        success: false,
        message: "dayBefore must be a boolean"
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/reminders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reminders: request.reminders })
    });

    const result: UpdateProjectRemindersResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update project reminders");
    }

    return result;
  } catch (error: any) {
    console.error("Error updating project reminders:", error);
    toast.error(error.message || "Network error while updating reminders");
    return {
      success: false,
      message: error.message || "Network error while updating reminders"
    };
  }
}