import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Building2, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerCompany } from "@/api/company";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

const schema = yup.object({
    name: yup
        .string()
        .trim()
        .required("Company name is required.")
        .min(3, "Company name must be at least 3 characters.")
        .max(50, "Company name can't exceed 50 characters."),

    adminEmail: yup
        .string()
        .required("Email is required.")
        .email("Enter a valid email address.")
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),

    password: yup
        .string()
        .required("Password is required.")
        .max(64, "Password can't exceed 64 characters.")
        .matches(
            /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d).{6,}$/,
            "Password must be at least 6 characters and include at least 1 uppercase letter, 1 letter and number."
        ),


    confirmPassword: yup
        .string()
        .required("Please confirm your password.")
        .oneOf([yup.ref("password")], "Passwords do not match.")

});


type FormData = yup.InferType<typeof schema>;

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChecking, setIsChecking] = useState(true)
    const navigate = useNavigate();


    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError
    } = useForm<FormData>({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        const token = localStorage.getItem("auth-token");
        const companyDetails = localStorage.getItem("companyDetails");

        if (token && companyDetails) {
            navigate("/");
        } else {
            setIsChecking(false)
        }
    }, []);

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true);

            const res = await registerCompany({
                name: data.name,
                email: data.adminEmail,
                password: data.password,
            });

            if (!res.success) {
                if (res.errors) {
                    toast.error("Validation failed.");
                } else if (res.message?.toLowerCase().includes("email")) {
                    setError("adminEmail", {
                        type: "server",
                        message: res.message,
                    });
                } else {
                    toast.error(res.message || "Registration failed.");
                }
                return;
            }

            toast.success("Company registered successfully!");
            reset();
            navigate("/login");
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (isChecking) {
        return null
    }

    return (
        <div className="h-dvh overflow-auto bg-background flex items-center justify-center px-4">
            <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle>Company Registration</CardTitle>
                    <CardDescription>Enter your company details</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-1">
                            <Label htmlFor="name">Company Name</Label>
                            <Input
                                id="name"
                                {...register("name")}
                                maxLength={60}
                                onChange={(e) => {
                                    if (e.target.value.startsWith(" ")) {
                                        e.target.value = e.target.value.trimStart();
                                    }
                                    register("name").onChange(e);
                                }}
                            />
                            <p className="text-sm text-red-500 min-h-[20px]">
                                {errors.name?.message || ""}
                            </p>
                        </div>


                        <div className="space-y-1">
                            <Label htmlFor="adminEmail">Admin Email</Label>
                            <Input id="adminEmail" type="text" {...register("adminEmail")} maxLength={60} />
                            <p className="text-sm text-red-500 min-h-[20px]">
                                {errors.adminEmail?.message || ""}
                            </p>
                        </div>

                        <div className="space-y-1 relative">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                className="pr-10"
                                maxLength={60}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-[35px] right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            <p className="text-sm text-red-500 min-h-[20px]">
                                {errors.password?.message || ""}
                            </p>
                        </div>

                        <div className="space-y-1 relative">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...register("confirmPassword")}
                                className="pr-10"
                                maxLength={60}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute top-[35px] right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide confirm password"
                                        : "Show confirm password"
                                }
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                            <p className="text-sm text-red-500 min-h-[20px]">
                                {errors.confirmPassword?.message || ""}
                            </p>
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={loading}>
                            {loading ? "Registering..." : "Register Company"}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                Login here
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;
