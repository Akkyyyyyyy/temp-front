import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X, Plus, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { RoleDropdown } from "./dropdowns/RoleDropdown";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const validationSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .max(100, "Name must be less than 100 characters"),

  email: yup
    .string()
    .required("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
    .max(150, "Email must be less than 150 characters"),

  roleId: yup
    .string()
    .required("Role is required"),

  phone: yup
    .string()
    .required("Phone number is required")
    .test('is-valid-phone', 'Invalid phone number format', function (value) {
      if (!value) return false;
      const digitsOnly = value.replace(/\D/g, '');
      return digitsOnly.length >= 10;
    })
    .max(20, "Phone number must be less than 20 characters"),
  location: yup
    .string()
    .nullable()
    .max(150, "Address must be less than 150 characters"),

  bio: yup
    .string()
    .nullable()
    .max(300, "Bio must be less than 300 characters"),

  skills: yup
    .array()
    .of(
      yup.string().max(50, "Each skill must be less than 50 characters")
    )
    .test('max-skills', 'Maximum 10 skills allowed', (skills) => !skills || skills.length <= 10)
    .nullable(),

  profilePhoto: yup
    .mixed()
    .nullable()
});

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (member: {
    name: string;
    email: string;
    roleId: string;
    phone?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    profilePhoto?: File;
  }) => Promise<{ success: boolean; message?: string }>;
}

export function AddTeamMemberDialog({ open, onOpenChange, onAddMember }: AddTeamMemberDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setError,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      roleId: "",
      phone: "",
      location: "",
      bio: "",
      skills: [],
      profilePhoto: undefined
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const roleId = watch("roleId");
  const skills = watch("skills") || [];
  const bio = watch("bio") || "";

  useEffect(() => {
    if (!open) {
      reset();
      setPhotoPreview(null);
      setNewSkill("");
    }
  }, [open, reset]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("profilePhoto", {
        type: "manual",
        message: "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("profilePhoto", {
        type: "manual",
        message: "Image size must be less than 5MB"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setValue("profilePhoto", file);
    setError("profilePhoto", { type: "manual", message: "" });
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setValue("profilePhoto", undefined);
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();

    if (trimmedSkill) {
      if (skills.includes(trimmedSkill)) {
        setError("skills", {
          type: "manual",
          message: "This skill has already been added"
        });
        return;
      }
      if (skills.length >= 10) {
        setError("skills", {
          type: "manual",
          message: "You can only add up to 10 skills"
        });
        return;
      }
      const updatedSkills = [...skills, newSkill.trim()];
      setValue("skills", updatedSkills);
      setNewSkill("");
      setError("skills", { type: "manual", message: "" });
    }
  };

  const handleRemoveSkill = (skillIndex: number) => {
    const updatedSkills = skills.filter((_, index) => index !== skillIndex);
    setValue("skills", updatedSkills);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const resData = await onAddMember(data);
      if (resData.success) {
        reset();
        setPhotoPreview(null);
        onOpenChange(false);
      } else if (resData.message?.includes("Email")) {
        setError("email", { type: "manual", message: resData.message });
      }
    } catch (error) {
      console.error("Error adding team member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setValue("roleId", roleId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-6 h-6 text-primary" />
            Add New Team Member
          </DialogTitle>
          {/* <DialogDescription className="ml-6">* are required</DialogDescription> */}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-3">
          <div className="max-h-[60vh] overflow-y-auto scrollbar-hide p-2">
            {/* Photo Upload Section */}
            {/* <div className="flex items-start gap-6 p-6 bg-muted/20 rounded-lg border mb-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserPlus className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <label
                    htmlFor="photo-upload"
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Profile Picture</Label>
                  {errors.profilePhoto && (
                    <p className="text-sm text-red-500">{errors.profilePhoto.message}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a profile picture (JPEG, PNG, GIF, WebP). Max 5MB.
                </p>
                <div className="flex gap-3">
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Choose Photo
                  </label>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div> */}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <Input
                    id="name"
                    placeholder="Enter team member name"
                    {...register("name")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="roleId" className="text-sm font-medium">Role *</Label>
                    {errors.roleId && (
                      <p className="text-sm text-red-500">{errors.roleId.message}</p>
                    )}
                  </div>
                  <RoleDropdown
                    selected={roleId}
                    onChange={handleRoleChange}
                    placeholder="Select a role"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter team member email"
                    {...register("email")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        defaultCountry="gb"
                        className="w-full gap-2"
                        inputClassName="!flex !h-10 !w-full border !border-input !bg-background px-3 py-2 text-sm !text-foreground
                                    !placeholder:text-muted-foreground 
                                    !rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                                    focus-visible:ring-offset-accent disabled:cursor-not-allowed disabled:opacity-50"
                        countrySelectorStyleProps={{
                          buttonClassName: "!h-10 border !border-input !bg-background hover:bg-accent !rounded-md px-3 !relative",
                          dropdownStyleProps: {
                            className: "!text-foreground !bg-background !border!border-white !shadow-lg !absolute !bottom-full !top-auto !mb-[4px] !rounded-md scrollbar-hide !border",
                            listItemSelectedClassName: "!bg-accent",
                            listItemCountryNameStyle: { color: "gray" },
                          },
                        }}
                        placeholder="Enter phone number"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Right Column - Additional Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="location" className="text-sm font-medium">Address</Label>
                    {errors.location && (
                      <p className="text-sm text-red-500">{errors.location.message}</p>
                    )}
                  </div>
                  <Input
                    id="location"
                    placeholder="Enter street, city, post code"
                    {...register("location")}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                      {errors.bio && (
                        <p className="text-sm text-red-500">{errors.bio.message}</p>
                      )}
                    </div>
                    <span className={`text-xs ${bio.length === 300 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {bio.length}/300
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about this team member's experience and background..."
                    className="w-full min-h-[120px] resize-none"
                    {...register("bio")}
                    maxLength={300}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Skills</Label>
                    {errors.skills && (
                      <p className="text-sm text-red-500">{errors.skills.message}</p>
                    )}
                  </div>

                  {/* Skills Display */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border min-h-[48px] mb-2">
                      {skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1 text-xs"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(index)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add Skill Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (press Enter to add)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      maxLength={50}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSkill}
                      size="sm"
                      disabled={!newSkill.trim()}
                      className="flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {skills.length}/10 skills added
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Team Member
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}