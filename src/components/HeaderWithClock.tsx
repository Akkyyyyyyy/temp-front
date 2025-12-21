// components/HeaderWithClock.tsx
import { useState, useEffect } from 'react';
import { GoogleCalendarSync } from './GoogleCalendarSync';
import { useAuth } from '@/context/AuthContext';
import { CompanyDropdown } from './dropdowns/CompanyDropdown';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

interface HeaderWithClockProps {
  timeView: any;
  onDateClick: () => void;
  setSelectedProject: (project: any) => void;
  selectedDay?: number;
  selectedMonth: number;
  selectedYear: number;
  selectedWeek?: number;
  refreshMembers?: () => void;
}

export function HeaderWithClock({
  timeView,
  onDateClick,
  setSelectedProject,
  selectedDay,
  selectedMonth,
  selectedWeek,
  selectedYear,
  refreshMembers
}: HeaderWithClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();
  const {
    isAuthorized,
    isSyncing,
    handleConnect,
    handleSyncAllEvents,  // Updated
    handleDisconnect
  } = useGoogleCalendar(refreshMembers);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleDateClick = () => {
    onDateClick();
  };

  return (
    <div className="hidden lg:flex justify-between items-center mb-4">
      <div className="lg:block">
        <CompanyDropdown
          setSelectedProject={setSelectedProject}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          selectedWeek={selectedWeek}
          timeView={timeView}
        />
      </div>

      {/* Date Display */}
      <div className="hidden lg:flex items-center gap-6">
        <GoogleCalendarSync
          onConnect={handleConnect}
          onSyncAllEvents={handleSyncAllEvents}  // Updated
          onDisconnect={handleDisconnect}
          isAuthorized={isAuthorized}
          isSyncing={isSyncing}
        />
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
      </div>
    </div>
  );
}