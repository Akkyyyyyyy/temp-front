import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BookingDetailsDialog } from './BookingDetailsDialog';
import { getFallback } from '@/helper/helper';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, MapPin, Info, Shield } from 'lucide-react';
import { format } from 'date-fns';

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface EditableTimeSlotProps {
  hour: number;
  booking?: any;
  isStartOfBooking: boolean;
  formatHour: (hour: number) => string;
  showHourLabel?: boolean;
  onProjectClick?: (projectId: string) => void;
  isMultiDay?: boolean;
  isFirstDay?: boolean;
  isLastDay?: boolean;
}

export function EditableTimeSlot({
  hour,
  booking,
  isStartOfBooking,
  formatHour,
  showHourLabel = true,
  onProjectClick
}: EditableTimeSlotProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isOtherEvent = booking?.isOther;
  const isGoogleEvent = booking?.source === 'google_calendar' || booking?.source === 'google_calendar_private';
  const isCurrentUserEvent = booking?.isCurrentUserEvent;

  const handleProjectClick = () => {
    // Don't allow clicks for private/Google events
    if (isOtherEvent) return;

    if (booking && onProjectClick) {
      onProjectClick(booking.id);
    }
    setShowDetails(true);
  };

  // Format time for display
  const formatTimeRange = () => {
    if (booking?.isAllDay) return 'All Day';
    return `${formatHour(booking?.startHour)} - ${formatHour(booking?.endHour)}`;
  };

  // Handle Google Calendar events - NEW STYLE
  if (isGoogleEvent) {
    // For current user's own Google Calendar events
    if (isCurrentUserEvent) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center p-3 rounded-lg border transition-colors ${booking
                  ? 'bg-white text-gray-900 border-blue-200 border-2 hover:bg-blue-50'
                  : 'bg-muted/20 border-border/20 hover:bg-muted/30'
                  }`}
                style={{
                  boxShadow: '0 1px 3px rgba(66, 133, 244, 0.1)',
                }}
              >
                {showHourLabel ? (
                  <div className="w-16 sm:w-20 text-sm font-medium">
                    {formatHour(hour)}
                  </div>
                ) : (
                  <div className="w-16 sm:w-20"></div>
                )}

                <div className="flex items-center gap-3 flex-1">
                  {isStartOfBooking && (
                    <>
                      <div className="relative">
                        <Avatar
                          className="w-8 h-8 ring-2 ring-blue-200 cursor-default"
                        >
                          <AvatarImage
                            src={`${S3_URL}/${booking.memberPhoto}`}
                            alt={booking.memberName}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs cursor-default">
                            {getFallback(booking.memberName)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Google Calendar icon */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-blue-300 
                          flex items-center justify-center shadow-md cursor-default">
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
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate cursor-default">
                            {booking.eventName || 'Private Event'}
                            {booking.isMultiDay && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {booking.isFirstDay ? 'Starts' : booking.isLastDay ? 'Ends' : 'Continues'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 truncate cursor-default">
                            {booking.memberName} • {formatTimeRange()}
                            {booking.location && ` • ${booking.location}`}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {!isStartOfBooking && (
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-default">
                      <Avatar
                        className="w-8 h-8 ring-2 ring-blue-200 flex-shrink-0"
                      >
                        <AvatarImage
                          src={`${S3_URL}/${booking.memberPhoto}`}
                          alt={booking.memberName}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs cursor-default">
                          {getFallback(booking.memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-gray-600 truncate cursor-default">
                        ↳ {booking.eventName || 'Private Event'} • Google Calendar
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="bg-background text-foreground text-sm rounded-lg shadow-xl px-4 py-3 max-w-xs border border-border"
              side="top"
              sideOffset={8}
            >
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
                      {booking.eventName || 'Private Event'}
                      {booking.isMultiDay && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Multi-day
                        </span>
                      )}
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
                      {/* Show date range for multi-day events */}
                      <>
                        {format(new Date(booking.date), "EEE, do MMM")}
                        {booking.endDate && (
                          <>
                            {" – "}
                            {format(new Date(booking.endDate), "EEE, do MMM")}
                          </>
                        )}
                      </>
                      {!booking.isAllDay && ` • ${formatHour(booking.startHour || 0)}–${formatHour(booking.endHour || 0)}`}
                    </span>
                  </div>

                  {/* For multi-day events, show current day indicator */}
                  {booking.isMultiDay && booking.endDate && (
                    <div className="flex items-center gap-2 text-xs bg-muted rounded p-2">
                      <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">
                        {booking.isFirstDay
                          ? "First day of multi-day event"
                          : booking.isLastDay
                            ? "Last day of multi-day event"
                            : "Day " + Math.floor(
                              (new Date(booking.date).getTime() - new Date(booking.date).getTime()) /
                              (1000 * 60 * 60 * 24)
                            ) + " of " + Math.floor(
                              (new Date(booking.endDate).getTime() - new Date(booking.date).getTime()) /
                              (1000 * 60 * 60 * 24)
                            ) + " days"
                        }
                      </span>
                    </div>
                  )}

                  {booking.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground truncate">
                        {booking.location}
                      </span>
                    </div>
                  )}

                  {booking.description && booking.description !== 'Details are private' && (
                    <div className="text-xs text-muted-foreground bg-muted rounded p-2 mt-1">
                      {booking.description}
                    </div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      // For admin viewing other users' Google Calendar events
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center p-3 rounded-lg border transition-colors ${booking
                  ? 'bg-gray-800/20 text-gray-500 border-dashed border-gray-400/30'
                  : 'bg-muted/20 border-border/20 hover:bg-muted/30'
                  }`}
              >
                {showHourLabel ? (
                  <div className="w-16 sm:w-20 text-sm font-medium">
                    {formatHour(hour)}
                  </div>
                ) : (
                  <div className="w-16 sm:w-20"></div>
                )}

                <div className="flex items-center gap-3 flex-1">
                  {isStartOfBooking && (
                    <>
                      <div className="relative">
                        <Avatar
                          className="w-8 h-8 ring-2 ring-gray-400/30"
                        >
                          <AvatarImage
                            src={`${S3_URL}/${booking.memberPhoto}`}
                            alt={booking.memberName}
                            className="object-cover opacity-40"
                          />
                          <AvatarFallback className="bg-gray-600 text-gray-500 font-semibold text-xs">
                            {getFallback(booking.memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-gray-500 text-gray-300 rounded-full p-0.5">
                          <Shield className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate text-gray-500">
                            Busy
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-400/10 text-gray-400 rounded">
                              Private
                            </span>
                          </div>
                          <div className="text-xs opacity-90 truncate text-gray-500">
                            {booking.memberName} • {formatTimeRange()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {!isStartOfBooking && (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        className="w-8 h-8 ring-2 ring-gray-400/30 flex-shrink-0 opacity-40"
                      >
                        <AvatarImage
                          src={`${S3_URL}/${booking.memberPhoto}`}
                          alt={booking.memberName}
                          className="object-cover opacity-40"
                        />
                        <AvatarFallback className="bg-gray-600 text-gray-500 font-semibold text-xs">
                          {getFallback(booking.memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm opacity-75 truncate text-gray-500">
                        ↳ {booking.memberName} • Busy
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="bg-[#101319] text-white text-sm rounded-md shadow-lg px-4 py-3 max-w-xs border border-white/20"
              side="top"
              sideOffset={8}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {/* Show date range for multi-day events */}
                    {booking.isMultiDay && booking.endDate ? (
                      <>
                        {format(new Date(booking.date), "do MMM")}
                        {" – "}
                        {format(new Date(booking.endDate), "do MMM, yyyy")}
                      </>
                    ) : (
                      format(new Date(booking.date || new Date()), "do MMM, yyyy")
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>
                    {booking.isAllDay
                      ? 'All Day'
                      : `${formatHour(booking.startHour || 0)} – ${formatHour(booking.endHour || 0)}`}
                  </span>
                </div>

                {/* For multi-day events, show duration info */}
                {booking.isMultiDay && booking.endDate && (
                  <div className="flex items-center gap-3 text-xs text-gray-300 pt-1 border-t border-white/10">
                    <Info className="w-3 h-3" />
                    <span>
                      Multi-day event ({Math.floor(
                        (new Date(booking.endDate).getTime() - new Date(booking.date).getTime()) /
                        (1000 * 60 * 60 * 24)
                      ) + 1} days)
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Google Calendar event details are private.
                  </p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  }

  // Handle other company events (non-Google) - KEEP ORIGINAL STYLE
  if (isOtherEvent && !isGoogleEvent) {
    return (
      <div
        className={`flex items-center p-3 rounded-lg border transition-colors ${booking
          ? 'bg-gray-800/30 text-gray-400 border-dashed border-gray-500/50'
          : 'bg-muted/20 border-border/20 hover:bg-muted/30'
          }`}
      >
        {showHourLabel ? (
          <div className="w-16 sm:w-20 text-sm font-medium">
            {formatHour(hour)}
          </div>
        ) : (
          <div className="w-16 sm:w-20"></div>
        )}

        <div className="flex items-center gap-3 flex-1">
          {isStartOfBooking && (
            <>
              <div className="relative">
                <Avatar
                  className="w-8 h-8 ring-2 ring-gray-500/50"
                >
                  <AvatarImage
                    src={`${S3_URL}/${booking.memberPhoto}`}
                    alt={booking.memberName}
                    className="object-cover opacity-50"
                  />
                  <AvatarFallback className="bg-gray-700 text-gray-400 font-semibold text-xs">
                    {getFallback(booking.memberName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white rounded-full p-0.5">
                  <Shield className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate text-gray-500">Private Event</div>
                  <div className="text-xs opacity-90 truncate text-gray-500">
                    Busy • {formatTimeRange()}
                    {booking.location && ` • ${booking.location}`}
                  </div>
                </div>
              </div>
            </>
          )}
          {!isStartOfBooking && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar
                className="w-8 h-8 ring-2 ring-gray-500/50 flex-shrink-0 opacity-50"
              >
                <AvatarImage
                  src={`${S3_URL}/${booking.memberPhoto}`}
                  alt={booking.memberName}
                  className="object-cover opacity-50"
                />
                <AvatarFallback className="bg-gray-700 text-gray-400 font-semibold text-xs">
                  {getFallback(booking.memberName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm opacity-75 truncate text-gray-500">
                ↳ Private Event • Busy
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular company event - KEEP ORIGINAL STYLE
  return (
    <div
      className={`flex items-center p-3 rounded-lg border transition-colors ${booking
        ? ` text-white border-transparent`
        : 'bg-muted/20 border-border/20 hover:bg-muted/30'
        }`}
      style={{ backgroundColor: booking?.color }}
    >
      {showHourLabel ? (
        <div className="w-16 sm:w-20 text-sm font-medium">
          {formatHour(hour)}
        </div>
      ) : (
        <div className="w-16 sm:w-20"></div>
      )}

      {booking ? (
        <div className="flex items-center gap-3 flex-1">
          {isStartOfBooking && (
            <>
              <Avatar
                className="w-8 h-8 ring-2 ring-white/20"
                style={{
                  borderColor: booking.memberRingColor || 'hsl(var(--muted))',
                  boxShadow: `0 0 0 2px ${booking.memberRingColor || 'hsl(var(--muted))'}`
                }}
              >
                <AvatarImage
                  src={`${S3_URL}/${booking.memberPhoto}`}
                  alt={booking.memberName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/20 text-white font-semibold text-xs">
                  {getFallback(booking.memberName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                  onClick={handleProjectClick}
                >
                  <div className="font-medium text-sm truncate">
                    {booking.projectName}
                    {booking.eventName && (
                      <span className="ml-1 text-xs opacity-90 font-semibold">
                        • {booking.eventName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-90 truncate">
                    {booking.memberName} • {booking.newRole} • {formatTimeRange()}
                    {booking.location && ` • ${booking.location}`}
                  </div>
                  {booking.instructions && (
                    <div className="text-xs opacity-80 truncate mt-1">
                      {booking.instructions}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {!isStartOfBooking && (
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
              onClick={handleProjectClick}
            >
              <Avatar
                className="w-8 h-8 ring-2 ring-white/20 flex-shrink-0"
                style={{
                  borderColor: booking.memberRingColor || 'hsl(var(--muted))',
                  boxShadow: `0 0 0 2px ${booking.memberRingColor || 'hsl(var(--muted))'}`
                }}
              >
                <AvatarImage
                  src={`${S3_URL}/${booking.memberPhoto}`}
                  alt={booking.memberName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/20 text-white font-semibold text-xs">
                  {getFallback(booking.memberName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm opacity-75 truncate">
                ↳ {booking.projectName} continues... • {booking.newRole}
                {booking.eventName && ` • ${booking.eventName}`}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 text-sm text-muted-foreground">
          Available
        </div>
      )}

      {booking && !isOtherEvent && (
        <BookingDetailsDialog
          booking={booking}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          formatHour={formatHour}
        />
      )}
    </div>
  );
}