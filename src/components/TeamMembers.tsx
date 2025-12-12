import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { differenceInDays, format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { Calendar, Clock, Info, Search, Palette, User, MapPin, Ban, Laptop, Settings, Settings2, MonitorCog, Star, Folder } from "lucide-react";
import { Input } from "./ui/input";
import { TimeView } from "./GanttChart";
import { monthNames } from "@/constant/constant";
import { Project, updateMemberRingColor } from "@/api/member";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { RingColorDialog } from "./modals/RingColorDialog";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TimeViewToggle } from "./TimeViewToggle";
import { useAuth } from "@/context/AuthContext";
import { getFallback, getTextColorBasedOnBackground } from "@/helper/helper";
import { DayCalendar } from "./DayCalendar";

const S3_URL = import.meta.env.VITE_S3_BASE_URL

export interface TeamMember {
  isAdmin: boolean;
  role: any;
  profilePhoto?: any;
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  events?: TeamMemberEvent[]; // Changed from projects to events
  ringColor?: string;
  active: boolean;
  roleId: string;
  countryCode?: string;
  isInvited: boolean;
  isOwner: boolean;
  invitation: string;
}

export interface TeamMemberEvent {
  isOther: any;
  eventId: string;
  name:string;
  date: string;
  startHour: number;
  endHour: number;
  location: string;
  reminders: {
    weekBefore: boolean;
    dayBefore: boolean;
  };
  project: {
    id: string;
    name: string;
    color: string;
    description: string;
    client: any;
    brief: any[];
    logistics: any[];
  };
  assignment: {
    id: string;
    role: string;
    roleId: string;
    instructions: string;
    googleEventId: string;
  };
}

