import { validateImageFiles } from "@/api/moodboard";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useMoodBoard } from "@/hooks/useMoodBoard";
import { AlertTriangle, ChevronLeft, ChevronRight, Folder, Image as ImageIcon, Loader2, Plus, PlusCircle, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface MoodboardTabProps {
    projectId: string;
}

interface FolderDisplay {
    id: string;
    name: string;
    imageCount: number;
    images: string[];
    createdAt: string;
    parentId?: string | null;
}

export interface filesObject extends File {
    exclude?: boolean
}

export function MoodboardTab({ projectId }: MoodboardTabProps) {
    // Use the MoodBoard hook
    const {
        folders,
        loading,
        error,
        createFolder,
        uploadImages,
        deleteImage,
        deleteFolder,
    } = useMoodBoard({ projectId, autoFetch: true });

    // State Management
    const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
    const [isAddImageDialogOpen, setIsAddImageDialogOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<FolderDisplay | null>(null);
    const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<FolderDisplay | null>(null);
    const [isDeletingFolder, setIsDeletingFolder] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // Handlers
    const handleAddFolder = async () => {
        if (!newFolderName.trim()) return;

        const response = await createFolder(newFolderName.trim());

        if (response.success) {
            setNewFolderName("");
            setIsAddFolderDialogOpen(false);
        }
    };

    const handleFolderClick = (folder: FolderDisplay) => {
        setSelectedFolder(folder);
        setIsGalleryDialogOpen(true);
    };

    const handleOpenImageDialog = (folderId?: string) => {
        setTargetFolderId(folderId || null);
        setIsAddImageDialogOpen(true);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = (files: filesObject[]) => {
        const validation = validateImageFiles(files);
        if (!validation.valid) {
            toast.error(<ul style={{ listStyleType: "disc;" }}>{
                validation.errors.map((error) => {
                    return <li>&#x2022; {error}</li>
                })}</ul>)
        }
        fileInputRef.current.value = null
        const newFiles = files.filter(data => !data.exclude)
        // Append to existing files instead of replacing
        setDraggedFiles(prev => [...prev, ...newFiles]);
        const urls = newFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...urls]);
    };

    const handleUploadImages = async () => {
        if (draggedFiles.length === 0 || !targetFolderId) {
            return;
        }

        setIsUploading(true);

        const response = await uploadImages(targetFolderId, draggedFiles);

        setIsUploading(false);

        if (response.success) {
            // Close dialogs and reset state
            clearPreviews();
            setIsAddImageDialogOpen(false);
            setIsGalleryDialogOpen(false);
            setSelectedFolder(null);
        }
    };

    const clearPreviews = () => {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setDraggedFiles([]);
        setPreviewUrls([]);
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!selectedFolder) return;

        // Optimistically update the selected folder immediately
        const updatedImages = selectedFolder.images.filter(url => url !== imageUrl);
        setSelectedFolder({
            ...selectedFolder,
            images: updatedImages,
            imageCount: updatedImages.length
        });

        // Call API to delete
        await deleteImage(selectedFolder.id, imageUrl);
    };

    const handleDeleteImageFromPreview = async (imageUrl: string) => {
        if (!selectedFolder) return;

        const currentImages = selectedFolder.images;
        const currentIndex = currentImageIndex;

        // Delete the image
        await handleDeleteImage(imageUrl);

        // Handle navigation after deletion
        if (currentImages.length === 1) {
            // Last image deleted, close preview
            setIsFullScreenOpen(false);
        } else if (currentIndex >= currentImages.length - 1) {
            // Deleted last image, show previous
            setCurrentImageIndex(Math.max(0, currentIndex - 1));
        }
        // If deleted image is not last, next image will automatically show at same index
    };

    const handleOpenDeleteFolderDialog = (e: React.MouseEvent, folder: FolderDisplay) => {
        e.stopPropagation();
        setFolderToDelete(folder);
        setIsDeleteFolderDialogOpen(true);
    };

    const handleConfirmDeleteFolder = async () => {
        if (!folderToDelete) return;

        setIsDeletingFolder(true);

        try {
            // Call API to delete folder and all images
            const response = await deleteFolder(folderToDelete.id);

            if (response.success) {
                // Close dialogs and clear selection
                setIsDeleteFolderDialogOpen(false);
                setFolderToDelete(null);

                // If this folder was selected in gallery, close gallery
                if (selectedFolder && selectedFolder.id === folderToDelete.id) {
                    setIsGalleryDialogOpen(false);
                    setSelectedFolder(null);
                }

                // If full screen preview is open for this folder, close it
                if (isFullScreenOpen && selectedFolder && selectedFolder.id === folderToDelete.id) {
                    setIsFullScreenOpen(false);
                }
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
        } finally {
            setIsDeletingFolder(false);
        }
    };

    const removePreview = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setDraggedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Full-screen image viewer handlers
    const handleImageClick = (index: number) => {
        setCurrentImageIndex(index);
        setIsFullScreenOpen(true);
    };

    const handlePreviousImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

    const handleNextImage = () => {
        if (selectedFolder && currentImageIndex < selectedFolder.images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };

    // Keyboard navigation for full-screen viewer
    useEffect(() => {
        if (!isFullScreenOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePreviousImage();
            } else if (e.key === 'ArrowRight') {
                handleNextImage();
            } else if (e.key === 'Escape') {
                setIsFullScreenOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreenOpen, currentImageIndex, selectedFolder]);

    // Clean up preview URLs on unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    // Sync selectedFolder with folders when folders update
    useEffect(() => {
        if (selectedFolder && isGalleryDialogOpen) {
            const updatedFolder = folders.find(f => f.id === selectedFolder.id);
            if (updatedFolder) {
                setSelectedFolder(updatedFolder);
            }
        }
    }, [folders, isGalleryDialogOpen]);

    // Loading state
    if (loading && folders.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                <span className="ml-3 text-muted-foreground">Loading moodboard...</span>
            </div>
        );
    }

    // Error state
    if (error && folders.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-red-500 mb-4">⚠️ Error loading moodboard</div>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">Moodboard</h4>
            </div>
            {/* Top Controls */}
            {
                user.data.isAdmin &&
                <div className="flex">
                    <Button
                        onClick={() => setIsAddFolderDialogOpen(true)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Folder
                    </Button>
                </div>
            }

            {/* Folder Display Grid */}
            {
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {folders.map(folder => (
                        <Card
                            key={folder.id}
                            className="cursor-pointer hover:border-studio-gold/50 transition-all hover:shadow-lg group"
                            onClick={() => handleFolderClick(folder)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Folder className="w-6 h-6 text-studio-gold" fill="currentColor" />

                                    <h3 className="font-semibold text-foreground truncate flex-1">
                                        {folder.name}
                                    </h3>
                                    {
                                        user.data.isAdmin && <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenImageDialog(folder?.id)
                                                }}
                                                className="transition-opacity p-1.5 hover:bg-studio-gold/10 rounded-full"
                                            >
                                                <PlusCircle className="w-4 h-4 text-studio-gold" />
                                            </button>
                                            <button
                                                onClick={(e) => handleOpenDeleteFolderDialog(e, folder)}
                                                className="transition-opacity p-1.5 hover:bg-destructive/10 rounded-full"
                                                title="Delete folder"
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </button>
                                        </>
                                    }
                                </div>

                                {/* Preview Thumbnails */}
                                {folder.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {folder.images.slice(0, 3).map((imageUrl, idx) => (
                                            <div
                                                key={`${folder.id}-${idx}`}
                                                className="h-[100px] w-auto rounded overflow-hidden bg-muted"
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={`${folder.name} preview ${idx + 1}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[100px] text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded">
                                        No images yet
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground mt-3">
                                    {folder.imageCount} {folder.imageCount === 1 ? 'image' : 'images'}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }

            {/* Add Folder Dialog */}
            <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                                id="folder-name"
                                placeholder="Enter folder name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddFolder();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddFolderDialogOpen(false);
                                setNewFolderName("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddFolder}
                            disabled={!newFolderName.trim() || loading}
                            className="bg-studio-gold hover:bg-studio-gold/90 text-studio-dark"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Image Dialog */}
            <Dialog open={isAddImageDialogOpen} onOpenChange={(open) => {
                setIsAddImageDialogOpen(open);
                if (!open) clearPreviews();
            }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Add Images to "{folders.find(f => f.id === targetFolderId)?.name || 'Folder'}"
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Drag & Drop Area */}
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-studio-gold/50 transition-colors cursor-pointer bg-background/50"
                            onDrop={handleFileDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-foreground mb-2 font-medium">Drop multiple files here or click to upload</p>
                            <p className="text-sm text-muted-foreground">Supports: JPEG, JPG, PNG, WEBP</p>
                            <p className="text-xs text-muted-foreground mt-2">✨ Max 100 images, 5MB each</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>

                        {/* Preview Grid */}
                        {previewUrls.length > 0 && (
                            <div className="space-y-2">
                                <Label>
                                    Preview{previewUrls.length >= 2 ? ` (${previewUrls.length} files)` : ''}
                                </Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 border border-border rounded-lg">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover rounded"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removePreview(index);
                                                }}
                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={isUploading}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddImageDialogOpen(false);
                                clearPreviews();
                            }}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUploadImages}
                            disabled={draggedFiles.length === 0 || !targetFolderId || isUploading}
                            className="bg-studio-gold hover:bg-studio-gold/90 text-studio-dark"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    Upload {draggedFiles.length > 0 && `(${draggedFiles.length})`}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Gallery Dialog */}
            <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2">
                                <Folder className="w-5 h-5 text-studio-gold" fill="currentColor" />
                                {selectedFolder?.name}
                            </DialogTitle>
                            {
                                user.data.isAdmin &&
                                <Button
                                    onClick={() => handleOpenImageDialog(selectedFolder?.id)}
                                    size="sm"
                                    className="bg-studio-gold hover:bg-studio-gold/90 text-studio-dark"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Add Images
                                </Button>
                            }
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        {selectedFolder && selectedFolder.images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {selectedFolder.images.map((imageUrl, index) => (
                                    <div key={`${selectedFolder.id}-img-${index}`} className="relative group">
                                        <div
                                            className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => handleImageClick(index)}
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {
                                            user.data.isAdmin &&
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteImage(imageUrl);
                                                }}
                                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                title="Delete image"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        }
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No images in this folder yet</p>
                                {
                                    user.data.isAdmin &&
                                    <p className="text-sm">Click "Add Images" to upload</p>
                                }

                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Full-Screen Image Viewer */}
            <Dialog open={isFullScreenOpen} onOpenChange={setIsFullScreenOpen}>
                <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95 border-none overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsFullScreenOpen(false)}
                            className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background text-foreground rounded-full p-2 transition-colors"
                            title="Close (Esc)"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Delete Button */}
                        {selectedFolder && selectedFolder.images[currentImageIndex] && (
                            user.data.isAdmin &&
                            <button
                                onClick={() => handleDeleteImageFromPreview(selectedFolder.images[currentImageIndex])}
                                className="absolute top-4 right-20 z-50 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-2 transition-colors"
                                title="Delete image"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>

                        )}

                        {/* Image Counter */}
                        {selectedFolder && selectedFolder.images.length > 0 && (
                            <div className="absolute top-4 left-4 z-50 bg-background/80 text-foreground px-4 py-2 rounded-full text-sm font-medium">
                                {currentImageIndex + 1} / {selectedFolder.images.length}
                            </div>
                        )}

                        {/* Previous Button */}
                        {currentImageIndex > 0 && (
                            <button
                                onClick={handlePreviousImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 hover:bg-background text-foreground rounded-full p-3 transition-colors shadow-lg"
                                title="Previous (←)"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                        )}

                        {/* Main Image Container */}
                        {selectedFolder && selectedFolder.images[currentImageIndex] && (
                            <div className="relative w-full h-full flex items-center justify-center px-20 py-24">
                                <img
                                    src={selectedFolder.images[currentImageIndex]}
                                    alt={`Image ${currentImageIndex + 1}`}
                                    className="max-w-full max-h-full w-auto h-auto object-contain"
                                    style={{ maxHeight: 'calc(100vh - 12rem)', maxWidth: 'calc(100vw - 10rem)' }}
                                />
                                {/* Image Name */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/80 text-foreground px-6 py-3 rounded-full text-sm max-w-[90%] truncate">
                                    Image {currentImageIndex + 1}
                                </div>
                            </div>
                        )}

                        {/* Next Button */}
                        {selectedFolder && currentImageIndex < selectedFolder.images.length - 1 && (
                            <button
                                onClick={handleNextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 hover:bg-background text-foreground rounded-full p-3 transition-colors shadow-lg"
                                title="Next (→)"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Confirmation Dialog */}
            <AlertDialog open={isDeleteFolderDialogOpen} onOpenChange={(open) => {
                if (!isDeletingFolder) {
                    setIsDeleteFolderDialogOpen(open);
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Delete Folder?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {folderToDelete && (
                                <>
                                    Are you sure you want to delete <span className="font-semibold">"{folderToDelete.name}"</span>
                                    {folderToDelete.imageCount > 0 ? (
                                        <span> and all its images</span>
                                    ) : null}?

                                    {folderToDelete.imageCount > 0 && (
                                        <span className="block mt-2 text-destructive font-medium">
                                            This will permanently delete {folderToDelete.imageCount} {folderToDelete.imageCount === 1 ? 'image' : 'images'} from storage.
                                        </span>
                                    )}

                                    <span className="block mt-3 font-medium">This action cannot be undone.</span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingFolder}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteFolder}
                            disabled={isDeletingFolder}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeletingFolder ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Folder'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}