import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar, Clock, MapPin, Info } from "lucide-react";
import { format } from "date-fns";
import { BusyEventTooltipContent } from "./BusyEventTooltipContent";

interface GoogleCalendarEventProps {
  event: any;
  startPercent: number;
  widthPercent: number;
  isLoggedInUser: boolean;
  formatTime: (hour: number) => string;
}

export const GoogleCalendarEvent = ({
  event,
  startPercent,
  widthPercent,
  isLoggedInUser,
  formatTime
}: GoogleCalendarEventProps) => {
  if (isLoggedInUser) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div
              className="absolute my-2 h-10 rounded-md flex items-center px-3 cursor-default
                transition-all duration-200 ease-out opacity-0 translate-x-[-10px] animate-fadeInSlideIn
                hover:bg-blue-50"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                animationFillMode: 'forwards',
                animationDuration: '0.5s',
                backgroundColor: '#ffffff',
                border: '2px solid #dbeafe',
                boxShadow: '0 1px 3px rgba(66, 133, 244, 0.1)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-medium truncate">
                    {event.name}
                  </span>
                </div>
              </div>

              <div className="absolute -top-1.5 right-1.5 w-5 h-5 bg-white rounded-full border border-blue-300 
                flex items-center justify-center shadow-md transform group-hover:scale-110 
                group-hover:shadow-blue-200 group-hover:border-blue-400 transition-all duration-300 z-10">
                <div className="relative">
                  <svg
                    className="w-2.5 h-2.5 relative z-10"
                    fill="#4285F4"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <div className="absolute -inset-1 bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            className="bg-background text-foreground text-sm rounded-lg shadow-xl px-4 py-3 max-w-xs border border-border"
            side="top"
            sideOffset={8}
          >
            <GoogleEventTooltipContent event={event} formatTime={formatTime} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // For other users' Google Calendar events (admins can see they're busy)
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className="absolute my-2 h-10 rounded-md flex items-center justify-center px-2 text-gray-400 font-medium text-[0.7rem] cursor-default
                border border-dashed border-gray-500/50 bg-gray-800/30 transition-all duration-500 ease-out opacity-0 translate-x-[-10px] animate-fadeInSlideIn"
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            }}
          >
            <span className="opacity-90">Busy</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-[#101319] text-white text-sm rounded-md shadow-lg px-4 py-3 max-w-xs border border-white/20"
          side="top"
          sideOffset={8}
        >
          <BusyEventTooltipContent event={event} formatTime={formatTime} type="google" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Separate tooltip content component for Google events
const GoogleEventTooltipContent = ({ event, formatTime }: { event: any; formatTime: (hour: number) => string }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 pb-2">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="#4285F4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">
            {event.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Google Calendar
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground">
            {event.endDate && new Date(event.endDate).getTime() > new Date(event.date).getTime() ? (
              (() => {
                let displayEndDate = new Date(event.endDate);

                if (event.allDay) {
                  displayEndDate.setDate(displayEndDate.getDate() - 1);
                }

                if (displayEndDate.getTime() > new Date(event.date).getTime()) {
                  return (
                    <>
                      {format(new Date(event.date), "do MMM")} – {format(displayEndDate, "do MMM")}
                    </>
                  );
                } else {
                  return format(new Date(event.date), "EEE, do MMM");
                }
              })()
            ) : (
              format(new Date(event.date), "EEE, do MMM")
            )}
            {!event.allDay && ` • ${formatTime(event.startHour || 0)}–${formatTime(event.endHour || 0)}`}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground truncate">
              {event.location}
            </span>
          </div>
        )}

        {event.description && (
          <div className="text-xs text-muted-foreground bg-muted rounded p-2 mt-1">
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
};