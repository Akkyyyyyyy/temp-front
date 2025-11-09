// components/HeaderWithClock.tsx
import { useState, useEffect } from 'react';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/api/apiClient';
const baseUrl = import.meta.env.VITE_BACKEND_URL;

interface HeaderWithClockProps {
  timeView: any;
  onDateClick: () => void;
}

export function HeaderWithClock({ timeView, onDateClick }: HeaderWithClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      // Optional security check:
      // if (event.origin !== window.location.origin) return;

      if (event.data.type === "GOOGLE_AUTH_SUCCESS" || event.data.type === "GOOGLE_AUTH_COMPLETE") {
        console.log("✅ Google auth successful");
        popup.close();
        checkGoogleAuthStatus();

        toast({
          title: "Connected successfully",
          description: "Google Calendar has been connected",
          variant: "default",
        });

        window.removeEventListener("message", messageHandler);
        clearInterval(checkPopup);
      }

      if (event.data.type === "GOOGLE_AUTH_ERROR") {
        console.error("❌ Google auth failed:", event.data.error);
        popup.close();

        toast({
          title: "Connection failed",
          description: event.data.error || "Failed to connect to Google Calendar",
          variant: "destructive",
        });

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
    toast({
      title: "Connection failed",
      description: error.message || "Failed to connect to Google Calendar",
      variant: "destructive",
    });
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
        toast({
          title: "Sync completed!",
          description: result.message
        });

        console.log('✅ Sync successful:', result);
      } else {
        toast({
          title: "Sync failed",
          description: result.message,
          variant: "destructive"
        });

        // If sync fails due to auth issues, update status
        if (result.message.includes('authentication expired') || result.message.includes('reconnect')) {
          setIsAuthorized(false);
        }

        console.error('❌ Sync failed:', result);
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync projects",
        variant: "destructive"
      });
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
        toast({
          title: "Disconnected",
          description: "Google Calendar has been disconnected"
        });
      } else {
        toast({
          title: "Disconnect failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect Google Calendar",
        variant: "destructive"
      });
    }
  };

  const handleDateClick = () => {
    onDateClick();
  };

  // Determine badge content and color based on user type
  const getBadgeConfig = () => {
    if (user?.type === 'member') {
      return {
        text: 'Member',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (user?.type === 'company') {
      return {
        text: 'Admin',
        className: 'bg-purple-100 text-purple-800 border-purple-200'
      };
    }
    return {
      text: 'User',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const badgeConfig = getBadgeConfig();

  return (
    <div className="hidden lg:flex justify-between items-center mb-4">
      <div className="lg:block">
        <h1 className="text-2xl font-semibold text-foreground mb-1">{user.data.company.name}</h1>
        
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