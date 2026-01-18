import { Calendar, Clock, Info } from "lucide-react";
import { format } from "date-fns";

interface BusyEventTooltipContentProps {
  event: any;
  formatTime: (hour: number) => string;
  type: 'google' | 'other';
}

export const BusyEventTooltipContent = ({ event, formatTime, type }: BusyEventTooltipContentProps) => {
  return (
    <div className="space-y-2">
      {/* Date */}
      <div className="flex items-center gap-3 text-xs text-gray-300">
        <Calendar className="w-4 h-4" />
        <span>
          {format(new Date(event.date), "do MMM, yyyy")}
          {event.endDate && ` - ${format(new Date(event.endDate), "do MMM, yyyy")}`}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-3 text-xs text-gray-300">
        <Clock className="w-4 h-4" />
        <span>
          {event.allDay
            ? type === 'google' ? 'All Day' : 'Whole Day'
            : `${formatTime(event.startHour || 0)} – ${formatTime(event.endHour || 0)}`}
        </span>
      </div>

      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-gray-400 flex items-center">
          <Info className="w-3 h-3 mr-1" />
          Details are hidden for privacy reasons.
        </p>
      </div>
    </div>
  );
};