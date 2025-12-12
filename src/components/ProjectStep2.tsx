import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, X, AlertCircle, Plus, Save, MessageSquare, CalendarIcon } from 'lucide-react';
import { colorOptions, MAX_TEAM_MEMBERS_PER_PROJECT } from '@/constant/constant';
import { ProjectFormData, EventFormData } from './AddProjectDialog';
import { Switch } from '@/components/ui/switch';
import { AvailableMember } from '@/api/member';
import { useEffect, useRef, useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { RoleDropdown } from './dropdowns/RoleDropdown';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Calendar2 } from './ui/calendar2';
import { Badge } from './ui/badge';

export interface TeamAssignment {
  id: string;
  memberName: string;
  responsibility: string;
  memberId: string;
  roleId: string;
  instructions: string;
}
export interface CurrentMember {
  memberId: string;
  memberName: string;
  memberPhoto: string;
  responsibility: string;
  roleId: string;
  instructions: string;
}
interface ProjectStep2Props {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData | ((prev: ProjectFormData) => ProjectFormData)) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  eventData: EventFormData;
  updateEventData: (field: keyof EventFormData, value: any) => void;
  teamAssignments: TeamAssignment[];
  currentMember: CurrentMember;
  updateCurrentMember: (field: keyof CurrentMember, value: string) => void;
  addTeamMember: () => void;
  removeTeamMember: (id: string) => void;
  filteredAvailableMembers: AvailableMember[];
  isLoadingAvailableMembers: boolean;
  hasConflicts: (memberId: string) => boolean;
  isPartiallyAvailable: (memberId: string) => boolean;
  onAddTeamMember: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  checkMemberAvailability: () => void;
  onDialogCloseTrigger: number;
  eventIndex: number;
}

