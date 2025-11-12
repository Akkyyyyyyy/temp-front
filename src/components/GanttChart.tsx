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
import { addMember, getMembersByCompanyId, Member, Project } from "@/api/member";

import { toast } from "sonner";
import { getISOWeek, isWithinInterval, parseISO } from "date-fns";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { PackagesDialog } from "./PackagesDialog";
import { ScheduleHourlyRef } from "./ScheduleHourly";
import { HeaderWithClock } from "./HeaderWithClock";
import { preloadCountries } from "@/helper/countryHelpers";


const teamMembers: TeamMember[] = [
  // {
  //   id: "iq",
  //   name: "Iq",
  //   photo: iqPhoto,
  //   role: "Lead Photographer",
  //   projects: [{
  //     id: "wedding-shoot",
  //     name: "Wedding Portfolio Shoot",
  //     startDate: 3,
  //     endDate: 7,
  //     color: "bg-blue-500",
  //     assignedTo: "iq",
  //     startHour: 9,
  //     endHour: 13
  //   }, {
  //     id: "brand-session",
  //     name: "Brand Photography",
  //     startDate: 15,
  //     endDate: 18,
  //     color: "bg-purple-500",
  //     assignedTo: "iq",
  //     startHour: 14,
  //     endHour: 18
  //   }, {
  //     id: "luxury-event",
  //     name: "Luxury Event Coverage",
  //     startDate: 25,
  //     endDate: 30,
  //     color: "bg-orange-500",
  //     assignedTo: "iq",
  //     startHour: 19,
  //     endHour: 23
  //   }]
  // }, {
  //   id: "usman",
  //   name: "Usman",
  //   photo: usmanPhoto,
  //   role: "Senior Photographer",
  //   projects: [{
  //     id: "product-catalog",
  //     name: "Product Catalog",
  //     startDate: 1,
  //     endDate: 5,
  //     color: "bg-green-500",
  //     assignedTo: "usman",
  //     startHour: 8,
  //     endHour: 12
  //   }, {
  //     id: "corporate-headshots",
  //     name: "Corporate Headshots",
  //     startDate: 12,
  //     endDate: 16,
  //     color: "bg-red-500",
  //     assignedTo: "usman",
  //     startHour: 10,
  //     endHour: 16
  //   }, {
  //     id: "fashion-editorial",
  //     name: "Fashion Editorial",
  //     startDate: 22,
  //     endDate: 27,
  //     color: "bg-indigo-500",
  //     assignedTo: "usman",
  //     startHour: 13,
  //     endHour: 19
  //   }]
  // }, {
  //   id: "jivan",
  //   name: "Jivan",
  //   photo: jivanPhoto,
  //   role: "Creative Director",
  //   projects: [{
  //     id: "creative-direction",
  //     name: "Creative Direction",
  //     startDate: 8,
  //     endDate: 12,
  //     color: "bg-yellow-500",
  //     assignedTo: "jivan"
  //   }, {
  //     id: "client-consultation",
  //     name: "Client Consultations",
  //     startDate: 19,
  //     endDate: 23,
  //     color: "bg-pink-500",
  //     assignedTo: "jivan"
  //   }]
  // }, {
  //   id: "amit",
  //   name: "Amit",
  //   photo: amitPhoto,
  //   role: "Portrait Specialist",
  //   projects: [{
  //     id: "family-portraits",
  //     name: "Family Portraits",
  //     startDate: 5,
  //     endDate: 9,
  //     color: "bg-teal-500",
  //     assignedTo: "amit"
  //   }, {
  //     id: "senior-portraits",
  //     name: "Senior Portraits",
  //     startDate: 16,
  //     endDate: 20,
  //     color: "bg-cyan-500",
  //     assignedTo: "amit"
  //   }, {
  //     id: "maternity-shoot",
  //     name: "Maternity Session",
  //     startDate: 28,
  //     endDate: 31,
  //     color: "bg-lime-500",
  //     assignedTo: "amit"
  //   }]
  // }, {
  //   id: "josh",
  //   name: "Josh",
  //   photo: joshPhoto,
  //   role: "Event Photographer",
  //   projects: [{
  //     id: "corporate-event",
  //     name: "Corporate Event",
  //     startDate: 2,
  //     endDate: 4,
  //     color: "bg-rose-500",
  //     assignedTo: "josh",
  //     startHour: 8,
  //     endHour: 17
  //   }, {
  //     id: "birthday-party",
  //     name: "Birthday Celebration",
  //     startDate: 14,
  //     endDate: 15,
  //     color: "bg-violet-500",
  //     assignedTo: "josh",
  //     startHour: 15,
  //     endHour: 20
  //   }, {
  //     id: "conference-coverage",
  //     name: "Conference Coverage",
  //     startDate: 24,
  //     endDate: 26,
  //     color: "bg-emerald-500",
  //     assignedTo: "josh",
  //     startHour: 9,
  //     endHour: 18
  //   }]
  // }, {
  //   id: "nikhil",
  //   name: "Nikhil",
  //   photo: nikhilPhoto,
  //   role: "Wedding Photographer",
  //   projects: [{
  //     id: "engagement-shoot",
  //     name: "Engagement Session",
  //     startDate: 6,
  //     endDate: 8,
  //     color: "bg-amber-500",
  //     assignedTo: "nikhil"
  //   }, {
  //     id: "wedding-ceremony",
  //     name: "Wedding Ceremony",
  //     startDate: 17,
  //     endDate: 19,
  //     color: "bg-fuchsia-500",
  //     assignedTo: "nikhil"
  //   }, {
  //     id: "reception-party",
  //     name: "Reception Coverage",
  //     startDate: 29,
  //     endDate: 31,
  //     color: "bg-sky-500",
  //     assignedTo: "nikhil"
  //   }]
  // }, {
  //   id: "alan",
  //   name: "Alan",
  //   photo: alanPhoto,
  //   role: "Product Photographer",
  //   projects: [{
  //     id: "ecommerce-shoot",
  //     name: "E-commerce Products",
  //     startDate: 1,
  //     endDate: 6,
  //     color: "bg-orange-600",
  //     assignedTo: "alan",
  //     startHour: 10,
  //     endHour: 14
  //   }, {
  //     id: "jewelry-catalog",
  //     name: "Jewelry Catalog",
  //     startDate: 13,
  //     endDate: 17,
  //     color: "bg-purple-600",
  //     assignedTo: "alan",
  //     startHour: 9,
  //     endHour: 15
  //   }, {
  //     id: "tech-products",
  //     name: "Tech Product Shots",
  //     startDate: 21,
  //     endDate: 25,
  //     color: "bg-blue-600",
  //     assignedTo: "alan",
  //     startHour: 11,
  //     endHour: 17
  //   }]
  // }, {
  //   id: "martyn",
  //   name: "Martyn",
  //   photo: martynPhoto,
  //   role: "Studio Manager",
  //   projects: [{
  //     id: "studio-management",
  //     name: "Studio Operations",
  //     startDate: 1,
  //     endDate: 31,
  //     color: "bg-gray-500",
  //     assignedTo: "martyn",
  //     startHour: 7,
  //     endHour: 19
  //   }, {
  //     id: "equipment-maintenance",
  //     name: "Equipment Check",
  //     startDate: 10,
  //     endDate: 12,
  //     color: "bg-red-600",
  //     assignedTo: "martyn",
  //     startHour: 6,
  //     endHour: 10
  //   }]
  // }
];
export type TimeView = 'Day' | 'week' | 'month';

