import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Upload,
    File,
    Download,
    Trash2,
    FileText,
    Image,
    FileArchive,
    Loader2,
    Video,
    Eye
} from "lucide-react";
import {
    getProjectDocuments,
    uploadProjectDocument,
    deleteDocumentFromArray,
    getDocumentDownloadUrl,
    getFileType,
    type ProjectDocument,
    deleteProjectDocument
} from "@/api/additional-tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface DocumentsTabProps {
    projectId: string;
}

export function DocumentsTab({ projectId }: DocumentsTabProps) {
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const result = await getProjectDocuments({ projectId });
            if (result.success && result.documents) {
                setDocuments(result.documents);
            }
        } catch {
            console.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !title.trim()) return;

        try {
            setUploading(true);
            const result = await uploadProjectDocument({
                projectId,
                file: selectedFile,
                title: title.trim()
            });

            if (result.success) {
                setSelectedFile(null);
                setTitle("");
                fetchDocuments();
            }
        } catch {
            console.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentToDelete: ProjectDocument) => {
        try {
            setDeletingId(documentToDelete.filename);
            const result = await deleteProjectDocument({
                projectId,
                filename: documentToDelete.filename
            });

            if (result.success) {
                // Remove from local state
                const updatedDocuments = deleteDocumentFromArray(documents, documentToDelete);
                setDocuments(updatedDocuments);
            }
        } catch {
            console.error("Failed to delete document");
        } finally {
            setDeletingId(null);
        }
    };
    const handleView = (doc: ProjectDocument) => {
        const viewUrl = getDocumentDownloadUrl(doc);

        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = viewUrl;
        link.target = '_blank';
        

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleDownload = async(doc: ProjectDocument) => {
        const downloadUrl = getDocumentDownloadUrl(doc);
         const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.filename || 'document'; // Set the filename
        link.target = '_blank';

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFileIcon = (filename: string) => {
        const fileType = getFileType(filename);
        switch (fileType) {
            case 'PDF': return <FileText className="h-5 w-5 text-red-500" />;
            case 'Image': return <Image className="h-5 w-5 text-green-500" />;
            case 'Archive': return <FileArchive className="h-5 w-5 text-yellow-500" />;
            case 'Video': return <Video className="h-5 w-5 text-purple-500" />;
            default: return <File className="h-5 w-5 text-blue-500" />;
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                {/* <span>Documents ({documents.length})</span> */}
                {!selectedFile ? (
                    <Button asChild size="sm" className="flex items-center gap-2" variant="outline">
                        <label>
                            <Upload className="h-4 w-4" />
                            Upload Document
                            <Input
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </label>
                    </Button>
                ) : null}
            </div>

            <div className="space-y-4">
                {/* File Preview and Title Input */}
                {selectedFile && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!uploading && title.trim()) {
                                handleUpload();
                            }
                        }}
                        className="space-y-3 p-4 border rounded-lg bg-muted/50"
                    >
                        <div className="flex items-center gap-3">
                            <File className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="document-title" className="text-sm font-medium">
                                Document Title
                            </label>
                            <Input
                                id="document-title"
                                placeholder="Enter a Document title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={uploading}
                                className="border-2 focus:border-primary"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={uploading || !title.trim()}
                                className="flex items-center gap-2"
                            >
                                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {uploading ? "Uploading..." : "Upload"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                                disabled={uploading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {/* Documents List */}
                {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No documents yet</p>
                    </div>
                ) : (


                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="p-3 font-medium">Name</TableHead>
                                    <TableHead className="p-3 font-medium text-right">Format</TableHead>
                                    <TableHead className="p-3 font-medium text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((document, index) => (
                                    <TableRow key={index} className="">
                                        <TableCell className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="text-muted-foreground">
                                                    {getFileIcon(document.filename)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{document.title}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-3 flex justify-end">
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                {getFileType(document.filename)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(document)}
                                                    disabled={deletingId === document.filename}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownload(document)}
                                                    disabled={deletingId === document.filename}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(document)}
                                                    disabled={deletingId === document.filename}
                                                    className="h-7 w-7 p-0 text-destructive"
                                                >
                                                    {deletingId === document.filename ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}