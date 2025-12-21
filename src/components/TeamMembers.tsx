import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useState, useEffect, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { differenceInDays, format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { Calendar, Clock, Info, Search, Palette, User, MapPin, Ban, Laptop, Settings, Settings2, MonitorCog, Star, Folder, Globe, Lock, Shield, Unlock, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { TimeView } from "./GanttChart";
import { monthNames } from "@/constant/constant";
import { Project, updateMemberRingColor } from "@/api/member";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { RingColorDialog } from "./modals/RingColorDialog";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TimeViewToggle } from "./TimeViewToggle";
import { useAuth } from "@/context/AuthContext";
import { formatTime, getFallback, getTextColorBasedOnBackground } from "@/helper/helper";
import { DayCalendar } from "./DayCalendar";
import { GoogleCalendarEvent } from "./eventRows/GoogleCalendarEvent";
import { OtherEvent } from "./eventRows/OtherEvent";
import { ProjectEvent } from "./eventRows/ProjectEvent";
import { lockDate, unlockDate } from "@/api/company";

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
  events?: TeamMemberEvent[];
  googleCalendarEvents?: GoogleCalendarEvent[];
  hasGoogleCalendar?: boolean;
  ringColor?: string;
  active: boolean;
  roleId: string;
  countryCode?: string;
  isInvited: boolean;
  isOwner: boolean;
  invitation: string;
}
export interface LockStatus {
  date: string;
  isLocked: boolean;
  processing?: boolean;
}

export interface GoogleCalendarEvent {
  endDate?: any;
  id: string;
  name: string;
  date: string;
  startHour: number | null;
  startMinute: number | null;
  endHour: number | null;
  endMinute: number | null;
  location: string;
  isGoogleCalendarEvent: true;
  source: 'google_calendar';
  htmlLink: string;
  description: string;
  allDay: boolean;
  organizer?: string;
  attendees?: Array<any>;
  extendedProperties?: any;
  project: null;
  assignment: null;
  reminders: null;
  isOther: false;
}

