import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, UserPlus } from "lucide-react";

// Import necessary hooks and libraries for form handling and validation
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ROLES } from "@/constant/constant";

// Validation schema using Yup
const validationSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format").required("Email is required"),
  role: yup.string().required("Role is required"),
});

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (member: { name: string; email: string; role: string }) => Promise<{ success: boolean; message?: string }>;
}




export function AddTeamMemberDialog({ open, onOpenChange, onAddMember }: AddTeamMemberDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setError
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: { name: string; email: string; role: string }) => {
    setIsSubmitting(true);
    try {
      const resData = await onAddMember(data);

      if (resData.success) {
        reset({
          name: "",
          email: "",
          role: "",
        });
        onOpenChange(false);
      } else {
        if (resData.message && resData.message.includes("Email")) {
          setError("email", {
            type: "manual",
            message: resData.message,
          });
        } else {
          console.error(resData.message || "Failed to add team member.");
        }
      }
    } catch (error) {
      console.error("An error occurred while adding the team member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Team Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          <div className="space-y-1">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter team member name"
              {...register("name", {
                onChange: (e) => {
                  let value = e.target.value.trimStart();
                  value = value.replace(/[^A-Za-z\s]/g, "");
                  e.target.value = value;
                },
              })}
            />
            <p className="text-sm text-red-500 min-h-[20px]">
              {errors.name?.message || ""}
            </p>
          </div>

          
          <div className="">
            <Label htmlFor="role">Role *</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  onValueChange={(value) => field.onChange(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-500 min-h-[20px]">
              {errors.role?.message || ""}
            </p>
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              placeholder="Enter team member email"
              {...register("email")}
            />
            <p className="text-sm text-red-500 min-h-[20px]">
              {errors.email?.message || ""}
            </p>
          </div>


          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset({ name: "", email: "", role: "" });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Add Team Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}