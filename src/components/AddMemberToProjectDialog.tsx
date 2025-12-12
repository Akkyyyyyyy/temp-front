import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { addMemberToProject } from "@/api/project";
import { AvailableMember, AvailableMembersData, getAvailableMembers } from "@/api/member";
import { useRole } from "@/hooks/useRole";
import { RoleDropdown } from "./dropdowns/RoleDropdown";
import { useAuth } from "@/context/AuthContext";
import { getFallback } from "@/helper/helper";
import { Plus, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onAddTeamMember: () => void;
  onMemberAdded: () => void;
  projectDetails?: {
    date: string;
    startHour: number;
    endHour: number;
  };
  assignedMembers?: Array<{
    id: string;
    name: string;
    email: string;
    profilePhoto: string;
    role: string;
    eventId?: string; // Add eventId to track which event the member is assigned to
  }>;
  selectedEventId?: string;
  selectedEventName?: string;
  projectEvents?: Array<{
    id: string;
    name: string;
    date: string;
    startHour: number;
    endHour: number;
    location?: string;
    assignments?: Array<{ // Add assignments to project events
      id: string;
      member: {
        id: string;
        name: string;
        email: string;
        profilePhoto?: string;
      };
      role: {
        id: string;
        name: string;
      };
    }>;
  }>;
}

