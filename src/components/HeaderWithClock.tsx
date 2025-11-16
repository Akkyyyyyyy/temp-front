// components/HeaderWithClock.tsx
import { useState, useEffect } from 'react';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/api/apiClient';
import { toast } from 'sonner';
import { CompanyDropdown } from './dropdowns/CompanyDropdown';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

interface HeaderWithClockProps {
  timeView: any;
  onDateClick: () => void;
  setSelectedProject: (project: any) => void;
}

export function HeaderWithClock({ timeView, onDateClick, setSelectedProject }: HeaderWithClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if user has Google Calendar connected on component mount
  useEffect(() => {
    if (user?.data.id) {
      checkGoogleAuthStatus();
    }
  }, [user?.data.id]);

  // Check Google Auth Status
  const checkGoogleAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${baseUrl}/calendar/check-auth`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id
        })
      });

      if (response.ok) {
        const { hasAuth } = await response.json();
        setIsAuthorized(hasAuth);
        console.log('🔍 Auth status:', hasAuth ? 'Connected' : 'Not connected');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  // Handle Google Calendar Connection (ONLY for first time)
  const handleConnect = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("token");

      // Step 1: Request Google Auth URL from backend
      const authResponse = await apiFetch(`${baseUrl}/calendar/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
        }),
      });

      if (!authResponse.ok) {
        throw new Error("Failed to get Google auth URL");
      }

      const { authUrl } = await authResponse.json();

      // ✅ Step 2: Open popup *after backend success*
      const popup = window.open(
        authUrl,
        "google-auth",
        "width=500,height=600,left=100,top=100"
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // ✅ Step 3: Setup message listener (for postMessage from backend redirect)
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === "GOOGLE_AUTH_SUCCESS" || event.data.type === "GOOGLE_AUTH_COMPLETE") {
          console.log("✅ Google auth successful");
          popup.close();
          checkGoogleAuthStatus();
          toast.success("Connected successfully");
          window.removeEventListener("message", messageHandler);
          clearInterval(checkPopup);
        }

        if (event.data.type === "GOOGLE_AUTH_ERROR") {
          console.error("❌ Google auth failed:", event.data.error);
          popup.close();
          toast.error("Connection failed");
          window.removeEventListener("message", messageHandler);
          clearInterval(checkPopup);
        }
      };

      window.addEventListener("message", messageHandler);

      // ✅ Step 4: Fallback check if popup was closed manually
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener("message", messageHandler);
          checkGoogleAuthStatus();
        }
      }, 500);
    } catch (error: any) {
      console.error("Connection failed:", error);
      toast.error("Connection failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Project Sync (NO POPUP - uses refresh token automatically)
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem('token');

      console.log('🔄 Starting project sync...');

      const response = await apiFetch(`${baseUrl}/calendar/sync-projects`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id,
          companyId: user?.data.company?.id
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Sync completed!");
        console.log('✅ Sync successful:', result);
      } else {
        toast.error("Sync failed");
        // If sync fails due to auth issues, update status
        if (result.message.includes('authentication expired') || result.message.includes('reconnect')) {
          setIsAuthorized(false);
        }
        console.error('❌ Sync failed:', result);
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await apiFetch(`${baseUrl}/calendar/disconnect`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: user?.data.id
        })
      });
      const result = await response.json();
      if (result.success) {
        setIsAuthorized(false);
        toast.success("Disconnected");
      } else {
        toast.error("Disconnect failed");
      }
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      toast.error("Disconnect failed");
    }
  };

  const handleDateClick = () => {
    onDateClick();
  };

  return (
    <div className="hidden lg:flex justify-between items-center mb-4">
      <div className="lg:block">
        <CompanyDropdown setSelectedProject={setSelectedProject} />
      </div>

      {/* Date Display */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Today's Date with Day Name - Clickable */}
        <div
          className="text-right cursor-pointer px-3 py-2 rounded-md transition-colors hover:bg-muted/60"
          onClick={handleDateClick}
          title={`Click to reset Dashboard`}
        >
          <p className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-foreground font-medium">
            {currentTime.toLocaleDateString('en-UK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <GoogleCalendarSync
          onConnect={handleConnect}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
          isAuthorized={isAuthorized}
          isSyncing={isSyncing}
        />
      </div>
    </div>
  );
}