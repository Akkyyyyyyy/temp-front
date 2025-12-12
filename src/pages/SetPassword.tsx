import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useSearchParams } from "react-router-dom";

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
import { KeyRound, Eye, EyeOff, CheckCircle, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { checkMemberInvite, updateInvitationStatus, setMemberPassword } from "@/api/member"; // Adjust import path as needed
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/context/AuthContext";

const schema = yup.object({
    password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], "Passwords must match")
        .required("Please confirm your password"),
});

type FormData = yup.InferType<typeof schema>;

const SetPassword = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [tokenValid, setTokenValid] = useState(true);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [needsPassword, setNeedsPassword] = useState(true); // Default to true for backward compatibility
    const [invitationStatus, setInvitationStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [checkingToken, setCheckingToken] = useState(true);
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    });

    // Extract token from URL on component mount and validate
    useEffect(() => {
        const validateToken = async () => {
            const tokenFromUrl = searchParams.get('token');
            if (tokenFromUrl) {
                try {
                    const decoded: any = jwtDecode(tokenFromUrl);

                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        setTokenValid(false);
                        setCheckingToken(false);
                        return;
                    }

                    // Check if token is the correct type
                    if (decoded.type !== 'set_password_invite') {
                        setTokenValid(false);
                        setCheckingToken(false);
                        return;
                    }

                    // Check member invite and get response data
                    const result = await checkMemberInvite({ token: tokenFromUrl });

                    if (result.success) {
                        setToken(tokenFromUrl);
                        if (result.isPassword === false) {
                            setNeedsPassword(true);
                        } else if (result.isPassword === true) {
                            setNeedsPassword(false);
                        }
                        // You can also check invitation status from the response
                        if (result.data?.invitationStatus) {
                            setInvitationStatus(result.data.invitationStatus);
                        }
                    } else {
                        setTokenValid(false);
                    }
                } catch (error) {
                    console.error("Error decoding token:", error);
                    setTokenValid(false);
                    toast.error("Invalid invitation link");
                }
            } else {
                setTokenValid(false);
                toast.error("Invalid or missing invitation link");
            }
            setCheckingToken(false);
        };
        validateToken();
    }, [searchParams]);

    const onSubmit = async (formData: FormData) => {
        if (!token) {
            toast.error("Invalid invitation link");
            return;
        }

        try {
            setLoading(true);

            const response = await setMemberPassword({
                token,
                password: formData.password,
            });

            if (!response.success) {
                throw new Error(response.message || "Failed to set password");
            }
            login("member", {
                token: response.data.token,
                member: response.data.user
            });

            setPasswordSuccess(true);
            navigate("/");

        } catch (error: any) {
            console.error(error.message || "Something went wrong");
            toast.error(error.message || "Failed to set password");
        } finally {
            setLoading(false);
        }
    };

    const handleInvitationResponse = async (accepted: boolean) => {
        if (!token) {
            toast.error("Invalid invitation link");
            return;
        }

        try {
            setLoading(true);

            const response = await updateInvitationStatus({
                token,
                status: accepted,
            });


            if (!response.success) {
                throw new Error(response.message || `Failed to ${accepted ? 'accept' : 'reject'} invitation`);
            }

            if (accepted) {
                // If accepted, login the user
                login("member", {
                    token: response.data.token,
                    member: response.data.user
                });

                setInvitationStatus('accepted');
                navigate("/");
            } else {
                setInvitationStatus('rejected');
                navigate("/");
            }

        } catch (error: any) {
            console.error(error.message || "Something went wrong");
            toast.error(error.message || `Failed to ${accepted ? 'accept' : 'reject'} invitation`);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    if (checkingToken) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                    <CardContent className="text-center p-8">
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <p>Loading...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shadow-lg">
                            <KeyRound className="h-7 w-7 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-bold tracking-tight">Invalid Link</CardTitle>
                            <CardDescription className="text-base">
                                This invitation link is invalid or has expired.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (passwordSuccess || invitationStatus === 'accepted') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-bold tracking-tight">Success!</CardTitle>
                            <CardDescription className="text-base">
                                {passwordSuccess
                                    ? "Your password has been set successfully."
                                    : "Invitation accepted successfully!"}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">
                            Redirecting you to dashboard...
                        </p>
                        <Button
                            onClick={() => navigate("/")}
                            variant="outline"
                            className="w-full h-11 text-base font-medium"
                        >
                            Go to Dashboard Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (invitationStatus === 'rejected') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center shadow-lg">
                            <ThumbsDown className="h-7 w-7 text-gray-600" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-bold tracking-tight">Invitation Rejected</CardTitle>
                            <CardDescription className="text-base">
                                You have rejected the invitation.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button
                            onClick={() => navigate("/login")}
                            className="w-full h-11 text-base font-medium"
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!needsPassword) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto w-16 h-16 bg-studio-gold rounded-2xl flex items-center justify-center shadow-lg">
                            <KeyRound className="h-7 w-7 text-background" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl font-bold tracking-tight">Company Invitation</CardTitle>
                            <CardDescription className="text-base">
                                You've been invited to join a company. Would you like to accept this invitation?
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleInvitationResponse(true)}
                                disabled={loading}
                                className="flex-1 h-11 text-base font-medium text-foreground bg-green-700 hover:bg-green-800"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                        Accepting...
                                    </div>
                                ) : (
                                    <>
                                        <ThumbsUp className="h-4 w-4 mr-2" />
                                        Accept
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleInvitationResponse(false)}
                                disabled={loading}
                                variant="outline"
                                className="flex-1 h-11 text-base font-medium hover:text-foreground bg-red-700 hover:bg-red-800"
                            >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">Set Your Password</CardTitle>
                        <CardDescription className="text-base">
                            Create a password to secure your account
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    {...register("password")}
                                    placeholder="Enter your new password"
                                    className="h-11 pr-11 transition-colors focus-visible:ring-2"
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

                        <div className="space-y-3">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    {...register("confirmPassword")}
                                    placeholder="Confirm your new password"
                                    className="h-11 pr-11 transition-colors focus-visible:ring-2"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-red-500 min-h-[20px]">
                                {errors.confirmPassword?.message || ""}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-lg mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                    Setting Password...
                                </div>
                            ) : (
                                "Set Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetPassword;