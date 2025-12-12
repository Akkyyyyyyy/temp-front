import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getEventReminders, getProjectAssignments, IReminders, updateEventReminders } from "@/api/additional-tabs";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Bell } from "lucide-react";

interface RemindersTabProps {
    projectId: string;
}

export function RemindersTab({ projectId }: RemindersTabProps) {
    const [reminders, setReminders] = useState<Record<string, IReminders>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const { user } = useAuth();
    const [events, setEvents] = useState<Array<{eventId: string, name?: string}>>([]);

   useEffect(() => {
    const fetchEventsAndReminders = async () => {
        if (!projectId) return;

        setLoading(true);
        
        try {
            // 1. First, get events for this project
            const assignmentsResponse = await getProjectAssignments({ projectId });
            
            if (!assignmentsResponse.success || !assignmentsResponse.events) {
                toast.error("Failed to load events");
                setLoading(false);
                return;
            }

            const projectEvents = assignmentsResponse.events;
            setEvents(projectEvents);
            
            // 2. Fetch reminders for each event
            const remindersMap: Record<string, IReminders> = {};
            
            for (const event of projectEvents) {
                const response = await getEventReminders({ eventId: event.eventId });
                
                if (response.success && response.reminders) {
                    remindersMap[event.eventId] = response.reminders;
                } else {
                    // Default reminders if none set
                    remindersMap[event.eventId] = { weekBefore: false, dayBefore: false };
                }
            }
            
            setReminders(remindersMap);
        } catch (error) {
            console.error("Error loading reminders:", error);
            toast.error("Failed to load reminders");
        } finally {
            setLoading(false);
        }
    };

    fetchEventsAndReminders();
}, [projectId]);

    const handleToggle = async (eventId: string, type: keyof IReminders, checked: boolean) => {
        if (saving[eventId]) return;

        const updated = { ...reminders[eventId], [type]: checked };
        const newReminders = { ...reminders, [eventId]: updated };
        setReminders(newReminders);

        setSaving(prev => ({ ...prev, [eventId]: true }));
        
        const response = await updateEventReminders({
            eventId,
            reminders: updated
        });

        if (!response.success) {
            console.error("Failed to update reminder");
            setReminders(reminders); // Revert on error
        } else {
            console.log("Reminder updated");
        }
        
        setSaving(prev => ({ ...prev, [eventId]: false }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-studio-gold mb-4" />
                <span className="text-muted-foreground">Loading reminders...</span>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Events Found</h3>
                <p className="text-muted-foreground">Create events to set up reminders</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-foreground">Event Reminders</h4>
                    {/* <p className="text-sm text-muted-foreground mt-1">
                        Set reminders for each event
                    </p> */}
                </div>
            </div>

            <div className="space-y-4">
                {events.map((event) => (
                    <Card key={event.eventId} className="bg-background">
                        <CardContent className="pt-6 space-y-6">
                            {/* Event Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <Bell className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-medium text-foreground">
                                    {event.name || `Event ${event.eventId}`}
                                </h3>
                                {/* {saving[event.eventId] && (
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />
                                )} */}
                            </div>

                            {/* Reminder Switches */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor={`week-before-${event.eventId}`} className="text-sm">
                                            Week Before Event
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            7 days before the event
                                        </p>
                                    </div>
                                    <Switch
                                        id={`week-before-${event.eventId}`}
                                        checked={reminders[event.eventId]?.weekBefore || false}
                                        onCheckedChange={(checked) => handleToggle(event.eventId, 'weekBefore', checked)}
                                        disabled={saving[event.eventId] || !user.data.isAdmin}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor={`day-before-${event.eventId}`} className="text-sm">
                                            Day Before Event
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            1 day before the event
                                        </p>
                                    </div>
                                    <Switch
                                        id={`day-before-${event.eventId}`}
                                        checked={reminders[event.eventId]?.dayBefore || false}
                                        onCheckedChange={(checked) => handleToggle(event.eventId, 'dayBefore', checked)}
                                        disabled={saving[event.eventId] || !user.data.isAdmin}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}