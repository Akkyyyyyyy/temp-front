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

interface EditProjectFormData {
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
    id: string;
    name: string;
    color?: string;
    location?: string;
    startDate: string;
    endDate: string;
    startHour?: number;
    endHour?: number;
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
    const [editFormData, setEditFormData] = useState<EditProjectFormData>({
        color: '#3b82f6',
        location: '',
        startDate: '',
        endDate: '',
        startHour: 9,
        endHour: 17,
        client: undefined
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const colorInputRef = useRef<HTMLInputElement>(null);

    // Initialize form with project data
    useEffect(() => {
        if (project) {
            setEditFormData({
                color: project.color || '#3b82f6',
                location: project.location || '',
                startDate: project.startDate,
                endDate: project.endDate,
                startHour: project.startHour || 9,
                endHour: project.endHour || 17,
                client: project.client ? { ...project.client } : undefined
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

    const isValidPhoneNumber = (phone: string): boolean => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Required fields validation
        if (!editFormData.startDate) {
            errors.startDate = "Start date is required";
        }

        if (!editFormData.endDate) {
            errors.endDate = "End date is required";
        }

        // Date range validation
        if (editFormData.startDate && editFormData.endDate) {
            const start = new Date(editFormData.startDate);
            const end = new Date(editFormData.endDate);
            if (start > end) {
                errors.endDate = "End date cannot be before start date";
            }
        }

        // Time validation
        if (editFormData.startHour >= editFormData.endHour) {
            errors.endHour = "End time must be after start time";
        }

        // Client information validation
        if (editFormData.client) {
            if (!editFormData.client.name?.trim()) {
                errors.clientName = "Client name is required when including client information";
            }

            if (editFormData.client.email && !isValidEmail(editFormData.client.email)) {
                errors.clientEmail = "Please enter a valid email address";
            }

            if (editFormData.client.mobile && !isValidPhoneNumber(editFormData.client.mobile)) {
                errors.clientMobile = "Please enter a valid phone number";
            }
        }

        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const updateData: any = {
                projectId: project.id,
                startDate: editFormData.startDate,
                endDate: editFormData.endDate,
                startHour: editFormData.startHour,
                endHour: editFormData.endHour,
                isScheduleUpdate: true
            };

            // Add optional fields if they exist
            if (editFormData.color) {
                updateData.color = editFormData.color;
            }

            if (editFormData.location) {
                updateData.location = editFormData.location;
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
                toast.success("Project updated successfully");
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
                color: project.color || '#3b82f6',
                location: project.location || '',
                startDate: project.startDate,
                endDate: project.endDate,
                startHour: project.startHour || 9,
                endHour: project.endHour || 17,
                client: project.client ? { ...project.client } : undefined
            });
            setEditErrors({});
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[95vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Edit Project Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full max-h-[calc(90vh-8rem)]">
                    <div className="space-y-4 py-4 pr-4">
                        {/* Project Color */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Color</Label>
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

                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={editFormData.location || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Enter project location"
                                className="bg-background border-border"
                            />
                        </div>

                        {/* Date Range Section */}
                        <div className="space-y-2">
                            <Label htmlFor="dateRange">Select Date Range *</Label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal ${editErrors.startDate || editErrors.endDate ? 'border-red-500' : ''}`}
                                        id="dateRange"
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        {editFormData.startDate && editFormData.endDate ? (
                                            <>
                                                {format(new Date(editFormData.startDate), "PPP")} - {format(new Date(editFormData.endDate), "PPP")}
                                            </>
                                        ) : editFormData.startDate ? (
                                            `Select end date for ${format(new Date(editFormData.startDate), "PPP")}`
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                    sideOffset={4}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex justify-between items-center p-2 border-b">
                                            <span className="text-sm font-medium">
                                                {editFormData.startDate && !editFormData.endDate
                                                    ? 'Select end date'
                                                    : 'Select date range'
                                                }
                                            </span>
                                            {(editFormData.startDate || editFormData.endDate) && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditFormData(prev => ({
                                                            ...prev,
                                                            startDate: '',
                                                            endDate: ''
                                                        }));
                                                        setEditErrors(prev => ({
                                                            ...prev,
                                                            startDate: '',
                                                            endDate: ''
                                                        }));
                                                    }}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                        <Calendar
                                            mode="range"
                                            classNames={{
                                                day_today: "",
                                            }}
                                            defaultMonth={editFormData.startDate ? new Date(editFormData.startDate) : new Date()}
                                            selected={
                                                editFormData.startDate
                                                    ? {
                                                        from: new Date(editFormData.startDate),
                                                        to: editFormData.endDate ? new Date(editFormData.endDate) : undefined
                                                    }
                                                    : undefined
                                            }
                                            onSelect={(range, singleDate) => {
                                                if (!range || (range?.from && !range?.to)) {
                                                    const date = range?.from || singleDate;
                                                    if (date) {
                                                        setEditFormData(prev => ({
                                                            ...prev,
                                                            startDate: format(date, "yyyy-MM-dd"),
                                                            endDate: format(date, "yyyy-MM-dd")
                                                        }));
                                                        return;
                                                    }
                                                    return;
                                                }
                                                setEditFormData(prev => ({
                                                    ...prev,
                                                    startDate: format(range.from, "yyyy-MM-dd"),
                                                    endDate: range.to ? format(range.to, "yyyy-MM-dd") : ''
                                                }));
                                                if (editErrors.startDate || editErrors.endDate) {
                                                    setEditErrors({ ...editErrors, startDate: '', endDate: '' });
                                                }
                                                if (range.to) {
                                                    setIsCalendarOpen(false);
                                                }
                                            }}
                                            initialFocus
                                            numberOfMonths={1}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {(editErrors.startDate || editErrors.endDate) && (
                                <p className="text-red-500 text-sm">{editErrors.startDate || editErrors.endDate}</p>
                            )}
                        </div>

                        {/* Time Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startHour">Start Time</Label>
                                <Select
                                    value={editFormData.startHour.toString()}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, startHour: parseInt(value) }))}
                                >
                                    <SelectTrigger className="bg-background border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border shadow-lg max-h-[50vh]">
                                        {hours
                                            .filter(hour => hour !== 24)
                                            .map((hour) => (
                                                <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                                                    {`${hour}:00`}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endHour">End Time</Label>
                                <Select
                                    value={editFormData.endHour.toString()}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, endHour: parseInt(value) }))}
                                >
                                    <SelectTrigger className={`bg-background ${editErrors.endHour ? 'border-red-500' : 'border-border'}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border shadow-lg max-h-[50vh]">
                                        {hours.filter(h => h > editFormData.startHour).map((hour) => (
                                            <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                                                {`${hour}:00`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editErrors.endHour && (
                                    <p className="text-red-500 text-sm">{editErrors.endHour}</p>
                                )}
                            </div>
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
                                        <Label htmlFor="clientName">Client Name *</Label>
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
                                            className={`bg-background ${editErrors.clientName ? 'border-red-500' : 'border-border'}`}
                                        />
                                        {editErrors.clientName && (
                                            <p className="text-red-500 text-sm">{editErrors.clientName}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="clientEmail">Email</Label>
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
                                            {editErrors.clientEmail && (
                                                <p className="text-red-500 text-sm">{editErrors.clientEmail}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="clientMobile">Mobile</Label>
                                            <Input
                                                id="clientMobile"
                                                value={editFormData.client.mobile}
                                                onChange={(e) => setEditFormData(prev => ({
                                                    ...prev,
                                                    client: {
                                                        ...prev.client!,
                                                        mobile: e.target.value
                                                    }
                                                }))}
                                                placeholder="+1 (555) 000-0000"
                                                className={`bg-background ${editErrors.clientMobile ? 'border-red-500' : 'border-border'}`}
                                            />
                                            {editErrors.clientMobile && (
                                                <p className="text-red-500 text-sm">{editErrors.clientMobile}</p>
                                            )}
                                        </div>
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