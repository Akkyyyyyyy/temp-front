import { toast } from "sonner";
import { apiFetch } from "./apiClient";
import { filesObject } from "@/components/additional-tabs/MoodboardTab";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// ==================== Type Definitions ====================

export interface IFolderMetadata {
  name: string;
  parentId?: string | null;
  createdAt: string;
}

export interface IMoodBoard {
  folders: {
    [folderId: string]: IFolderMetadata;
  };
  uploads: {
    [folderId: string]: string[]; // array of image URLs
  };
}

// ==================== Request/Response Interfaces ====================

// GET MoodBoard Data
export interface GetMoodBoardRequest {
  projectId: string;
}

export interface GetMoodBoardResponse {
  success: boolean;
  message?: string;
  moodBoard?: IMoodBoard;
}

// POST Create Folder
export interface CreateFolderRequest {
  projectId: string;
  folderName: string;
  parentId?: string | null;
}

export interface CreateFolderResponse {
  success: boolean;
  message: string;
  folderId?: string;
  folder?: IFolderMetadata;
}

// POST Upload Images (Bulk)
export interface UploadImagesRequest {
  projectId: string;
  folderId: string;
  images: File[];
}

export interface UploadImagesResponse {
  success: boolean;
  message: string;
  uploadedUrls?: string[];
  failedUploads?: string[];
}

// DELETE Image
export interface DeleteImageRequest {
  projectId: string;
  folderId: string;
  imageUrl: string;
}

export interface DeleteImageResponse {
  success: boolean;
  message: string;
}

// DELETE Folder (with all images)
export interface DeleteFolderRequest {
  projectId: string;
  folderId: string;
}

export interface DeleteFolderResponse {
  success: boolean;
  message: string;
  deletedImagesCount?: number;
  failedDeletions?: string[];
}

// ==================== Validation Constants ====================

const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES_PER_UPLOAD = 100;

// ==================== Validation Helper Functions ====================


/**
 * Validates image files before upload
 * - Checks file type (JPEG, JPG, PNG, GIF, WEBP)
 * - Checks file size (max 5MB per file)
 * - Checks total number of files (max 20)
 */
