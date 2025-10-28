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
import { Loader, UserPlus } from "lucide-react";
// Import necessary hooks and libraries for form handling and validation
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { RoleDropdown } from "./dropdowns/RoleDropdown";

// Validation schema using Yup
const validationSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format").required("Email is required"),
  roleId: yup.string().required("Role is required"),
  countryCode: yup.string().optional(),
  phone: yup
    .string()
    .test('is-valid-phone', 'Invalid phone number format', value => {
      return /^\+?[\d\s-()]+$/.test(value);
    })
});

interface Country {
  code: string;
}

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (member: {
    name: string;
    email: string;
    roleId: string;
    countryCode?: string;
    phone?: string;
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
    watch
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      roleId: "",
      countryCode: "+44", // Set +44 as default
      phone: ""
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  // Watch the roleId to ensure it's synchronized
  const roleId = watch("roleId");

  // Fetch countries when dialog opens
  useEffect(() => {
    if (open) {
      fetchCountries();
    } else {
      reset({
        name: "",
        email: "",
        roleId: "",
        countryCode: "+44", // Reset to +44 when dialog closes
        phone: ""
      });
    }
  }, [open, reset]);

  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd');
      const data = await response.json();

      const countryCodeSet = new Set<string>();

      data.forEach((country: any) => {
        if (country.idd?.root && country.idd?.suffixes) {
          // Handle countries with multiple suffixes
          country.idd.suffixes.forEach((suffix: string) => {
            const callingCode = `${country.idd.root}${suffix}`;
            // Filter out invalid or very long codes and add to Set (automatically removes duplicates)
            if (callingCode.length <= 5 && callingCode !== '+') {
              countryCodeSet.add(callingCode);
            }
          });
        } else if (country.idd?.root) {
          // For countries without suffixes
          const callingCode = country.idd.root;
          if (callingCode.length <= 5 && callingCode !== '+') {
            countryCodeSet.add(callingCode);
          }
        }
      });

      // Convert Set to array to ensure uniqueness
      const uniqueCodes = Array.from(countryCodeSet);

      // Create country objects and sort
      const sortedCountries = uniqueCodes
        .map(code => ({ code }))
        .sort((a, b) => {
          // Priority sorting: +1 first, then +44, then others numerically
          if (a.code === "+1") return -1;
          if (b.code === "+1") return 1;
          if (a.code === "+44") return -1;
          if (b.code === "+44") return 1;

          // Sort other codes numerically by converting to numbers
          const numA = parseInt(a.code.replace('+', '')) || 0;
          const numB = parseInt(b.code.replace('+', '')) || 0;
          return numA - numB;
        });

      console.log("Unique country codes:", sortedCountries.map(c => c.code));
      setCountries(sortedCountries);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      // Fallback to common country codes if API fails
      setCountries(getCommonCountryCodes());
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Fallback common country codes with proper sorting and uniqueness
  const getCommonCountryCodes = (): Country[] => {
    const commonCodes = [
      "+1", "+44", "+91", "+61", "+49", "+33", "+81", "+86",
      "+55", "+7", "+34", "+39", "+82", "+52", "+27"
    ];

    // Remove duplicates and sort
    const uniqueCodes = [...new Set(commonCodes)]
      .map(code => ({ code }))
      .sort((a, b) => {
        if (a.code === "+1") return -1;
        if (b.code === "+1") return 1;
        if (a.code === "+44") return -1;
        if (b.code === "+44") return 1;

        const numA = parseInt(a.code.replace('+', '')) || 0;
        const numB = parseInt(b.code.replace('+', '')) || 0;
        return numA - numB;
      });

    return uniqueCodes;
  };

  const onSubmit = async (data: {
    name: string;
    email: string;
    roleId: string;
    countryCode?: string;
    phone?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const resData = await onAddMember(data);

      if (resData.success) {
        reset({
          name: "",
          email: "",
          roleId: "",
          countryCode: "+44", // Reset to +44 after successful submission
          phone: ""
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

          <div className="space-y-1">
            <Label htmlFor="roleId">Role *</Label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <RoleDropdown
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Select a role"
                />
              )}
            />
            <p className="text-sm text-red-500 min-h-[20px]">
              {errors.roleId?.message || ""}
            </p>
          </div>

          <div className="space-y-1">
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="countryCode">Country Code</Label>
              <Controller
                name="countryCode"
                control={control}
                render={({ field }) => (
                  <div className="relative w-full">
                    <select
                      {...field}
                      disabled={isLoadingCountries}
                      className="appearance-none flex h-10 w-full rounded-md border border-input bg-background px-3 pr-8 py-2 text-sm ring-offset-background
                   placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>

                    {/* Custom dropdown arrow */}
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg
                        className="h-4 w-4 text-muted-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 12a.75.75 0 0 1-.53-.22l-4-4a.75.75 0 1 1 1.06-1.06L10 10.19l3.47-3.47a.75.75 0 0 1 1.06 1.06l-4 4A.75.75 0 0 1 10 12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              />

              {isLoadingCountries && (
                <p className="text-xs text-muted-foreground">Loading countries...</p>
              )}
              <p className="text-sm text-red-500 min-h-[20px]">
                {errors.countryCode?.message || ""}
              </p>
            </div>

            <div className="space-y-1 col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                {...register("phone", {
                  onChange: (e) => {
                    // Allow only numbers, spaces, hyphens, and parentheses
                    let value = e.target.value.replace(/[^\d\s\-()]/g, "");
                    e.target.value = value;
                  },
                })}
                maxLength={15}
              />
              <p className="text-sm text-red-500 min-h-[20px]">
                {errors.phone?.message || ""}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset({
                  name: "",
                  email: "",
                  roleId: "",
                  countryCode: "+44", // Reset to +44 on cancel
                  phone: ""
                });
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