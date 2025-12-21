import { getMembersWithFutureProjects } from "@/api/member";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Search, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TeamMember } from "./TeamMembers";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getFallback } from "@/helper/helper";

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface Event {
  isOther: any;
  eventId: string;
  date: string;
  startHour: number;
  endHour: number;
  location: string;
  reminders: {
    dayBefore: boolean;
    weekBefore: boolean;
  };
  status?: string;
  name?: string;
  project: {
    id: string;
    name: string;
    color: string;
    description: string;
    client: any;
    brief: any;
    logistics: any;
  };
  assignment: {
    id: string;
    role: string;
    roleId: string;
    instructions: any;
    googleEventId: any;
  };
}

interface TeamAvailabilityTableProps {
  isOpen: boolean;
  onClose: () => void;
  setSelectedProject: (project: any) => void;
  setSelectedMember: (member: any) => void;
  setIsProjectClick: (projectClick: boolean) => void;
  setSelectedEvent: (event: any) => void;
  setIsEventClick: (eventClick: boolean) => void;
  team: any[];
}

interface BookingEntry {
  memberName: string;
  memberColor: string;
  memberPhoto: string;
  memberRole: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventStartHour: number;
  eventEndHour: number;
  projectName: string;
  projectId: string;
  projectColor: string;
  dates: string;
  timeSlot: string;
  responsibility: string;
  startDate: string;
  endDate: string;
  memberId: string;
  location: string;
  assignment?: {
    id: string;
    role: string;
    roleId: string;
    instructions: any;
    googleEventId: any;
  };
}

