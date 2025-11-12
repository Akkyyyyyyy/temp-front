import { useState, useEffect } from "react";
import { Edit, Save, X, Loader2, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    getProjectAssignments,
    updateAssignmentInstructions,
    Assignment
} from "@/api/additional-tabs";
import { useAuth } from "@/context/AuthContext";

interface RolesTabProps {
    projectId: string;
}

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

export function RolesTab({ projectId }: RolesTabProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
    const [editInstructions, setEditInstructions] = useState("");
    const { user } = useAuth();

    // Fetch project assignments
    const fetchAssignments = async () => {
        if (!projectId) return;

        setIsLoading(true);
        try {
            const result = await getProjectAssignments({ projectId });

            if (result.success && result.assignments) {
                setAssignments(result.assignments);
            } else {
                setAssignments([]);
                if (result.message) {
                    toast.error(result.message);
                }
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast.error("Failed to load team assignments");
            setAssignments([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [projectId]);

    // Start editing instructions
    const handleStartEdit = (assignment: Assignment) => {
        setEditingAssignmentId(assignment.id);
        setEditInstructions(assignment.instructions || "");
    };

    // Start adding instructions
    const handleAddInstructions = (assignment: Assignment) => {
        setEditingAssignmentId(assignment.id);
        setEditInstructions("");
    };

    // Save instructions
    const handleSaveEdit = async () => {
        if (!editingAssignmentId) return;

        try {
            const result = await updateAssignmentInstructions({
                assignmentId: editingAssignmentId,
                instructions: editInstructions
            });

            if (result.success && result.assignment) {
                // Update local state with the updated assignment
                setAssignments(prev => prev.map(assignment =>
                    assignment.id === editingAssignmentId
                        ? result.assignment!
                        : assignment
                ));
                setEditingAssignmentId(null);
                setEditInstructions("");
            }
        } catch (error) {
            console.error("Error updating instructions:", error);
            // Error is already handled in the API function
        }
    };

    // Remove instructions
    const handleRemoveInstructions = async (assignmentId: string) => {
        try {
            const result = await updateAssignmentInstructions({
                assignmentId: assignmentId,
                instructions: ""
            });

            if (result.success && result.assignment) {
                // Update local state with the updated assignment
                setAssignments(prev => prev.map(assignment =>
                    assignment.id === assignmentId
                        ? result.assignment!
                        : assignment
                ));
            }
        } catch (error) {
            console.error("Error removing instructions:", error);
            // Error is already handled in the API function
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingAssignmentId(null);
        setEditInstructions("");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                <span className="ml-3 text-muted-foreground">Loading team...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">No team members assigned yet</p>
                    <p className="text-xs mt-1">Add team members to see their roles and instructions</p>
                </div>
            ) : (
                assignments.map((assignment) => (
                    <div
                        key={assignment.id}
                        className="p-4 bg-background rounded-lg border border-border/20"
                    >
                        {/* Member Info */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10"
                                    style={{
                                        borderColor: assignment.member.ringColor || 'hsl(var(--muted))',
                                        boxShadow: `0 0 0 2px ${assignment.member.ringColor || 'hsl(var(--muted))'}`
                                    }}>
                                    <AvatarImage
                                        src={`${S3_URL}/${assignment.member.profilePhoto}`}
                                        alt={assignment.member.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-studio-gold text-studio-dark font-semibold">
                                        {assignment.member.name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-medium text-foreground">
                                        {assignment.member.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        {assignment.role.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium text-foreground">Instructions</h5>
                                {editingAssignmentId !== assignment.id && assignment.instructions && user.data.isAdmin && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEdit(assignment)}
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        >
                                            <Edit className="w-3 h-3 mr-1" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveInstructions(assignment.id)}
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {editingAssignmentId === assignment.id ? (
                                // Edit mode
                                <div className="space-y-2">
                                    <Input
                                        value={editInstructions}
                                        onChange={(e) => setEditInstructions(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveEdit();
                                            }
                                        }}
                                        placeholder={`Add instructions for ${assignment.member.name}`}
                                        className="h-8 text-sm"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleSaveEdit}
                                            className="h-7 text-xs"
                                        >
                                            <Save className="w-3 h-3 mr-1" />
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            className="h-7 text-xs"
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // View mode
                                <div className="group relative">
                                    {assignment.instructions ? (
                                        <div className="text-sm text-foreground bg-muted/30 rounded-md p-2 pr-10">
                                            {assignment.instructions}
                                        </div>
                                    ) : (
                                        user.data.isAdmin ? (
                                            <button
                                                onClick={() => handleAddInstructions(assignment)}
                                                className="w-full text-left text-sm text-muted-foreground italic bg-muted/20 hover:bg-muted/30 rounded-md p-2 transition-colors"
                                            >
                                                + Add instructions
                                            </button>
                                        ) : (
                                    <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-2 pr-10">
                                        No instructions
                                    </div>
                                    )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}