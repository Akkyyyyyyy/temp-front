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
import { useRole } from "@/hooks/useRole"; // Import roles hook
import { RoleDropdown } from "./dropdowns/RoleDropdown";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onMemberAdded: () => void;
  projectDetails?: {
    startDate: string;
    endDate: string;
    startHour: number;
    endHour: number;
  };
  assignedMembers?: Array<{
    id: string;
    name: string;
    email: string;
    profilePhoto: string;
    role: string;
  }>;
}

export function AddMemberToProjectDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onMemberAdded,
  projectDetails,
  assignedMembers = []
}: AddMemberDialogProps) {
  const [addMemberForm, setAddMemberForm] = useState({
    memberId: '',
    roleId: '' // Changed from 'role' to 'roleId'
  });
  const [addMemberErrors, setAddMemberErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableMembersData, setAvailableMembersData] = useState<AvailableMembersData | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const companyId = JSON.parse(localStorage.getItem('user-details') || '{}').id;
  
  // Get roles from hook to map role names to IDs
  const { roles } = useRole();

  // Fetch available members when dialog opens
  useEffect(() => {
    if (open && companyId && projectDetails) {
      fetchAvailableMembers();
    } else if (open && (!companyId || !projectDetails)) {
      setAddMemberErrors({ submit: 'Company ID and project details are required' });
    }
  }, [open, companyId, projectDetails]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAddMemberForm({ memberId: '', roleId: '' });
      setAddMemberErrors({});
    }
  }, [open]);

  const fetchAvailableMembers = async () => {
    if (!projectDetails) return;
    
    setIsLoadingMembers(true);
    try {
      const request = {
        companyId,
        startDate: projectDetails.startDate,
        endDate: projectDetails.endDate,
        startHour: projectDetails.startHour,
        endHour: projectDetails.endHour,
        excludeProjectId: projectId
      };

      const response = await getAvailableMembers(request);
      
      if (response.success && response.data) {
        setAvailableMembersData(response.data);
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

  // Filter out already assigned members from available members
  const getFilteredAvailableMembers = (): AvailableMember[] => {
    const allAvailableMembers = availableMembersData?.availableMembers || [];
    
    // Filter out members that are already assigned to this project
    const filteredMembers = allAvailableMembers.filter(member => 
      !assignedMembers.some(assignedMember => assignedMember.id === member.id)
    );

    return filteredMembers;
  };

  // Get the selected member's default role ID
  const getSelectedMemberDefaultRoleId = (): string => {
    if (!addMemberForm.memberId) return '';
    const selectedMember = getFilteredAvailableMembers().find(member => member.id === addMemberForm.memberId);
    
    if (!selectedMember?.role) return '';
    
    // Find the role ID by role name
    const role = roles.find(r => r.name === selectedMember.role);
    return role?.id || '';
  };

  // Update role when member selection changes
  useEffect(() => {
    if (addMemberForm.memberId) {
      const defaultRoleId = getSelectedMemberDefaultRoleId();
      setAddMemberForm(prev => ({ ...prev, roleId: defaultRoleId }));
    }
  }, [addMemberForm.memberId, roles]); // Added roles dependency

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!addMemberForm.memberId) {
      errors.memberId = "Please select a team member";
    }

    if (!addMemberForm.roleId.trim()) { // Changed from 'role' to 'roleId'
      errors.roleId = "Role is required"; // Changed from 'role' to 'roleId'
    }

    setAddMemberErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await addMemberToProject({
        projectId,
        memberId: addMemberForm.memberId,
        roleId: addMemberForm.roleId // Changed from 'role' to 'roleId'
      });

      if (response.success) {
        onOpenChange(false);
        setAddMemberForm({ memberId: '', roleId: '' }); // Changed from 'role' to 'roleId'
        setAddMemberErrors({});
        onMemberAdded();
      } else {
        setAddMemberErrors({ submit: response.message });
      }
    } catch (error) {
      console.error('Error adding member to project:', error);
      setAddMemberErrors({ submit: 'Failed to add member to project' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAddMemberForm({ memberId: '', roleId: '' }); // Changed from 'role' to 'roleId'
    setAddMemberErrors({});
    setAvailableMembersData(null);
  };

  const filteredAvailableMembers = getFilteredAvailableMembers();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
              <SelectContent className="bg-background border-border shadow-lg max-h-[50vh]">
                {filteredAvailableMembers.map((member) => (
                  <SelectItem 
                    key={member.id} 
                    value={member.id} 
                    className="hover:bg-muted"
                    disabled={member.availabilityStatus === 'unavailable'}
                  >
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`${S3_URL}/${member.profilePhoto}`} alt={member.name} className="object-cover" />
                        <AvatarFallback className="bg-studio-gold text-studio-dark text-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{member.name} - </span>
                          <span className="text-sm font-normal truncate"> {member.role}</span>

                          {member.availabilityStatus === 'unavailable' && (
                            <Badge variant="destructive" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                          {assignedMembers.some(assigned => assigned.id === member.id) && (
                            <Badge variant="secondary" className="text-xs">
                              Already Assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                {!isLoadingMembers && filteredAvailableMembers.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    {projectDetails 
                      ? assignedMembers.length > 0
                        ? "All team members are already assigned to this project"
                        : "No available team members for the project timeframe"
                      : "Project details required to load available members"
                    }
                  </div>
                )}
              </SelectContent>
            </Select>
            {addMemberErrors.memberId && (
              <p className="text-red-500 text-sm">{addMemberErrors.memberId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <RoleDropdown
              selected={addMemberForm.roleId} // Changed from 'role' to 'roleId'
              onChange={(roleId) => {
                setAddMemberForm(prev => ({ ...prev, roleId: roleId })); // Changed from 'role' to 'roleId'
                if (addMemberErrors.roleId) { // Changed from 'role' to 'roleId'
                  setAddMemberErrors({ ...addMemberErrors, roleId: '' }); // Changed from 'role' to 'roleId'
                }
              }}
              disabled={isLoading || !addMemberForm.memberId}
              placeholder="Select a role"
              className={`bg-background ${addMemberErrors.roleId ? 'border-red-500' : 'border-border'}`} // Changed from 'role' to 'roleId'
            />
            {addMemberErrors.roleId && ( // Changed from 'role' to 'roleId'
              <p className="text-red-500 text-sm">{addMemberErrors.roleId}</p> // Changed from 'role' to 'roleId'
            )}
          </div>

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
              filteredAvailableMembers.length === 0 || 
              !projectDetails ||
              addMemberForm.memberId === '' ||
              addMemberForm.roleId === '' || // Changed from 'role' to 'roleId'
              // Disable if selected member is unavailable
              (addMemberForm.memberId && 
               filteredAvailableMembers.find(m => m.id === addMemberForm.memberId)?.availabilityStatus === 'unavailable')
            }
          >
            {isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}