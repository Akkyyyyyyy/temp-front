import { useEffect, useState } from "react";
import { Calendar, Clock, User, Mail, Phone, MapPin, Save, X, Edit, Plus, Trash2, Award, FileText, AlertCircle, BriefcaseBusiness, Delete, LogOut, AlertTriangle, Camera, Info, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, toggleMemberStatus, updateMember } from "@/api/member";
import { toast } from "sonner";
import { TeamMember } from "./TeamMembers";
import * as yup from 'yup';
import { format } from "date-fns";
import { removeMemberPhoto, updateMemberProfile, uploadMemberPhoto } from "@/api/member";
import { removeMemberFromProject } from "@/api/project";
import { Switch } from "./ui/switch";
import { useRole } from "@/hooks/useRole";
import { RoleDropdown } from "./dropdowns/RoleDropdown";
import { Label } from "./ui/label";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const baseUrl = import.meta.env.VITE_BACKEND_URL;
const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface TeamMemberProfileProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onDeleteMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onUpdateProject: (memberId: string, projectId: string, updates: Partial<Project>) => void;
  onAddProject: (memberId: string, project: Omit<Project, 'id'>) => void;
  onDeleteProject: (memberId: string, projectId: string) => void;
  refreshMembers: () => void;
}

// Yup validation schemas
const profileSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .test('min-if-not-empty', 'Name must be at least 3 characters', value => {
      if (!value) return true;
      return value.length >= 3;
    })
    .max(50, 'Name must be at most 50 characters'),
  role: yup
    .string()
    .required('Role is required'),
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: yup
    .string()
    .test('is-valid-phone', 'Invalid phone number format', value => {
      if (!value) return true; // skip if empty or undefined
      // Must contain at least 7 digits, optional +, and valid separators
      return /^\+?[\d\s\-()]{7,}$/.test(value) && (value.replace(/\D/g, '').length >= 7);
    })
    .required('Phone number is required')
  ,
  location: yup
    .string()
    .nullable()
    .notRequired(),
  bio: yup
    .string()
    .max(300, 'Bio must be less than 500 characters')
    .nullable()
    .notRequired(),
  skills: yup
    .array()
    .of(yup
      .string()
      .min(1, 'Skill cannot be empty'))
    .nullable()
    .notRequired()
});

const projectSchema = yup.object({
  name: yup.string().required('Project name is required').min(2, 'Project name must be at least 2 characters'),
  startDate: yup.number().required('Start date is required').min(1, 'Start date must be at least 1').max(31, 'Start date cannot exceed 31'),
  endDate: yup.number()
    .required('End date is required')
    .min(1, 'End date must be at least 1')
    .max(31, 'End date cannot exceed 31')
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { startDate } = this.parent;
      return !startDate || !value || value >= startDate;
    }),
  color: yup.string().required('Color is required').matches(/^bg-(blue|green|red|purple|orange|yellow|indigo|pink|teal|cyan|lime|rose|violet|emerald|amber|fuchsia|sky|gray)-(500|600)$/, 'Invalid color format'),
  startHour: yup.number().min(0, 'Start hour must be at least 0').max(23, 'Start hour cannot exceed 23').optional(),
  endHour: yup.number()
    .min(0, 'End hour must be at least 0')
    .max(23, 'End hour cannot exceed 23')
    .test('is-after-start', 'End hour must be after start hour', function (value) {
      const { startHour } = this.parent;
      return !startHour || !value || value > startHour;
    })
    .optional()
});

