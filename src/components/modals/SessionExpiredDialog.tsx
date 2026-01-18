import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface SessionExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginAgain: () => void;
}

export function SessionExpiredDialog({
  open,
  onOpenChange,
  onLoginAgain,
}: SessionExpiredDialogProps) {
  const handleLoginAgain = () => {
    onLoginAgain();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="
          sm:max-w-[420px]
          rounded-2xl
          border border-border
          bg-background
          shadow-xl
        "
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="
                flex items-center justify-center 
                rounded-full 
                bg-destructive/10
                p-2
              "
            >
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>

            <AlertDialogTitle className="text-left">
              Session Expired
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-left pt-2">
            Your session has expired. Please log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="justify-start">
          <AlertDialogAction
            onClick={handleLoginAgain}
            className="rounded-xl"
            
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
