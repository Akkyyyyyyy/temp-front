import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/api/apiClient";
import { toast } from "sonner";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  failed: number;
  results: Array<{
    eventId: string;
    eventName: string;
    projectName?: string;
    assignmentId: string;
    success: boolean;
    message: string;
    googleEventId?: string;
    role: string;
    date: string;
  }>;
}

export function useGoogleCalendar(onMemberRefresh?: () => void) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.data.id) {
      checkGoogleAuthStatus();
    }
  }, [user?.data.id]);

  const checkGoogleAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await apiFetch(`${baseUrl}/calendar/check-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
        }),
      });

      if (response.ok) {
        const { hasAuth } = await response.json();
        setIsAuthorized(hasAuth);
        console.log("🔍 Google Calendar auth status:", hasAuth);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");

      const authResponse = await apiFetch(`${baseUrl}/calendar/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: user?.data.id }),
      });

      if (!authResponse.ok) throw new Error("Failed to get Google auth URL");

      const { authUrl } = await authResponse.json();
      const popup = window.open(authUrl, "google-auth", "width=500,height=600");

      if (!popup) throw new Error("Popup blocked");

      const messageHandler = (event: MessageEvent) => {
        if (
          event.data.type === "GOOGLE_AUTH_SUCCESS" ||
          event.data.type === "GOOGLE_AUTH_COMPLETE"
        ) {
          onMemberRefresh?.();
          popup.close();
          toast.success("Connected to Google Calendar successfully");
          checkGoogleAuthStatus();
          window.removeEventListener("message", messageHandler);
          clearInterval(checkPopup);
        }

        if (event.data.type === "GOOGLE_AUTH_ERROR") {
          popup.close();
          toast.error("Google Calendar connection failed");
          window.removeEventListener("message", messageHandler);
          clearInterval(checkPopup);
        }
      };

      window.addEventListener("message", messageHandler);

      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener("message", messageHandler);
          checkGoogleAuthStatus();
        }
      }, 500);
    } catch (error) {
      console.error("Connection failed", error);
      toast.error("Google Calendar connection failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // SYNC ALL EVENT ASSIGNMENTS
  const handleSyncAllEvents = async (): Promise<SyncResult | null> => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");

      const response = await apiFetch(`${baseUrl}/calendar/sync-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
          companyId: user?.data.company?.id,
        }),
      });

      const result: SyncResult = await response.json();

      return result;
    } catch (error) {
      console.error("Event sync failed:", error);
      toast.error("Failed to sync events with Google Calendar");
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  // SYNC SINGLE EVENT ASSIGNMENT
  const handleSyncSingleEvent = async (assignmentId: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");

      const response = await apiFetch(`${baseUrl}/calendar/sync-event/${assignmentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Event "${result.eventName}" synced to Google Calendar`);
        return true;
      } else {
        toast.error(result.message || "Event sync failed");

        if (result.message.includes("authentication expired") ||
          result.message.includes("not connected")) {
          setIsAuthorized(false);
        }
        return false;
      }
    } catch (error) {
      console.error("Single event sync failed:", error);
      toast.error("Failed to sync event");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // UPDATE EVENT IN GOOGLE CALENDAR
  const handleUpdateEvent = async (eventId: string, googleEventId?: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");

      const response = await apiFetch(`${baseUrl}/calendar/event/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
          googleEventId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Event updated in Google Calendar`);
        return true;
      } else {
        toast.error(result.message || "Event update failed");
        return false;
      }
    } catch (error) {
      console.error("Event update failed:", error);
      toast.error("Failed to update event in Google Calendar");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // DELETE EVENT FROM GOOGLE CALENDAR
  const handleDeleteEvent = async (googleEventId: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");

      const response = await apiFetch(`${baseUrl}/calendar/event/${googleEventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Event removed from Google Calendar`);
        return true;
      } else {
        toast.error(result.message || "Failed to delete event");
        return false;
      }
    } catch (error) {
      console.error("Event deletion failed:", error);
      toast.error("Failed to delete event from Google Calendar");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await apiFetch(`${baseUrl}/calendar/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: user?.data.id }),
      });

      const result = await response.json();

      if (result.success) {
        onMemberRefresh?.();
        setIsAuthorized(false);
        toast.success("Disconnected from Google Calendar");
      } else {
        toast.error("Failed to disconnect from Google Calendar");
      }
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast.error("Failed to disconnect from Google Calendar");
    }
  };

  return {
    isAuthorized,
    isSyncing,
    handleConnect,
    handleSyncAllEvents,    // Changed from handleSync
    handleSyncSingleEvent,  // New
    handleUpdateEvent,      // New
    handleDeleteEvent,      // New
    handleDisconnect,
    checkGoogleAuthStatus,  // Export if needed for manual refresh
  };
}