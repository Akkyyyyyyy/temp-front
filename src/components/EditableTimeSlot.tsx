import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BookingDetailsDialog } from './BookingDetailsDialog';
import { EditableBooking } from '@/hooks/useBookingEditor';
import { getFallback } from '@/helper/helper';
import { Lock } from 'lucide-react';

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface EditableTimeSlotProps {
  hour: number;
  booking?: any;
  isStartOfBooking: boolean;
  formatHour: (hour: number) => string;
  showHourLabel?: boolean;
  onProjectClick?: (projectId: string) => void;
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

  const handleProjectClick = () => {
    if (isOtherEvent) return; // Don't allow clicks for other company events
    
    if (booking && onProjectClick) {
      onProjectClick(booking.id);
    }
    setShowDetails(true);
  };

  if (isOtherEvent) {
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
              </div>
              <div className="flex-1 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate text-gray-500">Private Event</div>
                  <div className="text-xs opacity-90 truncate text-gray-500">
                    Busy • {formatHour(booking.startHour)} - {formatHour(booking.endHour)}
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
                  <div className="font-medium text-sm truncate">{booking.projectName} • <span className="text-xs opacity-90 truncate font-semibold">
                      {booking.eventName}
                    </span></div>
                  <div className="text-xs opacity-90 truncate">
                    {booking.memberName} • {booking.newRole} • {formatHour(booking.startHour)} - {formatHour(booking.endHour)}
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