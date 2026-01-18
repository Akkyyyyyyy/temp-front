import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DayCalendar } from "@/components/DayCalendar";
import { ProjectDetails } from "./ProjectDetails";
import { TimeView } from "./GanttChart";
import { TeamMember } from "./TeamMembers";
import { monthNames } from "@/constant/constant";
import { formatTime, getFallback } from "@/helper/helper";
import { useAuth } from "@/context/AuthContext";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface ScheduleHourlyProps {
  selectedDay?: number;
  setSelectedDay: (day: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  timeView: TimeView;
  teamMembers: TeamMember[];
  googleCalendarEvents?: any[];
  selectedProject: string | null;
  selectedEvent: string | null;
  isProjectClick: boolean;
  isEventClick: boolean;
  setIsProjectClick: (bool: boolean) => void;
  setIsEventClick: (bool: boolean) => void;
  setSelectedProject: (projectId: string | null) => void;
  getWorkersForDay: (day: number, month: number, year: number) => any[]; // Keep original signature
  getAvailableForDay: (day: number, month: number, year: number) => any[];
  getHourlyBookings: (day: number, month: number, year: number) => any[];
  hourlyBookingsToday: any[];
  workersToday: any[];
  availableToday: any[];
  currentMonth: number;
  currentYear: number;
  setSelectedMember: (member: TeamMember) => void;
  onAddSection: () => void;
  onAddTeamMember: () => void;
}

// Define the ref interface
export interface ScheduleHourlyRef {
  scrollToDayCalendar: () => void;
  scrollToProjectDetails: () => void;
  scrollToEventDetails: () => void;
}

export const ScheduleHourly = forwardRef<ScheduleHourlyRef, ScheduleHourlyProps>(
  function ScheduleHourly({
    selectedDay,
    setSelectedDay,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedWeek,
    setSelectedWeek,
    timeView,
    teamMembers,
    googleCalendarEvents = [],
    selectedProject,
    setSelectedProject,
    getWorkersForDay,
    getAvailableForDay,
    getHourlyBookings,
    hourlyBookingsToday,
    workersToday,
    availableToday,
    currentMonth,
    currentYear,
    setSelectedMember,
    onAddSection,
    onAddTeamMember,
    selectedEvent,
    isProjectClick,
    isEventClick,
    setIsProjectClick,
    setIsEventClick
  }, ref) {
    const [showAvailable, setShowAvailable] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    // Create refs for scrolling
    const dayCalendarRef = useRef<HTMLDivElement>(null);
    const projectDetailsRef = useRef<HTMLDivElement>(null);
    const EventDetailsRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Auto-scroll to project details when selectedProject changes
    useEffect(() => {
      if (selectedProject && projectDetailsRef.current) {
        setTimeout(() => {
          scrollToProjectDetails();
        }, 600);
      }
    }, [selectedProject, isProjectClick]);

    useEffect(() => {
      const scrollTimer = setTimeout(() => {
        if (EventDetailsRef?.current) {
          EventDetailsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          console.log("EventDetailsRef still null, component may not be mounted yet");
        }
      }, 600);
      setIsEventClick(false);
      return () => clearTimeout(scrollTimer);
    }, [selectedEvent, isProjectClick, isEventClick]);

    // Scroll functions
    const scrollToDayCalendar = () => {
      if (dayCalendarRef.current) {
        dayCalendarRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    const scrollToProjectDetails = () => {
      setTimeout(() => {
        if (projectDetailsRef.current) {
          projectDetailsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 600);
    };

    const scrollToEventDetails = () => {
      setTimeout(() => {
        if (EventDetailsRef.current) {
          EventDetailsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 600);
    };
    // Expose the scroll functions via the forwardRef
    useImperativeHandle(ref, () => ({
      scrollToDayCalendar,
      scrollToProjectDetails,
      scrollToEventDetails
    }));
    const getCombinedWorkersToday = () => {
      if (!googleCalendarEvents || googleCalendarEvents.length === 0) {
        return workersToday;
      }

      // Create a map to combine workers
      const workerMap = new Map();

      // Add regular workers
      workersToday.forEach(worker => {
        workerMap.set(worker.id, {
          ...worker,
          activeProjects: [...(worker.activeProjects || [])]
        });
      });

      // Add Google Calendar events as separate "workers"
      googleCalendarEvents.forEach(googleEvent => {
        const googleWorkerId = `google-${googleEvent.id}`;

        if (workerMap.has(googleWorkerId)) {
          // If already exists, add the Google event to activeProjects
          const existingWorker = workerMap.get(googleWorkerId);
          existingWorker.activeProjects.push({
            id: googleEvent.id,
            name: 'Google Calendar',
            color: '#4285F4',
            eventName: googleEvent.name || 'Google Event',
            time: googleEvent.allDay ? 'All Day' :
              (googleEvent.startHour !== null && googleEvent.endHour !== null ?
                `${googleEvent.startHour}:00 - ${googleEvent.endHour}:00` : ''),
            eventId: googleEvent.id,
            startHour: googleEvent.startHour,
            endHour: googleEvent.endHour,
            location: googleEvent.location || '',
            role: 'Busy',
            isOther: true,
            isGoogleCalendarEvent: true,
            allDay: googleEvent.allDay,
            multiDay: googleEvent.multiDay
          });
        } else {
          // Create new entry for Google Calendar "worker"
          workerMap.set(googleWorkerId, {
            id: googleWorkerId,
            name: googleEvent.organizer || 'Google Calendar',
            profilePhoto: '', // No photo for Google events
            role: 'Google Calendar Event',
            activeProjects: [{
              id: googleEvent.id,
              name: 'Google Calendar',
              color: '#4285F4',
              eventName: googleEvent.name || 'Google Event',
              time: googleEvent.allDay ? 'All Day' :
                (googleEvent.startHour !== null && googleEvent.endHour !== null ?
                  `${googleEvent.startHour}:00 - ${googleEvent.endHour}:00` : ''),
              eventId: googleEvent.id,
              startHour: googleEvent.startHour,
              endHour: googleEvent.endHour,
              location: googleEvent.location || '',
              role: 'Busy',
              isOther: true,
              isGoogleCalendarEvent: true,
              allDay: googleEvent.allDay,
              multiDay: googleEvent.multiDay
            }],
            isGoogleEvent: true
          });
        }
      });

      return Array.from(workerMap.values());
    };

    // Combine availableToday, filtering out Google events
    const getCombinedAvailableToday = () => {
      return availableToday;
    };

    const combinedWorkersToday = getCombinedWorkersToday();
    const combinedAvailableToday = getCombinedAvailableToday();

    // Filter members based on current view and search query
    const getFilteredMembers = () => {
      const currentMembers = showAvailable ? combinedAvailableToday : combinedWorkersToday;

      if (!searchQuery.trim()) {
        return currentMembers;
      }

      const query = searchQuery.toLowerCase().trim();
      return currentMembers.filter(member =>
        member.name.toLowerCase().includes(query) ||
        (member.role && member.role.toLowerCase().includes(query)) ||
        (member.email && member.email.toLowerCase().includes(query))
      );
    };

    if (!selectedDay) {
      return null;
    }

    // Get workers for the current day using the original function signature
    const workers = combinedWorkersToday.length > 0 ? combinedWorkersToday : getWorkersForDay(selectedDay, currentMonth, currentYear);

    const projects = workers.flatMap(worker => worker.activeProjects || []);
    const uniqueProjectsMap = new Map();
    projects.forEach(project => {
      if (!project.isOther && !uniqueProjectsMap.has(project.id)) {
        uniqueProjectsMap.set(project.id, project);
      }
    });
    const uniqueProjects = Array.from(uniqueProjectsMap.values());

    // Get filtered members for display
    const filteredMembers = getFilteredMembers();


    // Function to handle project click
    const handleProjectClick = (projectId: string) => {
      const newSelectedProject = selectedProject === projectId ? null : projectId;
      setSelectedProject(newSelectedProject);
      setIsProjectClick(true);
    };

    if (!selectedDay) {
      return null;
    }

    // Get workers for the current day using the original function signature
    // const workers = workersToday.length > 0 ? workersToday : getWorkersForDay(selectedDay, currentMonth, currentYear);

    // const projects = workers.flatMap(worker => worker.activeProjects || []);
    // const uniqueProjectsMap = new Map();
    // projects.forEach(project => {
    //   if (!project.isOther && !uniqueProjectsMap.has(project.id)) {
    //     uniqueProjectsMap.set(project.id, project);
    //   }
    // });
    // const uniqueProjects = Array.from(uniqueProjectsMap.values());

    return (
      <div className="mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6">
        <div className="p-4 sm:p-6 bg-muted/30 rounded-lg border border-border/20">
          <div className="space-y-3 sm:space-y-4 mb-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground text-center sm:text-left w-full sm:w-auto">
                {selectedDay} {monthNames[currentMonth - 1]} {currentYear} - {showAvailable ? "Who's Available" : "Who's Working"}
                {searchQuery && ` (${filteredMembers.length} found)`}
              </h3>
              {/* Toggle Switch */}
              <div className="flex justify-center sm:justify-end w-full sm:w-auto">
                <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1 border border-border shadow-sm relative">
                  <div
                    className={`
                      absolute bg-studio-gold rounded-full shadow-sm transition-all duration-300 ease-in-out
                      ${showAvailable ? 'left-1 translate-x-full' : 'left-1'}
                      w-[calc(50%-4px)] h-[calc(100%-8px)] 
                    `}
                  />
                  {['working', 'available'].map((view) => (
                    <Button
                      key={view}
                      onClick={() => {
                        setShowAvailable(view === 'available');
                        setSearchQuery(""); // Clear search when switching views
                      }}
                      size="sm"
                      className={`bg-studio-gold
                        relative capitalize px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-300
                        hover:bg-transparent
                        ${showAvailable === (view === 'available')
                          ? 'text-primary-foreground'
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                        }
                      `}
                      variant="ghost"
                    >
                      {view === 'working' ? 'Working' : 'Available'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search and Filters Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={`Search ${showAvailable ? 'available' : 'working'} team members...`}
                  className="pl-10 w-full text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs h-6 px-2"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Project Filter Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Projects:</span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {uniqueProjects.map((project: any) => (
                    <Button
                      key={project.id}
                      variant={selectedProject === project.id ? "default" : "outline"}
                      size="sm"
                      className={`
                        text-xs px-2 sm:px-3 py-1 h-7 sm:h-8 flex items-center flex-shrink-0
                        ${selectedProject === project.id
                          ? 'bg-studio-gold border border-transparent '
                          : 'bg-background text-foreground border border-gray-800'
                        }
                      `}
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-1 sm:mr-2 flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate max-w-[80px] sm:max-w-none">
                        {project.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Team Members Grid */}
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredMembers.map(worker => (
                <div
                  key={worker.id}
                  className="bg-background rounded-lg p-3 sm:p-4 border border-border/20 hover:border-border/40 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 mb-3 cursor-pointer"
                    onClick={() => !worker.isGoogleEvent && setSelectedMember(worker)}
                  >
                    {!worker.isGoogleEvent ? (
                      <Avatar
                        className="w-8 h-8 sm:w-10 sm:h-10 ring-1 ring-green-500 flex-shrink-0"
                        style={{
                          borderColor: worker.ringColor || 'hsl(var(--muted))',
                          boxShadow: `0 0 0 2px ${worker.ringColor || 'hsl(var(--muted))'}`
                        }}
                      >
                        <AvatarImage
                          src={`${S3_URL}/${worker.profilePhoto}`}
                          alt={worker.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-studio-gold text-studio-dark font-semibold text-xs">
                          {getFallback(worker.name)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.5 12.5L20 20" stroke="currentColor" strokeWidth="2" />
                          <path d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
                        {worker.name}
                        {worker.isGoogleEvent && <span className="ml-2 text-xs text-blue-500">(Google)</span>}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {worker.role}
                      </p>
                    </div>
                  </div>

                  {!showAvailable && (worker as any).activeProjects && (
                    <div className="space-y-2">
                      <h5 className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Active Projects:
                      </h5>
                      <div className="space-y-1">
                        {(worker as any).activeProjects.map((project: any) => {
                          
                          const isOtherEvent = project.isOther;
                          const isGoogleEvent = project.isGoogleCalendarEvent;

                          // Check if Google event belongs to current user
                          const isCurrentUsersEvent = isGoogleEvent && project.userId === user?.data?.id;

                          return (
                            <div key={project.id} className="flex items-center gap-2 text-xs sm:text-sm">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={isOtherEvent || isGoogleEvent ? {
                                  background: isGoogleEvent ?
                                    (isCurrentUsersEvent ?
                                      'radial-gradient(circle at 30% 30%, #ffffff 0%, #4285F4 50%, #4285F4 100%)' : // Blue for user's own Google events
                                      'radial-gradient(circle at 30% 30%, #ffffff 0%, #9ca3af 50%, #4b5563 100%)'  // Gray for others
                                    ) :
                                    'radial-gradient(circle at 30% 30%, #ffffff 0%, #9ca3af 50%, #4b5563 100%)'
                                } : { backgroundColor: project.color }}
                              />
                              <span className={`truncate flex-1 ${isOtherEvent || isGoogleEvent ? 'text-gray-500' : 'text-foreground'}`}>
                                {isGoogleEvent ? (
                                  isCurrentUsersEvent ? (
                                    <>
                                      <span className="text-blue-500">Google: </span>
                                      {project.eventName}
                                    </>
                                  ) : (
                                    'Busy' // Show as "Busy" for other users' Google events
                                  )
                                ) : isOtherEvent ? (
                                  'Busy'
                                ) : (
                                  <>
                                    {project.name}
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {project.eventName}
                                    </span>
                                  </>
                                )}
                              </span>
                              {project.time && (
                                <span className={`text-xs whitespace-nowrap ml-2 ${isOtherEvent || isGoogleEvent ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                  {isGoogleEvent && project.allDay ? 'All Day' : project.time}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showAvailable && (
                    <div className="text-xs sm:text-sm text-green-600 font-medium">
                      Available all day
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
              {searchQuery
                ? `No ${showAvailable ? 'available' : 'working'} team members found matching "${searchQuery}"`
                : `No ${showAvailable ? 'available' : 'working'} team members for this day`
              }
            </div>
          )}

          {/* Project Details Section */}
          {selectedProject && (
            <div className="mt-6 sm:mt-8">
              <ProjectDetails
                projectId={selectedProject}
                teamMembers={teamMembers}
                onClose={() => setSelectedProject(null)}
                setSelectedMember={setSelectedMember}
                onAddSection={onAddSection}
                onReady={scrollToProjectDetails}
                onAddTeamMember={onAddTeamMember}
                eventItem={selectedEvent}
                EventDetailsRef={EventDetailsRef}
                isEventClick={isEventClick}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);