import { useState, useEffect, useRef, useMemo } from "react";
import { Edit, Plus, Trash2, Save, X, UserPlus, UserMinus, ChevronDown, File, Text, Phone, Mail, User, MapPin, FileText, Calendar, UserCog, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "./TeamMembers";
import { format, parseISO } from "date-fns";
import {
    updateProjectSections,
    getProjectSections,
    IProjectSection,
    removeMemberFromProject,
    getProjectById
} from "@/api/project";
import { AddMemberToProjectDialog } from "./AddMemberToProjectDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { toast } from "sonner";
import { EditProjectDialog } from "./modals/EditProjectDialog";
import {
    DocumentsTab,
    MoodboardTab,
    ChecklistTab,
    RolesTab,
    EquipmentTab,
    RemindersTab
} from './additional-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAuth } from "@/context/AuthContext";
import { formatTime, getFallback } from "@/helper/helper";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { AddEditEventDialog } from "./modals/AddEditEventDialog";
import { deleteEvent } from "@/api/event";
import { ConfirmDeleteEventDialog } from "./modals/ConfirmDeleteEventDialog";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface BriefSection {
    id: number;
    title: string;
    content: string | string[];
    type: 'text' | 'list';
}

interface LogisticsSection {
    id: number;
    title: string;
    content: string | string[];
    type: 'text' | 'list';
}

interface ProjectDetailsProps {
    projectId: string;
    teamMembers: TeamMember[];
    onClose: () => void;
    setSelectedMember: (member: TeamMember) => void;
    onAddSection: () => void;
    onReady: () => void;
    onAddTeamMember: () => void;
    EventDetailsRef?: React.RefObject<HTMLDivElement>;
    eventItem: string | null;
    isEventClick: boolean;
}

// Single source of truth for additional tabs configuration
const ADDITIONAL_TABS = {
    documents: {
        label: "Documents",
        description: "Upload and manage project documents",
        component: DocumentsTab
    },
    moodboard: {
        label: "Moodboard",
        description: "Visual inspiration and style references",
        component: MoodboardTab
    },
    checklist: {
        label: "Checklist",
        description: "Project tasks and completion tracking",
        component: ChecklistTab
    },
    roles: {
        label: "Team",
        description: "Team member responsibilities and roles",
        component: RolesTab
    },
    equipments: {
        label: "Equipment",
        description: "Required equipment and inventory",
        component: EquipmentTab
    },
    reminders: {
        label: "Reminders",
        description: "Important dates and notifications",
        component: RemindersTab
    }
} as const;

type AdditionalTabKey = keyof typeof ADDITIONAL_TABS;

// Props interface for additional tab components
interface AdditionalTabProps {
    projectId: string;
}

// Interface for event with assignments
interface ProjectEvent {
    id: string;
    name: string;
    date: string;
    startHour: number;
    endHour: number;
    location: string;
    reminders: any[];
    assignments: Assignment[];
    createdAt: string;
    updatedAt: string;
}

interface Assignment {
    id: string;
    instructions: string;
    googleEventId?: string;
    member: {
        id: string;
        name?: string;
        email: string;
        profilePhoto?: string;
        ringColor?: string;
    };
    role: {
        id: string;
        name: string;
    };
}

export function ProjectDetails({ projectId, teamMembers, onClose, setSelectedMember, onAddSection, onReady, onAddTeamMember, EventDetailsRef, eventItem, isEventClick }: ProjectDetailsProps) {
    const [activeProjectTab, setActiveProjectTab] = useState("creative-brief");
    const [editingSection, setEditingSection] = useState<number | null>(null);
    const [editingLogisticsSection, setEditingLogisticsSection] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [briefSections, setBriefSections] = useState<BriefSection[]>([]);
    const [logisticsSections, setLogisticsSections] = useState<LogisticsSection[]>([]);
    const [tabWidths, setTabWidths] = useState({});
    const tabRefs = useRef({});
    const [projectDetails, setProjectDetails] = useState<any>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [activeMainTab, setActiveMainTab] = useState<"project-details" | "additional-tabs">("project-details");
    const [activeAdditionalTab, setActiveAdditionalTab] = useState('documents');
    const additionalTabRefs = useRef({});
    const { user } = useAuth();
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [selectedEventForDialog, setSelectedEventForDialog] = useState(null);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [isDeleteEventDialogOpen, setIsDeleteEventDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isDeletingEvent, setIsDeletingEvent] = useState(false);


    // Add these functions inside ProjectDetails component:

    // Handle opening dialog to add new event
    const handleAddEvent = () => {
        setSelectedEventForDialog(null);
        setIsAddingEvent(true);
        setIsEventDialogOpen(true);
    };

    // Handle opening dialog to edit existing event
    // Update the handleEditEvent function
    const handleEditEvent = (event: any) => {
        setSelectedEventForDialog({
            id: event.id,
            projectId: projectId,
            name: event.name,
            date: event.date,
            startHour: event.startHour,
            endHour: event.endHour,
            location: event.location,
            reminders: event.reminders || {
                weekBefore: true,
                dayBefore: true
            },
            assignments: event.assignments?.map((assignment: any) => ({
                id: assignment.id,
                memberName: assignment.member?.name || '',
                responsibility: assignment.role?.name || '',
                memberId: assignment.member?.id || '',
                roleId: assignment.role?.id || '',
                instructions: assignment.instructions || ''
            })) || []
        });
        setIsAddingEvent(false);
        setIsEventDialogOpen(true);
    };

    // Update the handleDeleteEvent function to open confirmation dialog
    const handleDeleteEvent = (eventId: string, eventName: string) => {
        setEventToDelete({
            id: eventId,
            name: eventName
        });
        setIsDeleteEventDialogOpen(true);
    };

    // Add actual delete function
    const confirmDeleteEvent = async () => {
        if (!eventToDelete) return;

        setIsDeletingEvent(true);
        try {
            // Call your API to delete the event
            const result = await deleteEvent({ eventId: eventToDelete.id });

            if (result.success) {
                onAddSection();
                loadProjectDetails();
                setIsDeleteEventDialogOpen(false);
                setEventToDelete(null);
            } else {
                console.error(result.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        } finally {
            setIsDeletingEvent(false);
        }
    };

    // Add cancel delete function
    const cancelDeleteEvent = () => {
        setIsDeleteEventDialogOpen(false);
        setEventToDelete(null);
    };

    // Handle event dialog success
    const handleEventSuccess = () => {
        onAddSection();
        loadProjectDetails();
    };

    const handleProjectTabClick = (tab: string) => {
        setActiveMainTab("project-details");
        setActiveProjectTab(tab);
        handleCancelEdit('brief');
        handleCancelEdit('logistics');
    };

    const handleAdditionalTabClick = (tab: AdditionalTabKey) => {
        setActiveMainTab("additional-tabs");
        setActiveAdditionalTab(tab);
    };

    const loadProjectDetails = async () => {
        if (!projectId) return;

        setIsLoadingProject(true);
        try {
            const result = await getProjectById(projectId);
            if (result.success && result.project) {
                setProjectDetails(result.project);
            }
        } catch (error) {
            console.error('Error loading project details:', error);
        } finally {
            setIsLoadingProject(false);
        }
    };

    useEffect(() => {
        loadProjectDetails();
    }, [projectId]);

    useEffect(() => {
        if (projectDetails?.events && projectDetails.events.length > 0) {
            // First, check if event prop exists and find matching event
            if (eventItem) {
                const eventFromProp = projectDetails.events.find(e =>
                    e.id === eventItem
                );
                if (eventFromProp) {
                    setSelectedEventId(eventFromProp.id);
                    return;
                }
            }
            // Fallback to first event if no match or no event prop
            setSelectedEventId(projectDetails.events[0].id);
        }


    }, [projectDetails?.events, eventItem, isEventClick]);


    useEffect(() => {
        if (projectDetails) {
            onReady?.();
        }
    }, [projectId]);

    useEffect(() => {
        const widths = {};
        Object.keys(tabRefs.current).forEach(key => {
            if (tabRefs.current[key]) {
                widths[key] = tabRefs.current[key].offsetWidth;
            }
        });
        setTabWidths(widths);
    }, []);

    // Get all events for the project, sorted by date
    const projectEvents = useMemo(() => {
        if (!projectDetails?.events) return [];

        return [...projectDetails.events].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [projectDetails?.events]);

    // Get the currently selected event
    const selectedEvent = projectEvents.find(event => event.id === selectedEventId) || projectEvents[0];

    // Get assignments for the selected event
    const eventAssignments = useMemo(() => {
        if (!selectedEvent) return [];
        return selectedEvent.assignments || [];
    }, [selectedEvent]);

    const getActiveTabStyle = () => {
        if (!tabWidths[activeProjectTab]) return {};

        const activeIndex = ['creative-brief', 'logistics'].indexOf(activeProjectTab);
        let translateX = 0;

        for (let i = 0; i < activeIndex; i++) {
            const tabKey = ['creative-brief', 'logistics'][i];
            translateX += (tabWidths[tabKey] || 0) + 8;
        }

        return {
            width: `${tabWidths[activeProjectTab]}px`,
            transform: `translateX(${translateX}px)`
        };
    };

    // Store original sections for cancel operation
    const [originalBriefSections, setOriginalBriefSections] = useState<BriefSection[]>([]);
    const [originalLogisticsSections, setOriginalLogisticsSections] = useState<LogisticsSection[]>([]);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const isAnySectionEditing = editingSection !== null || editingLogisticsSection !== null;

    useEffect(() => {
        if (editingSection !== null || editingLogisticsSection !== null) {
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 100);
        }
    }, [editingSection, editingLogisticsSection]);

    useEffect(() => {
        const loadSections = async () => {
            setIsLoading(true);
            try {
                const response = await getProjectSections(projectId);
                if (response.success) {
                    const { brief, logistics } = response.data;

                    if (brief && Array.isArray(brief) && brief.length > 0) {
                        const briefSectionsData = brief.map(section => ({
                            id: parseInt(section.id) || Date.now() + Math.random(),
                            title: section.title || '',
                            content: section.content || '',
                            type: (section.type === 'list' ? 'list' : 'text') as 'text' | 'list'
                        }));
                        setBriefSections(briefSectionsData);
                        setOriginalBriefSections(briefSectionsData);
                    } else {
                        setBriefSections([]);
                        setOriginalBriefSections([]);
                    }

                    if (logistics && Array.isArray(logistics) && logistics.length > 0) {
                        const logisticsSectionsData = logistics.map(section => ({
                            id: parseInt(section.id) || Date.now() + Math.random(),
                            title: section.title || '',
                            content: section.content || '',
                            type: (section.type === 'list' ? 'list' : 'text') as 'text' | 'list'
                        }));
                        setLogisticsSections(logisticsSectionsData);
                        setOriginalLogisticsSections(logisticsSectionsData);
                    } else {
                        setLogisticsSections([]);
                        setOriginalLogisticsSections([]);
                    }
                }
            } catch (error) {
                console.error('Error loading sections:', error);
                setBriefSections([]);
                setLogisticsSections([]);
                setOriginalBriefSections([]);
                setOriginalLogisticsSections([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSections();
    }, [projectId]);

    const handleProjectDeleted = () => {
        onClose();
        onAddSection();
        loadProjectDetails();
    };

    // Handle remove member from event assignment
    const handleRemoveMember = async (memberId: string, eventId: string) => {
        setIsSaving(true);
        try {
            // Note: You might need to update this API to handle event-based assignments
            const response = await removeMemberFromProject({
                projectId,
                memberId,
                eventId // Pass eventId to remove from specific event
            });

            if (response.success) {
                onAddSection();
                loadProjectDetails();
            } else {
                console.error(response.message || "Failed to remove member");
            }
        } catch (error) {
            console.error('Error removing member from event:', error);
            toast.error("Failed to remove member from event");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle member added callback
    const handleMemberAdded = () => {
        onAddSection();
        loadProjectDetails();
    };

    // Handle project updated callback
    const handleProjectUpdated = () => {
        onAddSection();
        loadProjectDetails();
    };

    const saveSectionsToBackend = async (sections: (BriefSection | LogisticsSection)[], sectionType: 'brief' | 'logistics') => {
        setIsSaving(true);
        try {
            const backendSections: IProjectSection[] = sections.map(section => ({
                id: section.id.toString(),
                type: section.type,
                title: section.title,
                content: section.content,
                order: section.id
            }));

            const response = await updateProjectSections({
                projectId,
                sectionType,
                sections: backendSections
            });

            if (response.success) {
                onAddSection();
                if (sectionType === 'brief') {
                    setOriginalBriefSections([...sections] as BriefSection[]);
                } else {
                    setOriginalLogisticsSections([...sections] as LogisticsSection[]);
                }
                toast.success("Section saved successfully");
                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error(`Error saving ${sectionType} sections:`, error);
            toast.error(error instanceof Error ? error.message : "Error saving sections");
            return false; // Return false to indicate failure
        } finally {
            setIsSaving(false);
        }
    };

    // Handle form submission
    const handleFormSubmit = async (e: React.FormEvent, sectionType: 'brief' | 'logistics') => {
        e.preventDefault();

        // Save original state before attempting to save
        let originalSections: (BriefSection | LogisticsSection)[] = [];

        if (sectionType === 'brief') {
            originalSections = [...briefSections];
        } else {
            originalSections = [...logisticsSections];
        }

        // Attempt to save
        const success = await handleSaveSection(sectionType);

        // If save failed, revert UI to original state
        if (!success) {
            if (sectionType === 'brief') {
                setBriefSections(originalSections as BriefSection[]);
            } else {
                setLogisticsSections(originalSections as LogisticsSection[]);
            }
        }
    };

    // Handle section deletion
    const handleDeleteSection = async (id: number, sectionType: 'brief' | 'logistics') => {
        // Save original state before attempting deletion
        let originalSections: (BriefSection | LogisticsSection)[] = [];
        let newSections: (BriefSection | LogisticsSection)[] = [];

        if (sectionType === 'brief') {
            originalSections = [...briefSections];
            newSections = briefSections.filter(s => s.id !== id);
            setBriefSections(newSections);
        } else {
            originalSections = [...logisticsSections];
            newSections = logisticsSections.filter(s => s.id !== id);
            setLogisticsSections(newSections);
        }

        // Attempt to save to backend
        const success = await saveSectionsToBackend(newSections, sectionType);

        // If save failed, revert UI to original state
        if (!success) {
            if (sectionType === 'brief') {
                setBriefSections(originalSections as BriefSection[]);
            } else {
                setLogisticsSections(originalSections as LogisticsSection[]);
            }
        }
    };

    // Handle adding new section
    const handleAddSection = (sectionType: 'brief' | 'logistics', contentType: 'text' | 'list') => {
        const newId = Math.max(0, ...(sectionType === 'brief' ? briefSections : logisticsSections).map(s => s.id)) + 1;
        const newSection = {
            id: newId,
            title: '',
            content: contentType === 'text' ? "" : [""],
            type: contentType
        };

        if (sectionType === 'brief') {
            const newSections = [newSection, ...briefSections];
            setBriefSections(newSections);
            setEditingSection(newId);
        } else {
            const newSections = [newSection, ...logisticsSections];
            setLogisticsSections(newSections);
            setEditingLogisticsSection(newId);
        }
    };

    // Handle saving section edits
    // Update handleSaveSection to return a boolean
    const handleSaveSection = async (sectionType: 'brief' | 'logistics'): Promise<boolean> => {
        try {
            // Save original state before attempting save
            const originalSections = sectionType === 'brief'
                ? [...briefSections]
                : [...logisticsSections];

            // Call saveSectionsToBackend
            const success = await saveSectionsToBackend(
                sectionType === 'brief' ? briefSections : logisticsSections,
                sectionType
            );

            if (!success) {
                // Revert UI on failure
                if (sectionType === 'brief') {
                    setBriefSections(originalSections as BriefSection[]);
                } else {
                    setLogisticsSections(originalSections as LogisticsSection[]);
                }
                return false;
            }
            setEditingSection(null);
            setEditingLogisticsSection(null);
            return true;
        } catch (error) {
            console.error("Error in handleSaveSection:", error);
            return false;
        }
    };

    // Handle canceling edits
    const handleCancelEdit = (sectionType: 'brief' | 'logistics') => {
        if (sectionType === 'brief') {
            setBriefSections([...originalBriefSections]);
            setEditingSection(null);
        } else {
            setLogisticsSections([...originalLogisticsSections]);
            setEditingLogisticsSection(null);
        }
    };

    // Format time from hour number to readable format




    // Render additional tab content using the configuration
    const renderAdditionalTabContent = () => {
        const TabComponent = ADDITIONAL_TABS[activeAdditionalTab].component;
        return <TabComponent projectId={projectId} eventId={selectedEventId}/>;
    };

    if (isLoadingProject) {
        return (
            <div className="mt-6 p-6 bg-background rounded-lg border border-border/20 min-h-[429px]">
                <div className="text-center text-muted-foreground">
                    Loading project details...
                </div>
            </div>
        );
    }

    if (!projectDetails) {
        return (
            <div className="mt-6 p-6 bg-background rounded-lg border border-border/20">
                <div className="text-center text-muted-foreground">
                    Project not found
                </div>
            </div>
        );
    }

    const start = new Date(projectDetails.startDate);
    const end = new Date(projectDetails.endDate);
    const durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const today = new Date();
    let status = "Upcoming";

    if (today >= start && today <= end) {
        status = "In Progress";
    } else if (today > end) {
        status = "Completed";
    }

    const renderEditableSection = (
        section: BriefSection | LogisticsSection,
        isEditing: boolean,
        onEdit: (id: number) => void,
        onSave: () => void,
        onCancel: () => void,
        onUpdate: (updatedSection: BriefSection | LogisticsSection) => void,
        onDelete: (id: number) => void,
        allSections: (BriefSection | LogisticsSection)[],
        sectionType: 'brief' | 'logistics'
    ) => {
        if (isEditing) {
            return (
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();

                        // Save current editing state
                        const currentEditingSection = allSections.find(s => s.id === section.id);
                        if (!currentEditingSection) return;

                        // Store original state for potential rollback
                        const originalSection = { ...currentEditingSection };

                        // Attempt to save
                        if (sectionType === 'brief') {
                            const originalSections = [...briefSections];
                            const success = await handleSaveSection(sectionType);
                            if (success) {
                                onSave();
                            } else {
                                // Revert to original section if save fails
                                const updatedSections = briefSections.map(s =>
                                    s.id === originalSection.id ? originalSection : s
                                );
                                setBriefSections(updatedSections as BriefSection[]);
                            }
                        } else {
                            const originalSections = [...logisticsSections];
                            const success = await handleSaveSection(sectionType);
                            if (success) {
                                onSave();
                            } else {
                                // Revert to original section if save fails
                                const updatedSections = logisticsSections.map(s =>
                                    s.id === originalSection.id ? originalSection : s
                                );
                                setLogisticsSections(updatedSections as LogisticsSection[]);
                            }
                        }
                    }}
                    className="space-y-4 bg-muted/30 p-3 rounded-lg"
                >
                    <Input
                        ref={titleInputRef}
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                        className="w-full text-lg font-medium bg-background border border-border px-2 py-1 rounded-lg"
                        autoFocus
                        placeholder="Enter Title"
                    />
                    {section.type === "text" ? (
                        <Textarea
                            rows={5}
                            value={section.content as string}
                            onChange={(e) => onUpdate({ ...section, content: e.target.value })}
                            className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-2 py-1"
                            placeholder="Enter Creative Brief"
                        />
                    ) : (
                        <div className="space-y-2">
                            {(section.content as string[]).map((item, index) => (
                                <div key={index} className="flex items-center gap-5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"></div>
                                    <Input
                                        type="text"
                                        value={item}
                                        onChange={(e) => onUpdate({
                                            ...section,
                                            content: (section.content as string[]).map((c, i) => i === index ? e.target.value : c)
                                        })}
                                        className="flex-1 text-foreground text-md bg-background border border-border rounded-lg px-2 py-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onUpdate({
                                            ...section,
                                            content: (section.content as string[]).filter((_, i) => i !== index)
                                        })}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => onUpdate({
                                    ...section,
                                    content: [...(section.content as string[]), ""]
                                })}
                                className="flex items-center gap-2 text-md text-muted-foreground hover:text-foreground"
                            >
                                <Plus className="w-3 h-3" />
                                Add item
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={isSaving}
                            size="sm"
                            className="h-9 text-md"
                        >
                            <Save className="w-3 h-3 mr-1" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 text-md"
                            onClick={() => {
                                // Revert to original section from original state arrays
                                if (sectionType === 'brief') {
                                    const originalSection = originalBriefSections.find(s => s.id === section.id);
                                    if (originalSection) {
                                        const updatedSections = briefSections.map(s =>
                                            s.id === section.id ? originalSection : s
                                        );
                                        setBriefSections(updatedSections);
                                    }
                                } else {
                                    const originalSection = originalLogisticsSections.find(s => s.id === section.id);
                                    if (originalSection) {
                                        const updatedSections = logisticsSections.map(s =>
                                            s.id === section.id ? originalSection : s
                                        );
                                        setLogisticsSections(updatedSections);
                                    }
                                }
                                onCancel();
                            }}
                            disabled={isSaving}
                        >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                        </Button>
                    </div>
                </form>
            );
        }

        return (
            <div>
                <div className="flex items-center gap-10 group">
                    <label className="text-foreground font-medium mt-1 text-xl">{section.title}</label>
                    {
                        user.data.isAdmin == true && (
                            <div className="flex items-center transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    onClick={() => onEdit(section.id)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => onDelete(section.id)}
                                    title="Delete Project"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                </div>
                {section.type === "text" ? (
                    <p className=" text-lg text-muted-foreground">{section.content as string}</p>
                ) : (
                    <ul className="text-lg font-medium text-muted-foreground list-disc list-inside space-y-1">
                        {(section.content as string[]).map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                )}
            </div>
        );
    };

    return (
        <div className="mt-6 p-6 bg-background rounded-lg border border-border/20">
            {/* Dialogs */}
            <DeleteProjectDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                projectId={projectId}
                projectName={projectDetails.name}
                onProjectDeleted={handleProjectDeleted}
            />

            <AddMemberToProjectDialog
                open={isAddingMember}
                onOpenChange={setIsAddingMember}
                projectId={projectId}
                onMemberAdded={handleMemberAdded}
                projectDetails={{
                    date: selectedEvent.date,
                    startHour: selectedEvent.startHour,
                    endHour: selectedEvent.endHour
                }}
                assignedMembers={[]} // Pass empty since we're adding to specific event
                onAddTeamMember={onAddTeamMember}
                selectedEventId={selectedEventId}
                selectedEventName={selectedEvent.name}
                projectEvents={projectDetails.events}
            />

            <EditProjectDialog
                open={isEditingProject}
                onOpenChange={setIsEditingProject}
                project={projectDetails}
                onProjectUpdated={handleProjectUpdated}
            />
            <AddEditEventDialog
                isOpen={isEventDialogOpen}
                setIsOpen={setIsEventDialogOpen}
                projectId={projectId}
                eventData={selectedEventForDialog}
                onSuccess={handleEventSuccess}
                onAddTeamMember={onAddTeamMember}
            />
            <ConfirmDeleteEventDialog
                open={isDeleteEventDialogOpen}
                onOpenChange={setIsDeleteEventDialogOpen}
                eventId={eventToDelete?.id || ''}
                eventName={eventToDelete?.name || ''}
                onConfirm={confirmDeleteEvent}
                onCancel={cancelDeleteEvent}
                isLoading={isDeletingEvent}
            />

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-center mb-6 gap-3 justify-between w-full">
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl md:text-2xl font-semibold text-foreground p-0 m-0">
                            {projectDetails.name}
                        </h3>
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: projectDetails.color }}
                        />
                    </div>
                    <p className="text-muted-foreground text-sm md:text-md">
                        {/* {format(new Date(projectDetails.startDate), "do MMM yyyy")} - {format(new Date(projectDetails.endDate), "do MMM yyyy")} */}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    {
                        user.data.isAdmin == true && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-border/40 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setIsEditingProject(true)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs border-border/40 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    title="Delete Project"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    }

                    <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border shadow-sm relative">
                        <div
                            className="absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out h-[calc(100%-8px)]"
                            style={getActiveTabStyle()}
                        />
                        {(['creative-brief', 'logistics']).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleProjectTabClick(tab)}
                                className={`
                                    relative capitalize px-4 py-1.5 text-sm rounded-full transition-all duration-300
                                    z-10 min-w-[80px] justify-center font-semibold h-8
                                    ${activeProjectTab === tab && activeMainTab === "project-details"
                                        ? 'text-primary-foreground bg-studio-gold'
                                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                                    }
                                `}
                            >
                                {tab.split('-').map(word =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                            </button>
                        ))}
                    </div>

                    {/* Additional Tabs Section */}
                    <div className="relative">
                        {/* Mobile Dropdown */}
                        <div className="block lg:hidden">
                            <Select
                                value={activeMainTab === "additional-tabs" ? activeAdditionalTab : ""}
                                onValueChange={(value) => handleAdditionalTabClick(value as AdditionalTabKey)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Additional Tabs" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(ADDITIONAL_TABS).map((tabKey) => (
                                        <SelectItem key={tabKey} value={tabKey}>
                                            {ADDITIONAL_TABS[tabKey as AdditionalTabKey].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hidden lg:block">
                            <div className="relative overflow-x-auto scrollbar-hide">
                                <div className="flex space-x-5 relative w-max min-w-full">
                                    {Object.keys(ADDITIONAL_TABS).map((tabKey) => (
                                        <button
                                            key={tabKey}
                                            ref={(el) => (additionalTabRefs.current[tabKey] = el)}
                                            onClick={() => handleAdditionalTabClick(tabKey as AdditionalTabKey)}
                                            className={` px-1 text-sm font-medium transition-all duration-300 relative whitespace-nowrap flex-shrink-0 ${activeAdditionalTab === tabKey && activeMainTab === "additional-tabs"
                                                ? 'text-primary'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {ADDITIONAL_TABS[tabKey as AdditionalTabKey].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="">
                {activeMainTab === "project-details" && (
                    <>
                        {activeProjectTab === "creative-brief" && (
                            <div className="bg-background/50 rounded-lg space-y-6 pb-6">
                                <div className="flex items-center justify-between mt-10">
                                    <h4 className="font-medium text-foreground">Creative Brief</h4>
                                </div>
                                {!isAnySectionEditing && (
                                    user.data.isAdmin == true && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleAddSection('brief', 'text')}
                                                className="flex items-center gap-2 px-3 py-2 text-smrounded-md"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Additional Brief
                                            </Button>
                                        </div>
                                    )
                                )}
                                <div className="space-y-4">
                                    {briefSections.length > 0 && (
                                        briefSections.map((section) => (
                                            <div key={section.id} className="group relative">
                                                {renderEditableSection(
                                                    section,
                                                    editingSection === section.id,
                                                    setEditingSection,
                                                    () => handleSaveSection('brief'),
                                                    () => handleCancelEdit('brief'),
                                                    (updated) => setBriefSections(prev =>
                                                        prev.map(s => s.id === section.id ? updated as BriefSection : s)
                                                    ),
                                                    (id) => handleDeleteSection(id, 'brief'),
                                                    briefSections,
                                                    'brief'
                                                )}
                                            </div>
                                        ))
                                    )}

                                </div>
                            </div>
                        )}

                        {activeProjectTab === "logistics" && (
                            <div className="bg-background/50 rounded-lg space-y-6 pb-6">
                                <div className="flex items-center justify-between mt-10">
                                    <h4 className="font-medium text-foreground">Logistics</h4>
                                </div>
                                {!isAnySectionEditing && (
                                    user.data.isAdmin == true && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleAddSection('logistics', 'list')}
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add
                                            </Button>
                                        </div>
                                    )
                                )}
                                <div className="space-y-4">
                                    {logisticsSections.length > 0 && (
                                        logisticsSections.map((section) => (
                                            <div key={section.id} className="group relative">
                                                {renderEditableSection(
                                                    section,
                                                    editingLogisticsSection === section.id,
                                                    setEditingLogisticsSection,
                                                    () => handleSaveSection('logistics'),
                                                    () => handleCancelEdit('logistics'),
                                                    (updated) => setLogisticsSections(prev =>
                                                        prev.map(s => s.id === section.id ? updated as LogisticsSection : s)
                                                    ),
                                                    (id) => handleDeleteSection(id, 'logistics'),
                                                    logisticsSections,
                                                    'logistics'
                                                )}
                                            </div>
                                        ))
                                    ) }
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Additional Tabs Content */}
                {activeMainTab === "additional-tabs" && (
                    <div className="bg-background/50 rounded-lg">
                        <div className="py-4">
                            {renderAdditionalTabContent()}
                        </div>
                    </div>
                )}
            </div>

            {/* Team and Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Section with Event Dropdown */}
                <div className="p-2">
                    <div className="flex items-center justify-between mb-6" ref={EventDetailsRef}>
                        <div>
                            <h3 className="text-lg md:text-xl font-semibold text-foreground">Events</h3>
                        </div>
                        {user.data.isAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs sm:text-sm"
                                onClick={handleAddEvent}
                            >
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">New Event</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )}
                    </div>

                    {/* Empty State - No events at all */}
                    {projectEvents.length === 0 && (
                        <div className="text-center py-6 sm:py-8 px-4 border-2 border-dashed border-border/40 rounded-xl bg-muted/20 animate-in fade-in duration-300">
                            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3 opacity-50" />
                            <h4 className="font-medium text-foreground text-sm sm:text-base mb-1">No events scheduled</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-2">Create your first event to start assigning team members</p>
                            {user.data.isAdmin && (
                                <Button
                                    onClick={handleAddEvent}
                                    className="hover:shadow-sm text-xs sm:text-sm"
                                    size="sm"
                                >
                                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Create Event
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Events List as Accordions */}
                    {projectEvents.length > 0 && (
                        <div className="space-y-2">
                            {projectEvents.map((event) => {
                                const isExpanded = selectedEventId === event.id;

                                return (
                                    <div
                                        key={event.id}
                                        className={`rounded-lg border transition-all duration-300 overflow-hidden ${isExpanded
                                            ? 'shadow-sm'
                                            : 'border-border/40 hover:border-border'
                                            }`}
                                    >
                                        <div
                                            onClick={() => setSelectedEventId(isExpanded ? "" : event.id)}
                                            className={`p-3 sm:p-4 cursor-pointer flex items-center justify-between transition-all duration-300 ${isExpanded
                                                ? 'bg-background'
                                                : 'bg-background hover:bg-muted/30'
                                                }`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{event.name}</h4>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </div>

                                        <div
                                            className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                                }`}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="p-3 sm:p-4 lg:p-5 bg-background animate-in fade-in-50 duration-300">
                                                    {/* Event Info & Actions Row */}
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 sm:mb-5">
                                                        <div className="flex-1">
                                                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1.5 animate-in fade-in-50 duration-300 delay-100">
                                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                    {format(new Date(event.date), 'EEEE, do MMM yyyy')}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 animate-in fade-in-50 duration-300 delay-150">
                                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                    {formatTime(event.startHour)} - {formatTime(event.endHour)}
                                                                </span>
                                                                {event.location && (
                                                                    <span className="flex items-center gap-1.5 animate-in fade-in-50 duration-300 delay-200">
                                                                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                        <span className="truncate">{event.location}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Admin Actions - Icon Only */}
                                                        {user.data.isAdmin && (
                                                            <div className="flex gap-2 animate-in fade-in-50 duration-300 delay-250 self-start sm:self-center">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-border/40 hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
                                                                    title="Edit Event"
                                                                    onClick={() => handleEditEvent(event)}
                                                                >
                                                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-border/40 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                                    title="Delete Event"
                                                                    onClick={() => handleDeleteEvent(event.id, event.name)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Team Members Section */}
                                                    <div className="animate-in fade-in-50 duration-300 delay-300">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-foreground text-sm sm:text-base">Team Members</h4>
                                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                                    {eventAssignments.length} member{eventAssignments.length !== 1 ? 's' : ''} assigned
                                                                </p>
                                                            </div>
                                                            {user.data.isAdmin && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-xs h-8 sm:h-9 px-3 sm:px-4 hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap flex-shrink-0"
                                                                    onClick={() => setIsAddingMember(true)}
                                                                >
                                                                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                                    <span>Add Member</span>
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {/* Team Members Grid - Full width layout */}
                                                        <div className="space-y-3">
                                                            {eventAssignments.map((assignment) => (
                                                                <div
                                                                    key={assignment.id}
                                                                    className="group relative p-3 sm:p-4 bg-background/80 rounded-lg border border-border/30 w-full"
                                                                >
                                                                    <div className="flex items-start gap-3 sm:gap-4">
                                                                        <div className="relative flex-shrink-0">
                                                                            <Avatar
                                                                                className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-background transition-transform duration-300 "
                                                                                style={{
                                                                                    borderColor: assignment.member.ringColor || 'hsl(var(--muted))',
                                                                                    boxShadow: `0 0 0 2px ${assignment.member.ringColor || 'hsl(var(--muted))'}`,
                                                                                    color: assignment.member.ringColor || 'hsl(var(--muted))'
                                                                                }}
                                                                            >
                                                                                <AvatarImage
                                                                                    src={`${S3_URL}/${assignment.member.profilePhoto}`}
                                                                                    alt={assignment.member.name}
                                                                                    className="object-cover"
                                                                                />
                                                                                <AvatarFallback className="bg-studio-gold text-background font-semibold text-xs sm:text-sm">
                                                                                    {getFallback(assignment.member.name)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h5 className="font-medium text-foreground text-sm sm:text-base truncate">{assignment.member.name}</h5>
                                                                                    <Badge
                                                                                        variant="secondary"
                                                                                        className="mt-1 text-xs font-normal bg-muted/50 transition-colors duration-300"
                                                                                    >
                                                                                        {assignment.role.name}
                                                                                    </Badge>
                                                                                </div>
                                                                                {user.data.isAdmin && (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => handleRemoveMember(assignment.member.id, event.id)}
                                                                                        disabled={isSaving}
                                                                                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors  flex-shrink-0 self-start sm:self-center"
                                                                                        title="Remove from event"
                                                                                    >
                                                                                        <UserMinus className="w-3.5 h-3.5" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>

                                                                            {/* {assignment.instructions && (
                                                                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/20">
                                                                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                                                                        <span className="font-medium text-foreground">Instructions:</span> {assignment.instructions}
                                                                                    </p>
                                                                                </div>
                                                                            )} */}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Empty State - No team members for this event */}
                                                        {eventAssignments.length === 0 && (
                                                            <div className="text-center py-6 sm:py-8 px-4 border-2 border-dashed border-border/40 rounded-xl bg-muted/20 mt-4 animate-in fade-in-50 duration-300">
                                                                <UserCog className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3 opacity-50" />
                                                                <h4 className="font-medium text-foreground text-sm sm:text-base mb-1">No team members assigned</h4>
                                                                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Add members to this event to get started</p>
                                                                {user.data.isAdmin && (
                                                                    <Button
                                                                        onClick={() => setIsAddingMember(true)}
                                                                        className="hover:shadow-sm transition-all duration-300 text-xs sm:text-sm"
                                                                        size="sm"
                                                                    >
                                                                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                                        Add First Member
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Project Details Section */}
                <div className="p-2">
                    <div className="flex items-center justify-between mb-5">
                        <h4 className="font-semibold text-lg text-foreground">Project Details</h4>
                    </div>

                    <div className="space-y-1">
                        {projectDetails.color && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground font-medium">Color</span>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                                        style={{ backgroundColor: projectDetails.color }}
                                    />
                                    <Badge
                                        variant={status === 'Active' ? 'default' : 'secondary'}
                                        className="font-medium text-xs px-3 py-1"
                                    >
                                        {projectDetails.color}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <div className="py-2">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Total Events</span>
                                <Badge
                                    variant={status === 'Active' ? 'default' : 'secondary'}
                                    className="font-medium text-xs px-3 py-1"
                                >
                                    {projectEvents.length}
                                </Badge>
                            </div>
                        </div>
                        <div className="py-2">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Status</span>
                                <Badge
                                    variant={status === 'Active' ? 'default' : 'secondary'}
                                    className="font-medium text-xs px-3 py-1"
                                >
                                    {status}
                                </Badge>
                            </div>
                        </div>

                        {projectDetails.description && (
                            <div className="py-2">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-muted-foreground font-medium min-w-[80px] pt-1">Description</span>
                                    <p className="text-foreground text-sm leading-relaxed bg-muted/20 p-3 rounded-md inline-block max-w-full">
                                        {projectDetails.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {projectDetails.client && (
                            <div className="pt-4 mt-4 border-t border-border space-y-3">
                                <h5 className="font-semibold text-foreground mb-2">Client Information</h5>

                                <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground font-medium">Name</span>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-foreground font-medium">{projectDetails.client.name}</span>
                                    </div>
                                </div>

                                {projectDetails.client.email && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground font-medium">Email</span>
                                        <a
                                            href={`mailto:${projectDetails.client.email}`}
                                            className="text-foreground hover:text-primary transition-colors flex items-center gap-2"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate max-w-[180px]">{projectDetails.client.email}</span>
                                        </a>
                                    </div>
                                )}

                                {projectDetails.client.mobile && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground font-medium">Mobile</span>
                                        <a
                                            href={`tel:${projectDetails.client.mobile}`}
                                            className="text-foreground hover:text-primary transition-colors flex items-center gap-2"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>{projectDetails.client.mobile}</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}