export function validateImageFiles(files: filesObject[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length === 0) {
    errors.push("At least one image file is required");
    return { valid: false, errors };
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    errors.push(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`);
    return { valid: false, errors };
  }

  files.forEach((file, index) => {
    // Check file type
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      errors.push(`File ${index + 1} (${file.name}): Unsupported format. Supported: JPEG, JPG, PNG, GIF, WEBP`);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      file.exclude = true
      errors.push(`File ${index + 1} (${file.name}): Size ${sizeMB}MB exceeds 5MB limit`);
    }
  });

  return { valid: errors.length === 0, errors };
}


// ==================== API Functions ====================

/**
 * GET MoodBoard Data
 * Fetches all folders and image uploads for a project
 */
export async function getMoodBoard(
  request: GetMoodBoardRequest
): Promise<GetMoodBoardResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    if (!request.projectId?.trim()) {
      return {
        success: false,
        message: "Project ID is required"
      };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/moodboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result: GetMoodBoardResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch moodboard data");
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching moodboard:", error);
    return {
      success: false,
      message: error.message || "Network error while fetching moodboard"
    };
  }
}

/**
 * POST Create Folder
 * Creates a new folder in the moodboard
 * 
 * Validation:
 * - Folder names are case-insensitive unique
 * - Returns 409 if duplicate name exists
 */
export async function createFolder(
  request: CreateFolderRequest
): Promise<CreateFolderResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    // Validate project ID
    if (!request.projectId?.trim()) {
      const error = "Project ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    const payload = {
      folderName: request.folderName.trim(),
      ...(request.parentId !== undefined && { parentId: request.parentId })
    };

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/moodboard/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result: CreateFolderResponse = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 409) {
        toast.error("A folder with this name already exists");
      } else if (response.status === 400) {
        toast.error(result.message || "Invalid folder data");
      } else {
        throw new Error(result.message || "Failed to create folder");
      }
      return result;
    }

    if (result.success) {
      toast.success(result.message || "Folder created successfully");
    }

    return result;
  } catch (error: any) {
    console.error("Error creating folder:", error);
    toast.error(error.message || "Network error while creating folder");
    return {
      success: false,
      message: error.message || "Network error while creating folder"
    };
  }
}

/**
 * POST Upload Images (Bulk)
 * Uploads multiple images to a folder
 * 
 * Validation:
 * - Supported formats: JPEG, JPG, PNG, GIF, WEBP
 * - Max file size: 5MB per file
 * - Max files: 100 per upload
 * - Uses folderId (not folder name)
 */
export async function uploadImages(
  request: UploadImagesRequest
): Promise<UploadImagesResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    // Validate project ID
    if (!request.projectId?.trim()) {
      const error = "Project ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    // Validate folder ID
    if (!request.folderId?.trim()) {
      const error = "Folder ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    // Validate image files
    const validation = validateImageFiles(request.images);
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return {
        success: false,
        message: validation.errors.join('; ')
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('folderId', request.folderId);

    // Append all image files
    request.images.forEach(file => {
      formData.append('images', file);
    });

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/moodboard/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData
    });

    const result: UploadImagesResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to upload images");
    }

    if (!result.success) {
      toast.error(result.message || "Failed to upload images");
      return result;
    }

    // Handle partial failures
    if (result.failedUploads && result.failedUploads.length > 0) {
      toast.warning(`${result.uploadedUrls?.length || 0} uploaded, ${result.failedUploads.length} failed`);
    } else {
      toast.success(result.message || `${result.uploadedUrls?.length || 0} file(s) uploaded successfully`);
    }

    return result;
  } catch (error: any) {
    console.error("Error uploading images:", error);
    toast.error(error.message || "Network error while uploading images");
    return {
      success: false,
      message: error.message || "Network error while uploading images"
    };
  }
}

/**
 * DELETE Image
 * Deletes a single image from a folder
 */
export async function deleteImage(
  request: DeleteImageRequest
): Promise<DeleteImageResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    // Validate project ID
    if (!request.projectId?.trim()) {
      const error = "Project ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    // Validate folder ID
    if (!request.folderId?.trim()) {
      const error = "Folder ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    // Validate image URL
    if (!request.imageUrl?.trim()) {
      const error = "Image URL is required";
      toast.error(error);
      return { success: false, message: error };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/moodboard/image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        folderId: request.folderId,
        imageUrl: request.imageUrl
      })
    });

    const result: DeleteImageResponse = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 404) {
        toast.error("Image not found");
      } else if (response.status === 400) {
        toast.error(result.message || "Invalid request");
      } else {
        throw new Error(result.message || "Failed to delete image");
      }
      return result;
    }

    if (result.success) {
      toast.success(result.message || "Image deleted successfully");
    } else {
      toast.error(result.message || "Failed to delete image");
    }

    return result;
  } catch (error: any) {
    console.error("Error deleting image:", error);
    toast.error(error.message || "Network error while deleting image");
    return {
      success: false,
      message: error.message || "Network error while deleting image"
    };
  }
}

/**
 * DELETE Folder (with all images)
 * Deletes a folder and all its images from both database and S3
 * 
 * IMPORTANT: This is an irreversible operation
 * - All images in the folder are permanently deleted from S3
 * - Folder metadata is removed from database
 * - May have partial failures (some images fail to delete)
 */
export async function deleteFolder(
  request: DeleteFolderRequest
): Promise<DeleteFolderResponse> {
  try {
    const token = localStorage.getItem('auth-token');

    // Validate project ID
    if (!request.projectId?.trim()) {
      const error = "Project ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    // Validate folder ID
    if (!request.folderId?.trim()) {
      const error = "Folder ID is required";
      toast.error(error);
      return { success: false, message: error };
    }

    const response = await apiFetch(`${baseUrl}/project/${request.projectId}/moodboard/folder`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        folderId: request.folderId
      })
    });

    const result: DeleteFolderResponse = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 404) {
        toast.error("Folder not found. It may have been already deleted.");
      } else if (response.status === 400) {
        toast.error(result.message || "Folder ID is required");
      } else {
        throw new Error(result.message || "Failed to delete folder");
      }
      return result;
    }

    if (result.success) {
      // Handle partial failures
      if (result.failedDeletions && result.failedDeletions.length > 0) {
        toast.warning(
          `Folder deleted, but ${result.failedDeletions.length} image(s) failed to delete. Check console for details.`
        );
        console.error('Failed to delete images:', result.failedDeletions);
      } else {
        // Complete success
        const imageCount = result.deletedImagesCount || 0;
        if (imageCount > 0) {
          toast.success(`Folder and ${imageCount} image(s) deleted successfully`);
        } else {
          toast.success("Empty folder deleted successfully");
        }
      }
    } else {
      toast.error(result.message || "Failed to delete folder");
    }

    return result;
  } catch (error: any) {
    console.error("Error deleting folder:", error);
    toast.error(error.message || "Network error while deleting folder");
    return {
      success: false,
      message: error.message || "Network error while deleting folder"
    };
  }
}

// ==================== Helper Functions ====================

/**
 * Extracts folder ID from the moodboard data structure
 */
export function getFolderIds(moodBoard: IMoodBoard): string[] {
  return Object.keys(moodBoard.folders || {});
}

/**
 * Gets all images for a specific folder
 */
export function getFolderImages(moodBoard: IMoodBoard, folderId: string): string[] {
  return moodBoard.uploads?.[folderId] || [];
}

/**
 * Checks if a folder has any images
 */
export function folderHasImages(moodBoard: IMoodBoard, folderId: string): boolean {
  return getFolderImages(moodBoard, folderId).length > 0;
}

/**
 * Gets folder metadata by ID
 */
export function getFolderMetadata(moodBoard: IMoodBoard, folderId: string): IFolderMetadata | null {
  return moodBoard.folders?.[folderId] || null;
}

/**
 * Counts total images across all folders
 */
export function getTotalImageCount(moodBoard: IMoodBoard): number {
  return Object.values(moodBoard.uploads || {}).reduce(
    (total, images) => total + images.length,
    0
  );
}

/**
 * Gets folder by name (case-insensitive)
 */
export function findFolderByName(moodBoard: IMoodBoard, folderName: string): { id: string; metadata: IFolderMetadata } | null {
  const normalizedName = folderName.toLowerCase().trim();

  for (const [folderId, metadata] of Object.entries(moodBoard.folders || {})) {
    if (metadata.name.toLowerCase().trim() === normalizedName) {
      return { id: folderId, metadata };
    }
  }

  return null;
}

/**
 * Formats folder data for display in components
 */
export function formatFoldersForDisplay(moodBoard: IMoodBoard): Array<{
  id: string;
  name: string;
  imageCount: number;
  images: string[];
  createdAt: string;
  parentId?: string | null;
}> {
  const folders = moodBoard.folders || {};
  const uploads = moodBoard.uploads || {};

  return Object.entries(folders).map(([folderId, metadata]) => ({
    id: folderId,
    name: metadata.name,
    imageCount: (uploads[folderId] || []).length,
    images: uploads[folderId] || [],
    createdAt: metadata.createdAt,
    parentId: metadata.parentId
  }));
}

