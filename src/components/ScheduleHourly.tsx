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
import { getFallback } from "@/helper/helper";

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
  selectedProject: string | null;
  selectedEvent: string | null;
  isProjectClick: boolean;
  isEventClick:boolean;
  setIsProjectClick: (bool:boolean) => void;
  setIsEventClick: (bool:boolean) => void;
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

    // Create refs for scrolling
    const dayCalendarRef = useRef<HTMLDivElement>(null);
    const projectDetailsRef = useRef<HTMLDivElement>(null);
    const EventDetailsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to project details when selectedProject changes
    useEffect(() => {
      if (selectedProject && projectDetailsRef.current) {
        setTimeout(() => {
          scrollToProjectDetails();
        }, 600);
      }
    }, [selectedProject, isProjectClick]);

    useEffect(() => {
      if (selectedEvent) {
        // Wait for next render cycle to ensure ProjectDetails is mounted
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

        return () => clearTimeout(scrollTimer);
      }
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
    const workers = workersToday.length > 0 ? workersToday : getWorkersForDay(selectedDay, currentMonth, currentYear);

    const projects = workers.flatMap(worker => worker.activeProjects || []);
    const uniqueProjectsMap = new Map();
    projects.forEach(project => {
      if (!project.isOther && !uniqueProjectsMap.has(project.id)) {
        uniqueProjectsMap.set(project.id, project);
      }
    });
    const uniqueProjects = Array.from(uniqueProjectsMap.values());

    return (
      <div className="mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6">
        <div className="p-4 sm:p-6 bg-muted/30 rounded-lg border border-border/20">
          <div className="space-y-3 sm:space-y-4 mb-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground text-center sm:text-left w-full sm:w-auto">
                {selectedDay} {monthNames[currentMonth - 1]} {currentYear} - {showAvailable ? "Who's Available" : "Who's Working"}
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
                      onClick={() => setShowAvailable(view === 'available')}
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
                  placeholder="Search team members..."
                  className="pl-10 w-full text-sm sm:text-base"
                />
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
          {(showAvailable ? availableToday : workersToday).length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {(showAvailable ? availableToday : workersToday).map(worker => (
                <div
                  key={worker.id}
                  className="bg-background rounded-lg p-3 sm:p-4 border border-border/20 hover:border-border/40 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 mb-3 cursor-pointer"
                    onClick={() => setSelectedMember(worker)}
                  >
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
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
                        {worker.name}
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

                          return (
                            <div key={project.id} className="flex items-center gap-2 text-xs sm:text-sm">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={isOtherEvent ? {
                                  background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #9ca3af 50%, #4b5563 100%)'
                                } : { backgroundColor: project.color }}
                              />
                              <span className={`truncate flex-1 ${isOtherEvent ? 'text-gray-500' : 'text-foreground'}`}>
                                {isOtherEvent ? 'Private Event' : project.name}
                              </span>
                              {project.time && (
                                <span className={`text-xs whitespace-nowrap ml-2 ${isOtherEvent ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                  {project.time}
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
              No {showAvailable ? 'available' : 'working'} team members for this day
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

          {/* Day Calendar Section */}
          {/* <div ref={dayCalendarRef} className="mt-6 sm:mt-8">
            <DayCalendar
              date={`${monthNames[currentMonth - 1]} ${selectedDay}, ${currentYear}`}
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
          </div> */}
        </div>
      </div>
    );
  }
);