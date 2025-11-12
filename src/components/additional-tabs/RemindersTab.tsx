import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectReminders, IReminders, updateProjectReminders } from "@/api/additional-tabs";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface RemindersTabProps {
    projectId: string;
}

export function RemindersTab({ projectId }: RemindersTabProps) {
    const [reminders, setReminders] = useState<IReminders>({
        weekBefore: true,
        dayBefore: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchReminders = async () => {
            if (!projectId) return;

            setLoading(true);
            const response = await getProjectReminders({ projectId });

            if (response.success && response.reminders) {
                setReminders(response.reminders);
            }
            setLoading(false);
        };

        fetchReminders();
    }, [projectId]);

    const handleToggle = async (type: keyof IReminders, checked: boolean) => {
        if (!projectId || saving) return;

        const updated = { ...reminders, [type]: checked };
        setReminders(updated);

        setSaving(true);
        const response = await updateProjectReminders({
            projectId,
            reminders: updated
        });

        if (!response.success) {
            toast.error("Failed to update reminder");
            setReminders(reminders); // Revert on error
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-studio-gold" />
                <span className="ml-3 text-muted-foreground">Loading reminders...</span>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-2">
            <Card>
                <CardContent className="pt-6 space-y-6 bg-background rounded-md border border-border/20">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="week-before" className="text-base">
                                Week Before
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                7 days before project start
                            </p>
                        </div>
                        <Switch
                            id="week-before"
                            checked={reminders.weekBefore}
                            onCheckedChange={(checked) => handleToggle('weekBefore', checked)}
                            disabled={saving || !user.data.isAdmin}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="day-before" className="text-base">
                                Day Before
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                1 day before project start
                            </p>
                        </div>
                        <Switch
                            id="day-before"
                            checked={reminders.dayBefore}
                            onCheckedChange={(checked) => handleToggle('dayBefore', checked)}
                            disabled={saving || !user.data.isAdmin}
                        />
                    </div>
                </CardContent>
            </Card>


        </div>
    );
}