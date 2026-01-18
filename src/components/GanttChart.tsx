import { Search, LogIn, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TeamAvailabilityTable } from "@/components/TeamAvailabilityTable";
import { TeamMemberProfile } from "@/components/TeamMemberProfile";
import { FinancialManagementDialog } from "@/components/FinancialManagementDialog";
import { AddTeamMemberDialog } from "@/components/AddTeamMemberDialog";
import { Sidebar } from "@/components/Sidebar";
import { CalendarView } from "@/components/CalendarView";
import { TeamMember, TeamMembers } from "@/components/TeamMembers";
import { ScheduleHourly } from "@/components/ScheduleHourly";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addMember, getMembersByCompanyId, Member } from "@/api/member";

import { toast } from "sonner";
import { getISOWeek, isWithinInterval, parseISO, getISOWeekYear } from "date-fns";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { PackagesDialog } from "./PackagesDialog";
import { ScheduleHourlyRef } from "./ScheduleHourly";
import { HeaderWithClock } from "./HeaderWithClock";
import { preloadCountries } from "@/helper/countryHelpers";
import { isTokenExpired } from "@/helper/helper";
import { SessionExpiredDialog } from "./modals/SessionExpiredDialog";

export type TimeView = 'Day' | 'week' | 'month';

export function GanttChart() {
  const today = new Date();
  const { roles } = useRole();
  const [timeView, setTimeView] = useState<TimeView>('month');
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(today));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [colorUpdate, setColorUpdate] = useState(false);
  const hasMounted = useRef(false);
  const [dialogCloseTrigger, setDialogCloseTrigger] = useState(0);
  const scheduleHourlyRef = useRef<ScheduleHourlyRef>(null);
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setShowAddTeamMember(isOpen);
    if (!isOpen) {
      setDialogCloseTrigger(prev => prev + 1);
    }
  };
  const {
    teamMembers,
    loading: loadingMembers,
    refresh: refreshMembers,
    setTeamMembers,
    lockedDates
  } = useTeamMembers({
    selectedMonth,
    selectedYear,
    selectedWeek,
    timeView,
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAvailable, setShowAvailable] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showTeamAvailability, setShowTeamAvailability] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showFinancialManagement, setShowFinancialManagement] = useState(false);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [isDayClick, setIsDayClick] = useState(false);
  const [isProjectClick, setIsProjectClick] = useState(false);
  const [isEventClick, setIsEventClick] = useState(false);


  // Project selection effect
  useEffect(() => {
    if (selectedProject && scheduleHourlyRef.current && isProjectClick) {
      scheduleHourlyRef.current.scrollToProjectDetails();
      setIsProjectClick(false);
    }
  }, [selectedProject, isProjectClick]);
  useEffect(() => {
    if (selectedEvent && scheduleHourlyRef.current && setIsEventClick) {
      scheduleHourlyRef.current.scrollToProjectDetails();
      setIsEventClick(false);
    }
  }, [selectedEvent, setIsEventClick]);

  const { user, setUser } = useAuth();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        await refreshMembers();
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to fetch team members");
      }
    };
    fetchMembers();
  }, [selectedMonth, selectedYear, selectedWeek, timeView, colorUpdate, setColorUpdate, user]);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");

    if (!token || isTokenExpired(token)) {
      setShowSessionExpiredDialog(true);
    }
  }, []);
  const handleLoginAgain = () => {
    localStorage.removeItem("auth-token");
    setUser(null);
    setShowSessionExpiredDialog(false);
    navigate("/login");
  };

  const handleJumpToToday = () => {
    const today = new Date();

    if (timeView === 'week') {
      setSelectedDay(today.getDate());
      setSelectedWeek(getISOWeek(today));
      setSelectedYear(getISOWeekYear(today));
    } else if (timeView === 'Day') {
      setSelectedDay(today.getDate());
      setSelectedMonth(today.getMonth() + 1);
      setSelectedYear(getISOWeekYear(today));
    } else {
      setSelectedDay(today.getDate());
      setSelectedMonth(today.getMonth() + 1);
      setSelectedYear(today.getFullYear());
    }
    setIsDayClick(true);
  };

  // Get workers for a specific day based on events (both regular and Google Calendar)
  const getWorkersForDay = (day: number, month: number, year: number) => {
    const targetDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    return teamMembers
      .filter(member => {
        // Check if member has any events on this day
        const hasRegularEvents = member.events?.some(event =>
          event.date === targetDateString
        );

        const hasGoogleEvents = member.googleCalendarEvents?.some(event => {
          // For single-day events
          if (!event.multiDay) {
            return event.date === targetDateString;
          }

          // For multi-day events
          if (event.multiDay && event.endDate) {
            const startDate = new Date(event.date);
            const endDate = new Date(event.endDate);
            const targetDate = new Date(targetDateString);

            // For Google Calendar all-day events, end date is exclusive
            // So we need to subtract 1 day for comparison
            const adjustedEndDate = new Date(endDate);
            if (event.allDay) {
              adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
            }

            // Check if target date is between start and end dates (inclusive)
            return targetDate >= startDate && targetDate <= adjustedEndDate;
          }

          return false;
        });

        return hasRegularEvents || hasGoogleEvents;
      })
      .map(member => {
        const dayRegularEvents = member.events?.filter(event =>
          event.date === targetDateString
        ) || [];

        const dayGoogleEvents = member.googleCalendarEvents?.filter(event => {
          if (!event.multiDay) {
            return event.date === targetDateString;
          }

          if (event.multiDay && event.endDate) {
            const startDate = new Date(event.date);
            const endDate = new Date(event.endDate);
            const targetDate = new Date(targetDateString);

            // For Google Calendar all-day events, end date is exclusive
            // So we need to subtract 1 day for comparison
            const adjustedEndDate = new Date(endDate);
            if (event.allDay) {
              adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
            }

            return targetDate >= startDate && targetDate <= adjustedEndDate;
          }

          return false;
        }) || [];

        // Combine both types of events
        const allDayEvents = [...dayRegularEvents, ...dayGoogleEvents];

        const activeProjects = allDayEvents.map(event => {
          // Check if it's a Google Calendar event
          const isGoogleEvent = 'allDay' in event;

          if (isGoogleEvent) {
            const googleEvent = event as any;

            // Handle all-day Google Calendar events
            if (googleEvent.allDay) {
              return {
                id: `google-${Date.now()}-${Math.random()}`,
                name: 'Google Calendar',
                color: '#4285F4', // Google blue
                eventName: googleEvent.name || 'Google Event',
                time: googleEvent.allDay ? 'All Day' :
                  (googleEvent.startHour !== null && googleEvent.endHour !== null ?
                    `${googleEvent.startHour}:00 - ${googleEvent.endHour}:00` : ''),
                eventId: googleEvent.id || `google-${Date.now()}`,
                startHour: googleEvent.startHour,
                endHour: googleEvent.endHour,
                location: googleEvent.location || '',
                role: 'Busy',
                isOther: true,
                isGoogleCalendarEvent: true,
                allDay: googleEvent.allDay,
                multiDay: googleEvent.multiDay,
                userId: member.id,
                // Add adjusted end date for display
                displayEndDate: googleEvent.multiDay && googleEvent.endDate ?
                  (() => {
                    const end = new Date(googleEvent.endDate);
                    if (googleEvent.allDay) {
                      end.setDate(end.getDate() - 1);
                    }
                    return end.toISOString().split('T')[0];
                  })() : null
              };
            }

            // Handle timed Google Calendar events
            return {
              id: `google-${Date.now()}-${Math.random()}`,
              name: 'Google Calendar',
              color: '#4285F4',
              eventName: googleEvent.name || 'Google Event',
              time: googleEvent.startHour !== null && googleEvent.endHour !== null ?
                `${googleEvent.startHour}:00 - ${googleEvent.endHour}:00` : '',
              eventId: googleEvent.id || `google-${Date.now()}`,
              startHour: googleEvent.startHour,
              endHour: googleEvent.endHour,
              location: googleEvent.location || '',
              role: 'Busy',
              isOther: true,
              isGoogleCalendarEvent: true,
              allDay: false,
              multiDay: googleEvent.multiDay,
              userId: member.id,
              displayEndDate: googleEvent.multiDay && googleEvent.endDate ?
                googleEvent.endDate : null
            };
          }

          // Regular event
          return {
            id: event.project.id,
            name: event.project.name,
            color: event.project.color,
            eventName: event.name,
            time: `${event.startHour}:00 - ${event.endHour}:00`,
            eventId: event.eventId,
            startHour: event.startHour,
            endHour: event.endHour,
            location: event.location,
            role: event.assignment.role,
            isOther: event.isOther,
            isGoogleCalendarEvent: false,
            allDay: false,
            multiDay: false
          };
        });

        return {
          ...member,
          activeProjects,
          activeEvents: allDayEvents,
        };
      });
  };

  // Get available members for a specific day (no events on that day)
  const getAvailableForDay = (day: number, month: number, year: number) => {
    const targetDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    return teamMembers.filter(member => {
      const hasRegularEvents = member.events?.some(event =>
        event.date === targetDateString
      );

      const hasGoogleEvents = member.googleCalendarEvents?.some(event => {
        if (!event.multiDay) {
          return event.date === targetDateString;
        }

        if (event.multiDay && event.endDate) {
          const startDate = new Date(event.date);
          const endDate = new Date(event.endDate);
          const targetDate = new Date(targetDateString);

          // For Google Calendar all-day events, end date is exclusive
          // So we need to subtract 1 day for comparison
          const adjustedEndDate = new Date(endDate);
          if (event.allDay) {
            adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
          }

          return targetDate >= startDate && targetDate <= adjustedEndDate;
        }

        return false;
      });

      // Available if no events at all
      return !hasRegularEvents && !hasGoogleEvents;
    });
  };

  // Get hourly bookings for selected day based on events (both regular and Google Calendar)
  const getHourlyBookings = (day: number, month: number, year: number) => {
    const targetDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const bookings: Array<{
      startHour: number;
      endHour: number;
      projectName: string;
      memberName: string;
      memberPhoto: string;
      color: string;
      memberRingColor: string;
      eventId: string;
      role: string;
      instructions: string;
      location: string;
      isGoogleCalendarEvent: boolean;
      allDay: boolean;
      multiDay: boolean;
    }> = [];

    teamMembers?.forEach(member => {
      // Process regular events
      member?.events?.forEach(event => {
        if (event.date === targetDateString) {
          bookings.push({
            startHour: event.startHour,
            endHour: event.endHour,
            projectName: event.project.name,
            memberName: member.name,
            memberPhoto: member.profilePhoto,
            color: event.project.color,
            memberRingColor: member.ringColor,
            eventId: event.eventId,
            role: event.assignment.role,
            instructions: event.assignment.instructions || '',
            location: event.location,
            isGoogleCalendarEvent: false,
            allDay: false,
            multiDay: false
          });
        }
      });

      // Process Google Calendar events
      member?.googleCalendarEvents?.forEach(googleEvent => {
        let isOnTargetDate = false;

        if (!googleEvent.multiDay) {
          isOnTargetDate = googleEvent.date === targetDateString;
        } else if (googleEvent.multiDay && googleEvent.endDate) {
          const startDate = new Date(googleEvent.date);
          const endDate = new Date(googleEvent.endDate);
          const targetDate = new Date(targetDateString);

          // For Google Calendar all-day events, end date is exclusive
          // So we need to subtract 1 day for comparison
          const adjustedEndDate = new Date(endDate);
          if (googleEvent.allDay) {
            adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
          }

          isOnTargetDate = targetDate >= startDate && targetDate <= adjustedEndDate;
        }

        if (isOnTargetDate) {
          // Skip all-day events for hourly booking display (they're handled differently)
          if (googleEvent.allDay) return;

          // Only include timed events
          if (googleEvent.startHour !== null && googleEvent.endHour !== null) {
            bookings.push({
              startHour: googleEvent.startHour,
              endHour: googleEvent.endHour,
              projectName: 'Google Calendar',
              memberName: member.name,
              memberPhoto: member.profilePhoto,
              color: '#4285F4', // Google blue
              memberRingColor: member.ringColor,
              eventId: googleEvent.id || `google-${member.id}`,
              role: 'Busy',
              instructions: '',
              location: googleEvent.location || '',
              isGoogleCalendarEvent: true,
              allDay: googleEvent.allDay,
              multiDay: googleEvent.multiDay
            });
          }
        }
      });
    });

    return bookings.sort((a, b) => a.startHour - b.startHour);
  };

  const addNewTeamMember = async (memberData: {
    invitation: string;
    isInvited: boolean;
    isOwner: boolean;
    roleId: string;
    active: boolean;
    profilePhoto: any;
    name: string;
    email: string;
    role: string;
    photo: string;
    countryCode?: string;
    phone?: string;
    location?: string;
    bio?: string;
    skills?: string[];
  }) => {
    try {
      const selectedRole = roles.find(r => r.id === memberData.roleId);
      const roleName = selectedRole?.name || memberData.role;

      const response = await addMember({
        name: memberData.name,
        email: memberData.email,
        roleId: memberData.roleId,
        companyId: user.data.company.id,
        countryCode: memberData.countryCode,
        phone: memberData.phone,
        location: memberData.location,
        bio: memberData.bio,
        skills: memberData.skills,
      });

      if (!response.success) {
        if (response.statusCode === 401) {
          localStorage.removeItem("auth-token");
          toast.error("Session expired. Please log in again.");
          navigate("/login");
          return { success: false, message: "Session expired" };
        }

        if (response.statusCode === 403) {
          toast.error("You don't have permission to add team members.");
          return { success: false, message: "Permission denied" };
        }

        toast.error(response.message || "Failed to add team member.");
        return { success: false, message: response.message };
      }

      const newMember: TeamMember = {
        id: response.member?.id || memberData.name.toLowerCase().replace(/\s+/g, "-"),
        name: memberData.name,
        profilePhoto: memberData.profilePhoto,
        email: memberData.email,
        role: roleName,
        active: memberData.active,
        countryCode: memberData.countryCode,
        phone: memberData.phone,
        roleId: memberData.roleId,
        events: [], // New members start with no events
        location: memberData.location,
        bio: memberData.bio,
        skills: memberData.skills || [],
        isAdmin: false,
        isInvited: memberData.isInvited,
        isOwner: memberData.isOwner,
        invitation: memberData.invitation,
      };

      setTeamMembers((prev) => [newMember, ...prev]);
      toast.success("Member added successfully");

      await refreshMembers();

      return { success: true, message: "Member added successfully" };
    } catch (error: any) {
      console.error("Error adding new team member:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error("Network error. Please check your connection.");
        return { success: false, message: "Network error" };
      } else {
        toast.error("An unexpected error occurred.");
        return { success: false, message: "Unexpected error" };
      }
    }
  };

  // Filter team members based on search query (updated for events)
  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.events?.some(event =>
      // Search in project name
      event.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // ALSO search in event name (if it exists)
      event.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const workersToday = (selectedDay && selectedMonth && selectedYear)
    ? getWorkersForDay(selectedDay, selectedMonth, selectedYear)
    : [];
  const availableToday = (selectedDay && selectedMonth && selectedYear)
    ? getAvailableForDay(selectedDay, selectedMonth, selectedYear)
    : [];

  const hourlyBookingsToday = (selectedDay && selectedMonth && selectedYear)
    ? getHourlyBookings(selectedDay, selectedMonth, selectedYear)
    : [];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        onAddTeamMember={() => { setShowAddTeamMember(true); }}
        onShowTeamAvailability={() => setShowTeamAvailability(true)}
        onAddBooking={() => {
          if (!selectedDay) setSelectedDay(1);
        }}
        onShowFinancialManagement={() => setShowFinancialManagement(true)}
        onShowPackages={() => setShowPackages(true)}
        selectedDay={selectedDay}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        selectedYear={selectedYear}
        timeView={timeView}
        setSelectedDay={setSelectedDay}
        teamMembers={filteredTeamMembers}
        refreshMembers={refreshMembers}
        onDialogCloseTrigger={dialogCloseTrigger}
        onDateClick={handleJumpToToday}
        setSelectedProject={setSelectedProject}
      />

      {/* Main Content */}
      <div className="mt-12 lg:mt-0 flex-1 py-1 px-3 overflow-x-hidden">
        {/* Header */}
        <HeaderWithClock
          timeView={timeView}
          onDateClick={handleJumpToToday}
          setSelectedProject={setSelectedProject}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          refreshMembers={refreshMembers}
        />

        {/* Rest of your content */}
        <div className="space-y-6 overflow-x-hidden pt-5 lg:pt-1">

          {/* Team Members */}
          <TeamMembers
            refreshMembers={refreshMembers}
            teamMembers={filteredTeamMembers}
            lockedDates={lockedDates}
            timeView={timeView}
            setTimeView={setTimeView}
            setSelectedMember={setSelectedMember}
            setSelectedProject={setSelectedProject}
            setSelectedEvent={setSelectedEvent}
            setShowAddTeamMember={setShowAddTeamMember}
            selectedDay={selectedDay}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            loading={loadingMembers}
            setIsDayClick={setIsDayClick}
            setSearchQuery={setSearchQuery}
            searchQuery={searchQuery}
            setIsProjectClick={setIsProjectClick} //
            onRingColorUpdate={() => setColorUpdate(true)}
            setIsEventClick={setIsEventClick}
            handleJumpToToday={handleJumpToToday}
          />

          <ScheduleHourly
            ref={scheduleHourlyRef}
            selectedDay={selectedDay || undefined}
            setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth || new Date().getMonth() + 1}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear || new Date().getFullYear()}
            setSelectedYear={setSelectedYear}
            selectedWeek={selectedWeek || getISOWeek(new Date())}
            setSelectedWeek={setSelectedWeek}
            timeView={timeView}
            teamMembers={teamMembers}
            selectedProject={selectedProject}
            selectedEvent={selectedEvent}
            isProjectClick={isProjectClick}
            isEventClick={isEventClick}
            setIsProjectClick={setIsProjectClick}
            setIsEventClick={setIsEventClick}
            setSelectedProject={setSelectedProject}
            getWorkersForDay={getWorkersForDay}
            getAvailableForDay={getAvailableForDay}
            getHourlyBookings={getHourlyBookings}
            hourlyBookingsToday={hourlyBookingsToday}
            workersToday={workersToday}
            availableToday={availableToday}
            currentMonth={selectedMonth || new Date().getMonth() + 1}
            currentYear={selectedYear || new Date().getFullYear()}
            setSelectedMember={setSelectedMember}
            onAddSection={async () => {
              refreshMembers();
            }}
            onAddTeamMember={() => { setShowAddTeamMember(true); }}
          />
        </div>

        {/* Team Availability Table Dialog */}
        <TeamAvailabilityTable
          isOpen={showTeamAvailability}
          onClose={() => setShowTeamAvailability(false)}
          setSelectedProject={setSelectedProject}
          setSelectedEvent={setSelectedEvent}
          setIsEventClick={setIsEventClick}
          setSelectedMember={setSelectedMember}
          setIsProjectClick={setIsProjectClick}
          team={teamMembers}
        />

        <TeamMemberProfile
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
          refreshMembers={refreshMembers}
          setSelectedProject={setSelectedProject}
          setIsProjectClick={setIsProjectClick}
          setSelectedEvent={setSelectedEvent}
          setIsEventClick={setIsEventClick}
          onUpdateMember={async (memberId, updates) => {
            refreshMembers();
            setSelectedMember(prevSelected =>
              prevSelected && prevSelected.id === memberId
                ? { ...prevSelected, ...updates }
                : prevSelected
            );
          }}
          onDeleteMember={async (memberId) => {
            setTeamMembers(prev => prev.filter(member => member.id !== memberId));
            refreshMembers();
          }}
          onUpdateProject={(memberId, eventId, updates) => {
            setTeamMembers(prev => prev.map(member =>
              member.id === memberId
                ? {
                  ...member,
                  events: member.events.map(event =>
                    event.eventId === eventId ? { ...event, ...updates } : event
                  )
                }
                : member
            ));
          }}
          onAddProject={(memberId, eventData) => {
            const newEvent = {
              ...eventData,
              eventId: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            setTeamMembers(prev => prev.map(member =>
              member.id === memberId
                ? { ...member, events: [...member.events, newEvent] }
                : member
            ));
          }}
          onDeleteProject={(memberId, eventId) => {
            setTeamMembers(prev => prev.map(member =>
              member.id === memberId
                ? { ...member, events: member.events.filter(e => e.eventId !== eventId) }
                : member
            ));
            refreshMembers();
          }}
        />
        <PackagesDialog
          open={showPackages}
          onOpenChange={setShowPackages}
        />

        {/* Financial Management Dialog */}
        <FinancialManagementDialog
          open={showFinancialManagement}
          onOpenChange={setShowFinancialManagement}
        />

        {/* Add Team Member Dialog */}
        <AddTeamMemberDialog
          open={showAddTeamMember}
          onOpenChange={handleOpenChange}
          onAddMember={addNewTeamMember}
        />
        {/* Session Expired Dialog */}
        <SessionExpiredDialog
          open={showSessionExpiredDialog}
          onOpenChange={setShowSessionExpiredDialog}
          onLoginAgain={handleLoginAgain}
        />
      </div>
    </div>
  );
}