const DatePicker = ({ date, handleDateRange }: { date: { startDate: Date; endDate: Date }, handleDateRange: (val: { startDate: Date; endDate: Date }) => void }) => {
  const [openDatePicker, setOpenDatePicker] = useState(false)
  return (
    <div className="space-y-2">
      <Popover open={openDatePicker} onOpenChange={(val) => setOpenDatePicker(val)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal`}
            id="dateRange"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {date.startDate && date.endDate ? (
              <>
                {format(new Date(date.startDate), "PPP")} - {format(new Date(date.endDate), "PPP")}
              </>
            ) : date.startDate ? (
              `${format(new Date(date.startDate), "PPP")}`
            ) : (
              <span>Filter by Date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-center p-2 border-b">
              <span className="text-sm font-medium">
                {date.startDate && !date.endDate
                  ? 'Select end date'
                  : 'Select date range'
                }
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { handleDateRange({ startDate: null, endDate: null }) }}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <Calendar
              mode="range"
              classNames={{
                day_today: "",
              }}
              defaultMonth={date.startDate ? new Date(date.startDate) : new Date()}
              selected={
                date.startDate
                  ? {
                    from: new Date(date.startDate),
                    to: date.endDate ? new Date(date.endDate) : undefined
                  }
                  : undefined
              }
              onSelect={(range) => { handleDateRange({ startDate: range.from ?? null, endDate: range.to ?? null }) }}
              initialFocus
              numberOfMonths={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function TeamAvailabilityTable({ isOpen, onClose, setSelectedProject, setIsProjectClick, setSelectedEvent, setIsEventClick, setSelectedMember, team }: TeamAvailabilityTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null })
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const companyId = user.data.company?.id;

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMembersWithFutureProjects(companyId);
      setTeamMembers(data.data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
      console.error('Error fetching team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const bookingEntries = useMemo((): BookingEntry[] => {
    if (!teamMembers.length) return [];

    const entries: BookingEntry[] = [];

    teamMembers.forEach(member => {
      member?.events?.forEach((event: Event) => {
        if (event.isOther) return;

        const formatTimeUK = (hour: number) => {
          if (hour === 0) return '12:00 AM';
          if (hour === 12) return '12:00 PM';
          return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
        };

        const timeSlot = event.startHour && event.endHour
          ? `${formatTimeUK(event.startHour)} - ${formatTimeUK(event.endHour)}`
          : "All day";

        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        const eventName = event.name || event.project.name;

        entries.push({
          memberName: member.name,
          memberColor: member.ringColor,
          memberPhoto: member.profilePhoto,
          memberRole: member.role,
          eventId: event.eventId,
          eventName: eventName,
          eventDate: event.date,
          eventStartHour: event.startHour,
          eventEndHour: event.endHour,
          projectName: event.project.name,
          projectId: event.project.id,
          projectColor: event.project.color,
          dates: formattedDate,
          timeSlot,
          responsibility: event.assignment.role || "No Role Assigned",
          startDate: event.date,
          endDate: event.date,
          memberId: member.id,
          location: event.location,
          assignment: event.assignment
        });
      });
    });

    return entries.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      return a.memberName.localeCompare(b.memberName);
    });
  }, [teamMembers]);

  const filteredBookings = useMemo(() => {
    let res = bookingEntries;

    if (dateRange.startDate && dateRange.endDate) {
      res = res.filter(booking => {
        const selectedStart = new Date(format(dateRange.startDate, "yyyy-MM-dd")).getTime();
        const selectedEnd = new Date(format(dateRange.endDate, "yyyy-MM-dd")).getTime();

        const bookingDate = new Date(booking.startDate).getTime();

        return bookingDate >= selectedStart && bookingDate <= selectedEnd;
      });

    } else if (dateRange.startDate && !dateRange.endDate) {
      const selectedDate = new Date(format(dateRange.startDate, "yyyy-MM-dd")).getTime();

      res = res.filter(booking => {
        const bookingDate = new Date(booking.startDate).getTime();
        return bookingDate === selectedDate;
      });

    } else if (!dateRange.startDate && dateRange.endDate) {
      const selectedDate = new Date(format(dateRange.endDate, "yyyy-MM-dd")).getTime();

      res = res.filter(booking => {
        const bookingDate = new Date(booking.startDate).getTime();
        return bookingDate === selectedDate;
      });

    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      res = res.filter(booking =>
        booking.memberName.toLowerCase().includes(query) ||
        booking.memberRole.toLowerCase().includes(query) ||
        booking.eventName.toLowerCase().includes(query) ||
        booking.projectName.toLowerCase().includes(query) ||
        booking.responsibility.toLowerCase().includes(query) ||
        booking.location.toLowerCase().includes(query)
      );
    }

    return res;
  }, [bookingEntries, searchQuery, dateRange]);

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setIsProjectClick(true);
    onClose();
  }

  const handleMemberClick = (memberId: string) => {
    const member = team.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      onClose();
    } else {
      console.warn(`Member with id ${memberId} not found in team array`);
    }
  }

  const handleEventClick = (eventId: string, memberId: string, projectId: string) => {
    
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      const event = member.events?.find(e => e.eventId === eventId);
      if (event) {
        const eventData = {
          id: event.eventId,
          name: event.name || event.project.name,
          date: event.date,
          startHour: event.startHour,
          endHour: event.endHour,
          location: event.location,
          project: event.project,
          assignment: event.assignment,
          member: {
            id: memberId,
            name: member.name,
            role: member.role,
            profilePhoto: member.profilePhoto
          }
        };

        setSelectedEvent(event.eventId);
        setIsEventClick(true);
        setSelectedProject(projectId);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Team Availability & Events
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-2">
          {/* Search Bar */}
          <div className="flex-shrink-0 mb-4">
            <div className="relative">
              <div className="flex w-full gap-3">
                <div className="w-3/5">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search team members, roles, events & projects"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                </div>
                <div className="w-2/5 relative">
                  <DatePicker date={{
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                  }}
                    handleDateRange={(val) => setDateRange(val)}
                  />
                </div>
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Loading team members...</p>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-destructive">Error: {error}</p>
              <Button onClick={fetchTeamMembers} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Results Summary */}
              <div className="flex-shrink-0 mb-4 text-sm text-muted-foreground">
                Showing {filteredBookings.length} of {bookingEntries.length} events
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-[900px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[150px]">Team Member</TableHead>
                        <TableHead className="min-w-[150px]">Event Role</TableHead>
                        <TableHead className="min-w-[150px]">Event</TableHead>
                        <TableHead className="min-w-[150px]">Project</TableHead>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                        <TableHead className="min-w-[120px]">Time Slot</TableHead>
                        <TableHead className="min-w-[150px]">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => (
                          <TableRow
                            key={`${booking.eventId}-${index}`}
                            className="group cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <TableCell>
                              <div
                                className="flex items-center gap-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMemberClick(booking.memberId);
                                }}
                              >
                                <Avatar className="w-10 h-10 transition-transform"
                                  style={{
                                    borderColor: booking.memberColor || 'hsl(var(--muted))',
                                    boxShadow: `0 0 0 2px ${booking.memberColor || 'hsl(var(--muted))'}`
                                  }}>
                                  <AvatarImage
                                    src={`${S3_URL}/${booking.memberPhoto}`}
                                    alt={booking.memberName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-studio-gold text-studio-dark">
                                    {getFallback(booking.memberName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium truncate transition-colors">
                                  {booking.memberName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                {booking.responsibility}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border truncate hover:opacity-80 transition-opacity"
                                style={{
                                  backgroundColor: `${booking.projectColor}20`,
                                  borderColor: booking.projectColor,
                                  color: 'inherit'
                                }}
                                onClick={() => handleEventClick(booking.eventId, booking.memberId, booking.projectId)}
                              >
                                {booking.eventName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                              >
                                {booking.projectName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm truncate">
                                <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                                {booking.dates}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm truncate">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {booking.timeSlot}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm truncate" title={booking.location}>
                                {booking.location}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                {searchQuery || dateRange.startDate || dateRange.endDate
                                  ? "No events found matching your search."
                                  : "No events found."}
                              </p>
                              {(searchQuery || dateRange.startDate || dateRange.endDate) && (
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSearchQuery("");
                                  setDateRange({ startDate: null, endDate: null });
                                }}>
                                  Clear filters
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}