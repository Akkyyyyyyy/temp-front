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
import { User2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginMember } from "@/api/company";

import { Link, useNavigate } from "react-router-dom";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { useAuth } from "@/context/AuthContext";

const schema = yup.object({
  email: yup.string().email("Invalid email format").matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format").required("Email is required"),
  password: yup.string().required("Password is required"),
  rememberMe: yup.boolean().default(false),
});

type FormData = yup.InferType<typeof schema>;

const Login = () => {
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
    setError,
    watch
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });
  const watchedEmail = watch("email");

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");

    // Set initial email if remembered
    setTimeout(() => {
      if (rememberedEmail) {
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
      });

      if (!response.success) {
        // Handle force password reset for members
        if (response.forceReset) {
          setForceResetRequired(true);
          setShowForgotPassword(true);
          return;
        }
        // toast.error(response.message || "Login failed");
        setError("root", { message: response.message })
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
          member: response.data.user
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
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
              <User2 className="h-7 w-7 text-primary-foreground" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in with your account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">

            <form onSubmit={handleSubmit(onSubmit)} className="">
              <p className="text-md text-red-500 min-h-[25px] text-center font-medium">
                {errors.root?.message || ""}
              </p>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="member@company.com"
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
                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline"
                  >
                    Register your company
                  </Link>
                </div>

                <div className="text-center text-xs text-muted-foreground mt-2">
                  <Link
                    to="/privacy-policies"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                  .
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        email={''}
      />
    </>
  );
};

export default Login;