interface TeamMembersProps {
  refreshMembers: () => void;
  teamMembers: TeamMember[];
  timeView: any;
  selectedDay?: number;
  setSelectedDay: (day: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedWeek?: number;
  setSelectedWeek?: (week: number) => void;
  setSelectedMember: (member: TeamMember) => void;
  setShowAddTeamMember?: (open: boolean) => void;
  onMonthChange?: (month: number, year: number) => void;
  onWeekChange?: (week: number, year: number) => void;
  loading: boolean;
  setTimeView: (view: any) => void;
  setIsDayClick: (dayClick: boolean) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSelectedEvent: (eventId: string | null) => void;
  setSearchQuery: (query: string) => void;
  searchQuery: string,
  setIsProjectClick: (projectClick: boolean) => void;
  onRingColorUpdate?: (bool: boolean) => void;
  onDayChange?: (day: number, month: number, year: number) => void;
}

export function TeamMembers({
  refreshMembers,
  teamMembers,
  timeView,
  selectedDay,
  setSelectedDay,
  setSelectedMember,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedWeek,
  setSelectedWeek,
  setShowAddTeamMember,
  onMonthChange,
  onWeekChange,
  loading,
  setTimeView,
  setIsDayClick,
  setSelectedProject,
  setSelectedEvent,
  setSearchQuery,
  searchQuery,
  setIsProjectClick,
  onRingColorUpdate,
  onDayChange
}: TeamMembersProps) {
  const minColumnWidth = timeView === "week" ? "40px" : "8px";

  const [memberRingColors, setMemberRingColors] = useState<Record<string, string>>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const {
    refresh
  } = useTeamMembers({
    selectedMonth,
    selectedYear,
    selectedWeek,
    timeView,
  });
  const { user } = useAuth();

  // Filter team members based on user admin status
  const getFilteredTeamMembers = () => {
    // If user is admin, show all team members
    if (user?.data?.isAdmin) {
      return teamMembers;
    }

    // If user is not admin, only show themselves
    return teamMembers.filter(member => member.id === user?.data?.id);
  };

  const filteredTeamMembers = getFilteredTeamMembers();

  // Sort team members: active first, then inactive
  const sortedTeamMembers = [...filteredTeamMembers].sort((a, b) => {
    if (a.active && !b.active) return -1; // a (active) comes before b (inactive)
    if (!a.active && b.active) return 1;  // b (active) comes before a (inactive)
    return 0;
  });

  useEffect(() => {
    const initialColors: Record<string, string> = {};
    teamMembers.forEach(member => {
      if (member.ringColor) {
        initialColors[member.id] = member.ringColor;
      }
    });
    setMemberRingColors(initialColors);
  }, [teamMembers]);

  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedMemberForColor, setSelectedMemberForColor] = useState<TeamMember | null>(null);
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);

  // Handle opening the color dialog
  const handleOpenColorDialog = (member: TeamMember, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMemberForColor(member);
    setColorDialogOpen(true);
  };

  // Handle color change with API call
  const handleRingColorChange = async (memberId: string, color: string) => {
    setIsUpdatingColor(true);
    try {
      await updateMemberRingColor(memberId, color);
      setMemberRingColors(prev => ({ ...prev, [memberId]: color }));
      onRingColorUpdate(true);
    } catch (error) {
      console.error('Failed to update ring color:', error);
      throw error;
    } finally {
      setIsUpdatingColor(false);
    }
  };

  // Helper function to get date from week number
  function getDateFromWeek(year: number, week: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = simple;

    if (dayOfWeek <= 4) {
      isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }

    return isoWeekStart;
  }

  // Get event position in the timeline
  const getEventPosition = (event: TeamMemberEvent, totalPeriods: number) => {
    if (!event.date) {
      return { startPercent: 0, widthPercent: 0 };
    }

    const periods = getPeriods();

    if (periods.length === 0) {
      return { startPercent: 0, widthPercent: 0 };
    }

    const eventDate = new Date(event.date + 'T00:00:00');

    // Find the index of the event date in the periods
    const eventIndex = periods.findIndex(period => {
      const periodDate = new Date(period);
      periodDate.setHours(0, 0, 0, 0);
      return periodDate.getTime() === eventDate.getTime();
    });

    if (eventIndex === -1) {
      return { startPercent: 0, widthPercent: 0 };
    }

    // Events are single day, so they take one column width
    const startPercent = (eventIndex / totalPeriods) * 100;
    const widthPercent = (1 / totalPeriods) * 100;

    return {
      startPercent: Math.max(0, Math.min(100, startPercent)),
      widthPercent: Math.max(0, Math.min(100 - startPercent, widthPercent)),
    };
  };

  // Calculate periods based on timeView
  const getPeriods = () => {
    if (timeView === "week") {
      const weekStartDate = getDateFromWeek(selectedYear, selectedWeek);
      const start = startOfWeek(weekStartDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else if (timeView === "day") {
      // For day view, return just the selected day
      const dayDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      return [dayDate];
    } else {
      const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
      return eachDayOfInterval({ start, end });
    }
  };

  const periods = getPeriods();

  const getEventRows = (events: TeamMemberEvent[]): TeamMemberEvent[][] => {
    if (!events || events.length === 0) return [];

    // Group events by date
    const eventsByDate = new Map<string, TeamMemberEvent[]>();

    events.forEach(event => {
      if (!eventsByDate.has(event.date)) {
        eventsByDate.set(event.date, []);
      }
      eventsByDate.get(event.date)!.push(event);
    });

    // Get max number of events on any single day
    let maxEventsPerDay = 0;
    eventsByDate.forEach(dateEvents => {
      maxEventsPerDay = Math.max(maxEventsPerDay, dateEvents.length);
    });

    // Create rows based on max events per day
    const rows: TeamMemberEvent[][] = Array.from({ length: maxEventsPerDay }, () => []);

    // Distribute events into rows
    eventsByDate.forEach((dateEvents, date) => {
      // Sort events for this date by start time
      const sortedDateEvents = dateEvents.sort((a, b) => a.startHour - b.startHour);

      sortedDateEvents.forEach((event, index) => {
        // Place event in corresponding row (0-based index)
        if (index < rows.length) {
          rows[index].push(event);
        }
      });
    });

    return rows.filter(row => row.length > 0);
  };

  const handlePreviousPeriod = () => {
    if (timeView === "week") {
      let newWeek = selectedWeek - 1;
      let newYear = selectedYear;
      let newMonth = selectedMonth;

      if (newWeek === 0) {
        newWeek = 52;
        newYear = selectedYear - 1;
      }

      const firstDayOfWeek = getFirstDayOfWeek(newYear, newWeek);
      newMonth = firstDayOfWeek.getMonth() + 1;

      setSelectedWeek(newWeek);
      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      onWeekChange?.(newWeek, newYear);
    } else if (timeView === "day") {
      const currentDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      const previousDate = new Date(currentDate);
      previousDate.setDate(currentDate.getDate() - 1);

      const newYear = previousDate.getFullYear();
      const newMonth = previousDate.getMonth() + 1; // Convert to 1-indexed month
      const newDay = previousDate.getDate();

      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      setSelectedDay(newDay);
      onDayChange?.(newDay, newMonth, newYear);
    } else {
      // Month view
      let newMonth = selectedMonth - 1;
      let newYear = selectedYear;

      if (newMonth === 0) {
        newMonth = 12;
        newYear = selectedYear - 1;
      }

      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
      onMonthChange?.(newMonth, newYear);
    }
    setSelectedProject(null);
    setSelectedEvent(null);
  };

  const handleNextPeriod = () => {
    if (timeView === "week") {
      let newWeek = selectedWeek + 1;
      let newYear = selectedYear;
      let newMonth = selectedMonth;

      if (newWeek > 52) {
        newWeek = 1;
        newYear = selectedYear + 1;
      }
      const firstDayOfWeek = getFirstDayOfWeek(newYear, newWeek);
      newMonth = firstDayOfWeek.getMonth() + 1;

      setSelectedWeek(newWeek);
      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      onWeekChange?.(newWeek, newYear);
    } else if (timeView === "day") {
      const currentDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);

      const newYear = nextDate.getFullYear();
      const newMonth = nextDate.getMonth() + 1; // Convert to 1-indexed month
      const newDay = nextDate.getDate();

      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      setSelectedDay(newDay);
      onDayChange?.(newDay, newMonth, newYear);
    } else {
      // Month view
      let newMonth = selectedMonth + 1;
      let newYear = selectedYear;

      if (newMonth > 12) {
        newMonth = 1;
        newYear = selectedYear + 1;
      }

      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
      onMonthChange?.(newMonth, newYear);
    }
    setSelectedProject(null);
    setSelectedEvent(null);
  };

  const getFirstDayOfWeek = (year, week) => {
    // January 4th is always in week 1 (ISO week date standard)
    const januaryFourth = new Date(year, 0, 4);
    // Get the Monday of the week containing January 4th
    const startOfFirstWeek = new Date(januaryFourth);
    startOfFirstWeek.setDate(januaryFourth.getDate() - (januaryFourth.getDay() || 7) + 1);

    // Calculate the first day of the target week
    const firstDayOfWeek = new Date(startOfFirstWeek);
    firstDayOfWeek.setDate(startOfFirstWeek.getDate() + (week - 1) * 7);

    return firstDayOfWeek;
  };

  const getPeriodTitle = () => {
    if (timeView === "week") {
      const weekStartDate = getDateFromWeek(selectedYear, selectedWeek);
      const start = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday start for UK
      const end = endOfWeek(weekStartDate, { weekStartsOn: 1 });

      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "do")} - ${format(end, "do MMM yyyy")}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, "do MMM")} - ${format(end, "do MMM yyyy")}`;
      } else {
        return `${format(start, "do MMM yyyy")} - ${format(end, "do MMM yyyy")}`;
      }
    } else if (timeView === "day") {
      // Validate day parameters before creating date
      const day = selectedDay || new Date().getDate(); // Fallback to current day
      const month = selectedMonth || new Date().getMonth() + 1; // Fallback to current month
      const year = selectedYear || new Date().getFullYear(); // Fallback to current year

      // Create a valid date object
      const dayDate = new Date(year, month - 1, day);

      // Check if the date is valid
      if (isNaN(dayDate.getTime())) {
        // Fallback to current date if invalid
        const currentDate = new Date();
        return format(currentDate, "EEEE, do MMMM yyyy");
      }

      return format(dayDate, "EEEE, do MMMM yyyy");
    } else {
      // Month view
      return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
  };

  const handleDayClick = (day: Date) => {
    const clickedDate = day.getDate();
    setIsDayClick(true);
    setSelectedDay(clickedDate);
    setSelectedProject(null);
    setSelectedEvent(null);
  };

  const isDaySelected = (day: Date) => {
    return selectedDay === day.getDate();
  };

  // Calculate timeline height based on number of event rows needed
  const getTimelineHeight = (member: TeamMember) => {
    if (!member.events || member.events.length === 0) {
      return 'h-14'; // Default height for no events
    }

    const eventRows = getEventRows(member.events);
    const rowCount = eventRows.length;

    // Base height + additional height for extra rows
    if (rowCount === 1) return 'h-14'; // Single row
    if (rowCount === 2) return 'h-24'; // Two rows
    if (rowCount === 3) return 'h-[8.5rem]'; // Three rows
    return 'h-36'; // Four or more rows
  };

  const periodNavigation = (
    <div className="items-center gap-5">
      <div className="flex flex-col md:flex-row justify-end items-center gap-5">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search team members, roles & events"
            className="pl-10 w-full rounded-full h-12"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full justify-between lg:w-fit">
          <h2
            className={`text-md font-semibold text-foreground text-center ${timeView === "month" ? "min-w-[150px]" : "min-w-[200px]"
              }`}
          >
            {getPeriodTitle()}
          </h2>
          <div className="gap-2 flex">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPeriod}
              className="h-8 w-8 p-0 rounded-md"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPeriod}
              className="h-8 w-8 p-0 rounded-md"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
        <TimeViewToggle
          timeView={timeView}
          setTimeView={setTimeView}
          setSelectedDay={setSelectedDay}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
      </div>
    </div>
  );

  // Render team member list component (used in both day and week/month views)
  const renderTeamMemberList = () => (
    <div className="w-[130px] md:w-[180px] shrink-0 space-y-3 mr-3">
      {/* Empty space for header alignment */}
      <div className="h-12"></div>

      {loading ? (
        <div className="space-y-3 mt-2">
          {Array.from({ length: 1 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-md h-14"
            >
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedTeamMembers.length ? sortedTeamMembers.map((member, index) => {
        const eventRows = getEventRows(member.events || []);
        const timelineHeight = getTimelineHeight(member);
        const isInactive = !member.active;
        const isLoggedInUser = member.id === user.data.id;
        const isAdmin = member.isAdmin === true;

        return (
          <div
            key={member.id}
            className={`${timelineHeight} ${isInactive ? 'opacity-50 grayscale' : ''}`}
          >
            <div className={`flex gap-2 cursor-pointer p-2 rounded-sm transition-colors max-h-16 ${isInactive
              ? 'bg-muted/30 hover:bg-muted/40 border border-dashed border-muted-foreground/30'
              : isLoggedInUser
                ? 'border'
                : 'hover:bg-muted/50 hover:text-studio-gold'
              }`}>
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (user?.data?.id === member.id || user.data.isAdmin) {
                          handleOpenColorDialog(member, e);
                        }
                      }}
                    >
                      <Avatar
                        className={`w-9 h-9 ring-[2px] transition-all duration-200 ${isInactive ? 'ring-muted-foreground/30' : ''
                          }`}
                        style={{
                          borderColor: isInactive ? 'hsl(var(--muted-foreground) / 0.3)' : member.ringColor || 'hsl(var(--muted))',
                          boxShadow: isInactive
                            ? '0 0 0 2px hsl(var(--muted-foreground) / 0.3)'
                            : `0 0 0 2px ${member.ringColor || 'hsl(var(--muted))'}`
                        }}
                      >
                        <AvatarImage
                          src={`${S3_URL}/${member.profilePhoto}`}
                          alt={member.name}
                          className={isInactive ? 'grayscale object-cover' : 'object-cover'}
                        />
                        <AvatarFallback className={`text-sm font-semibold ${isInactive
                          ? 'bg-muted-foreground/20 text-muted-foreground'
                          : 'bg-studio-gold text-studio-dark'
                          }`}>
                          {getFallback(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOwner && (
                        <div className="absolute -bottom-1 -right-1 bg-studio-gold text-primary-foreground rounded-full p-0.5">
                          <Laptop className="w-3 h-3" />
                        </div>
                      )}

                      {/* Inactive Badge */}
                      {isInactive && !member.isOwner && (
                        <div className="absolute -bottom-1 -right-1 bg-muted-foreground/70 text-white rounded-full p-0.5">
                          <Ban className="w-3 h-3" />
                        </div>
                      )}

                      {/* Admin Badge */}
                      {isAdmin && !isInactive && !member.isOwner && (
                        <div className="absolute -bottom-1 -right-1 bg-studio-gold text-primary-foreground rounded-full p-0.5">
                          <Laptop className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isInactive
                        ? 'Inactive member - Click to set ring color'
                        : isAdmin
                          ? 'Admin - Click to set ring color'
                          : 'Click to set ring color'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className="min-w-0 flex-1"
                onClick={() => setSelectedMember(member)}
              >
                <h3 className={`font-medium transition-colors text-sm truncate ${isInactive ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                  {member.name}
                  {isInactive && (
                    <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </h3>
                <p className={`text-xs truncate ${isInactive ? 'text-muted-foreground/70' : 'text-muted-foreground'
                  }`}>
                  {member.role}
                </p>
              </div>
            </div>
          </div>
        );
      }) : (

        sortedTeamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-1 text-center mt-2">
            <div
              className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mb-2 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setShowAddTeamMember?.(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No Team Members</h3>
            <p className="text-muted-foreground text-xs max-w-xs">
              Add your first team member to organise events.
            </p>
          </div>
        ) : <></>)}
    </div>
  );

  // Render day view - show team member list alongside DayCalendar
  if (timeView === "day") {
    return (
      <div className="space-y-4">
        {/* Period Navigation */}
        {periodNavigation}

        {/* Container with team member list and day calendar */}
        <div className="flex">
          {/* Team Member List */}
          {renderTeamMemberList()}

          {/* Day Calendar */}
          <div className="flex-1">
            <DayCalendar
              date={`${monthNames[selectedMonth - 1]} ${selectedDay}, ${selectedYear}`}
              day={selectedDay}
              setSelectedDay={setSelectedDay}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              teamMembers={teamMembers}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              setSelectedProject={setSelectedProject}
            />
          </div>
        </div>

        <RingColorDialog
          isOpen={colorDialogOpen}
          onClose={() => setColorDialogOpen(false)}
          member={selectedMemberForColor}
          onColorChange={handleRingColorChange}
          isUpdating={isUpdatingColor}
          refreshMembers={refreshMembers}
        />
      </div>
    );
  }

  // Render week/month view - show team member list with grids
  return (
    <div className="space-y-4">
      {/* Period Navigation */}
      {periodNavigation}

      {/* Container with fixed member column and scrollable timeline */}
      <div className="flex">
        {/* Team Member List */}
        {renderTeamMemberList()}

        {/* Scrollable Timeline Area */}
        <div className="flex-1 max-w-[100vw] overflow-x-auto">
          <div className="min-w-max">
            {/* Calendar Headers */}
            <div
              className="grid mb-4"
              style={{
                gridTemplateColumns: `repeat(${periods.length}, minmax(${minColumnWidth}, 1fr))`
              }}
            >
              {periods.map((day, index) => {
                const dayOfWeek = format(day, 'EEE');
                const dayNumber = day.getDate();
                const isSelected = isDaySelected(day);
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <div key={index} className="text-center">
                    <div
                      className={`text-[10px] p-1 rounded border transition-colors cursor-pointer ${isSelected
                        ? 'bg-studio-gold text-studio-dark border-studio-gold font-bold'
                        : isToday
                          ? 'border-studio-gold bg-muted/30 text-studio-gold'
                          : 'text-muted-foreground bg-muted/30 border-border/20 hover:bg-muted/50'
                        }`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="font-medium">{dayOfWeek}</div>
                      <div className="font-semibold text-xs">{dayNumber}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Team Member Timelines */}
            <div className="space-y-3">
              {sortedTeamMembers.length === 0 ? (
                <>
                  {Array.from({ length: 1 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid rounded overflow-hidden h-14"
                      style={{ gridTemplateColumns: `repeat(${periods.length}, minmax(${minColumnWidth}, 1fr))` }}
                    >
                      {periods.map((_, periodIndex) => (
                        <div
                          key={`grid-empty-${periodIndex}`}
                          className="bg-muted/20 border-r border-border/30 last:border-r-0 relative"
                        >
                          {periodIndex < periods.length - 1 && (
                            <div className="absolute top-0 bottom-0 right-0 w-px bg-border/30" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              ) : (
                sortedTeamMembers.map(member => {
                  const eventRows = getEventRows(member.events || []);
                  const timelineHeight = getTimelineHeight(member);
                  const isInactive = !member.active;

                  return (
                    <div key={member.id} className={`relative ${timelineHeight}`}>
                      <div
                        className="grid rounded overflow-hidden relative h-full"
                        style={{
                          gridTemplateColumns: `repeat(${periods.length}, minmax(${minColumnWidth}, 1fr))`
                        }}
                      >
                        {/* Grid cells */}
                        {periods.map((_, index) => (
                          <div
                            key={`cell-${member.id}-${index}`}
                            className="bg-muted/20 border-r border-border/30 last:border-r-0 relative"
                          >
                            {index < periods.length - 1 && (
                              <div className="absolute top-0 bottom-0 right-0 w-px bg-border/30" />
                            )}
                          </div>
                        ))}

                        {/* Events overlay - render each row */}
                        <div className="absolute inset-0">
                          {eventRows.length > 0 ? (
                            eventRows.map((row, rowIndex) => (
                              <div key={rowIndex} className="absolute inset-x-0" style={{
                                top: `${rowIndex * 2.5}rem`,
                              }}>
                                {row.map((event) => {
                                  const { startPercent, widthPercent } = getEventPosition(event, periods.length);
                                  const isOtherEvent = event.isOther;

                                  // For other company events
                                  if (isOtherEvent) {
                                    return (
                                      <TooltipProvider key={event.eventId}>
                                        <Tooltip delayDuration={0}>
                                          <TooltipTrigger asChild>
                                            <div
                                              className={`absolute my-2 h-10 rounded-md flex items-center justify-center px-2 text-gray-400 font-medium text-[0.7rem] cursor-default
                        border border-dashed border-gray-500/50 bg-gray-800/30 transition-all duration-500 ease-out opacity-0 translate-x-[-10px] animate-fadeInSlideIn
                      `}
                                              style={{
                                                left: `${startPercent}%`,
                                                width: `${widthPercent}%`,
                                              }}
                                            >
                                              <span className="opacity-90">Private</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            className="bg-[#101319] text-white text-sm rounded-md shadow-lg px-4 py-3 max-w-xs border border-white/20"
                                            side="top"
                                            sideOffset={8}
                                          >
                                            <div className="space-y-2">

                                              {/* Date - Clear */}
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                  {format(new Date(event.date), "do MMM, yyyy")}
                                                </span>
                                              </div>

                                              {/* Event Time - Clear */}
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                  Time: {event.startHour}:00 – {event.endHour}:00
                                                </span>
                                              </div>



                                              <div className="pt-2 border-t border-white/10">
                                                <p className="text-xs text-gray-400 flex items-center">
                                                  <Info className="w-3 h-3 mr-1" />
                                                  Details are hidden for privacy reasons.
                                                </p>
                                              </div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  }

                                  // For regular events (same company)
                                  return (
                                    <TooltipProvider key={event.eventId}>
                                      <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                          <div
                                            className={`absolute my-2 h-10 rounded-md flex items-center px-2 text-white font-medium text-xs shadow hover:shadow-lg cursor-pointer
                      transition-all duration-500 ease-out opacity-0 translate-x-[-10px] animate-fadeInSlideIn
                    `}
                                            style={{
                                              left: `${startPercent}%`,
                                              width: `${widthPercent}%`,
                                              animationFillMode: 'forwards',
                                              animationDuration: '0.5s',
                                              backgroundColor: isInactive
                                                ? `${event.project.color}80`
                                                : event.project.color,
                                              color: getTextColorBasedOnBackground(event.project.color)
                                            }}
                                            onClick={() => { setSelectedProject(event.project.id); setSelectedEvent(event.eventId); setIsProjectClick(true); }}
                                          >
                                            <span className="truncate">{event.project.name}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="bg-[#101319] text-white text-sm rounded-md shadow-lg px-4 py-3 max-w-xs border border-white/20"
                                          side="top"
                                          sideOffset={8}
                                        >
                                          <div className="space-y-2">
                                            {/* Combined title */}
                                            <div className="font-semibold text-base">
                                              {event.project.name}
                                              {event.name && (
                                                <span className="font-normal text-gray-300 ml-1">• {event.name}</span>
                                              )}
                                            </div>

                                            {/* Rest of the content remains the same */}
                                            <div className="flex items-center gap-3 text-xs text-gray-300">
                                              <Calendar className="w-4 h-4 flex-shrink-0" />
                                              <span>{format(new Date(event.date), "do MMM, yyyy")}</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-300">
                                              <Clock className="w-4 h-4 flex-shrink-0" />
                                              <span>{event.startHour}:00 – {event.endHour}:00</span>
                                            </div>

                                            {/* Role Information */}
                                            {event.assignment.role && (
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <User className="w-4 h-4" />
                                                <span>Role: {event.assignment.role}</span>
                                              </div>
                                            )}

                                            {/* Instructions */}
                                            {event.assignment.instructions && (
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <Info className="w-4 h-4" />
                                                <span>Instructions: {event.assignment.instructions}</span>
                                              </div>
                                            )}

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
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })}
                              </div>
                            ))
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {/* Empty state */}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <RingColorDialog
        isOpen={colorDialogOpen}
        onClose={() => setColorDialogOpen(false)}
        member={selectedMemberForColor}
        onColorChange={handleRingColorChange}
        isUpdating={isUpdatingColor}
        refreshMembers={refreshMembers}
      />
    </div>
  );
}