import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User2, Eye, EyeOff, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { loginMember } from "@/api/company";

import { useNavigate } from "react-router-dom";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = yup.object({
  email: yup.string().email("Invalid email format").matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format").required("Email is required"),
  password: yup.string().required("Password is required"),
  rememberMe: yup.boolean().default(false),
});

type FormData = yup.InferType<typeof schema>;

const Login = () => {
  const [userType, setUserType] = useState<"company" | "member">("company");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forceResetRequired, setForceResetRequired] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedUserType = localStorage.getItem("user-type") as "company" | "member" | null;
    
    // Set initial user type based on localStorage (default to "company" if none)
    const initialUserType = rememberedUserType && (rememberedUserType === "company" || rememberedUserType === "member") 
      ? rememberedUserType 
      : "company";
    
    setUserType(initialUserType);

    // Set initial email if user type matches - use setTimeout to ensure state is updated
    setTimeout(() => {
      if (rememberedEmail && rememberedUserType === initialUserType) {
        setValue("email", rememberedEmail);
        setValue("rememberMe", true);
      }
      setIsChecking(false);
    }, 0);
  }, [setValue]);

  const onSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      setForceResetRequired(false);

      // Use member login with rememberMe
      const response = await loginMember({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        userType:userType
      });

      if (!response.success) {
        // Handle force password reset for members
        if (response.forceReset) {
          setForceResetRequired(true);
          toast.error("Password reset required");
          return;
        }
        toast.error(response.message || "Login failed");
        return;
      }

      // Handle remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // For member login, use the unified user data structure
      if (response.data) {
        login(response.data.user.userType, {
          token: response.data.token,
          member: response.data.user // Use the unified user object from backend
        });
      }

      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (type: "company" | "member") => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedUserType = localStorage.getItem("user-type");
    
    // Clear the form when switching user types
    reset({
      email: "",
      password: "",
      rememberMe: false,
    });
    
    setUserType(type);
    
    // Only set email if the selected type matches the remembered type
    if (rememberedEmail && rememberedUserType === type) {
      // Use setTimeout to ensure the reset has completed
      setTimeout(() => {
        setValue("email", rememberedEmail);
        setValue("rememberMe", true);
      }, 0);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForceReset = () => {
    // Navigate to force reset password page or show reset modal
    setShowForgotPassword(true);
    setForceResetRequired(false);
  };

  return (
    <>
      <div className="min-h-screen md:h-screen overflow-auto bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Icon Container */}
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              {userType === "company" ? (
                <Building2 className="h-7 w-7 text-primary-foreground" />
              ) : (
                <User2 className="h-7 w-7 text-primary-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in with your {userType === "company" ? "company admin" : " member"} account
              </CardDescription>
            </div>

            <div className="flex justify-center space-x-8 border-b border-muted/30 pb-0">
              <button
                className={`relative pb-3 font-medium transition-all duration-200 ${userType === "company"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => handleUserTypeChange("company")}
              >
                Company
                {userType === "company" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>
                )}
              </button>
              <button
                className={`relative pb-3 font-medium transition-all duration-200 ${userType === "member"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => handleUserTypeChange("member")}
              >
                Member
                {userType === "member" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>
                )}
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            {/* Force Reset Alert */}
            {forceResetRequired && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Password reset required.{" "}
                  <button 
                    onClick={handleForceReset}
                    className="underline font-medium hover:no-underline"
                  >
                    Reset your password
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder={userType === "company" ? "admin@company.com" : "member@company.com"}
                  {...register("email")}
                  maxLength={60}
                  className="h-11 transition-colors focus-visible:ring-2"
                />
                <p className="text-sm text-red-500 min-h-[20px]">
                  {errors.email?.message || ""}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    maxLength={60}
                    className="h-11 pr-11 transition-colors focus-visible:ring-2 "
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-red-500 min-h-[20px]">
                  {errors.password?.message || ""}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...register("rememberMe")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-lg mt-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="pt-4 border-t border-muted/30">
                {userType === "company" ? (
                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <a
                      href="/register"
                      className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline"
                    >
                      Register your company
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground leading-relaxed">
                    Contact your company admin to get invited to the team.
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType={"member"}
      />
    </>
  );
};

export default Login;