import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { EditableBooking } from '@/hooks/useBookingEditor';
import { TeamMember } from './TeamMembers';
import { createProject } from '@/api/project';
import { getAvailableMembers, type AvailableMember } from '@/api/member';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ProjectStep1 } from './ProjectStep1';
import { ProjectStep2, TeamAssignment } from './ProjectStep2';

export interface AddProjectDialogProps {
  onAddBooking?: (booking: Omit<EditableBooking, 'id'>) => void;
  defaultHour?: number;
  teamMembers: TeamMember[];
  isOpen: boolean;
  setIsOpen(open: boolean): void;
  refreshMembers: () => void;
  onAddTeamMember: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onDialogCloseTrigger: number;
}

export interface ProjectFormData {
  projectName: string;
  startDate: string;
  endDate: string;
  startHour: number;
  endHour: number;
  color: string;
  description: string;
  location: string;
  client: {
    name: string;
    mobile: string;
    email: string;
  };
}

export function AddProjectDialog({
  onAddBooking,
  defaultHour = 9,
  teamMembers,
  isOpen,
  setIsOpen,
  refreshMembers,
  onAddTeamMember,
  onDialogCloseTrigger,
}: AddProjectDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    startDate: '',
    endDate: '',
    startHour: defaultHour,
    endHour: defaultHour + 1,
    color: '',
    description: '',
    location: '',
    client: {
      name: '',
      mobile: '',
      email: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [currentMember, setCurrentMember] = useState({
    memberId: '',
    memberName: '',
    memberPhoto: '',
    responsibility: ''
  });

  const { user, isCompany } = useAuth();
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [isLoadingAvailableMembers, setIsLoadingAvailableMembers] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [includeClient, setIncludeClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);

  const companyDetails = isCompany && user?.data
    ? user.data
    : JSON.parse(localStorage.getItem('user-details') || '{}');

  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startHour >= formData.endHour) {
      newErrors.endHour = 'End time must be after start time';
    }

    // Client validation if included
    if (includeClient) {
      if (!formData.client.name?.trim()) {
        newErrors.clientName = 'Client name is required';
      }
      if (!formData.client.email?.trim()) {
        newErrors.clientEmail = 'Client email is required';
      }
      if (!formData.client.mobile?.trim()) {
        newErrors.clientMobile = 'Client mobile is required';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.client.email && !emailRegex.test(formData.client.email)) {
        newErrors.clientEmail = 'Please enter a valid email address';
      }

      const mobileRegex = /^[+]?[\d\s\-()]+$/;
      if (formData.client.mobile && !mobileRegex.test(formData.client.mobile)) {
        newErrors.clientMobile = 'Please enter a valid mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (teamAssignments.length === 0) {
      newErrors.teamAssignments = 'At least one team member is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step completion checks
  const isStep1Complete = formData.projectName && formData.startDate && formData.endDate &&
    formData.startHour < formData.endHour &&
    (!includeClient || (formData.client.name && formData.client.email && formData.client.mobile));

  const isStep2Complete = formData.location && formData.description && teamAssignments.length > 0;

  // Fetch available members
  const checkMemberAvailability = async () => {
    if (!formData.startDate || !formData.endDate) return;

    setIsLoadingAvailableMembers(true);
    try {
      const result = await getAvailableMembers({
        companyId: companyDetails.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startHour: formData.startHour,
        endHour: formData.endHour
      });

      if (result.success && result.data) {
        setAvailableMembers(result.data.availableMembers);
        setAvailabilityChecked(true);
      }
    } catch (error) {
      console.error('Error checking member availability:', error);      
    } finally {
      setIsLoadingAvailableMembers(false);
    }
  };

  const handleNextStep = async () => {
    if (!validateStep1()) {
      console.error('Please fix the validation errors before proceeding');
      return;
    }

    setIsLoadingNextStep(true);
    try {
      await checkMemberAvailability();
      setCurrentStep(2);
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      toast.error('Failed to proceed to next step');
    } finally {
      setIsLoadingNextStep(false);
    }
  };

  const handlePreviousStep = () => {
    setErrors({});
    setCurrentStep(1);
  };

  // Reset everything when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setAvailableMembers([]);
      setAvailabilityChecked(false);
      setErrors({});
      setIncludeClient(false);
      setIsSubmitting(false);
      setIsLoadingNextStep(false);
      resetForm();
    }
  }, [isOpen]);

  const addTeamMember = () => {
    if (currentMember.memberName && currentMember.responsibility) {
      setTeamAssignments(prev => [
        ...prev,
        {
          id: currentMember.memberId,
          memberName: currentMember.memberName,
          responsibility: currentMember.responsibility,
          memberId: currentMember.memberId
        }
      ]);

      setCurrentMember({
        memberId: '',
        memberName: '',
        memberPhoto: '',
        responsibility: ''
      });
    }
  };

  const removeTeamMember = (id: string) => {
    setTeamAssignments(prev => prev.filter(assignment => assignment.id !== id));
  };

  const updateCurrentMember = (field: keyof typeof currentMember, value: string) => {
    setCurrentMember(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'memberId') {
        const selectedMember = availableMembers.find(m => m.id === value);
        if (selectedMember) {
          updated.memberName = selectedMember.name;
          updated.responsibility = selectedMember.role;
        }
      }

      if (field === 'memberName') {
        const selectedMember = availableMembers.find(m => m.id === value);
        if (selectedMember) {
          updated.memberId = selectedMember.id;
          updated.responsibility = selectedMember.role;
        }
      }

      return updated;
    });
  };

  const updateClientField = (field: keyof typeof formData.client, value: string) => {
    setFormData(prev => ({
      ...prev,
      client: {
        ...prev.client,
        [field]: value
      }
    }));

    if (errors[`client${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({
        ...prev,
        [`client${field.charAt(0).toUpperCase() + field.slice(1)}`]: ''
      }));
    }
  };

  const getDefaultFormData = (): ProjectFormData => ({
    projectName: '',
    startDate: '',
    endDate: '',
    startHour: defaultHour,
    endHour: defaultHour + 1,
    color: '',
    description: '',
    location: '',
    client: {
      name: '',
      mobile: '',
      email: ''
    }
  });

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setTeamAssignments([]);
    setCurrentMember({
      memberId: '',
      memberName: '',
      memberPhoto: '',
      responsibility: ''
    });
    setErrors({});
    setIncludeClient(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep(1);
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    if (!formData.projectName || teamAssignments.length === 0) return;

    setIsSubmitting(true);
    try {
      const primaryMember = teamAssignments[0];
      const allMembers = teamAssignments.map(ta =>
        `${ta.memberName} (${ta.responsibility})`
      ).join(', ');

      const res = await createProject({
        ...formData,
        memberName: primaryMember.memberName,
        description: formData.description,
        teamAssignments: teamAssignments,
        client: includeClient ? formData.client : undefined,
        newRole: undefined
      });

      if (res?.success) {
        refreshMembers();
        resetForm();
        setCurrentStep(1);
        setIsOpen(false);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAvailableMembers = availableMembers.filter(member =>
    !teamAssignments.some(ta => ta.memberId === member.id)
  );

  const hasConflicts = (memberId: string) => {
    const member = availableMembers.find(m => m.id === memberId);
    return member?.availabilityStatus === 'unavailable';
  };

  const isPartiallyAvailable = (memberId: string) => {
    const member = availableMembers.find(m => m.id === memberId);
    return member?.availabilityStatus === 'partially_available';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px]" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              Add New Booking - Step {currentStep} of 2
              {(isLoadingNextStep || isSubmitting) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className='max-h-[70vh] overflow-y-auto p-2'>
            {currentStep === 1 ? (
              <ProjectStep1
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
                includeClient={includeClient}
                setIncludeClient={setIncludeClient}
                updateClientField={updateClientField}
              />
            ) : (
              <ProjectStep2
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
                teamAssignments={teamAssignments}
                currentMember={currentMember}
                updateCurrentMember={updateCurrentMember}
                addTeamMember={addTeamMember}
                removeTeamMember={removeTeamMember}
                filteredAvailableMembers={filteredAvailableMembers}
                isLoadingAvailableMembers={isLoadingAvailableMembers}
                hasConflicts={hasConflicts}
                isPartiallyAvailable={isPartiallyAvailable}
                onAddTeamMember={onAddTeamMember}
                checkMemberAvailability={checkMemberAvailability}
                onDialogCloseTrigger={onDialogCloseTrigger}
              />
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            {currentStep === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleNextStep} 
                  disabled={!isStep1Complete || isLoadingNextStep}
                >
                  {isLoadingNextStep ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Availability...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-2">
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
                    disabled={!isStep2Complete || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Booking...
                      </>
                    ) : (
                      'Add Booking'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}