export function AddMemberToProjectDialog({
  open,
  onOpenChange,
  projectId,
  onMemberAdded,
  onAddTeamMember,
  projectDetails,
  assignedMembers = [],
  selectedEventId = "",
  selectedEventName = "",
  projectEvents = []
}: AddMemberDialogProps) {
  const [addMemberForm, setAddMemberForm] = useState({
    memberId: '',
    roleId: '',
    eventId: selectedEventId
  });
  const [addMemberErrors, setAddMemberErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableMembersData, setAvailableMembersData] = useState<any | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { user } = useAuth();
  const companyId = user.data.company.id;

  const { roles } = useRole();

  // Fetch available members when dialog opens or event changes
  useEffect(() => {
    if (open && companyId && projectDetails && addMemberForm.eventId) {
      fetchAvailableMembers();
    } else if (open && (!companyId || !projectDetails)) {
      setAddMemberErrors({ submit: 'Company ID and project details are required' });
    }
  }, [open, companyId, projectDetails, addMemberForm.eventId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAddMemberForm({
        memberId: '',
        roleId: '',
        eventId: selectedEventId
      });
      setAddMemberErrors({});
    }
  }, [open, selectedEventId]);

  // Update eventId when selectedEventId prop changes
  useEffect(() => {
    if (selectedEventId && selectedEventId !== addMemberForm.eventId) {
      setAddMemberForm(prev => ({ ...prev, eventId: selectedEventId }));
    }
  }, [selectedEventId]);

  const fetchAvailableMembers = async () => {
    if (!projectDetails || !addMemberForm.eventId) return;

    setIsLoadingMembers(true);
    try {
      const request = {
        companyId,
        eventDate: projectDetails.date, // Changed from startDate to eventDate
        startHour: projectDetails.startHour,
        endHour: projectDetails.endHour,
        excludeEventId: addMemberForm.eventId // Using addMemberForm.eventId instead of selectedEventId
      };
      const response = await getAvailableMembers(request);

      if (response.success && response.data) {
        setAvailableMembersData(response.data.availableMembers);
      } else {
        setAddMemberErrors({ submit: response.message || 'Failed to load available members' });
        setAvailableMembersData(null);
      }
    } catch (error) {
      console.error('Error fetching available members:', error);
      setAddMemberErrors({ submit: 'Failed to load available members' });
      setAvailableMembersData(null);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Get members already assigned to the selected event
  const getAssignedMembersForSelectedEvent = (): string[] => {
    if (!addMemberForm.eventId) return [];

    // Find the selected event
    const selectedEvent = projectEvents.find(event => event.id === addMemberForm.eventId);
    if (selectedEvent?.assignments) {
      // Return array of member IDs who are already assigned to this event
      return selectedEvent.assignments.map(assignment => assignment.member.id);
    }

    return [];
  };

  // Filter out already assigned members from available members for the selected event
  const getFilteredAvailableMembers = (availableMembersData): AvailableMember[] => {
    const allAvailableMembers = availableMembersData || [];
    const assignedMemberIds = getAssignedMembersForSelectedEvent();

    // Filter out members that are already assigned to this specific event
    const filteredMembers = allAvailableMembers.filter(member =>
      !assignedMemberIds.includes(member.id)
    );

    return filteredMembers;
  };

  // Get the selected member's default role ID
  const getSelectedMemberDefaultRoleId = (): string => {
    if (!addMemberForm.memberId) return '';
    const selectedMember = getFilteredAvailableMembers(availableMembersData).find(member => member.id === addMemberForm.memberId);

    if (!selectedMember?.role) return '';

    const role = roles.find(r => r.name === selectedMember.role);
    return role?.id || '';
  };

  // Update role when member selection changes
  useEffect(() => {
    if (addMemberForm.memberId) {
      const defaultRoleId = getSelectedMemberDefaultRoleId();
      setAddMemberForm(prev => ({ ...prev, roleId: defaultRoleId }));
    }
  }, [addMemberForm.memberId, roles]);

  // Format time from hour number to readable format
  const formatTime = (hour: number) => {
    const isPM = hour >= 12;
    const displayHour = hour % 12 || 12;
    return `${displayHour}${isPM ? 'PM' : 'AM'}`;
  };

  // Format event name for dropdown
  const formatEventName = (event: any) => {
    return `${event.name} - ${format(parseISO(event.date), "MMM do, yyyy")} (${formatTime(event.startHour)} - ${formatTime(event.endHour)})`;
  };

  // Check if a member is already assigned to the selected event
  const isMemberAssignedToSelectedEvent = (memberId: string): boolean => {
    const assignedMemberIds = getAssignedMembersForSelectedEvent();
    return assignedMemberIds.includes(memberId);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!addMemberForm.eventId) {
      errors.eventId = "Please select an event";
    }

    if (!addMemberForm.memberId) {
      errors.memberId = "Please select a team member";
    }

    if (!addMemberForm.roleId.trim()) {
      errors.roleId = "Role is required";
    }

    setAddMemberErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = async () => {
    if (!validateForm()) return;

    // Double-check that the member isn't already assigned (in case of race conditions)
    if (isMemberAssignedToSelectedEvent(addMemberForm.memberId)) {
      setAddMemberErrors({ submit: 'This member is already assigned to the selected event' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await addMemberToProject({
        projectId,
        memberId: addMemberForm.memberId,
        roleId: addMemberForm.roleId,
        eventId: addMemberForm.eventId
      });

      if (response.success) {
        onOpenChange(false);
        setAddMemberForm({
          memberId: '',
          roleId: '',
          eventId: selectedEventId
        });
        setAddMemberErrors({});
        onMemberAdded();
      } else {
        setAddMemberErrors({ submit: response.message });
      }
    } catch (error) {
      console.error('Error adding member to event:', error);
      setAddMemberErrors({ submit: 'Failed to add member to event' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAddMemberForm({
      memberId: '',
      roleId: '',
      eventId: selectedEventId
    });
    setAddMemberErrors({});
    setAvailableMembersData(null);
  };

  const filteredAvailableMembers = getFilteredAvailableMembers(availableMembersData);
  const assignedMemberIds = getAssignedMembersForSelectedEvent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex">
          <DialogTitle className="flex items-center justify-between">
            Add Member
            <Button type="button" size='default' variant='outline' onClick={onAddTeamMember} className="cursor-pointer hover:bg-transparent hover:text-foreground">
              <Plus />
              Add New Member
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Event Selection
          {projectEvents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="event">Select Event *</Label>
              <Select
                value={addMemberForm.eventId}
                onValueChange={(value) => {
                  setAddMemberForm(prev => ({ ...prev, eventId: value, memberId: '', roleId: '' }));
                  if (addMemberErrors.eventId) {
                    setAddMemberErrors({ ...addMemberErrors, eventId: '' });
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger className={`bg-background ${addMemberErrors.eventId ? 'border-red-500' : 'border-border'}`}>
                  <SelectValue
                    placeholder="Choose an event"
                  />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-lg max-h-[50vh]">
                  {projectEvents.map((event) => (
                    <SelectItem
                      key={event.id}
                      value={event.id}
                      className="hover:bg-muted"
                    >
                      <div className="flex items-center gap-3 py-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{event.name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addMemberErrors.eventId && (
                <p className="text-red-500 text-sm">{addMemberErrors.eventId}</p>
              )}
            </div>
          )} */}

          {/* Show warning if no events */}
          {projectEvents.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  No events available. Please create events first before adding team members.
                </span>
              </div>
            </div>
          )}

          {/* Member Selection - Only show if event is selected */}
          {addMemberForm.eventId && (
            <div className="space-y-2">
              <Label htmlFor="member">Select Team Member *</Label>
              <Select
                value={addMemberForm.memberId}
                onValueChange={(value) => {
                  setAddMemberForm(prev => ({ ...prev, memberId: value }));
                  if (addMemberErrors.memberId) {
                    setAddMemberErrors({ ...addMemberErrors, memberId: '' });
                  }
                }}
                disabled={isLoading || isLoadingMembers}
              >
                <SelectTrigger className={`bg-background ${addMemberErrors.memberId ? 'border-red-500' : 'border-border'}`}>
                  <SelectValue
                    placeholder={
                      isLoadingMembers
                        ? "Loading available members..."
                        : filteredAvailableMembers.length === 0
                          ? "No available members"
                          : "Choose a team member"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-lg max-h-60 overflow-y-auto">
                  {
                    filteredAvailableMembers.map((member) => (
                      <SelectItem
                        key={member.id}
                        value={member.id}
                        className={`
          hover:bg-muted
        `}
                        disabled={member.availabilityStatus === 'unavailable'}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{member.name}</span>

                              <span className="text-sm font-normal truncate text-muted-foreground">
                                - {member.role || "No role assigned"}
                              </span>

                              {member.availabilityStatus === 'unavailable' && (
                                <Badge variant="destructive" className="text-xs">
                                  Unavailable
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1 mt-1">
                              {isMemberAssignedToSelectedEvent(member.id) && (
                                <Badge variant="secondary" className="text-xs">
                                  Already Assigned
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              {addMemberErrors.memberId && (
                <p className="text-red-500 text-sm">{addMemberErrors.memberId}</p>
              )}
            </div>
          )}

          {/* Role Selection - Only show if member is selected */}
          {addMemberForm.memberId && (
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <RoleDropdown
                selected={addMemberForm.roleId}
                onChange={(roleId) => {
                  setAddMemberForm(prev => ({ ...prev, roleId: roleId }));
                  if (addMemberErrors.roleId) {
                    setAddMemberErrors({ ...addMemberErrors, roleId: '' });
                  }
                }}
                disabled={isLoading || !addMemberForm.memberId}
                placeholder="Select a role"
                className={`bg-background ${addMemberErrors.roleId ? 'border-red-500' : 'border-border'}`}
              />
              {addMemberErrors.roleId && (
                <p className="text-red-500 text-sm">{addMemberErrors.roleId}</p>
              )}
            </div>
          )}
          {addMemberErrors.submit && (
            <p className="text-red-500 text-sm">{addMemberErrors.submit}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={
              isLoading ||
              isLoadingMembers ||
              !addMemberForm.eventId ||
              filteredAvailableMembers.length === 0 ||
              !projectDetails ||
              addMemberForm.memberId === '' ||
              addMemberForm.roleId === '' ||
              // Disable if selected member is unavailable or already assigned
              (addMemberForm.memberId && (
                filteredAvailableMembers.find(m => m.id === addMemberForm.memberId)?.availabilityStatus === 'unavailable' ||
                isMemberAssignedToSelectedEvent(addMemberForm.memberId)
              ))
            }
          >
            {isLoading ? 'Adding to Event...' : 'Add to Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}