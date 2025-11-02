import { useState, useEffect, useRef } from "react";
import { Edit, Plus, Trash2, Save, X, UserPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "./TeamMembers";
import { format } from "date-fns";
import {
    updateProjectSections,
    getProjectSections,
    IProjectSection,
    removeMemberFromProject
} from "@/api/project";
import { AddMemberToProjectDialog } from "./AddMemberToProjectDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { toast } from "sonner";
import { EditProjectDialog } from "./modals/EditProjectDialog";

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
}

// Single source of truth for additional tabs configuration
const ADDITIONAL_TABS = {
    documents: {
        label: "Documents",
        description: "Upload and manage project documents",
        content: (
            <div className="text-center py-8 text-muted-foreground">
                <p>Documents content will be displayed here</p>
                <p className="text-sm">Upload and manage project documents</p>
            </div>
        )
    },
    moodboard: {
        label: "Moodboard",
        description: "Visual inspiration and style references",
        content: (
            <div className="text-center py-8 text-muted-foreground">
                <p>Moodboard content will be displayed here</p>
                <p className="text-sm">Visual inspiration and style references</p>
            </div>
        )
    },
    checklist: {
        label: "Checklist",
        description: "Project tasks and completion tracking",
        content: (
            <div className="text-center py-8 text-muted-foreground">
                <p>Checklist content will be displayed here</p>
                <p className="text-sm">Project tasks and completion tracking</p>
            </div>
        )
    },
    roles: {
        label: "Roles",
        description: "Team member responsibilities and roles",
        content: (
            <div className="text-center py-8 text-muted-foreground">
                <p>Roles content will be displayed here</p>
                <p className="text-sm">Team member responsibilities and roles</p>
            </div>
        )
    },
    equipments: {
        label: "Equipment",
        description: "Required equipment and inventory",
        content: (
            <div className="text-center py-8 text-muted-foreground">
                <p>Equipment content will be displayed here</p>
                <p className="text-sm">Required equipment and inventory</p>
            </div>
        )
    },
    reminders: {
        label: "Reminders",
        description: "Important dates and notifications",
        content: (
            <div className="text-center py-8 text-muted-foreground">
                <p>Reminders content will be displayed here</p>
                <p className="text-sm">Important dates and notifications</p>
            </div>
        )
    }
} as const;

type AdditionalTabKey = keyof typeof ADDITIONAL_TABS;

