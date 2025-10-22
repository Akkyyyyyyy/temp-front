// components/ForgotPasswordModal.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { requestPasswordReset, verifyOTP, resetPassword } from "@/api/company";

const emailSchema = yup.object({
    email: yup.string().email("Invalid email format").required("Email is required").matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
});

const otpSchema = yup.object({
    otp: yup.string().length(6, "OTP must be 6 digits").required("OTP is required"),
});

const newPasswordSchema = yup.object({
    newPassword: yup.string().required("New password is required").matches(
            /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d).{6,}$/,
            "Password must be at least 6 characters and include at least 1 uppercase letter, 1 letter and number."
        ),
    confirmPassword: yup.string()
        .oneOf([yup.ref('newPassword')], "Passwords must match")
        .required("Please confirm your password"),
});

type EmailData = yup.InferType<typeof emailSchema>;
type OTPData = yup.InferType<typeof otpSchema>;
type NewPasswordData = yup.InferType<typeof newPasswordSchema>;

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userType: "company" | "member";
}

type ForgotPasswordStep = 'email' | 'otp' | 'newPassword';

export const ForgotPasswordModal = ({ isOpen, onClose, userType }: ForgotPasswordModalProps) => {
    const [step, setStep] = useState<ForgotPasswordStep>('email');
    const [loading, setLoading] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [initialToken, setInitialToken] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [showConfirmPassword,setShowConfirmPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const emailForm = useForm<EmailData>({
        resolver: yupResolver(emailSchema),
    });

    const otpForm = useForm<OTPData>({
        resolver: yupResolver(otpSchema),
    });

    const newPasswordForm = useForm<NewPasswordData>({
        resolver: yupResolver(newPasswordSchema),
    });

    // Timer effect for resend OTP
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    const startResendTimer = () => {
        setResendTimer(30); // 30 seconds
    };

    const handleSendOTP = async (data: EmailData) => {
        try {
            setLoading(true);
            const response = await requestPasswordReset(userType, { email: data.email });

            if (response.success) {
                setResetEmail(data.email);

                if (response.data?.token) {
                    setInitialToken(response.data.token);
                }
                setStep('otp');
                startResendTimer(); // Start the timer when OTP is sent
                toast.success("OTP sent to your email!");
            } else {
                toast.error(response.message || "Failed to send OTP");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return; // Prevent resend if timer is active

        try {
            setIsResending(true);
            const response = await requestPasswordReset(userType, { email: resetEmail });

            if (response.success) {
                if (response.data?.token) {
                    setInitialToken(response.data.token);
                }
                startResendTimer(); // Restart the timer
                toast.success("OTP resent to your email!");
            } else {
                toast.error(response.message || "Failed to resend OTP");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsResending(false);
        }
    };

    const handleVerifyOTP = async (data: OTPData) => {
        try {
            setLoading(true);

            const tokenToUse = initialToken;

            if (!tokenToUse) {
                toast.error("Reset token not found. Please request a new OTP.");
                return;
            }

            const response = await verifyOTP(userType, {
                email: resetEmail,
                otp: data.otp,
                token: tokenToUse
            });

            if (response.success) {
                setResetToken(response.data.token);
                setStep('newPassword');
                setResendTimer(0); // Clear the timer when OTP is verified
                toast.success("OTP verified successfully!");
            } else {
                toast.error(response.message || "Invalid OTP");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (data: NewPasswordData) => {
        try {
            setLoading(true);
            const response = await resetPassword(userType, {
                token: resetToken,
                newPassword: data.newPassword
            });

            if (response.success) {
                toast.success("Password reset successfully!");
                handleClose();
            } else {
                toast.error(response.message || "Failed to reset password");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('email');
        setResetEmail("");
        setResetToken("");
        setInitialToken("");
        setResendTimer(0); // Clear timer on close
        emailForm.reset();
        otpForm.reset();
        newPasswordForm.reset();
        onClose();
    };

    const getStepTitle = () => {
        switch (step) {
            case 'email':
                return 'Reset Your Password';
            case 'otp':
                return 'Enter OTP Code';
            case 'newPassword':
                return 'Create New Password';
            default:
                return 'Reset Password';
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 'email':
                return 'Enter your email address and we\'ll send you an OTP to reset your password.';
            case 'otp':
                return 'Enter the 6-digit verification code sent to your email.';
            case 'newPassword':
                return 'Create a new password for your account.';
            default:
                return '';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="relative">
                    <DialogTitle className="text-xl">{getStepTitle()}</DialogTitle>
                    <DialogDescription>{getStepDescription()}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Step Indicator */}
                    <div className="flex justify-center space-x-4 mb-6">
                        {['email', 'otp', 'newPassword'].map((stepName, index) => (
                            <div key={stepName} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === stepName
                                            ? 'bg-primary text-primary-foreground'
                                            : step === 'otp' && index < 1
                                                ? 'bg-primary text-primary-foreground'
                                                : step === 'newPassword' && index < 2
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                {index < 2 && (
                                    <div
                                        className={`w-8 h-0.5 mx-2 ${(step === 'otp' && index === 0) || (step === 'newPassword' && index < 2)
                                                ? 'bg-primary'
                                                : 'bg-muted'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Email Step */}
                    {step === 'email' && (
                        <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder={userType === "company" ? "admin@company.com" : "member@company.com"}
                                    {...emailForm.register("email")}
                                />
                                {emailForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">
                                        {emailForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* OTP Step */}
                    {step === 'otp' && (
                        <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="text-center text-lg font-mono tracking-widest"
                                    {...otpForm.register("otp")}
                                />
                                {otpForm.formState.errors.otp && (
                                    <p className="text-sm text-destructive">
                                        {otpForm.formState.errors.otp.message}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground text-center">
                                    Code sent to: {resetEmail}
                                </p>

                                {/* Resend OTP Section */}
                                <div className="flex justify-center items-center space-x-2 mt-4">
                                    <span className="text-sm text-muted-foreground">
                                        Didn't receive the code?
                                    </span>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="p-0 h-auto text-sm"
                                        onClick={handleResendOTP}
                                        disabled={resendTimer > 0 || isResending}
                                    >
                                        {isResending ? (
                                            <>
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                                                Resending...
                                            </>
                                        ) : resendTimer > 0 ? (
                                            `Resend in ${resendTimer}s`
                                        ) : (
                                            'Resend again'
                                        )}
                                    </Button>
                                </div>

                                {/* Development helper - show token if available */}
                                {process.env.NODE_ENV === 'development' && initialToken && (
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        OTP available (check console)
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Code'
                                )}
                            </Button>
                        </form>
                    )}

                    {/* New Password Step */}
                    {step === 'newPassword' && (
                        <form onSubmit={newPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                            <div className="space-y-2">
    <Label htmlFor="newPassword">New Password</Label>
    <div className="relative">
        <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password"
            {...newPasswordForm.register("newPassword")}
            className="pr-10"
        />
        <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowNewPassword(!showNewPassword)}
        >
            {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
            ) : (
                <Eye className="h-4 w-4" />
            )}
        </button>
    </div>
    {newPasswordForm.formState.errors.newPassword && (
        <p className="text-sm text-destructive">
            {newPasswordForm.formState.errors.newPassword.message}
        </p>
    )}
</div>

<div className="space-y-2">
    <Label htmlFor="confirmPassword">Confirm Password</Label>
    <div className="relative">
        <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            {...newPasswordForm.register("confirmPassword")}
            className="pr-10"
        />
        <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
            {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
            ) : (
                <Eye className="h-4 w-4" />
            )}
        </button>
    </div>
    {newPasswordForm.formState.errors.confirmPassword && (
        <p className="text-sm text-destructive">
            {newPasswordForm.formState.errors.confirmPassword.message}
        </p>
    )}
</div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};