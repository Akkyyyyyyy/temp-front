// components/ConfirmRemoveMemberDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserMinus } from "lucide-react";


export function ConfirmRemoveMemberDialog({
  open,
  onOpenChange,
  memberName,
  eventName,
  roleName,
  onConfirm,
  isLoading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <UserMinus className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">
              Remove Member from Event
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">{memberName}</span>{" "}
            from the {" "}
            <span className="font-semibold text-foreground">"{eventName}"</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/20"
          >
            {isLoading ? "Removing..." : "Remove Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}