export function ProjectDetails({ projectId, teamMembers, onClose, setSelectedMember, onAddSection }: ProjectDetailsProps) {
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
    const additionalTabRefs = useRef({});

    // New state for additional tabs - set "documents" as default
    const [activeAdditionalTab, setActiveAdditionalTab] = useState<AdditionalTabKey>("documents");

    useEffect(() => {
        const widths = {};
        Object.keys(tabRefs.current).forEach(key => {
            if (tabRefs.current[key]) {
                widths[key] = tabRefs.current[key].offsetWidth;
            }
        });
        setTabWidths(widths);
    }, []);

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

    // Get tab indicator style for additional tabs
    const getAdditionalTabStyle = () => {
        const activeEl = additionalTabRefs.current[activeAdditionalTab];
        if (!activeEl) return { width: 0, left: 0 };

        const rect = activeEl.getBoundingClientRect();
        const containerRect = activeEl.parentElement?.getBoundingClientRect();
        
        const left = (rect.left - (containerRect?.left || 0)) - 32;

        return {
            width: rect.width,
            left,
        };
    };

    // Store original sections for cancel operation
    const [originalBriefSections, setOriginalBriefSections] = useState<BriefSection[]>([]);
    const [originalLogisticsSections, setOriginalLogisticsSections] = useState<LogisticsSection[]>([]);

    // Ref for auto-focusing on title input
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Check if any section is being edited
    const isAnySectionEditing = editingSection !== null || editingLogisticsSection !== null;

    // Auto-focus on title input when editing starts
    useEffect(() => {
        if (editingSection !== null || editingLogisticsSection !== null) {
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 100);
        }
    }, [editingSection, editingLogisticsSection]);

    // Load sections from backend
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
    };

    // Get assigned workers
    const assignedWorker = teamMembers
        .filter(member =>
            member.projects.some(project => project.id === projectId)
        )
        .map(member => {
            const project = member.projects.find(project => project.id === projectId);
            return {
                ...member,
                projectRole: project?.newRole || 'No role assigned'
            };
        });

    // Prepare data for AddMemberDialog
    const assignedMembers = assignedWorker.map(worker => ({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        profilePhoto: worker.profilePhoto,
        role: worker.projectRole
    }));

    // Handle remove member from project
    const handleRemoveMember = async (memberId: string) => {
        setIsSaving(true);
        try {
            const response = await removeMemberFromProject({
                projectId,
                memberId
            });

            if (response.success) {
                onAddSection();
                toast.success("Member removed from project");
            } else {
                toast.error(response.message || "Failed to remove member");
            }
        } catch (error) {
            console.error('Error removing member from project:', error);
            toast.error("Failed to remove member from project");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle member added callback
    const handleMemberAdded = () => {
        onAddSection();
    };

    // Handle project updated callback
    const handleProjectUpdated = () => {
        onAddSection();
    };

    // Save sections to backend
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
            toast.error(`Failed to save ${sectionType} section`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Handle form submission
    const handleFormSubmit = async (e: React.FormEvent, sectionType: 'brief' | 'logistics') => {
        e.preventDefault();
        await handleSaveSection(sectionType);
    };

    // Handle section deletion
    const handleDeleteSection = async (id: number, sectionType: 'brief' | 'logistics') => {
        if (sectionType === 'brief') {
            const newSections = briefSections.filter(s => s.id !== id);
            setBriefSections(newSections);
            await saveSectionsToBackend(newSections, 'brief');
        } else {
            const newSections = logisticsSections.filter(s => s.id !== id);
            setLogisticsSections(newSections);
            await saveSectionsToBackend(newSections, 'logistics');
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
            const newSections = [...briefSections, newSection];
            setBriefSections(newSections);
            setEditingSection(newId);
        } else {
            const newSections = [...logisticsSections, newSection];
            setLogisticsSections(newSections);
            setEditingLogisticsSection(newId);
        }
    };

    // Handle saving section edits
    const handleSaveSection = async (sectionType: 'brief' | 'logistics') => {
        if (sectionType === 'brief') {
            setEditingSection(null);
            await saveSectionsToBackend(briefSections, 'brief');
        } else {
            setEditingLogisticsSection(null);
            await saveSectionsToBackend(logisticsSections, 'logistics');
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

    // Render additional tab content using the configuration
    const renderAdditionalTabContent = () => {
        return ADDITIONAL_TABS[activeAdditionalTab].content;
    };

    // Find project details
    const projectDetails = teamMembers
        .flatMap(member => member.projects)
        .find(project => project.id === projectId);

    if (!projectDetails) {
        return (
            <div className="mt-6 p-6 bg-background rounded-lg border border-border/20">
                <div className="text-center text-muted-foreground">
                    Project not found
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="mt-6 p-6 bg-background rounded-lg border border-border/20">
                <div className="text-center text-muted-foreground">
                    Loading project details...
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
                <form onSubmit={(e) => handleFormSubmit(e, sectionType)} className="space-y-2">
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                        className="w-full text-md font-medium bg-background border border-border rounded px-2 py-1"
                        autoFocus
                        placeholder="Enter Title"
                    />
                    {section.type === "text" ? (
                        <input
                            type="text"
                            value={section.content as string}
                            onChange={(e) => onUpdate({ ...section, content: e.target.value })}
                            className="w-full text-sm text-foreground bg-background border border-border rounded px-2 py-1"
                        />
                    ) : (
                        <div className="space-y-2">
                            {(section.content as string[]).map((item, index) => (

                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"></div>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => onUpdate({
                                            ...section,
                                            content: (section.content as string[]).map((c, i) => i === index ? e.target.value : c)
                                        })}
                                        className="flex-1 text-foreground bg-background border border-border rounded px-2 py-1"
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
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <Plus className="w-3 h-3" />
                                Add item
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Save className="w-3 h-3" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 disabled:opacity-50"
                        >
                            <X className="w-3 h-3" />
                            Cancel
                        </button>
                    </div>
                </form>
            );
        }

        return (
            <div>
                <div className="flex items-center gap-5 group">
                    <label className="text-sm font-medium text-muted-foreground">{section.title}</label>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={() => onEdit(section.id)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(section.id)}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {section.type === "text" ? (
                    <p className="text-foreground mt-1">{section.content as string}</p>
                ) : (
                    <ul className="text-foreground mt-1 list-disc list-inside space-y-1">
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
                    startDate: projectDetails.startDate,
                    endDate: projectDetails.endDate,
                    startHour: projectDetails.startHour,
                    endHour: projectDetails.endHour
                }}
                assignedMembers={assignedMembers}
            />

            <EditProjectDialog
                open={isEditingProject}
                onOpenChange={setIsEditingProject}
                project={projectDetails}
                onProjectUpdated={handleProjectUpdated}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-2">
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-foreground p-0 m-0">
                            {projectDetails.name}
                        </h3>
                    </div>
                    <p className="text-muted-foreground">
                        {format(new Date(projectDetails.startDate), "d MMM yyyy")} - {format(new Date(projectDetails.endDate), "d MMM yyyy")}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => setIsEditingProject(true)}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    {/* Delete Project Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        title="Delete Project"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border shadow-sm relative">
                        <div
                            className="absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out h-[calc(100%-8px)]"
                            style={getActiveTabStyle()}
                        />
                        {(['creative-brief', 'logistics']).map((tab) => (
                            <button
                                key={tab}
                                ref={el => tabRefs.current[tab] = el}
                                onClick={() => setActiveProjectTab(tab)}
                                className={`
                                    relative capitalize px-4 py-1.5 text-sm rounded-full transition-all duration-300
                                    z-10 min-w-[80px] justify-center font-semibold h-8
                                    ${activeProjectTab === tab
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
                </div>
            </div>

            {/* Tab Content */}
            {activeProjectTab === "creative-brief" && (
                <div className="bg-background/50 rounded-lg mb-6">
                    <h4 className="font-semibold text-foreground mb-4">Add Brief</h4>
                    <div className="space-y-4">
                        {briefSections.map((section) => (
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
                        ))}

                        {!isAnySectionEditing && (
                            <div className="flex gap-2 pt-4 border-t border-border/20">
                                <button
                                    type="button"
                                    onClick={() => handleAddSection('brief', 'text')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Text Section
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddSection('brief', 'list')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add List Section
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeProjectTab === "logistics" && (
                <div className="bg-background/50 rounded-lg mb-6">
                    <h4 className="font-semibold text-foreground mb-4">Add Logistics</h4>
                    <div className="space-y-4">
                        {logisticsSections.map((section) => (
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
                        ))}

                        {!isAnySectionEditing && (
                            <div className="flex gap-2 pt-4 border-t border-border/20">
                                <button
                                    type="button"
                                    onClick={() => handleAddSection('logistics', 'text')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Text Section
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddSection('logistics', 'list')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add List Section
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Additional Tabs Section */}
            <div className="bg-background/50 rounded-lg mb-6">
                <div className="relative mb-4">
                    {/* Scrollable tabs container */}
                    <div className="relative border-b border-border/20 overflow-x-auto scrollbar-hide">
                        <div className="flex space-x-8 pb-1 relative w-max min-w-full">
                            {Object.keys(ADDITIONAL_TABS).map((tabKey) => (
                                <button
                                    key={tabKey}
                                    ref={(el) => (additionalTabRefs.current[tabKey] = el)}
                                    onClick={() => setActiveAdditionalTab(tabKey as AdditionalTabKey)}
                                    className={`pb-3 px-1 text-sm font-medium transition-all duration-300 relative whitespace-nowrap flex-shrink-0 ${
                                        activeAdditionalTab === tabKey
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {ADDITIONAL_TABS[tabKey as AdditionalTabKey].label}
                                </button>
                            ))}

                            {/* Underline indicator
                            <div
                                className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
                                style={getAdditionalTabStyle()}
                            /> */}
                        </div>
                    </div>
                </div>

                <div className="min-h-[200px]">
                    {renderAdditionalTabContent()}
                </div>
            </div>

            {/* Team and Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">Assigned Team</h4>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                            onClick={() => setIsAddingMember(true)}
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Member
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {assignedWorker.map(worker => (
                            <div
                                key={worker.id}
                                className="flex items-center justify-between gap-3 p-3 bg-background rounded-lg border border-border/20 group"
                            >
                                <div
                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                    onClick={() => setSelectedMember(worker)}
                                >
                                    <Avatar
                                        className="w-10 h-10 ring-2 ring-studio-gold/20"
                                        style={{
                                            borderColor: worker.ringColor || 'hsl(var(--muted))',
                                            boxShadow: `0 0 0 2px ${worker.ringColor || 'hsl(var(--muted))'}`
                                        }}
                                    >
                                        <AvatarImage src={`${S3_URL}/${worker.profilePhoto}`} alt={worker.name} />
                                        <AvatarFallback className="bg-studio-gold text-studio-dark font-semibold">
                                            {worker.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h5 className="font-medium text-foreground">{worker.name}</h5>
                                        <p className="text-sm text-muted-foreground">{worker.projectRole}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveMember(worker.id)}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 transition-opacity text-muted-foreground p-1 hover:bg-background hover:text-red-500"
                                    title="Remove from project"
                                >
                                    <UserMinus className="w-4 h-4" />
                                    Remove
                                </Button>
                            </div>
                        ))}
                        {assignedWorker.length === 0 && (
                            <div className="text-center p-4 text-muted-foreground border border-dashed border-border rounded-lg">
                                No team members assigned yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Schedule Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">Project Details</h4>
                    </div>

                    {/* Display Section */}
                    <div className="space-y-3 text-sm">
                        {projectDetails.color && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Color:</span>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full border border-border"
                                        style={{ backgroundColor: projectDetails.color }}
                                    />
                                    <span className="text-foreground">{projectDetails.color}</span>
                                </div>
                            </div>
                        )}

                        {projectDetails.location && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span className="text-foreground">{projectDetails.location}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="text-foreground">{durationDays} days</span>
                        </div>

                        {projectDetails.startHour && projectDetails.endHour && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Daily Hours:</span>
                                <span className="text-foreground">{projectDetails.endHour - projectDetails.startHour} hours/day</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="secondary" className="text-xs">{status}</Badge>
                        </div>

                        {projectDetails.client && (
                            <div className="pt-3 border-t border-border space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Client:</span>
                                    <span className="text-foreground font-medium">{projectDetails.client.name}</span>
                                </div>

                                {projectDetails.client.email && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="text-foreground">{projectDetails.client.email}</span>
                                    </div>
                                )}

                                {projectDetails.client.mobile && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mobile:</span>
                                        <span className="text-foreground">{projectDetails.client.mobile}</span>
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