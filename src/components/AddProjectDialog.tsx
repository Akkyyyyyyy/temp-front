import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from 'lucide-react';
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
  color: string;
  description: string;
  client: {
    name: string;
    mobile: string;
    email: string;
    cc: string;
  };
  reminders: {
    weekBefore: boolean;
    dayBefore: boolean;
  };
  events: EventFormData[]; // Changed from single event to multiple events
}

export interface EventFormData {
  id: string;
  name: string; // Added event name
  date: string;
  startHour: number;
  endHour: number;
  location: string;
  reminders: {
    weekBefore: boolean;
    dayBefore: boolean;
  };
  assignments: TeamAssignment[]; // Assignments are now at event level
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
    color: '',
    description: '',
    client: {
      name: '',
      mobile: '',
      email: '',
      cc: ''
    },
    reminders: {
      weekBefore: true,
      dayBefore: true
    },
    events: [getDefaultEventData()] // Start with one default event
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentEventIndex, setCurrentEventIndex] = useState(0); // Track which event we're editing
  const [currentMember, setCurrentMember] = useState({
    memberId: '',
    memberName: '',
    memberPhoto: '',
    responsibility: '',
    roleId: '',
    instructions: ''
  });

  const { user } = useAuth();
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [isLoadingAvailableMembers, setIsLoadingAvailableMembers] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [includeClient, setIncludeClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);

  // Helper function to create default event data
  function getDefaultEventData(): EventFormData {
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      date: '',
      startHour: defaultHour,
      endHour: defaultHour + 1,
      location: '',
      reminders: {
        weekBefore: true,
        dayBefore: true
      },
      assignments: []
    };
  }

  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    }

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

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

      if (formData.client.mobile && formData.client.mobile.replace(/\D/g, '').length < 7) {
        newErrors.clientMobile = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    // Validate each event
    formData.events.forEach((event, index) => {
      if (!event.name?.trim()) {
        newErrors[`event-${index}-name`] = 'Event name is required';
      }
      if (!event.date) {
        newErrors[`event-${index}-date`] = 'Event date is required';
      }
      if (!event.location?.trim()) {
        newErrors[`event-${index}-location`] = 'Location is required';
      }
      if (event.assignments.length === 0) {
        newErrors[`event-${index}-assignments`] = 'At least one team member is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch available members for current event
  const checkMemberAvailability = async () => {
    const currentEvent = formData.events[currentEventIndex];
    if (!currentEvent?.date) return;

    setIsLoadingAvailableMembers(true);
    try {
      const result = await getAvailableMembers({
        companyId: user.data.company.id,
        eventDate: currentEvent.date,
        startHour: currentEvent.startHour,
        endHour: currentEvent.endHour
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

  useEffect(() => {
    checkMemberAvailability();
  }, [formData.events[currentEventIndex].date, formData.events[currentEventIndex].startHour, formData.events[currentEventIndex].endHour]);

  const handleNextStep = async () => {
    if (!validateStep1()) {
      console.error('Please fix the validation errors before proceeding');
      return;
    }

    setIsLoadingNextStep(true);
    try {
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
      setCurrentEventIndex(0);
      setAvailableMembers([]);
      setAvailabilityChecked(false);
      setErrors({});
      setIncludeClient(false);
      setIsSubmitting(false);
      setIsLoadingNextStep(false);
      resetForm();
    }
  }, [isOpen]);

  // Event management functions
  const addEvent = () => {
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, getDefaultEventData()]
    }));
    setCurrentEventIndex(formData.events.length); // Switch to the new event
  };

  const removeEvent = (index: number) => {

    if (formData.events.length <= 1) {
      toast.error('At least one event is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }));

    // Adjust current event index if needed
    if (currentEventIndex >= index) {
      setCurrentEventIndex(Math.max(0, currentEventIndex - 1));
    }
  };

  const updateCurrentEvent = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.map((event, index) =>
        index === currentEventIndex ? { ...event, [field]: value } : event
      )
    }));
  };

  // Team assignment functions for current event
  const addTeamMember = () => {
    const currentEvent = formData.events[currentEventIndex];
    if (currentMember.memberName && currentMember.responsibility) {
      updateCurrentEvent('assignments', [
        ...currentEvent.assignments,
        {
          id: currentMember.memberId,
          memberName: currentMember.memberName,
          responsibility: currentMember.responsibility,
          memberId: currentMember.memberId,
          roleId: currentMember.roleId,
          instructions: currentMember.instructions,
        }
      ]);

      setCurrentMember({
        memberId: '',
        memberName: '',
        memberPhoto: '',
        responsibility: '',
        roleId: '',
        instructions: '',
      });
    }
  };

  const removeTeamMember = (id: string) => {
    const currentEvent = formData.events[currentEventIndex];
    updateCurrentEvent('assignments',
      currentEvent.assignments.filter(assignment => assignment.id !== id)
    );
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
    color: '',
    description: '',
    client: {
      name: '',
      mobile: '',
      email: '',
      cc: ''
    },
    reminders: {
      weekBefore: true,
      dayBefore: true
    },
    events: [getDefaultEventData()]
  });

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setCurrentEventIndex(0);
    setCurrentMember({
      memberId: '',
      memberName: '',
      memberPhoto: '',
      responsibility: '',
      roleId: '',
      instructions: '',
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
      return;
    }

    setIsSubmitting(true);
    try {
      const apiData = {
        ...formData,
        events: formData.events.map(event => ({
          name: event.name,
          date: event.date,
          startHour: event.startHour,
          endHour: event.endHour,
          location: event.location,
          reminders: event.reminders,
          assignments: event.assignments.map(assignment => ({
            memberId: assignment.memberId,
            roleId: assignment.roleId,
            instructions: assignment.instructions
          }))
        })),
        client: includeClient ? formData.client : undefined
      };
      const res = await createProject(apiData, user.data.company.id);

      if (res?.success) {
        refreshMembers();
        resetForm();
        setCurrentStep(1);
        setIsOpen(false);
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

  const currentEvent = formData.events[currentEventIndex];
  const filteredAvailableMembers = availableMembers.filter(member =>
    !currentEvent.assignments.some(ta => ta.memberId === member.id)
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
      <DialogContent className="sm:max-w-[1000px]" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              Add New Project - Step {currentStep} of 2
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
              <div className="space-y-6">
                {/* Events Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Events</h3>
                </div>

                {/* Event Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                  {formData.events.map((event, index) => {
                    // Check if this event has any errors
                    const hasEventErrors = Object.keys(errors).some(key =>
                      key.startsWith(`event-${index}-`)
                    );

                    return (
                      <div
                        key={event.id}
                        className={`flex items-center px-3 py-1 rounded-md border cursor-pointer ${currentEventIndex === index
                            ? "bg-studio-gold text-black"
                            : "bg-transparent"
                          } ${hasEventErrors ? "border-red-500 border-2" : ""
                          }`}
                        onClick={() => setCurrentEventIndex(index)}
                      >
                        <span className="truncate mr-2">
                          {
                            formData.events[index].name ? (formData.events[index].name):(`Event ${index + 1}`)
                          }
                          {hasEventErrors && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </span>

                        {/* Delete icon */}
                        {formData.events.length > 1 && (
                          <Trash2
                            className="w-3 h-3 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEvent(index);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEvent}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </Button>
                </div>

                {/* Current Event Form */}
                <ProjectStep2
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  setErrors={setErrors}
                  eventData={currentEvent}
                  updateEventData={updateCurrentEvent}
                  teamAssignments={currentEvent.assignments}
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
                  eventIndex={currentEventIndex}
                />
              </div>
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
                  disabled={isLoadingNextStep}
                >
                  {isLoadingNextStep ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      'Create Project'
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