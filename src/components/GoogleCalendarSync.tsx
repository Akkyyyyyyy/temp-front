// components/GoogleCalendarSync.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoogleCalendarSyncProps {
  className?: string;
  isAuthorized?: boolean;
  isSyncing?: boolean;
  onConnect: () => Promise<void>;
  onSyncAllEvents: () => Promise<any>;  // Updated
  onDisconnect: () => Promise<void>;
}

export function GoogleCalendarSync({
  className,
  isAuthorized = false,
  isSyncing = false,
  onConnect,
  onSyncAllEvents,  // Updated
  onDisconnect
}: GoogleCalendarSyncProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showDisconnectPopover, setShowDisconnectPopover] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleConnect = async () => {
    try {
      await onConnect();
      setShowConnectDialog(false);
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect Google Calendar");
    }
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
      setShowDisconnectPopover(false);
      toast.success("Disconnected from Google Calendar");
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast.error("Failed to disconnect");
    }
  };

  const handleSyncEvents = async () => {
    try {
      const result = await onSyncAllEvents();
      setSyncResult(result);
      setShowDisconnectPopover(false);

      // Show detailed results in toast
      if (result?.synced > 0) {
        toast.success(`Synced events to Google Calendar`);
      }
      if (result?.failed > 0) {
        toast.warning(`Failed to sync Events`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync events");
    }
  };

  const handleIconClick = async () => {
    if (isAuthorized) {
      // Already authorized - open popover for sync options
      setShowDisconnectPopover(true);
    } else {
      // Not authorized - show connect dialog
      setShowConnectDialog(true);
    }
  };

  return (
    <TooltipProvider>
      <div className={`relative ${className}`}>
        {isAuthorized ? (
          // When connected - shows sync status
          <Popover open={showDisconnectPopover} onOpenChange={setShowDisconnectPopover}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    onClick={handleIconClick}
                    disabled={isSyncing}
                    className={`
                      relative p-2 rounded-lg transition-all duration-300
                      text-blue-500 hover:text-blue-600 hover:bg-blue-500/10
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <GoogleCalendarIcon />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    {isSyncing && <SyncSpinner />}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isSyncing ? "Syncing events..." : "Sync events to Google Calendar"}
              </TooltipContent>
            </Tooltip>
            
            <PopoverContent className="w-64" side="bottom" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Google Calendar Connected</h4>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {isSyncing ? "Syncing in progress..." : "Ready to sync events"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSyncEvents}
                    disabled={isSyncing}
                    className="flex-1"
                    size="sm"
                  >
                    {isSyncing ? <SyncButtonText /> : "Sync All Events"}
                  </Button>
                </div>

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // When not connected
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleIconClick}
                disabled={isSyncing}
                className={`
                  relative p-2 rounded-lg transition-all duration-300
                  text-muted-foreground hover:text-foreground hover:bg-muted
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <GoogleCalendarIcon />
                {isSyncing && <SyncSpinner />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isSyncing ? "Connecting..." : "Connect Google Calendar"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Connect Dialog - Only shows for first-time connection */}
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GoogleCalendarIcon />
                Connect Google Calendar
              </DialogTitle>
              <DialogDescription>
                Connect once and your events will sync automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-foreground font-medium">One-time setup:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Connect to Google Calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Sync events automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Updates reflected in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>No repeated sign-ins</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleConnect}
                className="w-full gap-2"
                disabled={isSyncing}
              >
                {isSyncing ? <ConnectButtonText /> : "Connect Google Calendar"}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                By connecting, you allow our app to create and manage events in your Google Calendar
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Helper components
const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const SyncSpinner = () => (
  <span className="absolute -bottom-1 -right-1 w-3 h-3">
    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </span>
);

const SyncButtonText = () => (
  <>
    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
    Syncing...
  </>
);

const ConnectButtonText = () => (
  <>
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    Connecting...
  </>
);