export function TeamMemberProfile({
  isOpen,
  onClose,
  member,
  onUpdateMember,
  onDeleteMember,
  onUpdateProject,
  onAddProject,
  onDeleteProject,
  refreshMembers
}: TeamMemberProfileProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [projectErrors, setProjectErrors] = useState<Record<string, string>>({});
  const [newProjectErrors, setNewProjectErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [removeDialog, setRemoveDialog] = useState({
    open: false,
    memberId: null,
    projectId: null,
    projectName: ''
  });
  const [memberDetails, setMemberDetails] = useState(() => {
    const stored = localStorage.getItem('memberDetails');
    return stored ? JSON.parse(stored) : null;
  });
  const { roles } = useRole();

  const formatHour12 = (hour) => {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour < 12 || hour === 24 ? 'AM' : 'PM';
    return `${h} ${suffix}`;
  };


  const [profileData, setProfileData] = useState({
    name: member?.name || '',
    role: member?.role || '',
    email: member?.email || '',
    phone: member?.phone || '',
    countryCode: member?.countryCode || '',
    location: member?.location || '',
    bio: member?.bio || '',
    skills: member?.skills || [],
    photo: member?.profilePhoto || '',
    roleId: member?.roleId || '',
  });
  const [togglingStatus, setTogglingStatus] = useState(false);




  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const result = await toggleMemberStatus(member.id);
      if (result.success && result.member) {
        const updatedMember = {
          ...member,
          active: result.member.active
        };

        // Update the parent component's state
        onUpdateMember(member.id, { active: result.member.active });

        refreshMembers();

      }
    } catch (error) {
      console.error('Failed to toggle member status:', error);
    } finally {
      setTogglingStatus(false);
    }
  };

  useEffect(() => {
    setProfileData({
      name: member?.name || '',
      role: member?.role || '',
      email: member?.email || '',
      phone: member?.phone || '',
      countryCode: member?.countryCode || '',
      location: member?.location || '',
      bio: member?.bio || '',
      skills: member?.skills || [],
      roleId: member?.roleId || '',
      photo: member?.profilePhoto || ''
    });
  }, [member]);

  const [newProject, setNewProject] = useState({
    name: '',
    startDate: 1,
    endDate: 1,
    color: '',
    startHour: 9,
    endHour: 17
  });

  const [newSkill, setNewSkill] = useState('');

  // Handle photo upload using your existing upload-photo endpoint
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);

      const result = await uploadMemberPhoto(member.id, file);

      if (result.success) {
        // Update local state with new photo URL/path
        const updatedProfileData = {
          ...profileData,
          photo: result.profilePhotoPath
        };

        setProfileData(updatedProfileData);

        // Update member in parent component
        onUpdateMember(member.id, {
          ...updatedProfileData,
          profilePhoto: result.profilePhotoPath
        });

        // Update localStorage if memberDetails exists
        if (memberDetails) {
          const updatedMemberDetails = {
            ...memberDetails,
            profilePhoto: result.profilePhotoPath
          };
          localStorage.setItem('memberDetails', JSON.stringify(updatedMemberDetails));
          setMemberDetails(updatedMemberDetails);
        }

        toast.success('Profile picture updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      // Error is already handled in the API function
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Remove profile picture using dedicated remove API
  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);

      const result = await removeMemberPhoto(member.id);

      if (result.success) {
        const updatedProfileData = {
          ...profileData,
          photo: '',
          profilePhoto: ''
        };

        setProfileData(updatedProfileData);

        onUpdateMember(member.id, {
          ...result.member,
          photo: '',
          profilePhoto: ''
        });

        if (memberDetails) {
          const updatedMemberDetails = {
            ...memberDetails,
            profilePhoto: ''
          };
          localStorage.setItem('user-details', JSON.stringify(updatedMemberDetails));
          setMemberDetails(updatedMemberDetails);
        }

        toast.success('Profile picture removed successfully!');
      } else {
        throw new Error(result.message || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      // Error is already handled in the API function
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!member) return null;

  const validateProfile = async (data: any) => {
    try {
      await profileSchema.validate(data, { abortEarly: false });
      setProfileErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach(err => {
          if (err.path) errors[err.path] = err.message;
        });
        setProfileErrors(errors);
      }
      return false;
    }
  };

  const validateProject = async (data: any) => {
    try {
      await projectSchema.validate(data, { abortEarly: false });
      setProjectErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach(err => {
          if (err.path) errors[err.path] = err.message;
        });
        setProjectErrors(errors);
      }
      return false;
    }
  };

  const validateNewProject = async (data: any) => {
    try {
      await projectSchema.validate(data, { abortEarly: false });
      setNewProjectErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach(err => {
          if (err.path) errors[err.path] = err.message;
        });
        setNewProjectErrors(errors);
      }
      return false;
    }
  };

  const handleSaveProfile = async () => {
    if (!member) return;

    const isValid = await validateProfile(profileData);
    if (!isValid) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    try {
      setSaving(true);

      // Prepare data for update - convert skills array to JSON string for form-data
      const updateData = {
        name: profileData.name,
        role: profileData.role,
        phone: profileData.phone,
        countryCode: profileData.countryCode,
        location: profileData.location,
        bio: profileData.bio,
        skills: JSON.stringify(profileData.skills), // Convert to string for form-data
        profilePhoto: profileData.photo,
        roleId: profileData.roleId,
      };

      const result = await updateMemberProfile(member.id, updateData);

      if (result.success) {
        onUpdateMember(member.id, {
          ...profileData,
          profilePhoto: profileData.photo
        });

        const updatedMember = {
          name: result.member.name,
          role: result.member.role.name,
          email: result.member.email || '',
          phone: result.member.phone || '',
          countryCode: result.member.countryCode || '',
          location: result.member.location || '',
          bio: result.member.bio || '',
          skills: result.member.skills || [],
          photo: result.member.profilePhoto || profileData.photo,
          roleId: result.member.role.id || '',
        };

        if (memberDetails) {
          localStorage.setItem('memberDetails', JSON.stringify(result.member));
          setMemberDetails(result.member);
        }

        setProfileData(updatedMember);
        setEditingProfile(false);
        toast.success("Member profile updated successfully!");
      } else {
        toast.error(result.message || "Failed to update member profile");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error is already handled in the API function
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProject = async (projectId: string, updates: Partial<Project>) => {
    const projectToValidate = { ...member?.projects.find(project => project.id === projectId), ...updates };
    const isValid = await validateProject(projectToValidate);

    if (!isValid) {
      toast.error("Please fix the project validation errors before saving");
      return;
    }

    onUpdateProject(member.id, projectId, updates);
    setEditingProject(null);
    setProjectErrors({});
  };

  const handleAddProject = async () => {
    const isValid = await validateNewProject(newProject);

    if (!isValid) {
      toast.error("Please fix the project validation errors before adding");
      return;
    }

    setNewProject({
      name: '',
      startDate: 1,
      endDate: 1,
      color: '',
      startHour: 9,
      endHour: 17
    });
    setShowAddProject(false);
    setNewProjectErrors({});
  };

  const handleRemoveProject = (memberId: string, projectId: string) => {
    removeMemberFromProject({ memberId, projectId })
      .then(result => {
        if (result.success) {
          onDeleteProject(memberId, projectId);
          onClose();
        }
      })
      .catch(error => {
        console.error("Error in handleRemoveProject:", error);
      });
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setProfileData(prev => {
        const currentSkills = prev.skills || [];

        if (currentSkills.length >= 10) {
          toast.info(`You can only add up to ${10} skills.`);
          return prev;
        }

        if (currentSkills.includes(newSkill.trim())) {
          toast.info("Skill already added.");
          return prev;
        }

        const updatedSkills = [...currentSkills, newSkill.trim()];
        return { ...prev, skills: updatedSkills };
      });

      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillIndex: number) => {
    const updatedSkills = profileData.skills.filter((_, index) => index !== skillIndex);
    setProfileData(prev => ({ ...prev, skills: updatedSkills }));
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${baseUrl}/member/delete/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete member');
      }

      if (data.success) {
        toast.success('Member deleted successfully');
        setShowDeleteDialog(false);
        onDeleteMember(data.id);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to delete member');
      }

    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error(error.message || 'Failed to delete member');

      if (error.message.includes('not found')) {
        toast.error('Member not found');
      } else if (error.message.includes('active projects')) {
        // Handle active projects case
      } else {
        toast.error('An error occurred while deleting the member');
      }
    }
  };

  // Helper function to get full image URL from S3 key
  const getImageUrl = (s3Key: string) => {
    if (!s3Key) return '';
    return `${import.meta.env.NEXT_PUBLIC_S3_BASE_URL}/${s3Key}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setEditingProfile(false);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="relative group">
                {editingProfile && (
                  <>
                    <label
                      htmlFor="photo-upload"
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />

                    {(profileData.photo || member.profilePhoto) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 scrollbar-hide">
          {/* Profile Information Card */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0 border-b bg-gradient-to-r from-muted/20 to-muted/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
                  <CardDescription className="mt-1">
                    Manage personal and professional details
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Toggle Status Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className={`h-8 w-8 ${member.active
                    ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                    : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                    } ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {member.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-8 w-8 bg-red-500/10 text-red-600 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Photo Upload Section - Enhanced */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-muted/20 rounded-xl border">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg"
                      style={{
                        borderColor: member.ringColor || 'hsl(var(--muted))',
                        boxShadow: `0 0 0 2px ${member.ringColor || 'hsl(var(--muted))'}`
                      }}>
                      <AvatarImage
                        src={`${S3_URL}/${member.profilePhoto}`}
                        alt={member.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-semibold">
                        <User className="w-10 h-10" />
                      </AvatarFallback>
                    </Avatar>

                    <label
                      htmlFor="photo-upload-form"
                      className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                      ) : (
                        <div className="text-center text-white">
                          <Camera className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs font-medium">Change</span>
                        </div>
                      )}
                    </label>
                    <input
                      id="photo-upload-form"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-lg mb-2">{member.name}</h3>
                  <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-primary/20">
                    {member.role}
                  </Badge>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start mt-4">
                    <label
                      htmlFor="photo-upload-form"
                      className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      {uploadingPhoto ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent mr-1" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Change Photo
                        </>
                      )}
                    </label>
                    {member.profilePhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile();
                }} className="space-y-6">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Name Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          Name *
                        </label>
                        <Input
                          value={profileData.name}
                          onChange={(e) => {
                            let value = e.target.value;
                            value = value.trimStart();
                            value = value.replace(/[^A-Za-z\s]/g, '');
                            setProfileData(prev => ({ ...prev, name: value }));
                          }}
                          className={`w-full transition-colors ${profileErrors.name ? 'border-red-500 focus:ring-red-200' : 'focus:ring-primary/20'}`}
                          maxLength={60}
                          placeholder="Enter your full name"
                        />
                        {profileErrors.name && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {profileErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Role Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <BriefcaseBusiness className="w-4 h-4 text-muted-foreground" />
                          Role *
                        </label>
                        <RoleDropdown
                          selected={profileData.roleId}
                          onChange={(roleId) => {
                            const selectedRole = roles.find(role => role.id === roleId);
                            // For now, we'll use the role name as the value
                            // This will be updated when we modify the API to use role IDs
                            setProfileData(prev => ({ ...prev, roleId: roleId, role: selectedRole?.name }));
                          }}
                          placeholder="Select your role"
                          className={`w-full transition-colors ${profileErrors.role ? 'border-red-500 focus:ring-red-200' : 'focus:ring-primary/20'}`}
                        />
                        {profileErrors.role && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {profileErrors.role}
                          </p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={profileData.email}
                          disabled={true}
                          className="w-full bg-muted/50 text-muted-foreground cursor-not-allowed"
                          maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Email cannot be changed
                        </p>
                      </div>

                      {/* Combined Phone Number Field with Country Code */}
                      {/* Combined Phone Number Field with Country Code */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          Phone Number *
                        </label>

                        <PhoneInput
                          defaultCountry="gb"
                          value={profileData.phone || ""}
                          onChange={(phone) => setProfileData(prev => ({ ...prev, phone }))}
                          className="rounded-md  gap-2"
                          inputClassName="!flex !h-10 !w-full border !border-input !bg-background px-3 py-2 text-sm !text-foreground
      !placeholder:text-muted-foreground 
      !rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      focus-visible:ring-offset-accent disabled:cursor-not-allowed disabled:opacity-50"
                          countrySelectorStyleProps={{
                            buttonClassName: "!h-10 border !border-input !bg-background hover:bg-accent !rounded-md px-3",
                            dropdownStyleProps: { className: "!text-foreground !bg-background !hover:bg-background !rounded-md scrollbar-hide !border", listItemSelectedClassName: "!bg-accent", listItemCountryNameStyle: { color: "gray" } },
                          }}
                          placeholder="Enter phone number"
                        />


                        {profileErrors.phone && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {profileErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Location Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          Address
                        </label>
                        <Input
                          value={profileData.location}
                          onChange={(e) =>
                            setProfileData(prev => ({ ...prev, location: e.target.value }))
                          }
                          className={`w-full transition-colors ${profileErrors.location ? 'border-red-500 focus:ring-red-200' : 'focus:ring-primary/20'}`}
                          placeholder="Street, city, state, ZIP code"
                          maxLength={150}
                        />
                        {profileErrors.location && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {profileErrors.location}
                          </p>
                        )}
                      </div>

                      {/* Bio Field */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Bio
                          </label>
                          <span className={`text-xs ${profileData.bio?.length === 300 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            {profileData.bio?.length || 0} / 300
                          </span>
                        </div>
                        <Textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          className={`w-full min-h-[100px] transition-colors ${profileErrors.bio ? 'border-red-500 focus:ring-red-200' : 'focus:ring-primary/20'}`}
                          maxLength={300}
                          placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                        />
                        {profileErrors.bio && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {profileErrors.bio}
                          </p>
                        )}
                      </div>

                      {/* Skills Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Award className="w-4 h-4 text-muted-foreground" />
                          Skills
                        </label>
                        {profileData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/30 rounded-lg border">
                            {profileData.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1.5 bg-background border shadow-sm">
                                {skill}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                                  onClick={() => handleRemoveSkill(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>)}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a skill (press Enter to add)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                            maxLength={50}
                            className="flex-grow"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSkill}
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            disabled={!newSkill.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                /* View Mode - Enhanced Display */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        {
                          icon: Mail,
                          label: "Email",
                          value: member.email,
                          color: "#3b82f6", // blue
                          lightColor: "#dbeafe" // blue-100 equivalent
                        },
                        {
                          icon: Phone,
                          label: "Phone",
                          value: member.phone,
                          color: "#10b981", // green
                          lightColor: "#d1fae5" // green-100 equivalent
                        },
                        {
                          icon: MapPin,
                          label: "Location",
                          value: member.location,
                          color: "#ef4444", // red
                          lightColor: "#fee2e2" // red-100 equivalent
                        }
                      ].map((item, index) => (
                        item.value && (
                          <div key={index} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                            <div
                              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors group-hover:bg-opacity-80"
                              style={{
                                backgroundColor: item.lightColor,
                              }}
                            >
                              <item.icon
                                className="w-5 h-5"
                                style={{ color: item.color }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                              <p className="font-semibold text-foreground break-all">{item.value}</p>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {member.bio && (
                      <div className="p-5 rounded-xl border bg-card shadow-sm">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                          <FileText className="w-5 h-5 text-primary" />
                          About Me
                        </h4>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {member.bio}
                        </p>
                      </div>
                    )}

                    {member.skills && member.skills.length > 0 && (
                      <div className="p-5 rounded-xl border bg-card shadow-sm">
                        <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                          <Award className="w-5 h-5 text-primary" />
                          Skills & Expertise
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {member.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="px-3 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Action Button in Header */}
              <div className="flex items-center justify-end gap-2">
                {editingProfile && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileErrors({});
                      setProfileData({
                        name: member.name,
                        role: member.role,
                        email: member.email || '',
                        phone: member.phone || '',
                        countryCode: member.countryCode || '',
                        location: member.location || '',
                        bio: member.bio || '',
                        skills: member.skills || [],
                        photo: member.profilePhoto || '',
                        roleId: member?.roleId || '',
                      });
                    }}
                    className="flex items-center gap-1 border-muted-foreground/30 hover:bg-muted"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={saving || uploadingPhoto}
                  onClick={() => {
                    if (editingProfile) {
                      handleSaveProfile();
                    } else {
                      setEditingProfile(true);
                      setProfileData({
                        name: member.name,
                        role: member.role,
                        email: member.email || '',
                        phone: member.phone || '',
                        countryCode: member.countryCode || '',
                        location: member.location || '',
                        bio: member.bio || '',
                        skills: member.skills || [],
                        photo: member.profilePhoto || '',
                        roleId: member?.roleId || '',
                      });
                      setProfileErrors({});
                    }
                  }}
                  className="flex items-center gap-1 bg-primary hover:bg-primary/90 shadow-sm min-w-[100px]"
                >
                  {editingProfile ? (
                    saving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent mr-1" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rest of your existing code for Current Bookings, Delete Confirmation Dialog, and Add Project Form remains the same */}
          {/* Current Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Current Bookings & Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {member?.projects?.length > 0 ? (
                <div className="space-y-4">
                  {member?.projects?.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      {editingProject === project.id ? (
                        <EditProjectForm
                          project={project}
                          onSave={(updates) => handleSaveProject(project.id, updates)}
                          onCancel={() => {
                            setEditingProject(null);
                            setProjectErrors({});
                          }}
                        />
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-3 h-3 rounded-full`}
                                style={{ backgroundColor: project.color }}></div>
                              <h4 className="font-medium">{project.name}</h4>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(project.startDate), 'd MMM yyyy')} - {format(new Date(project.endDate), 'd MMM yyyy')}
                              </div>
                              {project.startHour !== undefined && project.endHour !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatHour12(project.startHour)} - {formatHour12(project.endHour)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog(prev => ({ ...prev, open }))}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRemoveDialog({
                                    open: true,
                                    memberId: member.id,
                                    projectId: project.id,
                                    projectName: project.name
                                  })}
                                >
                                  <LogOut className="w-4 h-4" /> Remove from project
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Remove from Project</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to remove {member?.name} from the project "{removeDialog.projectName}"?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setRemoveDialog(prev => ({ ...prev, open: false }))}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      handleRemoveProject(removeDialog.memberId, removeDialog.projectId);
                                      setRemoveDialog(prev => ({ ...prev, open: false }));
                                    }}
                                  >
                                    Remove from Project
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No current projects assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-md bg-[#101319]  text-white">
              <div className="py-2 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">This action cannot be undone</p>
                    <p className="text-gray-300 mt-1">
                      You are about to permanently delete <strong className="text-red-300">{member.name}</strong> from the system.
                      All associated data will be lost.
                    </p>
                  </div>
                </div>

                <div className="bg-red-900/30 border border-red-700 rounded-md p-3 mt-3">
                  <p className="text-sm text-red-300 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Warning: This action is irreversible
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="sm:order-1 border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteMember(member.id);
                    setShowDeleteDialog(false);
                  }}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Member Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Project Form */}
          {showAddProject && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Project Name</label>
                    <Input
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      className={newProjectErrors.name ? 'border-red-500' : ''}
                    />
                    {newProjectErrors.name && <p className="text-red-500 text-xs mt-1">{newProjectErrors.name}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <select
                      value={newProject.color}
                      onChange={(e) => setNewProject(prev => ({ ...prev, color: e.target.value }))}
                      className={`w-full p-2 border rounded ${newProjectErrors.color ? 'border-red-500' : ''}`}
                    >
                      <option value="bg-blue-500">Blue</option>
                      <option value="bg-green-500">Green</option>
                      <option value="bg-red-500">Red</option>
                      <option value="bg-purple-500">Purple</option>
                      <option value="bg-orange-500">Orange</option>
                      <option value="bg-yellow-500">Yellow</option>
                    </select>
                    {newProjectErrors.color && <p className="text-red-500 text-xs mt-1">{newProjectErrors.color}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Start Date (August)</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject(prev => ({ ...prev, startDate: parseInt(e.target.value) || 1 }))}
                      className={newProjectErrors.startDate ? 'border-red-500' : ''}
                    />
                    {newProjectErrors.startDate && <p className="text-red-500 text-xs mt-1">{newProjectErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date (August)</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject(prev => ({ ...prev, endDate: parseInt(e.target.value) || 1 }))}
                      className={newProjectErrors.endDate ? 'border-red-500' : ''}
                    />
                    {newProjectErrors.endDate && <p className="text-red-500 text-xs mt-1">{newProjectErrors.endDate}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Start Hour</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={newProject.startHour}
                      onChange={(e) => setNewProject(prev => ({ ...prev, startHour: parseInt(e.target.value) || 9 }))}
                      className={newProjectErrors.startHour ? 'border-red-500' : ''}
                    />
                    {newProjectErrors.startHour && <p className="text-red-500 text-xs mt-1">{newProjectErrors.startHour}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Hour</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={newProject.endHour}
                      onChange={(e) => setNewProject(prev => ({ ...prev, endHour: parseInt(e.target.value) || 17 }))}
                      className={newProjectErrors.endHour ? 'border-red-500' : ''}
                    />
                    {newProjectErrors.endHour && <p className="text-red-500 text-xs mt-1">{newProjectErrors.endHour}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddProject}>Add Project</Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddProject(false);
                    setNewProjectErrors({});
                  }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
// Component for editing individual projects
interface EditProjectFormProps {
  project: Project;
  onSave: (updates: Partial<Project>) => void;
  onCancel: () => void;
}

function EditProjectForm({ project, onSave, onCancel }: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    color: project.color,
    startHour: project.startHour || 9,
    endHour: project.endHour || 17
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Project Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Color</label>
          <select
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            <option value="bg-blue-500">Blue</option>
            <option value="bg-green-500">Green</option>
            <option value="bg-red-500">Red</option>
            <option value="bg-purple-500">Purple</option>
            <option value="bg-orange-500">Orange</option>
            <option value="bg-yellow-500">Yellow</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Start Date (August)</label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Date (August)</label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Start Hour</label>
          <Input
            type="number"
            min="0"
            max="23"
            value={formData.startHour}
            onChange={(e) => setFormData(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Hour</label>
          <Input
            type="number"
            min="0"
            max="23"
            value={formData.endHour}
            onChange={(e) => setFormData(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}