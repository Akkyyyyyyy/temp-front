import { useState, useEffect } from "react";
import { Edit, Save, X, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    getProjectAssignments,
    updateAssignmentInstructions,
    type GetProjectAssignmentsResponse
} from "@/api/additional-tabs";
import { useAuth } from "@/context/AuthContext";
import { getFallback, formatTime } from "@/helper/helper";
import { Textarea } from "../ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Label } from "../ui/label";

interface RolesTabProps {
    projectId: string;
    eventId: string;
}

interface EventWithAssignments {
    eventId: string;
    name?: string;
    date: string;
    startHour: number;
    endHour: number;
    location?: string;
    reminders?: any[];
    assignments: Assignment[];
}

interface Assignment {
    id: string;
    instructions?: string;
    googleEventId?: string;
    member: {
        id: string;
        name?: string;
        email: string;
        profilePhoto?: string;
        ringColor?: string;
    };
    role: {
        id?: string;
        name?: string;
    };
}

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

export function RolesTab({ projectId, eventId }: RolesTabProps) {
    const [events, setEvents] = useState<EventWithAssignments[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
    const [editInstructions, setEditInstructions] = useState("");
    const { user } = useAuth();

    const fetchAssignments = async () => {
        if (!projectId) return;

        setIsLoading(true);
        try {
            const result = await getProjectAssignments({ projectId });

            if (result.success && result.events) {
                setEvents(result.events);
            } else {
                setEvents([]);
                if (result.message) {
                    toast.error(result.message);
                }
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast.error("Failed to load project assignments");
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [projectId]);

    const isEventFinished = (event: EventWithAssignments): boolean => {
        if (!event.date || event.startHour === undefined) {
            return false;
        }

        const now = new Date();
        const eventDateTime = new Date(event.date);
        eventDateTime.setHours(event.startHour, 0, 0, 0);

        return now >= eventDateTime;
    };

    const handleStartEdit = (assignment: Assignment, event: EventWithAssignments) => {
        if (isEventFinished(event)) {
            toast.error("Cannot edit instructions for completed events");
            return;
        }
        setEditingAssignmentId(assignment.id);
        setEditInstructions(assignment.instructions || "");
    };

    const handleAddInstructions = (assignment: Assignment, event: EventWithAssignments) => {
        if (isEventFinished(event)) {
            toast.error("Cannot add instructions for completed events");
            return;
        }
        setEditingAssignmentId(assignment.id);
        setEditInstructions("");
    };

    const handleSaveEdit = async (event: EventWithAssignments) => {
        if (!editingAssignmentId) return;
        if (isEventFinished(event)) {
            toast.error("Cannot save instructions for completed events");
            handleCancelEdit();
            return;
        }

        try {
            const result = await updateAssignmentInstructions({
                assignmentId: editingAssignmentId,
                instructions: editInstructions
            });

            if (result.success && result.assignment) {
                setEvents(prevEvents =>
                    prevEvents.map(event => ({
                        ...event,
                        assignments: event.assignments.map(assignment =>
                            assignment.id === editingAssignmentId
                                ? {
                                    ...assignment,
                                    instructions: result.assignment!.instructions,
                                    member: result.assignment!.member,
                                    role: result.assignment!.role
                                }
                                : assignment
                        )
                    }))
                );
                setEditingAssignmentId(null);
                setEditInstructions("");
                toast.success("Instructions updated successfully");
            }
        } catch (error) {
            console.error("Error updating instructions:", error);
            toast.error("Failed to update instructions");
        }
    };

    const handleRemoveInstructions = async (assignmentId: string, event: EventWithAssignments) => {
        if (isEventFinished(event)) {
            toast.error("Cannot remove instructions for completed events");
            return;
        }
        try {
            const result = await updateAssignmentInstructions({
                assignmentId: assignmentId,
                instructions: ""
            });

            if (result.success && result.assignment) {
                setEvents(prevEvents =>
                    prevEvents.map(event => ({
                        ...event,
                        assignments: event.assignments.map(assignment =>
                            assignment.id === assignmentId
                                ? {
                                    ...assignment,
                                    instructions: undefined,
                                    member: result.assignment!.member,
                                    role: result.assignment!.role
                                }
                                : assignment
                        )
                    }))
                );
                toast.success("Instructions removed");
            }
        } catch (error) {
            console.error("Error removing instructions:", error);
            toast.error("Failed to remove instructions");
        }
    };

    const handleCancelEdit = () => {
        setEditingAssignmentId(null);
        setEditInstructions("");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-studio-gold mr-2" />
                <span className="text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-muted">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Team Members</h3>
                <p className="text-muted-foreground">Assign team members to events</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-foreground">Team</h4>
                </div>
            </div>

            <div className="space-y-4">
                {events.map((event) => {
                    const isFinished = isEventFinished(event);

                    return (
                        <Card key={event.eventId} className={`bg-background ${isFinished ? 'opacity-75' : ''}`}>
                            <CardContent className="pt-6">
                                {/* Event Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-foreground">
                                                {event.name || `Event ${event.eventId}`}
                                            </h3>
                                            {isFinished && (
                                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                                                    Completed
                                                </Badge>
                                            )}
                                        </div>
                                        {event.date && (
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    {format(new Date(event.date), 'EEEE, do MMM yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    {formatTime(event.startHour)} - {formatTime(event.endHour)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Assignments for this Event */}
                                <div className="space-y-4">
                                    {event.assignments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                            <p className="text-sm">No team members assigned to this event</p>
                                        </div>
                                    ) : (
                                        event.assignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="p-4 bg-muted/30 rounded-lg"
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
                                                                {getFallback(assignment.member.name)}
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
                                                        <Label className="text-sm font-medium text-foreground">Instructions</Label>
                                                        {editingAssignmentId !== assignment.id &&
                                                            assignment.instructions &&
                                                            user.data.isAdmin &&
                                                            !isFinished && (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleStartEdit(assignment, event)}
                                                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                                    >
                                                                        <Edit className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveInstructions(assignment.id, event)}
                                                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                    </div>

                                                    {editingAssignmentId === assignment.id ? (
                                                        // Edit mode
                                                        <div className="space-y-2">
                                                            <Textarea
                                                                value={editInstructions}
                                                                onChange={(e) => setEditInstructions(e.target.value)}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleSaveEdit(event);
                                                                    }
                                                                }}
                                                                placeholder={`Add instructions for ${assignment.member.name}`}
                                                                className="min-h-[80px] text-sm"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleSaveEdit(event)}
                                                                    className="h-8 text-xs bg-studio-gold hover:bg-studio-gold/90"
                                                                >
                                                                    <Save className="w-3 h-3 mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={handleCancelEdit}
                                                                    className="h-8 text-xs"
                                                                >
                                                                    <X className="w-3 h-3 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // View mode
                                                        <div>
                                                            {assignment.instructions ? (
                                                                <div className="text-sm text-foreground bg-background rounded-md p-3 border">
                                                                    {assignment.instructions}
                                                                </div>
                                                            ) : (
                                                                user.data.isAdmin && !isFinished ? (
                                                                    <button
                                                                        onClick={() => handleAddInstructions(assignment, event)}
                                                                        className="w-full text-left text-sm text-muted-foreground italic bg-background hover:bg-muted/30 rounded-md p-3 border border-dashed transition-colors"
                                                                    >
                                                                        + Add instructions
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-sm text-muted-foreground bg-background rounded-md p-3 border">
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
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}