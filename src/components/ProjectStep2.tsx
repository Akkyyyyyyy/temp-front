import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, X, AlertCircle, Plus, Save, MessageSquare } from 'lucide-react';
import { colorOptions, MAX_TEAM_MEMBERS_PER_PROJECT } from '@/constant/constant';
import { ProjectFormData } from './AddProjectDialog';
import { Switch } from '@/components/ui/switch'; // Add switch import
import { AvailableMember } from '@/api/member';
import { useEffect, useRef, useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { RoleDropdown } from './dropdowns/RoleDropdown';

export interface TeamAssignment {
  id: string;
  memberName: string;
  responsibility: string;
  memberId: string;
  roleId: string;
  instructions: string; // Add instructions to team assignment
}
export interface CurrentMember {
  memberId: string;
  memberName: string;
  memberPhoto: string;
  responsibility: string;
  roleId: string;
  instructions: string; // Add instructions to current member
}
interface ProjectStep2Props {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData | ((prev: ProjectFormData) => ProjectFormData)) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  teamAssignments: TeamAssignment[];
  currentMember: {
    roleId: string;
    memberId: string;
    memberName: string;
    memberPhoto: string;
    responsibility: string;
    instructions: string;
  };
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
}

export function ProjectStep2({
  formData,
  setFormData,
  errors,
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
  onDialogCloseTrigger
}: ProjectStep2Props) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { roles } = useRole();
  const [expandedMember, setExpandedMember] = useState<string | null>(null); // Track which member is expanded for instructions

  const handleDialogCloseLocally = () => {
    checkMemberAvailability();
  };
  useEffect(() => {
    handleDialogCloseLocally();
  }, [onDialogCloseTrigger]);

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleColorPreviewClick = () => {
    colorInputRef.current?.click();
  };

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
  // When member selection changes, set their default role
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

  // Handle reminder toggle
  const handleReminderToggle = (reminderType: 'weekBefore' | 'dayBefore', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [reminderType]: checked
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Additional Details */}
        <div className="space-y-4">
          {/* Color Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="relative">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer"
                    style={{ zIndex: 10 }}
                  />
                  <span
                    className={`
                      block w-12 h-12 rounded-md border-2 cursor-pointer transition-all duration-200
                      ${formData.color ? 'border-border' : 'border-dashed border-muted-foreground/30'}
                    `}
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">
                      {formData.color}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the color box to pick a custom color
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              maxLength={150}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, location: e.target.value }));
              }}
              placeholder="Studio A, Conference Room, etc."
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              maxLength={350}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
              }}
              placeholder="Additional notes about this booking..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Reminders Section */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Reminders</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekBefore" className="text-sm font-normal">
                    Week Before
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send reminder 1 week before the project
                  </p>
                </div>
                <Switch
                  id="weekBefore"
                  checked={formData.reminders.weekBefore}
                  onCheckedChange={(checked) => handleReminderToggle('weekBefore', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dayBefore" className="text-sm font-normal">
                    Day Before
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send reminder 1 day before the project
                  </p>
                </div>
                <Switch
                  id="dayBefore"
                  checked={formData.reminders.dayBefore}
                  onCheckedChange={(checked) => handleReminderToggle('dayBefore', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Team Members */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className='flex items-center gap-2'>
              <Users className="w-5 h-5" />
              <Label className="text-base">Team Members *</Label>
            </div>

            <Button type="button" size='sm' variant='outline' onClick={onAddTeamMember} className="cursor-pointer hover:bg-transparent hover:text-foreground">
              <Plus />
              Add New Member
            </Button>
          </div>

          {errors.teamAssignments && (
            <p className="text-red-500 text-sm">{errors.teamAssignments}</p>
          )}

          {/* Single Team Member Input */}
          <div className="p-3 bg-muted/20 rounded-lg border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Team Member</Label>
                <Select
                  value={currentMember.memberId}
                  onValueChange={handleMemberChange}
                  disabled={isLoadingAvailableMembers}
                >
                  <SelectTrigger className="bg-background border-border truncate">
                    <SelectValue placeholder={
                      isLoadingAvailableMembers ? "Loading availability..." : "Select member"
                    } />
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
                            ${hasConflicts(member.id) ? "text-red-600 hover:bg-red-50" : ""}
                            ${isPartiallyAvailable(member.id) ? "hover:bg-amber-50" : ""}
                          `}
                          disabled={hasConflicts(member.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {hasConflicts(member.id) && (
                                <AlertCircle className="w-3 h-3 text-red-600" />
                              )}
                              <span>{member.name}</span>
                              <span className="text-muted-foreground text-xs">- {member.role}</span>
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

          {/* Team Summary */}
          {teamAssignments.length > 0 && (
            <div className="p-3 bg-background rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Team Summary</h4>
              <div className="space-y-2 overflow-y-auto max-h-[300px]">
                {teamAssignments.map((ta) => (
                  <div key={ta.id} className={`rounded ${hasConflicts(ta.memberId)
                      ? "bg-red-50 border border-red-200"
                      : isPartiallyAvailable(ta.memberId)
                        ? "border"
                        : "bg-muted/20"
                    }`}>
                    <div className="flex items-start justify-between p-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${hasConflicts(ta.memberId) ? "bg-red-500"
                                : isPartiallyAvailable(ta.memberId) ? "bg-amber-500"
                                  : "bg-green-500"
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