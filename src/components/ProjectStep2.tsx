import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, X, AlertCircle, Plus } from 'lucide-react';
import { colorOptions, MAX_TEAM_MEMBERS_PER_PROJECT, ROLES } from '@/constant/constant';
import { ProjectFormData } from './AddProjectDialog';

import { AvailableMember } from '@/api/member';
import { useEffect, useRef, useState } from 'react';

export interface TeamAssignment {
  id: string;
  memberName: string;
  responsibility: string;
  memberId: string;
}
export interface CurrentMember {
  memberId: string;
  memberName: string;
  memberPhoto: string;
  responsibility: string;
}
interface ProjectStep2Props {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData | ((prev: ProjectFormData) => ProjectFormData)) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  teamAssignments: TeamAssignment[];
  currentMember: {
    memberId: string;
    memberName: string;
    memberPhoto: string;
    responsibility: string;
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Additional Details */}
        <div className="space-y-4">
          {/* Color Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            
            {/* Custom Color Picker */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {/* Container for positioning */}
                <div className="relative">
                  {/* Hidden but positioned color input */}
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer"
                    style={{ zIndex: 10 }}
                  />
                  
                  {/* Color preview that sits behind the input */}
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

            {/* Quick Color Presets */}
            {/* <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Quick Colors</label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <span
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`
                      block w-6 h-6 rounded-md cursor-pointer transition-all duration-200
                      hover:scale-110 active:scale-95
                      ${formData.color === color.value 
                        ? 'ring-2 ring-offset-1 ring-primary scale-110' 
                        : 'hover:ring-1 hover:ring-offset-1 hover:ring-border'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div> */}
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
                  onValueChange={(value) => {
                    // Find the selected member by ID
                    const selectedMember = filteredAvailableMembers.find(member => member.id === value);
                    if (selectedMember) {
                      // Update both ID and name to keep them in sync
                      updateCurrentMember('memberId', selectedMember.id);
                      updateCurrentMember('memberName', selectedMember.name);
                    }
                  }}
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
                <Select
                  value={currentMember.responsibility}
                  onValueChange={(value) => updateCurrentMember('responsibility', value)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select responsibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border shadow-lg">
                    {ROLES.map((responsibility) => (
                      <SelectItem key={responsibility} value={responsibility} className="hover:bg-muted">
                        {responsibility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeamMember}
              disabled={!currentMember.memberName || !currentMember.responsibility || hasConflicts(currentMember.memberId)}
              className="text-xs w-full"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              {hasConflicts(currentMember.memberId)
                ? "Member Unavailable"
                : teamAssignments.length > 0
                  ? "Add Another Member"
                  : "Add Member"
              }
            </Button>
          </div>

          {/* Team Summary */}
          {teamAssignments.length > 0 && (
            <div className="p-3 bg-background rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Team Summary</h4>
              <div className="space-y-2 overflow-y-auto max-h-[136px]">
                {teamAssignments.map((ta) => (
                  <div key={ta.id} className={`flex items-center justify-between p-2 rounded ${hasConflicts(ta.memberId)
                    ? "bg-red-50 border border-red-200"
                    : isPartiallyAvailable(ta.memberId)
                      ? "border"
                      : "bg-muted/20"
                    }`}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${hasConflicts(ta.memberId) ? "bg-red-500"
                          : isPartiallyAvailable(ta.memberId) ? "bg-amber-500"
                            : "bg-green-500"
                          }`}
                      ></div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-500">{ta.memberName}</span>
                        <span className="text-muted-foreground text-sm">- {ta.responsibility}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(ta.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-3 h-3" />
                    </Button>
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