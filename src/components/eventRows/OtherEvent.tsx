import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { BusyEventTooltipContent } from "./BusyEventTooltipContent";

interface OtherEventProps {
  event: any;
  startPercent: number;
  widthPercent: number;
  formatTime: (hour: number) => string;
}

export const OtherEvent = ({ event, startPercent, widthPercent, formatTime }: OtherEventProps) => {
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
          <BusyEventTooltipContent event={event} formatTime={formatTime} type="other" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};