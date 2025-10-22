import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; // Adjust the import path as needed

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function LogoutModal({ isOpen, onClose, onLogout }: LogoutModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Log out?</SheetTitle>
            <SheetDescription>
              You'll need to sign in again to access your account.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 pt-6">
            <Button
              onClick={onLogout}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="w-full"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Log out?</DialogTitle>
          <DialogDescription className="text-center">
            You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onLogout}
            variant="destructive"
            className="flex-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}