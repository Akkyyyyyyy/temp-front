import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, X, Users, MessageSquare, CalendarIcon, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getAvailableMembers } from '@/api/member';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar2 } from '@/components/ui/calendar2';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/useRole';
import { RoleDropdown } from '../dropdowns/RoleDropdown';
import { Switch } from '../ui/switch';
import { createEvent, updateEvent } from '@/api/event';
import { formatTime } from '@/helper/helper';
import { getFutureLockedDates } from '@/api/company';

export interface EventDialogData {
    reminders: any;
    id?: string;
    projectId?: string;
    name: string;
    date: string;
    startHour: number;
    endHour: number;
    location: string;
    assignments: TeamAssignment[];
}

export interface TeamAssignment {
    id: string;
    memberName: string;
    responsibility: string;
    memberId: string;
    roleId: string;
    instructions: string;
}

interface CurrentMember {
    memberId: string;
    memberName: string;
    responsibility: string;
    roleId: string;
    instructions: string;
}

export interface AddEditEventDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    projectId?: string;
    eventData?: EventDialogData | null;
    onSuccess?: () => void;
    onAddTeamMember?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function AddEditEventDialog({
    isOpen,
    setIsOpen,
    projectId,
    eventData,
    onSuccess,
    onAddTeamMember,
}: AddEditEventDialogProps) {
    const { user } = useAuth();
    const { roles } = useRole();
    const [lockedDates, setLockedDates] = useState<string[]>([]);
    const [loadingLockedDates, setLoadingLockedDates] = useState(false);

    // Fetch locked dates when dialog opens
    useEffect(() => {
        const fetchLockedDates = async () => {
            if (isOpen && user?.data?.company?.id) {
                setLoadingLockedDates(true);
                try {
                    const response = await getFutureLockedDates(user.data.company.id);
                    if (response.success && response.data) {
                        setLockedDates(response.data.lockedDates);
                    }
                } catch (error) {
                    console.error('Error fetching locked dates:', error);
                } finally {
                    setLoadingLockedDates(false);
                }
            }
        };

        fetchLockedDates();
    }, [isOpen, user?.data?.company?.id]);

    const [formData, setFormData] = useState<EventDialogData>({
        name: '',
        date: '',
        startHour: 9,
        endHour: 10,
        location: '',
        reminders: {
            weekBefore: true,
            dayBefore: true
        },
        assignments: [],
        ...(eventData || {})
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [availableMembers, setAvailableMembers] = useState<any[]>([]);
    const [isLoadingAvailableMembers, setIsLoadingAvailableMembers] = useState(false);

    const [currentMember, setCurrentMember] = useState<CurrentMember>({
        memberId: '',
        memberName: '',
        responsibility: '',
        roleId: '',
        instructions: '',
    });

    const hours = Array.from({ length: 25 }, (_, i) => i);
    const isEditMode = !!eventData?.id;

    // Fetch available members when date/time changes
    useEffect(() => {
        const fetchAvailableMembers = async () => {
            if (!formData.date) return;

            setIsLoadingAvailableMembers(true);
            try {
                const result = await getAvailableMembers({
                    companyId: user.data.company.id,
                    eventDate: formData.date,
                    startHour: formData.startHour,
                    endHour: formData.endHour
                });

                if (result.success && result.data) {
                    setAvailableMembers(result.data.availableMembers);
                }
            } catch (error) {
                console.error('Error fetching available members:', error);
            } finally {
                setIsLoadingAvailableMembers(false);
            }
        };

        fetchAvailableMembers();
    }, [formData.date, formData.startHour, formData.endHour, user.data.company.id]);

    // Filter members already assigned
    const filteredAvailableMembers = availableMembers.filter(member =>
        !formData.assignments.some(ta => ta.memberId === member.id)
    );

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            if (eventData) {
                setFormData({
                    name: eventData.name || '',
                    date: eventData.date || '',
                    startHour: eventData.startHour || 9,
                    endHour: eventData.endHour || 10,
                    location: eventData.location || '',
                    reminders: {
                        weekBefore: eventData.reminders.weekBefore,
                        dayBefore: eventData.reminders.dayBefore
                    },
                    assignments: eventData.assignments || [],
                });
            } else {
                setFormData({
                    name: '',
                    date: '',
                    startHour: 9,
                    endHour: 10,
                    location: '',
                    reminders: {
                        weekBefore: true,
                        dayBefore: true
                    },
                    assignments: [],
                });
            }
            setErrors({});
            setCurrentMember({
                memberId: '',
                memberName: '',
                responsibility: '',
                roleId: '',
                instructions: '',
            });
        }
    }, [isOpen, eventData]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Event name is required';
        }

        if (!formData.date) {
            newErrors.date = 'Event date is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        // Only require assignments when creating new event
        if (!isEditMode && formData.assignments.length === 0) {
            newErrors.assignments = 'At least one team member is required';
        }
        if (formData.date && lockedDates.includes(formData.date)) {
            newErrors.date = 'This date is locked and cannot be booked';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.date && lockedDates.includes(formData.date)) {
            toast.error('Cannot create/update event on a locked date');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const eventPayload = {
                ...formData,
                companyId: user.data.company.id,
                projectId: projectId || eventData?.projectId,
                // For edit mode, only include assignment changes if there are any
                assignments: isEditMode && formData.assignments.length === 0
                    ? undefined
                    : formData.assignments.map(assignment => ({
                        memberId: assignment.memberId,
                        roleId: assignment.roleId,
                        instructions: assignment.instructions
                    }))
            };

            let result;
            if (isEditMode && eventData?.id) {
                result = await updateEvent(eventData.id, eventPayload);
            } else {
                result = await createEvent(eventPayload);
            }

            if (result?.success) {
                setIsOpen(false);
                onSuccess?.();
            } else {
                console.error(result?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
            }
        } catch (error) {
            console.error('Error saving event:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    // Team member functions
    const addTeamMember = () => {
        if (currentMember.memberName && currentMember.responsibility) {
            setFormData(prev => ({
                ...prev,
                assignments: [
                    ...prev.assignments,
                    {
                        id: currentMember.memberId,
                        memberName: currentMember.memberName,
                        responsibility: currentMember.responsibility,
                        memberId: currentMember.memberId,
                        roleId: currentMember.roleId,
                        instructions: currentMember.instructions,
                    }
                ]
            }));

            setCurrentMember({
                memberId: '',
                memberName: '',
                responsibility: '',
                roleId: '',
                instructions: '',
            });

            // Clear assignment error if any
            if (errors.assignments) {
                setErrors(prev => ({ ...prev, assignments: '' }));
            }
        }
    };

    const removeTeamMember = (id: string) => {
        setFormData(prev => ({
            ...prev,
            assignments: prev.assignments.filter(assignment => assignment.id !== id)
        }));
    };

    const updateCurrentMember = (field: keyof CurrentMember, value: string) => {
        setCurrentMember(prev => {
            const updated = { ...prev, [field]: value };

            if (field === 'memberId') {
                const selectedMember = filteredAvailableMembers.find(m => m.id === value);
                if (selectedMember) {
                    updated.memberName = selectedMember.name;
                    updated.responsibility = selectedMember.role;

                    const memberRole = roles.find(role => role.name === selectedMember.role);
                    updated.roleId = memberRole?.id || selectedMember.role;
                }
            }

            if (field === 'memberName') {
                const selectedMember = filteredAvailableMembers.find(m => m.id === value);
                if (selectedMember) {
                    updated.memberId = selectedMember.id;
                    updated.responsibility = selectedMember.role;

                    const memberRole = roles.find(role => role.name === selectedMember.role);
                    updated.roleId = memberRole?.id || selectedMember.role;
                }
            }

            return updated;
        });
    };

    const handleResponsibilityChange = (roleId: string) => {
        const selectedRole = roles.find(role => role.id === roleId);
        if (selectedRole) {
            setCurrentMember(prev => ({
                ...prev,
                responsibility: selectedRole.name,
                roleId: selectedRole.id
            }));
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setFormData(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
            setIsCalendarOpen(false);

            if (errors.date) {
                setErrors(prev => ({ ...prev, date: '' }));
            }
        }
    };

    const handleClearDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, date: '' }));
    };

    const getRoleName = (roleId: string): string => {
        const role = roles.find(r => r.id === roleId);
        return role?.name || roleId;
    };

    const hasConflicts = (memberId: string) => {
        const member = availableMembers.find(m => m.id === memberId);
        return member?.availabilityStatus === 'unavailable';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[800px]" onInteractOutside={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? 'Edit Event' : 'Add New Event'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Event Details */}
                        <div className={`space-y-4 ${isEditMode ? 'lg:col-span-2' : ''}`}>
                            {/* Event Name */}
                            <div className="space-y-2">
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor="eventName">Event Name <span className='text-red-500'>*</span></Label>
                                    <div className="h-6 flex items-center">
                                        {errors.name && (
                                            <p className="text-red-500 text-sm">{errors.name}</p>
                                        )}
                                    </div>
                                </div>
                                <Input
                                    id="eventName"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, name: e.target.value }));
                                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    placeholder="Enter event name"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            {/* Event Date */}
                            <div className="space-y-2">
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor="eventDate">Event Date <span className='text-red-500'>*</span></Label>
                                    <div className="h-6 flex items-center">
                                        {errors.date && (
                                            <p className="text-red-500 text-sm">{errors.date}</p>
                                        )}
                                    </div>
                                </div>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal`}
                                            id="eventDate"
                                        >
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            {formData.date ? (
                                                format(new Date(formData.date), "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                                        <div className="flex flex-col">
                                            <div className="flex justify-between items-center p-2 border-b">
                                                <span className="text-sm font-medium">Select event date</span>
                                                {formData.date && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleClearDate}
                                                        className="h-6 px-2 text-xs"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                            <Calendar2
                                                mode='single'
                                                classNames={{ day_today: "" }}
                                                defaultMonth={formData.date ? new Date(formData.date) : new Date()}
                                                selected={formData.date ? new Date(formData.date) : undefined}
                                                onSelect={handleDateSelect}
                                                initialFocus
                                                disabled={(date) => {
                                                    // Disable past dates
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    if (date < today) return true;

                                                    // Disable locked dates
                                                    const dateStr = format(date, 'yyyy-MM-dd');
                                                    return lockedDates.includes(dateStr);
                                                }}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Time Section */}
                            <div className='flex items-center justify-between gap-2'>
                                <div className="space-y-2 w-full">
                                    <Label htmlFor="startHour">Start Time <span className='text-red-500'>*</span></Label>
                                    <Select
                                        value={formData.startHour.toString()}
                                        onValueChange={(value) => {
                                            const newStartHour = parseInt(value);
                                            setFormData(prev => {
                                                const updated = { ...prev, startHour: newStartHour };
                                                // Adjust end hour if needed
                                                if (newStartHour >= prev.endHour) {
                                                    updated.endHour = newStartHour + 1;
                                                }
                                                return updated;
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="bg-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border shadow-lg">
                                            {hours
                                                .filter(hour => hour !== 24)
                                                .map((hour) => (
                                                    <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                                                        {formatTime(hour)}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 w-full">
                                    <Label htmlFor="endHour">End Time <span className='text-red-500'>*</span></Label>
                                    <Select
                                        value={formData.endHour.toString()}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, endHour: parseInt(value) }))}
                                    >
                                        <SelectTrigger className="bg-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border shadow-lg">
                                            {hours
                                                .filter(h => h > formData.startHour)
                                                .map((hour) => (
                                                    <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                                                        {formatTime(hour)}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor="location">Location <span className='text-red-500'>*</span></Label>
                                    <div className="h-6 flex items-center">
                                        {errors.location && (
                                            <p className="text-red-500 text-sm">{errors.location}</p>
                                        )}
                                    </div>
                                </div>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    maxLength={150}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, location: e.target.value }));
                                        if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                                    }}
                                    placeholder="Studio A, Conference Room, etc."
                                />
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-sm font-medium">Event Reminders</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="weekBefore" className="text-sm font-normal">
                                                Week Before
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Send reminder 1 week before the event
                                            </p>
                                        </div>
                                        <Switch
                                            id="weekBefore"
                                            checked={formData.reminders.weekBefore}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    reminders: { ...prev.reminders, weekBefore: checked }
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="dayBefore" className="text-sm font-normal">
                                                Day Before
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Send reminder 1 day before the event
                                            </p>
                                        </div>
                                        <Switch
                                            id="dayBefore"
                                            checked={formData.reminders.dayBefore}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    reminders: { ...prev.reminders, dayBefore: checked }
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Right Column - Team Members */}
                        {!isEditMode && (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <div className='flex items-center gap-2'>
                                        <Users className="w-5 h-5" />
                                        <Label className="text-base">
                                            Team Members
                                            <span className='text-red-500'>*</span>
                                        </Label>
                                    </div>

                                    {onAddTeamMember && (
                                        <Button
                                            type="button"
                                            size='sm'
                                            variant='outline'
                                            onClick={onAddTeamMember}
                                            className="cursor-pointer hover:bg-transparent hover:text-foreground"
                                        >
                                            <Plus />
                                            Add New Member
                                        </Button>
                                    )}
                                </div>

                                {errors.assignments && (
                                    <p className="text-red-500 text-sm">{errors.assignments}</p>
                                )}

                                {/* Team Member Input Section */}
                                <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Team Member</Label>
                                            <Select
                                                value={currentMember.memberId}
                                                onValueChange={updateCurrentMember.bind(null, 'memberId')}
                                            >
                                                <SelectTrigger className="bg-background border-border truncate">
                                                    <SelectValue placeholder="Select member" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-border shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredAvailableMembers.length === 0 ? (
                                                        <div className="px-4 py-2 text-muted-foreground text-sm">
                                                            {isLoadingAvailableMembers ? "Loading..." : "No available members"}
                                                        </div>
                                                    ) : (
                                                        filteredAvailableMembers.map((member) => (
                                                            <SelectItem
                                                                key={member.id}
                                                                value={member.id}
                                                                className="hover:bg-muted"
                                                                disabled={hasConflicts(member.id)}
                                                            >
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{member.name}</span>
                                                                        <span className="text-muted-foreground text-xs">- {member.role || "No role assigned"}</span>
                                                                        {hasConflicts(member.id) && (
                                                                            <Badge variant="destructive" className="text-xs">
                                                                                Unavailable
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">Responsibility</Label>
                                            <RoleDropdown
                                                selected={currentMember.roleId}
                                                onChange={handleResponsibilityChange}
                                                placeholder="Select responsibility"
                                                className="bg-background border-border"
                                            />
                                        </div>
                                    </div>

                                    {/* Instructions Input */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">Instructions (Optional)</Label>
                                        <Textarea
                                            value={currentMember.instructions}
                                            onChange={(e) => updateCurrentMember('instructions', e.target.value)}
                                            placeholder="Add specific instructions for this team member..."
                                            rows={2}
                                            className="text-sm resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTeamMember}
                                        disabled={!currentMember.memberName || !currentMember.responsibility || hasConflicts(currentMember.memberId)}
                                        className="text-xs w-full"
                                    >
                                        <Save className="w-3 h-3 mr-1" />
                                        {hasConflicts(currentMember.memberId)
                                            ? "Member Unavailable"
                                            : "Save"
                                        }
                                    </Button>
                                </div>

                                {/* Team Summary */}
                                {formData.assignments.length > 0 && (
                                    <div className="p-3 bg-background rounded-lg border">
                                        <h4 className="text-sm font-medium mb-2">Team Summary</h4>
                                        <div className="space-y-2 overflow-y-auto max-h-[200px]">
                                            {formData.assignments.map((ta) => {
                                                const isUnavailable = hasConflicts(ta.memberId);
                                                return (
                                                    <div
                                                        key={ta.id}
                                                        className={`rounded-lg ${isUnavailable ? "border border-red-800" : "bg-muted/20"}`}
                                                    >
                                                        <div className="flex items-start justify-between p-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnavailable ? "bg-red-800" : "bg-green-800"}`}
                                                                    ></div>
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="font-medium text-sm text-gray-500 truncate">
                                                                            {ta.memberName}
                                                                        </span>
                                                                        <span className="text-muted-foreground text-sm flex-shrink-0">
                                                                            - {getRoleName(ta.roleId)}
                                                                        </span>
                                                                        {isUnavailable && (
                                                                            <Badge variant="destructive" className="text-xs ml-2">
                                                                                Unavailable
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {ta.instructions && (
                                                                    <div className="mt-1 ml-4">
                                                                        <div className="flex items-start gap-1">
                                                                            <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                                            <p className="text-xs text-muted-foreground truncate">
                                                                                {ta.instructions}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeTeamMember(ta.id)}
                                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 ml-2"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}


                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                isEditMode ? 'Update Event' : 'Create Event'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}