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
  setSelectedProject: (projectId: string | null) => void;
  getWorkersForDay: (day: number, month: number, year: number) => any[];
  getAvailableForDay: (day: number, month: number, year: number) => any[];
  getHourlyBookings: (day: number, month: number, year: number) => any[];
  hourlyBookingsToday: any[];
  workersToday: any[];
  availableToday: any[];
  currentMonth: number;
  currentYear: number;
  setSelectedMember: (member: TeamMember) => void;
  onAddSection: () => void;
}

// Define the ref interface
export interface ScheduleHourlyRef {
  scrollToDayCalendar: () => void;
  scrollToProjectDetails: () => void;
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
  }, ref) {
    const [showAvailable, setShowAvailable] = useState(false);

    // Create refs for scrolling
    const dayCalendarRef = useRef<HTMLDivElement>(null);
    const projectDetailsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to project details when selectedProject changes
    useEffect(() => {
      if (selectedProject && projectDetailsRef.current) {
        // Small timeout to ensure the DOM is updated
        setTimeout(() => {
          scrollToProjectDetails();
        }, 50);
      }
    }, [selectedProject]);

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
      if (projectDetailsRef.current) {
        projectDetailsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Alternative approach using container scrolling if needed
        // if (containerRef.current && projectDetailsRef.current) {
        //   const container = containerRef.current;
        //   const target = projectDetailsRef.current;
        //   const offset = 20; // Adjust this value as needed
        //   const targetPosition = target.offsetTop - container.offsetTop - offset;
        //   
        //   container.scrollTo({
        //     top: targetPosition,
        //     behavior: 'smooth'
        //   });
        // }
      }
    };

    // Expose the scroll functions via the forwardRef
    useImperativeHandle(ref, () => ({
      scrollToDayCalendar,
      scrollToProjectDetails
    }));

    // Function to handle project click
    const handleProjectClick = (projectId: string) => {
      const newSelectedProject = selectedProject === projectId ? null : projectId;
      setSelectedProject(newSelectedProject);
      
      // If we're selecting a project (not deselecting), scroll to project details
      // Note: The useEffect above will handle the scrolling automatically
    };

    if (!selectedDay) {
      return null;
    }

    const projects = workersToday.flatMap(worker => worker.activeProjects || []);
    const uniqueProjectsMap = new Map();
    projects.forEach(project => {
      if (!uniqueProjectsMap.has(project.id)) {
        uniqueProjectsMap.set(project.id, project);
      }
    });
    const uniqueProjects = Array.from(uniqueProjectsMap.values());

    return (
      <div ref={containerRef} className="mt-8 space-y-6">
        <div className="p-6 bg-muted/30 rounded-lg border border-border/20">
          <div className="space-y-4 mb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">
                {monthNames[currentMonth - 1]} {selectedDay}, {currentYear} - {showAvailable ? "Who's Available" : "Who's Working Today"}
              </h3>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1 border border-border shadow-sm relative">
                  <div
                    className={`
                      absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out
                      ${showAvailable ? 'left-1 translate-x-full' : 'left-1'}
                      w-[calc(50%-4px)] h-[calc(100%-8px)] 
                    `}
                  />

                  {['working', 'available'].map((view) => (
                    <Button
                      key={view}
                      onClick={() => setShowAvailable(view === 'available')}
                      size="sm"
                      className={`
                        relative capitalize px-4 py-1.5 text-sm rounded-full transition-all duration-300
                        hover:bg-transparent
                        ${
                          showAvailable === (view === 'available')
                            ? 'text-primary-foreground'
                            : 'bg-transparent text-muted-foreground hover:text-foreground'
                        }
                      `}
                      variant="ghost"
                    >
                      {view === 'working' ? 'Show Working' : 'Show Available'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search bar for day details */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search team members..." className="pl-10" />
              </div>

              {/* Project filter buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Projects:</span>
                {uniqueProjects.map((project: any) => (
                  <Button
                    key={project.id}
                    variant={selectedProject === project.id ? "default" : "outline"}
                    size="sm"
                    className={`
                      text-xs
                      px-3
                      py-1.5
                      h-8
                      flex
                      items-center
                      ${selectedProject === project.id ? 'bg-primary border border-transparent' : 'bg-background text-foreground border border-gray-800'}
                    `}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2`}
                    style={{ backgroundColor: project.color }}></div>
                    {project.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(showAvailable ? availableToday : workersToday).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAvailable ? availableToday : workersToday).map(worker => (
                <div key={worker.id} className="bg-background rounded-lg p-4 border border-border/20 ">
                  <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setSelectedMember(worker)}>
                    <Avatar className="w-10 h-10 ring-1 ring-green-500" 
                    style={{
                            borderColor: worker.ringColor || 'hsl(var(--muted))',
                            boxShadow: `0 0 0 2px ${worker.ringColor || 'hsl(var(--muted))'}`
                          }}>
                      <AvatarImage
                        src={`${S3_URL}/${worker.profilePhoto}`}
                        alt={worker.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-studio-gold text-studio-dark font-semibold">
                        {worker.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{worker.name}</h4>
                      <p className="text-sm text-muted-foreground">{worker.role}</p>
                    </div>
                  </div>

                  {!showAvailable && (worker as any).activeProjects && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Active Projects:</h5>
                      {(worker as any).activeProjects.map((project: any) => (
                        <div key={project.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full`}
                          style={{ backgroundColor: project.color }}></div>
                          <span className="text-foreground">{project.name}</span>
                          {project.time && <span className="text-muted-foreground ml-auto">{project.time}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {showAvailable && (
                    <div className="text-sm text-green-600 font-medium">Available all day</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No {showAvailable ? 'available' : 'working'} team members for this day
            </div>
          )}

          {/* Project Details Section with ref */}
          {selectedProject && (
            <div ref={projectDetailsRef} className="mt-8">
              <ProjectDetails
                projectId={selectedProject}
                teamMembers={teamMembers}
                onClose={() => setSelectedProject(null)}
                setSelectedMember={setSelectedMember}
                onAddSection={onAddSection}
              />
            </div>
          )}

          {/* Day Calendar with ref */}
          <div ref={dayCalendarRef} className="mt-8">
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
            />
          </div>
        </div>
      </div>
    );
  }
);