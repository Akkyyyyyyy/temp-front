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
import { getISOWeek, isWithinInterval, parseISO } from "date-fns";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { PackagesDialog } from "./PackagesDialog";
import { ScheduleHourlyRef } from "./ScheduleHourly";
import { HeaderWithClock } from "./HeaderWithClock";
import { preloadCountries } from "@/helper/countryHelpers";

export type TimeView = 'Day' | 'week' | 'month';

export function GanttChart() {
  const today = new Date();
  const { roles } = useRole();
  const [timeView, setTimeView] = useState<TimeView>('week');
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number | null>(today.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(getISOWeek(today));
  const [colorUpdate, setColorUpdate] = useState(false);
  const hasMounted = useRef(false);
  const [dialogCloseTrigger, setDialogCloseTrigger] = useState(0);
  const scheduleHourlyRef = useRef<ScheduleHourlyRef>(null);

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
    setTeamMembers
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
  const [activeProjectTab, setActiveProjectTab] = useState<string>("overview");
  const [briefSections, setBriefSections] = useState([
    {
      id: 1,
      title: "Project Concept",
      content: "Commercial shoot for premium lifestyle brand featuring natural lighting and authentic moments",
      type: "text"
    },
    {
      id: 2,
      title: "Visual Style",
      content: "Clean, minimalist aesthetic with warm tones. Focus on product integration in lifestyle settings",
      type: "text"
    },
    {
      id: 3,
      title: "Key Requirements",
      content: ["5-10 hero shots for campaign", "Behind-the-scenes content", "Multiple product angles", "Social media assets (16:9, 9:16, 1:1)"],
      type: "list"
    }
  ]);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [logisticsSections, setLogisticsSections] = useState([
    {
      id: 1,
      title: "Parking Information",
      content: "Free parking available for suppliers in Car Park B. Quote 'Chloe/Ben Wedding' at the barrier.",
      type: "text"
    },
    {
      id: 2,
      title: "Dress Code",
      content: "All black, smart casual.",
      type: "text"
    },
    {
      id: 3,
      title: "Assigned Gear",
      content: ["Sony A7IV Body", "85mm f/1.4 Lens", "2x Godox V1 Flashes"],
      type: "list"
    }
  ]);
  const [editingLogisticsSection, setEditingLogisticsSection] = useState<number | null>(null);
  const [peopleSections, setPeopleSections] = useState<Array<{
    id: number;
    title: string;
    people: Array<{
      id: number;
      name: string;
      phone: string;
      email: string;
    }>;
  }>>([
    {
      id: 1,
      title: "Client(s)",
      people: [
        { id: 1, name: "Chloe", phone: "07700 900123", email: "chloe@email.com" },
        { id: 2, name: "Ben", phone: "07700 900456", email: "ben@email.com" }
      ]
    },
    {
      id: 2,
      title: "Key Vendors",
      people: [
        { id: 3, name: "Jane Doe", phone: "07700 900789", email: "jane@weddingplanner.com" },
        { id: 4, name: "Tom Smith", phone: "07700 900012", email: "tom@venue.com" }
      ]
    },
    {
      id: 3,
      title: "Your Team",
      people: [
        { id: 5, name: "Sarah Jones", phone: "07700 900345", email: "sarah@studio.com" },
        { id: 6, name: "David Green", phone: "07700 900678", email: "david@studio.com" }
      ]
    }
  ]);
  const [editingPeopleSection, setEditingPeopleSection] = useState<number | null>(null);
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

  const { user } = useAuth();
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

  const handleJumpToToday = () => {
    const today = new Date();

    if (timeView === 'week') {
      setSelectedDay(today.getDate());
      setSelectedWeek(getISOWeek(today));
      setSelectedYear(today.getFullYear());
    } else {
      setSelectedDay(today.getDate());
      setSelectedMonth(today.getMonth() + 1);
      setSelectedYear(today.getFullYear());
    }
    setIsDayClick(true);
  };

  // Get workers for a specific day based on events
  const getWorkersForDay = (day: number, month: number, year: number) => {
    const targetDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    return teamMembers
      .filter(member =>
        member.events && member.events.some(event =>
          event.date === targetDateString
        )
      )
      .map(member => {
        const dayEvents = member.events.filter(event =>
          event.date === targetDateString
        );

        const activeProjects = dayEvents.map(event => ({
          id: event.project.id,
          name: event.project.name,
          color: event.project.color,
          time: `${event.startHour}:00 - ${event.endHour}:00`,
          eventId: event.eventId,
          startHour: event.startHour,
          endHour: event.endHour,
          location: event.location,
          role: event.assignment.role,
          isOther: event.isOther
        }));

        return {
          ...member,
          activeProjects,
          activeEvents: dayEvents,
        };
      });
  };

  // Get available members for a specific day (no events on that day)
  const getAvailableForDay = (day: number, month: number, year: number) => {
    const targetDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    return teamMembers.filter(member =>
      !member.events?.some(event => event.date === targetDateString)
    );
  };

  // Get hourly bookings for selected day based on events
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
    }> = [];

    teamMembers?.forEach(member => {
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
            location: event.location
          });
        }
      });
    });

    return bookings.sort((a, b) => a.startHour - b.startHour);
  };

  const addNewTeamMember = async (memberData: {
    invitation: string;
    isInvited: boolean;
    isOwner:boolean;
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
      event.project.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="mt-12 lg:mt-0 flex-1 py-6 px-3 lg:p-3 overflow-x-hidden">
        {/* Header */}
        <HeaderWithClock
          timeView={timeView}
          onDateClick={handleJumpToToday}
          setSelectedProject={setSelectedProject}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
        />

        {/* Rest of your content */}
        <div className="space-y-6">

          {/* Team Members */}
          <TeamMembers
            refreshMembers={refreshMembers}
            teamMembers={filteredTeamMembers}
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
      </div>
    </div>
  );
}