export function ProjectStep2({
  formData,
  setFormData,
  errors,
  eventData,
  updateEventData,
  teamAssignments,
  currentMember,
  updateCurrentMember,
  addTeamMember,
  removeTeamMember,
  filteredAvailableMembers,
  isLoadingAvailableMembers,
  hasConflicts,
  isPartiallyAvailable,
  onAddTeamMember,
  checkMemberAvailability,
  onDialogCloseTrigger,
  setErrors,
  eventIndex
}: ProjectStep2Props) {
  const { roles } = useRole();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const hours = Array.from({ length: 25 }, (_, i) => i);

  const handleDateSelect = (date: Date | undefined) => {

    if (date) {
      updateEventData('date', format(date, "yyyy-MM-dd"));
      setIsCalendarOpen(false);

      // Clear errors
      // if (errors[`event-${eventIndex}-date`]) {
      //   setErrors(prev => ({ ...prev, [`event-${eventIndex}-date`]: '' }));
      // }
    }
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEventData('date', '');
  };

  const handleDialogCloseLocally = () => {
    checkMemberAvailability();
  };
  useEffect(() => {
    handleDialogCloseLocally();
  }, [onDialogCloseTrigger]);

  // Get role name from role ID for display
  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || roleId;
  };

  const handleResponsibilityChange = (roleId: string) => {
    const selectedRole = roles.find(role => role.id === roleId);
    if (selectedRole) {
      updateCurrentMember('responsibility', selectedRole.name);
      updateCurrentMember('roleId', selectedRole.id);
    }
  };

  const handleMemberChange = (memberId: string) => {
    const selectedMember = filteredAvailableMembers.find(member => member.id === memberId);
    if (selectedMember) {
      updateCurrentMember('memberId', selectedMember.id);
      updateCurrentMember('memberName', selectedMember.name);

      const memberRole = roles.find(role => role.name === selectedMember.role);
      if (memberRole) {
        updateCurrentMember('responsibility', memberRole.name);
        updateCurrentMember('roleId', memberRole.id);
      } else {
        updateCurrentMember('responsibility', selectedMember.role);
        const fallbackRole = roles.find(role => role.name.toLowerCase() === selectedMember.role.toLowerCase());
        updateCurrentMember('roleId', fallbackRole?.id || selectedMember.role);
      }
    }
  };

  // Handle reminder toggle for current event
  const handleReminderToggle = (reminderType: 'weekBefore' | 'dayBefore', checked: boolean) => {
    updateEventData('reminders', {
      ...eventData.reminders,
      [reminderType]: checked
    });
  };

  // Update event field
  const updateEventField = (field: keyof EventFormData, value: any) => {
    updateEventData(field, value);

    // Clear corresponding error
    const errorKey = `event-${eventIndex}-${field}`;
    // if (errors[errorKey]) {
    //   setErrors(prev => ({ ...prev, [errorKey]: '' }));
    // }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Event Details */}
        <div className="space-y-4">
          {/* Event Name */}
          <div className="space-y-2">
            <div className='flex items-center justify-between'>
              <Label htmlFor="eventName">Event Name <span className='text-red-500'>*</span></Label>
              <div className="h-6 flex items-center">
                {errors[`event-${eventIndex}-name`] && (
                  <p className="text-red-500 text-sm">{errors[`event-${eventIndex}-name`]}</p>
                )}
              </div>
            </div>
            <Input
              id="eventName"
              value={eventData.name}
              onChange={(e) => updateEventField('name', e.target.value)}
              placeholder="Enter event name"
              required
            />
          </div>

          {/* Event Date */}
          <div className="space-y-2">
            <div className='flex items-center justify-between'>
              <Label htmlFor="eventDate">Event Date <span className='text-red-500'>*</span></Label>
              <div className="h-6 flex items-center">
                {errors[`event-${eventIndex}-date`] && (
                  <p className="text-red-500 text-sm">{errors[`event-${eventIndex}-date`]}</p>
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
                  {eventData.date ? (
                    format(new Date(eventData.date), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm font-medium">Select event date</span>
                    {eventData.date && (
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
                    classNames={{
                      day_today: "",
                    }}
                    defaultMonth={eventData.date ? new Date(eventData.date) : new Date()}
                    selected={eventData.date ? new Date(eventData.date) : undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={(date) => date < new Date()}
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
                value={eventData.startHour.toString()}
                onValueChange={(value) => {
                  const newStartHour = parseInt(value);
                  updateEventData('startHour', newStartHour);

                  // Adjust end hour if needed
                  if (newStartHour >= eventData.endHour) {
                    updateEventData('endHour', newStartHour + 1);
                  }
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
                        {`${hour}:00`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="endHour">End Time <span className='text-red-500'>*</span></Label>
              <Select
                value={eventData.endHour.toString()}
                onValueChange={(value) => updateEventData('endHour', parseInt(value))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-lg">
                  {hours.filter(h => h > eventData.startHour).map((hour) => (
                    <SelectItem key={hour} value={hour.toString()} className="hover:bg-muted">
                      {`${hour}:00`}
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
                {errors[`event-${eventIndex}-location`] && (
                  <p className="text-red-500 text-sm">{errors[`event-${eventIndex}-location`]}</p>
                )}
              </div>
            </div>
            <Input
              id="location"
              value={eventData.location}
              maxLength={150}
              onChange={(e) => updateEventField('location', e.target.value)}
              placeholder="Studio A, Conference Room, etc."
            />
          </div>

          {/* Event Reminders */}
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
                  checked={eventData.reminders.weekBefore}
                  onCheckedChange={(checked) => handleReminderToggle('weekBefore', checked)}
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
                  checked={eventData.reminders.dayBefore}
                  onCheckedChange={(checked) => handleReminderToggle('dayBefore', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Team Members for this Event */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className='flex items-center gap-2'>
              <Users className="w-5 h-5" />
              <Label className="text-base">Team Members <span className='text-red-500'>*</span></Label>
            </div>

            <Button type="button" size='sm' variant='outline' onClick={onAddTeamMember} className="cursor-pointer hover:bg-transparent hover:text-foreground">
              <Plus />
              Add New Member
            </Button>
          </div>

          {errors[`event-${eventIndex}-assignments`] && (
            <p className="text-red-500 text-sm">{errors[`event-${eventIndex}-assignments`]}</p>
          )}

          {/* Single Team Member Input */}
          <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Team Member</Label>
                <Select
                  value={currentMember.memberId}
                  onValueChange={handleMemberChange}
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
                          className={`
                            hover:bg-muted
                          `}
                          disabled={hasConflicts(member.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span>{member.name}</span>
                              <span className="text-muted-foreground text-xs">- {member.role || "No role assigned"}</span>
                              {member.availabilityStatus === 'unavailable' && (
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
              <Save className="w-3 h-3" />
              {hasConflicts(currentMember.memberId)
                ? "Member Unavailable"
                : teamAssignments.length > 0
                  ? "Save"
                  : "Save"
              }
            </Button>
          </div>

          {/* Team Summary for this Event */}
          {teamAssignments.length > 0 && (
            <div className="p-3 bg-background rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Team Summary</h4>
              <div className="space-y-2 overflow-y-auto max-h-[140px]">
                {teamAssignments.map((ta) => (
                  <div key={ta.id} className={`rounded-lg ${hasConflicts(ta.memberId)
                    ? " border border-red-800"
                    : isPartiallyAvailable(ta.memberId)
                      ? "border"
                      : "bg-muted/20"
                    }`}>
                    <div className="flex items-start justify-between p-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${hasConflicts(ta.memberId) ? "bg-red-800"
                              : "bg-green-800"
                              }`}
                          ></div>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm text-gray-500 truncate">{ta.memberName}</span>
                            <span className="text-muted-foreground text-sm flex-shrink-0">
                              - {getRoleName(ta.roleId)}
                            </span>
                          </div>
                        </div>

                        {/* Instructions Display */}
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}