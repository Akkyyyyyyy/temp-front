import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    getEventReminders,
    getProjectAssignments,
    IReminders,
    updateEventReminders
} from "@/api/additional-tabs";
import {
    createCustomReminder,
    getEventCustomReminders,
    updateCustomReminder,
    deleteCustomReminder,
    type CustomReminder
} from "@/api/customReminder";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Bell, Calendar, Trash2, Plus, Edit, CalendarIcon, X, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatReminderDateTime, formatTime } from "@/helper/helper";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { Calendar2 } from "../ui/calendar2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface RemindersTabProps {
    projectId: string;
}

interface EventInfo {
    eventId: string;
    name?: string;
    date?: string;
    startHour?: number;
    endHour?: number;
}

const CalendarDialog = ({ handleAddCustomReminder, user, isFinished, isEditMode, event, newReminderDate, newReminderHour, setNewReminderHour, isAddingReminder, validateAndSaveReminder, setNewReminderDate, isDialogOpen, setIsDialogOpen }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const handleDateSelect = (date: Date | String, e: any) => {
        if (date) {
            setNewReminderDate(date);
            setIsCalendarOpen(false);
        }
    };
    const handleCancel = () => {
        setIsDialogOpen(false);
        setNewReminderDate("");
    }
    return <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
            {
                user.data.isAdmin &&
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCustomReminder(event.eventId)}
                    disabled={!user.data.isAdmin || isFinished}
                    className="h-8"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Custom Reminder
                </Button>

            }

        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>
                    {isEditMode ? 'Edit Custom Reminder' : 'Add Custom Reminder'}
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal`}
                                id="eventDate"
                            >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {newReminderDate ? (
                                    format(new Date(newReminderDate), "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center p-2 border-b">
                                    <span className="text-sm font-medium">Select event date</span>

                                </div>
                                <Calendar2
                                    mode='single'
                                    classNames={{
                                        day_today: "",
                                    }}
                                    defaultMonth={newReminderDate ? new Date(newReminderDate) : new Date()}
                                    selected={newReminderDate ? new Date(newReminderDate) : undefined}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                    disabled={(date) => {
                                        const today = new Date()
                                        today.setHours(0, 0, 0, 0)

                                        return date < today
                                    }}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>Time</Label>
                    <Select
                        value={newReminderHour.toString()}
                        onValueChange={(value) => setNewReminderHour(Number(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select hour" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                                const displayHour = hour % 12 || 12;
                                const ampm = hour < 12 ? 'AM' : 'PM';
                                return (
                                    <SelectItem key={hour} value={hour.toString()}>
                                        {displayHour}:00 {ampm}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isAddingReminder}
                    className="h-9"
                >
                    Cancel
                </Button>
                <Button
                    onClick={validateAndSaveReminder}
                    disabled={isAddingReminder || !newReminderDate}
                    className="h-9 bg-studio-gold hover:bg-studio-gold/90"
                >
                    {isAddingReminder ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isEditMode ? 'Updating' : 'Adding'}
                        </>
                    ) : (
                        isEditMode ? 'Update Reminder' : 'Add Reminder'
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}

export function RemindersTab({ projectId }: RemindersTabProps) {
    const [reminders, setReminders] = useState<Record<string, IReminders>>({});
    const [customReminders, setCustomReminders] = useState<Record<string, CustomReminder[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const { user } = useAuth();
    const [events, setEvents] = useState<EventInfo[]>([]);

    // Custom reminder dialog state
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [selectedReminderId, setSelectedReminderId] = useState<string>("");
    const [newReminderDate, setNewReminderDate] = useState("");
    const [newReminderHour, setNewReminderHour] = useState(9);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddingReminder, setIsAddingReminder] = useState(false);

    useEffect(() => {
        const fetchEventsAndReminders = async () => {
            if (!projectId) return;

            setLoading(true);

            try {
                // Get events for this project
                const assignmentsResponse = await getProjectAssignments({ projectId });

                if (!assignmentsResponse.success || !assignmentsResponse.events) {
                    setLoading(false);
                    return;
                }

                const projectEvents = assignmentsResponse.events;
                setEvents(projectEvents);

                // Fetch reminders for each event
                const remindersMap: Record<string, IReminders> = {};
                const customRemindersMap: Record<string, CustomReminder[]> = {};

                for (const event of projectEvents) {
                    // Fetch default reminders
                    const response = await getEventReminders({ eventId: event.eventId });
                    remindersMap[event.eventId] = response.success && response.reminders
                        ? response.reminders
                        : { weekBefore: false, dayBefore: false };

                    // Fetch custom reminders
                    const customResponse = await getEventCustomReminders(event.eventId);
                    customRemindersMap[event.eventId] = customResponse.success && customResponse.reminders
                        ? customResponse.reminders
                        : [];
                }

                setReminders(remindersMap);
                setCustomReminders(customRemindersMap);
            } catch (error) {
                console.error("Error loading reminders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventsAndReminders();
    }, [projectId]);

    const isEventFinished = (event: EventInfo): boolean => {
        if (!event.date || event.startHour === undefined) {
            return false;
        }

        const now = new Date();
        const eventDateTime = new Date(event.date);
        eventDateTime.setHours(event.startHour, 0, 0, 0);
        
        return now >= eventDateTime;
    };

    // Check if reminder time is before event time
    const isReminderBeforeEvent = (reminderDate: string, reminderHour: number, event: EventInfo): boolean => {
        if (!event.date || !event.startHour) return true;

        const reminderDateTime = new Date(reminderDate);
        reminderDateTime.setHours(reminderHour, 0, 0, 0);

        const eventDateTime = new Date(event.date);
        eventDateTime.setHours(event.startHour, 0, 0, 0);

        return reminderDateTime < eventDateTime;
    };

    const handleToggle = async (eventId: string, type: keyof IReminders, checked: boolean) => {
        if (saving[eventId]) return;

        const event = events.find(e => e.eventId === eventId);
        if (event && isEventFinished(event)) {
            toast.error("Cannot update reminders for completed events");
            return;
        }

        const updated = { ...reminders[eventId], [type]: checked };
        const newReminders = { ...reminders, [eventId]: updated };
        setReminders(newReminders);

        setSaving(prev => ({ ...prev, [eventId]: true }));

        const response = await updateEventReminders({
            eventId,
            reminders: updated
        });

        if (!response.success) {
            setReminders(reminders);
            toast.error("Failed to update reminder");
        }

        setSaving(prev => ({ ...prev, [eventId]: false }));
    };

    const handleAddCustomReminder = (eventId: string) => {
        const event = events.find(e => e.eventId === eventId);
        if (!event) return;

        if (isEventFinished(event)) {
            toast.error("Cannot add reminders for completed events");
            return;
        }

        setSelectedEventId(eventId);
        setSelectedReminderId("");
        setIsEditMode(false);

        // Set default date to tomorrow or event date - 1 day
        const now = new Date();
        const eventDate = event.date ? new Date(event.date) : null;

        let defaultDate = new Date();
        defaultDate.setDate(now.getDate() + 1); // Tomorrow

        if (eventDate && eventDate > now) {
            // If event is in future, set to 1 day before event
            const oneDayBefore = new Date(eventDate);
            oneDayBefore.setDate(eventDate.getDate() - 1);
            defaultDate = oneDayBefore;
        }

        setNewReminderDate("");
        setNewReminderHour(9); // Default 9 AM
        setIsDialogOpen(true);
    };

    const handleEditCustomReminder = (eventId: string, reminder: CustomReminder) => {
        const event = events.find(e => e.eventId === eventId);
        if (!event) return;

        if (isEventFinished(event)) {
            toast.error("Cannot edit reminders for completed events");
            return;
        }

        setSelectedEventId(eventId);
        setSelectedReminderId(reminder.id);
        setIsEditMode(true);
        setNewReminderDate(reminder.reminderDate);
        setNewReminderHour(reminder.reminderHour);
        setIsDialogOpen(true);
    };

    const validateAndSaveReminder = async () => {
        const event = events.find(e => e.eventId === selectedEventId);
        if (!event) {
            toast.error("Event not found");
            return;
        }

        // Check if event is finished
        if (isEventFinished(event)) {
            toast.error("Cannot add/edit reminders for completed events");
            return;
        }

        // Check if reminder is before event
        if (!isReminderBeforeEvent(newReminderDate, newReminderHour, event)) {
            toast.error("Reminder must be set before the event starts");
            return;
        }

        setIsAddingReminder(true);
        try {
            if (isEditMode && selectedReminderId) {
                // Update existing reminder
                const response = await updateCustomReminder(selectedReminderId, {
                    reminderDate: newReminderDate,
                    reminderHour: newReminderHour
                });

                if (response.success && response.data) {
                    setCustomReminders(prev => ({
                        ...prev,
                        [selectedEventId]: prev[selectedEventId].map(r =>
                            r.id === selectedReminderId ? response.data! : r
                        )
                    }));
                    setIsDialogOpen(false);
                } else {
                    toast.error(response.message || "Failed to update reminder");
                }
            } else {
                // Create new reminder
                const response = await createCustomReminder({
                    eventId: selectedEventId,
                    reminderDate: newReminderDate,
                    reminderHour: newReminderHour
                });

                if (response.success && response.data) {
                    setCustomReminders(prev => ({
                        ...prev,
                        [selectedEventId]: [...(prev[selectedEventId] || []), response.data!]
                    }));
                    setIsDialogOpen(false);
                } else {
                    toast.error(response.message || "Failed to create reminder");
                }
            }
        } catch (error) {
            console.error("Error saving reminder:", error);
            toast.error("Failed to save reminder");
        } finally {
            setIsAddingReminder(false);
        }
    };

    const handleDeleteCustomReminder = async (eventId: string, reminderId: string) => {
        const event = events.find(e => e.eventId === eventId);
        if (event && isEventFinished(event)) {
            toast.error("Cannot delete reminders for completed events");
            return;
        }

        try {
            const response = await deleteCustomReminder(reminderId);
            if (response.success) {
                setCustomReminders(prev => ({
                    ...prev,
                    [eventId]: prev[eventId].filter(r => r.id !== reminderId)
                }));
            } else {
                toast.error(response.message || "Failed to delete reminder");
            }
        } catch (error) {
            console.error("Error deleting custom reminder:", error);
            toast.error("Failed to delete custom reminder");
        }
    };

    if (loading) {
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
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Events</h3>
                <p className="text-muted-foreground">Create events to set up reminders</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-foreground">Event Reminders</h4>
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
                                            {saving[event.eventId] && (
                                                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
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

                                    <CalendarDialog
                                        event={event}
                                        handleAddCustomReminder={handleAddCustomReminder}
                                        isAddingReminder={isAddingReminder}
                                        isEditMode={isEditMode}
                                        isFinished={isFinished}
                                        newReminderDate={newReminderDate}
                                        newReminderHour={newReminderHour}
                                        setNewReminderHour={setNewReminderHour}
                                        user={user}
                                        validateAndSaveReminder={validateAndSaveReminder}
                                        setNewReminderDate={setNewReminderDate}
                                        isDialogOpen={isDialogOpen}
                                        setIsDialogOpen={setIsDialogOpen} />
                                </div>

                                {/* Default Reminders */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Week Before</Label>
                                            <p className="text-xs text-muted-foreground">7 days before</p>
                                        </div>
                                        <Switch
                                            checked={reminders[event.eventId]?.weekBefore || false}
                                            onCheckedChange={(checked) => handleToggle(event.eventId, 'weekBefore', checked)}
                                            disabled={saving[event.eventId] || !user.data.isAdmin || isFinished}
                                            className="data-[state=checked]:bg-studio-gold"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Day Before</Label>
                                            <p className="text-xs text-muted-foreground">1 day before</p>
                                        </div>
                                        <Switch
                                            checked={reminders[event.eventId]?.dayBefore || false}
                                            onCheckedChange={(checked) => handleToggle(event.eventId, 'dayBefore', checked)}
                                            disabled={saving[event.eventId] || !user.data.isAdmin || isFinished}
                                            className="data-[state=checked]:bg-studio-gold"
                                        />
                                    </div>
                                </div>

                                {/* Custom Reminders */}
                                {customReminders[event.eventId]?.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-foreground mb-3">Custom Reminders</h4>
                                        <div className="space-y-2">
                                            {customReminders[event.eventId].map((reminder) => {
                                                // Get event date and time
                                                const eventDateTime = new Date(event.date);
                                                eventDateTime.setHours(event.startHour, 0, 0, 0);

                                                // Get reminder date and time
                                                const reminderDateTime = new Date(reminder.reminderDate);
                                                reminderDateTime.setHours(reminder.reminderHour, 0, 0, 0);

                                                // Check if event is before reminder
                                                const isEventBeforeReminder = eventDateTime < reminderDateTime;

                                                return (
                                                    <div
                                                        key={reminder.id}
                                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-sm text-foreground">
                                                                {formatReminderDateTime(reminder)}
                                                            </div>
                                                            {(isEventBeforeReminder && user.data.isAdmin) && (
                                                                <div className="flex items-center gap-1.5 text-amber-600">
                                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                                    <span className="text-xs font-medium">Event schedule might have changed. Please update this reminder.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {user.data.isAdmin && !isFinished && (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    onClick={() => handleEditCustomReminder(event.eventId, reminder)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-border/40 hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteCustomReminder(event.eventId, reminder.id)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-border/40 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}