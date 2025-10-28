import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { differenceInDays, format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { Calendar, Clock, Info, Search, Palette, User, MapPin, Ban } from "lucide-react";
import { Input } from "./ui/input";
import { TimeView } from "./GanttChart";
import { monthNames } from "@/constant/constant";
import { Project, updateMemberRingColor } from "@/api/member";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { RingColorDialog } from "./modals/RingColorDialog";
import { useTeamMembers } from "@/hooks/useTeamMembers";

const S3_URL = import.meta.env.VITE_S3_BASE_URL

export interface TeamMember {
  role: any;
  profilePhoto?: any;
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  projects?: Project[];
  ringColor?: string;
  active: boolean;
  roleId: string;
  countryCode?:string;
}

interface TeamMembersProps {
  teamMembers: TeamMember[];
  timeView: TimeView;
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
  setTimeView: (view: TimeView) => void;
  setIsDayClick: (dayClick: boolean) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;
  searchQuery: string,
  setIsProjectClick: (projectClick: boolean) => void;
  onRingColorUpdate?: (bool: boolean) => void;
}

export function TeamMembers({
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
  setSearchQuery,
  searchQuery,
  setIsProjectClick,
  onRingColorUpdate,
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

  // Sort team members: active first, then inactive
  const sortedTeamMembers = [...teamMembers].sort((a, b) => {
    if (a.active && !b.active) return -1; // a (active) comes before b (inactive)
    if (!a.active && b.active) return 1;  // b (active) comes before a (inactive)
    return 0; // keep original order for same status
  });

  // Initialize ring colors from teamMembers data
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

  // Helper function to get current week number
  function getCurrentWeekNumber(): number {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

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

  const getProjectPosition = (project: Project, totalPeriods: number) => {
    if (!project.startDate || !project.endDate) {
      return { startPercent: 0, widthPercent: 0 };
    }

    const periods = getPeriods();

    if (periods.length === 0) {
      return { startPercent: 0, widthPercent: 0 };
    }

    const visibleStart = periods[0];
    const visibleEnd = periods[periods.length - 1];

    const projectStart = new Date(project.startDate + 'T00:00:00');
    const projectEnd = new Date(project.endDate + 'T00:00:00');

    let firstVisibleDay = -1;
    let lastVisibleDay = -1;

    periods.forEach((day, index) => {
      const currentDay = new Date(day);
      currentDay.setHours(0, 0, 0, 0);

      const isInProjectRange = currentDay >= projectStart && currentDay <= projectEnd;

      if (isInProjectRange && firstVisibleDay === -1) {
        firstVisibleDay = index;
      }
      if (isInProjectRange) {
        lastVisibleDay = index;
      }
    });

    if (firstVisibleDay === -1 || lastVisibleDay === -1) {
      return { startPercent: 0, widthPercent: 0 };
    }

    const startPercent = (firstVisibleDay / totalPeriods) * 100;
    const widthPercent = ((lastVisibleDay - firstVisibleDay + 1) / totalPeriods) * 100;

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
    } else {
      const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
      return eachDayOfInterval({ start, end });
    }
  };

  const periods = getPeriods();

  // Detect overlapping projects and calculate required rows
  const getProjectRows = (projects: Project[]): Project[][] => {
    if (!projects.length) return [];

    const rows: Project[][] = [[]];

    // Sort projects by start date
    const sortedProjects = [...projects].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    sortedProjects.forEach(project => {
      let placed = false;

      // Try to place project in existing rows
      for (const row of rows) {
        const lastProjectInRow = row[row.length - 1];

        if (!lastProjectInRow ||
          new Date(project.startDate) > new Date(lastProjectInRow.endDate)) {
          row.push(project);
          placed = true;
          break;
        }
      }

      // If couldn't place in existing rows, create new row
      if (!placed) {
        rows.push([project]);
      }
    });

    return rows;
  };

  const handlePreviousPeriod = () => {
    if (timeView === "week") {
      let newWeek = selectedWeek - 1;
      let newYear = selectedYear;

      if (newWeek === 0) {
        newWeek = 52;
        newYear = selectedYear - 1;
      }

      setSelectedWeek(newWeek);
      setSelectedYear(newYear);
      onWeekChange?.(newWeek, newYear);
    } else {
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
  };

  const handleNextPeriod = () => {
    if (timeView === "week") {
      let newWeek = selectedWeek + 1;
      let newYear = selectedYear;

      if (newWeek > 52) {
        newWeek = 1;
        newYear = selectedYear + 1;
      }

      setSelectedWeek(newWeek);
      setSelectedYear(newYear);
      onWeekChange?.(newWeek, newYear);
    } else {
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
  };

  const getPeriodTitle = () => {
    if (timeView === "week") {
      const weekStartDate = getDateFromWeek(selectedYear, selectedWeek);
      const start = startOfWeek(weekStartDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekStartDate, { weekStartsOn: 1 });

      if (start.getMonth() === end.getMonth()) {
        return `Week ${selectedWeek}, ${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
      } else if (start.getFullYear() === end.getFullYear()) {
        return `Week ${selectedWeek}, ${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      } else {
        return `Week ${selectedWeek}, ${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
      }
    } else {
      return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
  };

  const handleDayClick = (day: Date) => {
    const clickedDate = day.getDate();
    setIsDayClick(true);
    setSelectedDay(clickedDate);
    setSelectedProject(null);

    if (selectedDay && clickedDate === selectedDay) {
      setSelectedDay(null);
    }
  };

  const isDaySelected = (day: Date) => {
    return selectedDay === day.getDate();
  };

  // Calculate timeline height based on number of project rows needed
  const getTimelineHeight = (member: TeamMember) => {
    if (!member.projects || member.projects.length === 0) {
      return 'h-14'; // Default height for no projects
    }

    const projectRows = getProjectRows(member.projects);
    const rowCount = projectRows.length;

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
            placeholder="Search team members, roles, projects"
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
        <div className="w-full border border-gray-700 rounded-full bg-muted sm:w-fit">
          <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1 border border-border shadow-sm relative">
            <div
              className={`
              absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out
              ${timeView === 'week' ? 'left-1' : 'left-1 translate-x-full'}
              w-[calc(50%-4px)] h-[calc(100%-8px)] 
            `}
            />

            {(['week', 'month'] as TimeView[]).map((view) => (
              <Button
                key={view}
                onClick={() => setTimeView(view)}
                size="sm"
                className={`
                relative capitalize px-4 py-1.5 text-sm rounded-full transition-all duration-300
                hover:bg-transparent
                ${timeView === view
                    ? 'text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }
              `}
                variant="ghost"
              >
                {view}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Period Navigation */}
      {periodNavigation}

      {/* Container with fixed member column and scrollable timeline */}
      <div className="flex">
        {/* Fixed Team Member Column */}
        <div className="w-[130px] md:w-[180px] shrink-0 space-y-3 mr-3">
          {/* Empty space for header alignment */}
          <div className="h-12"></div>

          {loading ? (
            <div className="space-y-3 mt-2">
              {Array.from({ length: 2 }).map((_, index) => (
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
          ) : sortedTeamMembers.length ? sortedTeamMembers.map(member => {
            const projectRows = getProjectRows(member.projects || []);
            const timelineHeight = getTimelineHeight(member);
            const isInactive = !member.active;

            return (
              <div
                key={member.id}
                className={`${timelineHeight} ${isInactive ? 'opacity-50 grayscale' : ''}`}
              >
                <div className={`flex gap-2 cursor-pointer p-2 rounded-md transition-colors max-h-16 ${isInactive
                    ? 'bg-muted/30 hover:bg-muted/40 border border-dashed border-muted-foreground/30'
                    : 'hover:bg-muted/50 hover:text-studio-gold'
                  }`}>
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="cursor-pointer"
                          onClick={(e) => handleOpenColorDialog(member, e)}
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
                              className={isInactive ? 'grayscale' : ''}
                            />
                            <AvatarFallback className={`text-sm font-semibold ${isInactive
                                ? 'bg-muted-foreground/20 text-muted-foreground'
                                : 'bg-studio-gold text-studio-dark'
                              }`}>
                              {member.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isInactive && (
                            <div className="absolute -top-1 -right-1 bg-muted-foreground/70 text-white rounded-full p-0.5">
                              <Ban className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isInactive ? 'Inactive member - Click to set ring color' : 'Click to set ring color'}</p>
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
                  Add your first team member to organize projects.
                </p>
              </div>
            ) : <></>)}
        </div>

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
                  {Array.from({ length: 2 }).map((_, index) => (
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
                  const projectRows = getProjectRows(member.projects || []);
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

                        {/* Projects overlay - render each row */}
                        <div className="absolute inset-0">
                          {projectRows.length > 0 ? (
                            projectRows.map((row, rowIndex) => (
                              <div key={rowIndex} className="absolute inset-x-0" style={{
                                top: `${rowIndex * 2.5}rem`,
                              }}>
                                {row.map((project) => {
                                  const { startPercent, widthPercent } = getProjectPosition(project, periods.length);

                                  return (
                                    <TooltipProvider key={project.id}>
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
                                                ? `${project.color}80` // Add transparency for inactive members
                                                : project.color
                                            }}
                                            onClick={() => { setSelectedProject(project.id); setIsProjectClick(true); }}
                                          >
                                            <span className="truncate">{project.name}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="bg-[#101319] text-white text-sm rounded-md shadow-lg px-4 py-3 max-w-xs border border-white/20"
                                          side="top"
                                          sideOffset={8}
                                        >
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-semibold text-lg">
                                              <Info className="w-5 h-5 text-blue-400" />
                                              <span>{project.name}</span>
                                            </div>

                                            {/* Project Description */}
                                            {project.description && (
                                              <div className="text-xs text-gray-300">
                                                {project.description}
                                              </div>
                                            )}

                                            <div className="flex items-center gap-3 text-xs text-gray-300">
                                              <Calendar className="w-4 h-4" />
                                              <span>
                                                {format(new Date(project.startDate), "MMM d, yyyy")} – {format(new Date(project.endDate), "MMM d, yyyy")}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-300">
                                              <Clock className="w-4 h-4" />
                                              <span>
                                                Duration: {differenceInDays(new Date(project.endDate), new Date(project.startDate)) + 1} days
                                              </span>
                                            </div>

                                            {/* Working Hours */}
                                            {(project.startHour !== undefined || project.endHour !== undefined) && (
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                  Hours: {project.startHour !== undefined ? `${project.startHour}:00` : 'N/A'} – {project.endHour !== undefined ? `${project.endHour}:00` : 'N/A'}
                                                </span>
                                              </div>
                                            )}

                                            {/* Client Information */}
                                            {project.client && (
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <User className="w-4 h-4" />
                                                <span>Client: {project.client.name || project.client}</span>
                                              </div>
                                            )}

                                            {/* Location */}
                                            {project.location && (
                                              <div className="flex items-center gap-3 text-xs text-gray-300">
                                                <MapPin className="w-4 h-4" />
                                                <span>Location: {project.location}</span>
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

              <RingColorDialog
                isOpen={colorDialogOpen}
                onClose={() => setColorDialogOpen(false)}
                member={selectedMemberForColor}
                onColorChange={handleRingColorChange}
                isUpdating={isUpdatingColor}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}