// Generate different time periods
const augustDates = Array.from({
  length: 31
}, (_, i) => i + 1);
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const years = ['2022', '2023', '2024', '2025', '2026'];
export function GanttChart() {


  const today = new Date();
  const { roles } = useRole(); // Get roles to look up role name by ID
  const [timeView, setTimeView] = useState<TimeView>('month');
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
      // Dialog just closed
      setDialogCloseTrigger(prev => prev + 1); // trigger for child
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

  // Project selection effect
  useEffect(() => {
    if (selectedProject && scheduleHourlyRef.current && isProjectClick) {
      scheduleHourlyRef.current.scrollToProjectDetails();
      setIsProjectClick(false); // Reset after scrolling
    }
  }, [selectedProject, isProjectClick]);
  // useEffect(() => {
  //   // Preload countries when app starts
  //   preloadCountries();
  // }, []);


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
  }, [selectedMonth, selectedYear, selectedWeek, timeView, colorUpdate, setColorUpdate]);


  const handleJumpToToday = () => {
    const today = new Date();

    if (timeView === 'week') {
      // Reset to current week
      setSelectedDay(today.getDate());
      setSelectedWeek(getISOWeek(today));
      setSelectedYear(today.getFullYear());
    } else {
      // Reset to current day/month/year for month view
      setSelectedDay(today.getDate());
      setSelectedMonth(today.getMonth() + 1);
      setSelectedYear(today.getFullYear());
    }
    setIsDayClick(true);

  };
  const addNewTeamMember = async (memberData: {
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
      // Find the role name from the roles array using roleId
      const selectedRole = roles.find(r => r.id === memberData.roleId);
      const roleName = selectedRole?.name || memberData.role;
      
      const response = await addMember({
        name: memberData.name,
        email: memberData.email,
        roleId: memberData.roleId, // Use roleId instead of role
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
        role: roleName, // Use role name from roles array
        active: memberData.active,
        countryCode: memberData.countryCode,
        phone: memberData.phone,
        roleId: memberData.roleId,
        projects: response.member?.projects || [],
        location: memberData.location,
        bio: memberData.bio,
        skills: memberData.skills || [],
        isAdmin: false
      };

      setTeamMembers((prev) => [newMember, ...prev]);
      toast.success(`Invitation sent to ${memberData.name}!`);

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



  // Get current time periods and scale factor based on view
  const getTimeData = () => {
    switch (timeView) {
      case 'month':
        return {
          periods: months,
          scale: 31,
          unit: 'day'
        };
      default:
        return {
          periods: augustDates,
          scale: 7,
          unit: 'day'
        };
    }
  };
  const {
    periods,
    scale,
    unit
  } = getTimeData();

  const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Get who's working on a specific day
  const getWorkersForDay = (day: number, month: number, year: number) => {
    const targetDate = normalizeDate(new Date(year, month - 1, day));

    return teamMembers
      .filter(member =>
        member.projects && member.projects.some(project => {
          const start = normalizeDate(new Date(project.startDate));
          const end = normalizeDate(new Date(project.endDate));
          return targetDate >= start && targetDate <= end;
        })
      )
      .map(member => ({
        ...member,
        activeProjects: member.projects.filter(project => {
          const start = normalizeDate(new Date(project.startDate));
          const end = normalizeDate(new Date(project.endDate));
          return targetDate >= start && targetDate <= end;
        }),
      }));
  };
  const getAvailableForDay = (day: number, month: number, year: number) => {
    const targetDate = normalizeDate(new Date(year, month - 1, day));

    return teamMembers.filter(member =>
      !member.projects?.some(project => {
        const start = normalizeDate(new Date(project.startDate));
        const end = normalizeDate(new Date(project.endDate));
        return targetDate >= start && targetDate <= end;
      })
    );
  };

  // Get hourly bookings for selected day
  const getHourlyBookings = (day: number, month: number, year: number) => {
    const targetDate = normalizeDate(new Date(year, month - 1, day));

    const bookings: Array<{
      startHour: number;
      endHour: number;
      projectName: string;
      memberName: string;
      memberPhoto: string;
      color: string;
      memberRingColor: string;
    }> = [];

    teamMembers?.forEach(member => {
      member?.projects?.forEach(project => {
        const start = normalizeDate(new Date(project.startDate));
        const end = normalizeDate(new Date(project.endDate));

        if (
          targetDate >= start &&
          targetDate <= end &&
          project.startHour !== undefined &&
          project.endHour !== undefined
        ) {
          bookings.push({
            startHour: project.startHour,
            endHour: project.endHour,
            projectName: project.name,
            memberName: member.name,
            memberPhoto: member.profilePhoto,
            color: project.color,
            memberRingColor: member.ringColor
          });
        }
      });
    });

    return bookings.sort((a, b) => a.startHour - b.startHour);
  };

  const workersToday = (selectedDay && selectedMonth && selectedYear)
    ? getWorkersForDay(selectedDay, selectedMonth, selectedYear)
    : [];
  const availableToday = (selectedDay && selectedMonth && selectedYear)
    ? getAvailableForDay(selectedDay, selectedMonth, selectedYear)
    : [];

  const hourlyBookingsToday = (selectedDay && selectedMonth && selectedYear)
    ? getHourlyBookings(selectedDay, selectedMonth, selectedYear)
    : [];

  // Filter team members based on search query
  const filteredTeamMembers = teamMembers.filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.role.toLowerCase().includes(searchQuery.toLowerCase()) || member.projects.some(project => project.name.toLowerCase().includes(searchQuery.toLowerCase())));



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
        setSelectedDay={setSelectedDay}
        teamMembers={filteredTeamMembers}
        refreshMembers={refreshMembers}
        onDialogCloseTrigger={dialogCloseTrigger}
        onDateClick={handleJumpToToday}
      />

      {/* Main Content */}
      <div className="mt-12 lg:mt-0 flex-1 px-6 py-6 overflow-x-hidden">
        {/* Header */}
        <HeaderWithClock
          timeView={timeView}
          onDateClick={handleJumpToToday}
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
            // getProjectPosition={getProjectPosition}
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
            setIsProjectClick={setIsProjectClick}
            onRingColorUpdate={() => setColorUpdate(true)}
          />

          <ScheduleHourly
            ref={scheduleHourlyRef}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            timeView={timeView}
            teamMembers={teamMembers}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            getWorkersForDay={getWorkersForDay}
            getAvailableForDay={getAvailableForDay}
            getHourlyBookings={getHourlyBookings}
            hourlyBookingsToday={hourlyBookingsToday}
            workersToday={workersToday}
            availableToday={availableToday}
            currentMonth={selectedMonth}
            currentYear={selectedYear}
            setSelectedMember={setSelectedMember}
            onAddSection={async () => {
              refreshMembers();
            }}
          />
        </div>


        {/* Team Availability Table Dialog */}
        <TeamAvailabilityTable
          isOpen={showTeamAvailability}
          onClose={() => setShowTeamAvailability(false)}
          // teamMembers={teamMembers}
          setSelectedProject={setSelectedProject}
          setSelectedMember={setSelectedMember}
          setIsProjectClick={setIsProjectClick}
          team={teamMembers}
        />

        <TeamMemberProfile
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
          refreshMembers={refreshMembers}
          onUpdateMember={async (memberId, updates) => {
            refreshMembers();
            // setTeamMembersState(prev => prev.map(member =>
            //   member.id === memberId ? { ...member, ...updates } : member
            // ));

            setSelectedMember(prevSelected =>
              prevSelected && prevSelected.id === memberId
                ? { ...prevSelected, ...updates }
                : prevSelected
            );

          }}
          onDeleteMember={async (memberId) => {
            setTeamMembers(prev => prev.filter(member => member.id !== memberId));
            refreshMembers();
          }

          }
          onUpdateProject={(memberId, projectId, updates) => {
            setTeamMembers(prev => prev.map(member =>
              member.id === memberId
                ? {
                  ...member,
                  projects: member.projects.map(project =>
                    project.id === projectId ? { ...project, ...updates } : project
                  )
                }
                : member
            ));
          }}
          onAddProject={(memberId, projectData) => {
            const newProject = {
              ...projectData,
              id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            setTeamMembers(prev => prev.map(member =>
              member.id === memberId
                ? { ...member, projects: [...member.projects, newProject] }
                : member
            ));
          }}
          onDeleteProject={(memberId, projectId) => {
            setTeamMembers(prev => prev.map(member =>
              member.id === memberId
                ? { ...member, projects: member.projects.filter(p => p.id !== projectId) }
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