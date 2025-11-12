import {
  createFolder,
  CreateFolderResponse,
  deleteFolder,
  DeleteFolderResponse,
  deleteImage,
  DeleteImageResponse,
  formatFoldersForDisplay,
  getMoodBoard,
  GetMoodBoardResponse,
  IMoodBoard,
  uploadImages,
  UploadImagesResponse
} from '@/api/moodboard';
import { useCallback, useEffect, useState } from 'react';

interface UseMoodBoardOptions {
  projectId: string;
  autoFetch?: boolean;
}

interface FolderDisplay {
  id: string;
  name: string;
  imageCount: number;
  images: string[];
  createdAt: string;
  parentId?: string | null;
}

export function useMoodBoard({ projectId, autoFetch = true }: UseMoodBoardOptions) {
  const [moodBoard, setMoodBoard] = useState<IMoodBoard | null>(null);
  const [folders, setFolders] = useState<FolderDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch moodboard data
  const fetchMoodBoard = useCallback(async () => {
    if (!projectId) {
      setError("Project ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: GetMoodBoardResponse = await getMoodBoard({ projectId });

      if (response.success && response.moodBoard) {
        setMoodBoard(response.moodBoard);
        setFolders(formatFoldersForDisplay(response.moodBoard));
      } else {
        setError(response.message || "Failed to fetch moodboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching moodboard");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Create a new folder
  const handleCreateFolder = useCallback(async (
    folderName: string,
    parentId?: string | null
  ): Promise<CreateFolderResponse> => {
    if (!projectId) {
      return { success: false, message: "Project ID is required" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createFolder({
        projectId,
        folderName,
        parentId
      });

      if (response.success) {
        // Refresh moodboard data to get updated folders
        await fetchMoodBoard();
      }

      return response;
    } catch (err: any) {
      setError(err.message || "Failed to create folder");
      return { success: false, message: err.message || "Failed to create folder" };
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchMoodBoard]);

  // Upload images to a folder
  const handleUploadImages = useCallback(async (
    folderId: string,
    images: File[]
  ): Promise<UploadImagesResponse> => {
    if (!projectId) {
      return { success: false, message: "Project ID is required" };
    }

    if (!folderId) {
      return { success: false, message: "Folder ID is required" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadImages({
        projectId,
        folderId,
        images
      });

      if (response.success) {
        // Refresh moodboard data to get updated images
        await fetchMoodBoard();
      }

      return response;
    } catch (err: any) {
      setError(err.message || "Failed to upload images");
      return { success: false, message: err.message || "Failed to upload images" };
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchMoodBoard]);

  // Delete an image
  const handleDeleteImage = useCallback(async (
    folderId: string,
    imageUrl: string
  ): Promise<DeleteImageResponse> => {
    if (!projectId) {
      return { success: false, message: "Project ID is required" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await deleteImage({
        projectId,
        folderId,
        imageUrl
      });

      if (response.success) {
        // Optimistically update the UI
        if (moodBoard) {
          const updatedMoodBoard = {
            ...moodBoard,
            uploads: {
              ...moodBoard.uploads,
              [folderId]: (moodBoard.uploads[folderId] || []).filter(url => url !== imageUrl)
            }
          };
          setMoodBoard(updatedMoodBoard);
          setFolders(formatFoldersForDisplay(updatedMoodBoard));
        }
      }

      return response;
    } catch (err: any) {
      setError(err.message || "Failed to delete image");
      return { success: false, message: err.message || "Failed to delete image" };
    } finally {
      setLoading(false);
    }
  }, [projectId, moodBoard]);

  // Delete a folder (with all images)
  const handleDeleteFolder = useCallback(async (
    folderId: string
  ): Promise<DeleteFolderResponse> => {
    if (!projectId) {
      return { success: false, message: "Project ID is required" };
    }

    if (!folderId) {
      return { success: false, message: "Folder ID is required" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await deleteFolder({
        projectId,
        folderId
      });

      if (response.success) {
        // Refresh moodboard data to get updated state
        await fetchMoodBoard();
      }

      return response;
    } catch (err: any) {
      setError(err.message || "Failed to delete folder");
      return { success: false, message: err.message || "Failed to delete folder" };
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchMoodBoard]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && projectId) {
      fetchMoodBoard();
    }
  }, [autoFetch, projectId, fetchMoodBoard]);

  return {
    moodBoard,
    folders,
    loading,
    error,
    fetchMoodBoard,
    createFolder: handleCreateFolder,
    uploadImages: handleUploadImages,
    deleteImage: handleDeleteImage,
    deleteFolder: handleDeleteFolder,
  };
}