export interface TeamMemberEvent {
  endDate?: any;
  allDay: any;
  isOther: any;
  eventId: string;
  name: string;
  date: string;
  startHour: number;
  endHour: number;
  location: string;
  reminders: {
    weekBefore: boolean;
    dayBefore: boolean;
  };
  project: {
    endDate: any;
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
  lockedDates: string[];
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
  setIsEventClick: (eventClick: boolean) => void;
}

export function TeamMembers({
  refreshMembers,
  teamMembers,
  lockedDates,
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
  onDayChange,
  setIsEventClick
}: TeamMembersProps) {
  const minColumnWidth = timeView === "week" ? "40px" : "8px";

  const [memberRingColors, setMemberRingColors] = useState<Record<string, string>>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [lockProcessing, setLockProcessing] = useState<Record<string, boolean>>({});
  const {
    refresh
  } = useTeamMembers({
    selectedMonth,
    selectedYear,
    selectedWeek,
    timeView,
  });
  const { user } = useAuth();

  const isDateLocked = useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return lockedDates.includes(dateStr);
  }, [lockedDates]);

  const handleToggleDateLock = async (date: Date, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const companyId = user?.data?.company?.id;
    if (!companyId) {
      console.error("Company not found");
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const isCurrentlyLocked = isDateLocked(date);

    // Set processing state
    setLockProcessing(prev => ({ ...prev, [dateStr]: true }));

    try {
      if (isCurrentlyLocked) {
        // Unlock the date
        const response = await unlockDate({ companyId, date: dateStr });
        if (response.success) {
          // Update local state - you might want to refresh or update lockedDates
          // toast.success(`Date unlocked: ${format(date, 'MMM dd, yyyy')}`);
          // Refresh team members to get updated locked dates
          refreshMembers();
        } else {
          console.error(response.message || "Failed to unlock date");
        }
      } else {
        // Lock the date
        const response = await lockDate({ companyId, date: dateStr });
        if (response.success) {
          // toast.success(`Date locked: ${format(date, 'MMM dd, yyyy')}`);
          // Refresh team members to get updated locked dates
          refreshMembers();
        } else {
          console.error(response.message || "Failed to lock date");
        }
      }
    } catch (error) {
      console.error("Error toggling date lock:", error);
      console.error("Failed to update date lock");
    } finally {
      setLockProcessing(prev => ({ ...prev, [dateStr]: false }));
    }
  };


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

  // Sort team members: logged-in user first, then active, then inactive
  const sortedTeamMembers = [...filteredTeamMembers].sort((a, b) => {
    const isUserA = a.id === user?.data?.id;
    const isUserB = b.id === user?.data?.id;

    // Logged-in user always comes first
    if (isUserA && !isUserB) return -1;
    if (!isUserA && isUserB) return 1;

    // Then sort by active status
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;

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

  // NEW: Get events for each day (handles multi-day events)
  const getEventsForPeriod = (member: TeamMember, periodIndex: number) => {
    const isLoggedInUser = member.id === user?.data?.id;

    // Start with all events
    let eventsToShow = [...(member.events || [])];

    // Filter out isOther events ONLY for logged-in user
    if (isLoggedInUser) {
      eventsToShow = eventsToShow.filter(event => !event.isOther);
    }

    // Combine filtered events with Google Calendar events
    const allEvents: (any)[] = [
      ...eventsToShow,
      ...(member.googleCalendarEvents || [])
    ];

    if (allEvents.length === 0) return [];

    const currentPeriod = periods[periodIndex];
    const periodDate = new Date(currentPeriod);
    periodDate.setHours(0, 0, 0, 0);

    // Find events that occur on this day
    const eventsOnThisDay: (any)[] = [];

    allEvents.forEach(event => {
      const eventStartDate = new Date(event.date + 'T00:00:00');

      // For Google Calendar events, check if they have endDate for multi-day events
      let eventEndDate = eventStartDate;
      if (event.isGoogleCalendarEvent && event.endDate) {
        eventEndDate = new Date(event.endDate + 'T23:59:59');
      }
      // For regular events (not Google Calendar), check if they have endDate too
      if (!event.isGoogleCalendarEvent && event.project?.endDate) {
        eventEndDate = new Date(event.project.endDate + 'T23:59:59');
      }

      // Check if the period date is within the event date range
      if (periodDate >= eventStartDate && periodDate <= eventEndDate) {
        eventsOnThisDay.push({
          ...event,
          periodIndex: periodIndex,
          isFirstDay: periodDate.getTime() === eventStartDate.getTime(),
          isLastDay: periodDate.getTime() === eventEndDate.getTime()
        });
      }
    });

    // Sort events for this day by start time
    return eventsOnThisDay.sort((a, b) => {
      const aStart = 'startHour' in a ? a.startHour : (a.allDay ? -1 : 0);
      const bStart = 'startHour' in b ? b.startHour : (b.allDay ? -1 : 0);
      return aStart - bStart;
    });
  };

  // NEW: Get max events per day across all periods
  const getMaxEventsPerDay = (member: TeamMember) => {
    let maxEvents = 0;

    for (let i = 0; i < periods.length; i++) {
      const eventsOnDay = getEventsForPeriod(member, i);
      maxEvents = Math.max(maxEvents, eventsOnDay.length);
    }

    return maxEvents;
  };

  const getEventRows = (member: TeamMember): any[][] => {
    const isLoggedInUser = member.id === user?.data?.id;

    let eventsToShow = [...(member.events || [])];

    // Hide "isOther" only for logged-in user
    if (isLoggedInUser) {
      eventsToShow = eventsToShow.filter(event => !event.isOther);
    }

    const allEvents: any[] = [
      ...eventsToShow,
      ...(member.googleCalendarEvents || [])
    ];

    if (allEvents.length === 0) return [];

    /**
     * Helper: get event start/end indexes within periods
     */
    const getEventSpanIndexes = (event: any) => {
      const startDate = new Date(event.date + "T00:00:00");

      let endDate = startDate;

      // Determine end date
      if (event.isGoogleCalendarEvent) {
        // Google Calendar events
        if (event.endDate) {
          // IMPORTANT: For Google Calendar all-day events, endDate is EXCLUSIVE
          // Example: Event from Dec 19-24 means Dec 19, 20, 21, 22, 23 (5 days)
          // The endDate "2025-12-24" means the event does NOT include Dec 24
          if (event.allDay) {
            // For all-day events, subtract 1 day to make it inclusive
            endDate = new Date(event.endDate + "T00:00:00");
            endDate.setDate(endDate.getDate() - 1); // Make exclusive end date inclusive
          } else {
            // For timed events, endDate is inclusive
            endDate = new Date(event.endDate + "T23:59:59");
          }
        } else if (event.allDay) {
          // Single day all-day event
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        // Project events - end dates are inclusive
        if (event.endDate) {
          endDate = new Date(event.endDate + "T23:59:59");
        } else if (event.project?.endDate) {
          endDate = new Date(event.project.endDate + "T23:59:59");
        } else {
          // Single day event
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        }
      }

      // Make sure dates are at midnight for comparison
      const startMidnight = new Date(startDate);
      startMidnight.setHours(0, 0, 0, 0);

      const endMidnight = new Date(endDate);
      endMidnight.setHours(0, 0, 0, 0);

      // Find indices in periods array
      let startIndex = -1;
      let endIndex = -1;

      // Find the exact dates in periods
      for (let i = 0; i < periods.length; i++) {
        const periodDate = new Date(periods[i]);
        periodDate.setHours(0, 0, 0, 0);

        if (startIndex === -1 && periodDate.getTime() === startMidnight.getTime()) {
          startIndex = i;
        }
        if (endIndex === -1 && periodDate.getTime() === endMidnight.getTime()) {
          endIndex = i;
        }
        if (startIndex !== -1 && endIndex !== -1) break;
      }

      // CRITICAL FIX: For events that start before our date range
      // If start date is before first period, start at period 0
      const firstPeriodDate = new Date(periods[0]);
      firstPeriodDate.setHours(0, 0, 0, 0);

      const lastPeriodDate = new Date(periods[periods.length - 1]);
      lastPeriodDate.setHours(0, 0, 0, 0);

      // If event starts before our date range, start at first period
      if (startIndex === -1 && startMidnight < firstPeriodDate) {
        startIndex = 0;
      }

      // If event ends after our date range, end at last period
      if (endIndex === -1 && endMidnight > lastPeriodDate) {
        endIndex = periods.length - 1;
      }

      // For events that start within our range but we couldn't find exact match
      if (startIndex === -1) {
        // Find first period that is >= start date
        for (let i = 0; i < periods.length; i++) {
          const periodDate = new Date(periods[i]);
          if (periodDate >= startMidnight) {
            startIndex = Math.max(0, i);
            break;
          }
        }
        // If still not found, use last period
        if (startIndex === -1) startIndex = periods.length - 1;
      }

      if (endIndex === -1) {
        // Find last period that is <= end date
        for (let i = periods.length - 1; i >= 0; i--) {
          const periodDate = new Date(periods[i]);
          if (periodDate <= endMidnight) {
            endIndex = Math.min(periods.length - 1, i);
            break;
          }
        }
        // If still not found, use startIndex
        if (endIndex === -1) endIndex = startIndex;
      }

      // For events that start before and end after our date range
      // We should show them spanning the entire range
      if (startMidnight < firstPeriodDate && endMidnight > lastPeriodDate) {
        startIndex = 0;
        endIndex = periods.length - 1;
      }

      // Ensure start <= end
      if (startIndex > endIndex) {
        [startIndex, endIndex] = [endIndex, startIndex];
      }

      return {
        startIndex: Math.max(0, Math.min(startIndex, periods.length - 1)),
        endIndex: Math.max(0, Math.min(endIndex, periods.length - 1)),
      };
    };

    /**
     * Track which rows are occupied per day
     * dayIndex -> Set<rowIndex>
     */
    const occupiedRowsPerDay = new Map<number, Set<number>>();
    periods.forEach((_, i) => occupiedRowsPerDay.set(i, new Set()));

    const rows: any[][] = [];
    const usedEvents = new Set<string>();

    const getEventKey = (event: any) =>
      event.isGoogleCalendarEvent ? `google-${event.id}` : `event-${event.eventId}`;

    /**
     * Sort events by start date AND duration (longer events first)
     */
    const sortedEvents = [...allEvents].sort((a, b) => {
      const aSpan = getEventSpanIndexes(a);
      const bSpan = getEventSpanIndexes(b);
      const aDuration = aSpan.endIndex - aSpan.startIndex;
      const bDuration = bSpan.endIndex - bSpan.startIndex;

      // Sort by start date first, then by duration (longest first)
      if (aSpan.startIndex !== bSpan.startIndex) {
        return aSpan.startIndex - bSpan.startIndex;
      }
      return bDuration - aDuration;
    });

    for (const event of sortedEvents) {
      const eventKey = getEventKey(event);
      if (usedEvents.has(eventKey)) continue;

      const { startIndex, endIndex } = getEventSpanIndexes(event);
      const duration = endIndex - startIndex;

      let placed = false;

      // Try existing rows
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        let canPlace = true;

        // Check if this row is free for all days of this event
        for (let d = startIndex; d <= endIndex; d++) {
          if (occupiedRowsPerDay.get(d)?.has(rowIndex)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          // Initialize row if needed
          if (!rows[rowIndex]) {
            rows[rowIndex] = [];
          }

          // Find the correct position to insert in the row array
          let insertIndex = 0;
          for (let i = 0; i < rows[rowIndex].length; i++) {
            const existingEvent = rows[rowIndex][i];
            if (existingEvent.periodIndex > startIndex) {
              break;
            }
            insertIndex = i + 1;
          }

          rows[rowIndex].splice(insertIndex, 0, {
            ...event,
            periodIndex: startIndex,
            spanDays: duration + 1,
            isFirstDay: startIndex > 0, // Not first day if it starts before our range
            isLastDay: endIndex < periods.length - 1 // Not last day if it ends after our range
          });

          // Mark this row as occupied for all days of this event
          for (let d = startIndex; d <= endIndex; d++) {
            occupiedRowsPerDay.get(d)?.add(rowIndex);
          }

          usedEvents.add(eventKey);
          placed = true;
          break;
        }
      }

      // Create new row if needed
      if (!placed) {
        const newRowIndex = rows.length;
        rows[newRowIndex] = [{
          ...event,
          periodIndex: startIndex,
          spanDays: duration + 1,
          isFirstDay: startIndex > 0,
          isLastDay: endIndex < periods.length - 1
        }];

        // Mark this row as occupied for all days of this event
        for (let d = startIndex; d <= endIndex; d++) {
          occupiedRowsPerDay.get(d)?.add(newRowIndex);
        }

        usedEvents.add(eventKey);
      }
    }

    return rows;
  };


  // Update the getEventPosition function to handle multi-day events properly
  const getEventPosition = (event: any, totalPeriods: number) => {
    const periods = getPeriods();
    if (isSingleDayOutsideRange(event, periods)) {
      return null; // do not render
    }
    const { startIndex, endIndex } = getEventSpanIndexes(event, periods);

    if (startIndex === -1 || endIndex === -1) {
      return { startPercent: 0, widthPercent: 0 };
    }

    const spanDays = endIndex - startIndex + 1;

    return {
      startPercent: (startIndex / totalPeriods) * 100,
      widthPercent: (spanDays / totalPeriods) * 100,
    };
  };

  const getEventSpanIndexes = (event: any, periods: Date[]) => {
    const startDate = new Date(event.date + "T00:00:00");

    let endDate = startDate;

    // Google Calendar handling
    if (event.isGoogleCalendarEvent && event.endDate) {
      if (event.allDay) {
        endDate = new Date(event.endDate + "T00:00:00");
        endDate.setDate(endDate.getDate() - 1); // Google endDate is exclusive
      } else {
        endDate = new Date(event.endDate + "T23:59:59");
      }
    }

    // Normalize
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const firstPeriod = new Date(periods[0]);
    const lastPeriod = new Date(periods[periods.length - 1]);
    firstPeriod.setHours(0, 0, 0, 0);
    lastPeriod.setHours(0, 0, 0, 0);

    // If event does not intersect visible range at all
    if (endDate < firstPeriod || startDate > lastPeriod) {
      return { startIndex: -1, endIndex: -1 };
    }

    // Clip to visible range
    const visibleStart = startDate < firstPeriod ? firstPeriod : startDate;
    const visibleEnd = endDate > lastPeriod ? lastPeriod : endDate;

    let startIndex = periods.findIndex(
      d => new Date(d).getTime() === visibleStart.getTime()
    );
    let endIndex = periods.findIndex(
      d => new Date(d).getTime() === visibleEnd.getTime()
    );

    return { startIndex, endIndex };
  };
  const isSingleDayOutsideRange = (event: any, periods: Date[]) => {
    if (event.endDate) return false; // multi-day handled elsewhere

    const eventDate = new Date(event.date + 'T00:00:00');
    eventDate.setHours(0, 0, 0, 0);

    const rangeStart = new Date(periods[0]);
    const rangeEnd = new Date(periods[periods.length - 1]);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    return eventDate < rangeStart || eventDate > rangeEnd;
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

  const handleEventClick = (event) => {
    setSelectedProject(event.project.id);
    setSelectedEvent(event.eventId);
    setIsEventClick(true);
  }

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
    const maxEventsPerDay = getMaxEventsPerDay(member);

    if (maxEventsPerDay === 0) return 'h-14'; // Default height for no events

    // Base height + additional height for extra rows
    if (maxEventsPerDay === 1) return 'h-14'; // Single row
    if (maxEventsPerDay === 2) return 'h-24'; // Two rows
    if (maxEventsPerDay === 3) return 'h-[8.5rem]'; // Three rows
    return 'h-44'; // Four or more rows
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
      <div className="h-[4.1rem]"></div>

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
                  {/* {isLoggedInUser && (
                    <span className="ml-2 text-xs text-studio-gold bg-studio-gold/10 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )} */}
                  {isInactive && !isLoggedInUser && (
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
              setSelectedEvent={setSelectedEvent}
            // lockedDates={lockedDates}
            // onToggleDateLock={handleToggleDateLock}
            // lockProcessing={lockProcessing}
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
              className="grid mb-1"
              style={{
                gridTemplateColumns: `repeat(${periods.length}, minmax(${minColumnWidth}, 1fr))`
              }}
            >
              {periods.map((day, index) => {
                const dayOfWeek = format(day, 'EEE');
                const dayNumber = day.getDate();
                const isSelected = isDaySelected(day);
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const dateStr = format(day, 'yyyy-MM-dd');
                const locked = isDateLocked(day);
                const processing = lockProcessing[dateStr];

                return (
                  <div key={index} className="text-center">
                    {/* Date Header */}
                    <div
                      className={`text-[10px] p-1 rounded-t border-t border-x transition-colors cursor-pointer ${isSelected
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

                    <div
                      className={`p-1 rounded-b transition-all cursor-pointer flex items-center justify-center h-8 ${locked
                        ? 'text-studio-gold'
                        : ''
                        }`}
                      onClick={(e) => !loading && handleToggleDateLock(day, e)}
                      title={locked ? `Click to unlock ${format(day, 'MMM dd, yyyy')}` : `Click to lock ${format(day, 'MMM dd, yyyy')}`}
                    >
                      {processing || loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : locked ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          {/* <span className="text-[10px] font-medium">Locked</span> */}
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 mr-1" />
                          {/* <span className="text-[10px] font-medium">Open</span> */}
                        </>
                      )}
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
                  const eventRows = getEventRows(member);
                  const timelineHeight = getTimelineHeight(member);
                  const isInactive = !member.active;
                  const isLoggedInUser = member.id === user?.data?.id;

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
                                  // Check if it's a Google Calendar event
                                  const isGoogleEvent = 'isGoogleCalendarEvent' in event && event.isGoogleCalendarEvent;
                                  const position = getEventPosition(event, periods.length);
                                  if (!position) return null;

                                  const { startPercent, widthPercent } = position;


                                  if (isGoogleEvent) {
                                    return (
                                      <GoogleCalendarEvent
                                        key={event.id}
                                        event={event}
                                        startPercent={startPercent}
                                        widthPercent={widthPercent}
                                        isLoggedInUser={isLoggedInUser}
                                        formatTime={formatTime}
                                      />
                                    );
                                  }
                                  // For regular project events (TeamMemberEvent)
                                  const projectEvent = event as TeamMemberEvent;
                                  const isOtherEvent = projectEvent.isOther;

                                  // For isOther events (should be visible to everyone EXCEPT the logged-in user themselves)
                                  if (isOtherEvent) {
                                    return (
                                      <OtherEvent
                                        key={projectEvent.eventId}
                                        event={projectEvent}
                                        startPercent={startPercent}
                                        widthPercent={widthPercent}
                                        formatTime={formatTime}
                                      />
                                    );
                                  }
                                  // For regular events (same company) - not isOther
                                  return (
                                    <ProjectEvent
                                      key={projectEvent.eventId}
                                      event={projectEvent}
                                      startPercent={startPercent}
                                      widthPercent={widthPercent}
                                      isInactive={isInactive}
                                      handleEventClick={handleEventClick}
                                      formatTime={formatTime}
                                    />
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