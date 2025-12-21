import { useState, useEffect, useRef } from "react";
import { Save, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { editProject } from "@/api/project";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { PhoneInput } from "react-international-phone";
import { Textarea } from "../ui/textarea";

interface EditProjectFormData {
    name: string;
    color?: string;
    location?: string;
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
    client?: {
        name: string;
        email: string;
        mobile: string;
    };
}

interface ProjectDetails {
    description: string;
    id: string;
    name: string;
    color?: string;
    client?: {
        name: string;
        email: string;
        mobile: string;
    };
}

interface EditProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: ProjectDetails;
    onProjectUpdated: () => void;
}

export function EditProjectDialog({
    open,
    onOpenChange,
    project,
    onProjectUpdated
}: EditProjectDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({
        name: '',
        color: '#3b82f6',
        description: '',
        client: undefined
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const colorInputRef = useRef<HTMLInputElement>(null);

    // Initialize form with project data
    useEffect(() => {
        if (project) {
            setEditFormData({
                name: project.name || '',
                color: project.color || '#3b82f6',
                description: project.description || '',
                client: project.client ? {
                    ...project.client
                } : undefined
            });
        }
    }, [project]);

    // Generate hours for time selection
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Validation functions
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Project name validation
        if (!editFormData.name?.trim()) {
            errors.name = "Project name is required";
        }
        if (!editFormData.description?.trim()) {
            errors.description = "description is required";
        }

        // Client information validation
        if (editFormData.client) {
            if (!editFormData.client.name?.trim()) {
                errors.clientName = "Client name is required when including client information";
            }

            if (editFormData.client.email && !isValidEmail(editFormData.client.email)) {
                errors.clientEmail = "Please enter a valid email address";
            }

            // Phone validation - react-international-phone handles basic validation
            if (editFormData.client.mobile && editFormData.client.mobile.replace(/\D/g, '').length < 7) {
                errors.clientMobile = "Please enter a valid phone number";
            }
        }

        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle phone number change
    const handlePhoneChange = (phone: string) => {
        setEditFormData(prev => ({
            ...prev,
            client: prev.client ? {
                ...prev.client,
                mobile: phone
            } : undefined
        }));
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const updateData: any = {
                projectId: project.id,
                name: editFormData.name.trim(),
                isScheduleUpdate: true
            };

            // Add optional fields if they exist
            if (editFormData.color) {
                updateData.color = editFormData.color;
            }

            if (editFormData.description) {
                updateData.description = editFormData.description;
            }

            // Add client information if included
            if (editFormData.client && editFormData.client.name?.trim()) {
                updateData.client = {
                    name: editFormData.client.name.trim(),
                    email: editFormData.client.email?.trim() || null,
                    mobile: editFormData.client.mobile?.trim() || null
                };
            } else {
                // Remove client information if checkbox is unchecked
                updateData.client = null;
            }

            const response = await editProject(updateData);

            if (response.success) {
                onOpenChange(false);
                onProjectUpdated();
            } else {
                setEditErrors({ submit: response.message });
                toast.error(response.message || "Failed to update project");
            }
        } catch (error) {
            console.error('Error updating project:', error);
            setEditErrors({ submit: 'Failed to update project' });
            toast.error("Failed to update project");
        } finally {
            setIsSaving(false);
        }
    };

    // Reset form when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset form when closing
            setEditFormData({
                name: project.name || '',
                color: project.color || '#3b82f6',
                description: project.description || '',
                client: project.client ? {
                    ...project.client
                } : undefined
            });
            setEditErrors({});
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Edit Project Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full max-h-[calc(90vh-8rem)]">
                    <div className="space-y-4 p-4 pr-4">
                        {/* Project Name */}
                        <div className="space-y-2">
                            <div className='flex items-center justify-between'>
                                <Label htmlFor="projectName">Project Name <span className="text-red-500">*</span></Label>
                                <div className="h-6 flex items-center">
                                    {editErrors.name && (
                                        <p className="text-red-500 text-sm">{editErrors.name}</p>
                                    )}
                                </div>
                            </div>
                            <Input
                                id="projectName"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter project name"
                                className={`bg-background`}
                                maxLength={100}
                            />
                        </div>

                        {/* Project Color */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Color <span className="text-red-500">*</span></Label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                    <div className="relative">
                                        <input
                                            ref={colorInputRef}
                                            type="color"
                                            value={editFormData.color}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                                            className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer"
                                            style={{ zIndex: 10 }}
                                        />
                                        <span
                                            className={`
                                                block w-12 h-12 rounded-md border-2 cursor-pointer transition-all duration-200
                                                ${editFormData.color ? 'border-border' : 'border-dashed border-muted-foreground/30'}
                                            `}
                                            style={{ backgroundColor: editFormData.color }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono text-muted-foreground">
                                                {editFormData.color}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Click the color box to pick a custom color
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* description */}
                        <div className="space-y-2">
                            <div className='flex items-center justify-between'>
                                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                                <div className="h-6 flex items-center">
                                    {editErrors.description && (
                                        <p className="text-red-500 text-sm">{editErrors.description}</p>
                                    )}
                                </div>
                            </div>
                            <Textarea
                                id="description"
                                value={editFormData.description || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter project description"
                                className="bg-background border-border"
                            />
                        </div>



                        {/* Client Information Section */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeClientInfo"
                                    checked={!!editFormData.client}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setEditFormData(prev => ({
                                                ...prev,
                                                client: {
                                                    name: prev.client?.name || '',
                                                    email: prev.client?.email || '',
                                                    mobile: prev.client?.mobile || ''
                                                }
                                            }));
                                        } else {
                                            setEditFormData(prev => {
                                                const newData = { ...prev };
                                                delete newData.client;
                                                return newData;
                                            });
                                        }
                                    }}
                                />
                                <Label htmlFor="includeClientInfo" className="text-sm font-medium cursor-pointer">
                                    Include Client Information
                                </Label>
                            </div>

                            {editFormData.client && (
                                <div className="grid grid-cols-1 gap-4 pl-6 border-l-2 border-border">
                                    <div className="space-y-2">
                                        <div className='flex items-center justify-between'>
                                            <Label htmlFor="clientName">Client Name <span className="text-red-500">*</span></Label>
                                            <div className="h-6 flex items-center">
                                                {editErrors.clientName && (
                                                    <p className="text-red-500 text-sm">{editErrors.clientName}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Input
                                            id="clientName"
                                            value={editFormData.client.name}
                                            onChange={(e) => setEditFormData(prev => ({
                                                ...prev,
                                                client: {
                                                    ...prev.client!,
                                                    name: e.target.value
                                                }
                                            }))}
                                            placeholder="Enter client name"
                                            className={`bg-background`}
                                        />

                                    </div>

                                    <div className="space-y-2">
                                        <div className='flex items-center justify-between'>
                                            <Label htmlFor="clientEmail">Email <span className="text-red-500">*</span></Label>
                                            <div className="h-6 flex items-center">
                                                {editErrors.clientEmail && (
                                                    <p className="text-red-500 text-sm">{editErrors.clientEmail}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Input
                                            id="clientEmail"
                                            type="email"
                                            value={editFormData.client.email}
                                            onChange={(e) => setEditFormData(prev => ({
                                                ...prev,
                                                client: {
                                                    ...prev.client!,
                                                    email: e.target.value
                                                }
                                            }))}
                                            placeholder="client@example.com"
                                            className={`bg-background ${editErrors.clientEmail ? 'border-red-500' : 'border-border'}`}
                                        />
                                    </div>

                                    {/* Client Mobile with react-international-phone */}
                                    <div className="space-y-2">
                                        <div className='flex items-center justify-between'>
                                            <Label htmlFor="clientMobile">Mobile <span className="text-red-500">*</span></Label>
                                            <div className="h-6 flex items-center">
                                                {editErrors.clientMobile && (
                                                    <p className="text-red-500 text-sm mt-1">{editErrors.clientMobile}</p>
                                                )}
                                            </div>
                                        </div>
                                        <PhoneInput
                                            defaultCountry="gb"
                                            value={editFormData.client.mobile || ""}
                                            onChange={handlePhoneChange}
                                            className={`rounded-md gap-2 ${editErrors.clientMobile ? 'border-red-500' : ''}`}
                                            inputClassName="!flex !h-10 !w-full border !border-input !bg-background px-3 py-2 text-sm !text-foreground
                                                !placeholder:text-muted-foreground 
                                                !rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                                                focus-visible:ring-offset-accent disabled:cursor-not-allowed disabled:opacity-50"
                                            countrySelectorStyleProps={{
                                                buttonClassName: "!h-10 border !border-input !bg-background hover:bg-accent !rounded-md px-3 !relative",
                                                dropdownStyleProps: {
                                                    className: "!text-foreground !bg-background !border!border-white !shadow-lg !absolute !bottom-full !top-auto !mb-[4px] !rounded-md scrollbar-hide !border",
                                                    listItemSelectedClassName: "!bg-accent",
                                                    listItemCountryNameStyle: { color: "gray" },
                                                },
                                            }}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {editErrors.submit && (
                            <p className="text-red-500 text-sm">{editErrors.submit}</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}