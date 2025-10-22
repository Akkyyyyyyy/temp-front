import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, Mail, MessageSquare } from "lucide-react";

interface ReminderSetting {
  id: string;
  name: string;
  email: boolean;
  text: boolean;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<ReminderSetting[]>([
    { id: "job-assignment", name: "Job Assignment", email: true, text: false },
    { id: "two-weeks", name: "Two Weeks Before", email: false, text: false },
    { id: "72-hours", name: "72 Hours Before", email: true, text: true },
    { id: "24-hours", name: "24 Hours Before", email: true, text: true },
    { id: "2-hours", name: "2 Hours Before", email: false, text: true },
  ]);

  const updateReminder = (id: string, type: 'email' | 'text', value: boolean) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, [type]: value }
        : reminder
    ));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log("Saving reminder settings:", reminders);
    window.close(); // Close the tab after saving
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.close()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Close
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-6 h-6 text-studio-gold" />
              Reminder Settings
            </h1>
            <p className="text-muted-foreground">Configure email and text notifications for project milestones</p>
          </div>
        </div>

        {/* Reminder Settings */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center pb-4 border-b border-border/20">
              <div className="font-medium text-foreground">Reminder Type</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                Text
              </div>
            </div>

            {reminders.map((reminder) => (
              <div key={reminder.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-4 border-b border-border/10 last:border-b-0">
                <div>
                  <Label className="text-foreground font-medium">{reminder.name}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reminder.id === 'job-assignment' && 'Notification sent when assigned to a new project'}
                    {reminder.id === 'two-weeks' && 'Advance notice for upcoming projects'}
                    {reminder.id === '72-hours' && 'Final preparation reminder'}
                    {reminder.id === '24-hours' && 'Last day preparation notice'}
                    {reminder.id === '2-hours' && 'Immediate pre-shoot reminder'}
                  </p>
                </div>
                
                <div className="flex items-center justify-center">
                  <Switch
                    checked={reminder.email}
                    onCheckedChange={(checked) => updateReminder(reminder.id, 'email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  <Switch
                    checked={reminder.text}
                    onCheckedChange={(checked) => updateReminder(reminder.id, 'text', checked)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/20">
            <div className="text-sm text-muted-foreground">
              Changes will be applied to all future projects
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.close()}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-studio-gold text-studio-dark hover:bg-studio-gold-light">
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}