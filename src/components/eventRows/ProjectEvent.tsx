import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar, Clock, MapPin, User, Info } from "lucide-react";
import { format } from "date-fns";
import { TeamMemberEvent } from "../TeamMembers";
import { getTextColorBasedOnBackground } from "@/helper/helper";
interface ProjectEventProps {
  event: TeamMemberEvent;
  startPercent: number;
  widthPercent: number;
  isInactive: boolean;
  handleEventClick: (event: TeamMemberEvent) => void;
  formatTime: (hour: number) => string;
}

export const ProjectEvent = ({ 
  event, 
  startPercent, 
  widthPercent, 
  isInactive, 
  handleEventClick,
  formatTime 
}: ProjectEventProps) => {
  const textColor = getTextColorBasedOnBackground(event.project.color);
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className="absolute my-2 h-10 rounded-md flex items-center px-2 text-white font-medium text-xs shadow hover:shadow-lg cursor-pointer
              transition-all duration-500 ease-out opacity-0 translate-x-[-10px] animate-fadeInSlideIn"
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
              animationFillMode: 'forwards',
              animationDuration: '0.5s',
              backgroundColor: isInactive
                ? `${event.project.color}80`
                : event.project.color,
              color: textColor
            }}
            onClick={() => handleEventClick(event)}
          >
            <span className="truncate">{event.project.name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-[#101319] text-white text-sm rounded-md shadow-lg px-4 py-3 max-w-xs border border-white/20"
          side="top"
          sideOffset={8}
        >
          <ProjectEventTooltipContent event={event} formatTime={formatTime} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Separate tooltip content component for project events
const ProjectEventTooltipContent = ({ event, formatTime }: { event: TeamMemberEvent; formatTime: (hour: number) => string }) => {
  return (
    <div className="space-y-2">
      {/* Combined title */}
      <div className="font-semibold text-base">
        {event.project.name}
        {event.name && (
          <span className="font-normal text-gray-300 ml-1">• {event.name}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-300">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span>{format(new Date(event.date), "do MMM, yyyy")}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-300">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>{formatTime(event.startHour)} – {formatTime(event.endHour)}</span>
      </div>

      {/* Role Information */}
      {event.assignment.role && (
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <User className="w-4 h-4" />
          <span>Role: {event.assignment.role}</span>
        </div>
      )}

      {/* Instructions */}
      {/* {event.assignment.instructions && (
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <Info className="w-4 h-4" />
          <span>Instructions: {event.assignment.instructions}</span>
        </div>
      )} */}

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <MapPin className="w-4 h-4" />
          <span> {event.location}</span>
        </div>
      )}

      {/* Client Information */}
      {event.project.client && (
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <User className="w-4 h-4" />
          <span>Client: {event.project.client.name || event.project.client}</span>
        </div>
      )}
    </div>
  );
};