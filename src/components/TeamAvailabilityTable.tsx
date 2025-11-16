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

const S3_URL = import.meta.env.VITE_S3_BASE_URL;

interface Project {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  color: string;
  assignedTo?: string;
  startHour?: number;
  endHour?: number;
}

interface TeamAvailabilityTableProps {
  isOpen: boolean;
  onClose: () => void;
  setSelectedProject: (project: any) => void;
  setSelectedMember: (member: any) => void;
  setIsProjectClick: (projectClick: boolean) => void;
  team: any[];
}

interface BookingEntry {
  memberName: string;
  memberColor: string;
  memberPhoto: string;
  memberRole: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  dates: string;
  timeSlot: string;
  responsibility: string;
  startDate: string;
  endDate: string;
  memberId: string; // Add memberId to identify the member
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
              `Select end date for ${format(new Date(date.startDate), "PPP")}`
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
              {/* {(formData.startDate || formData.endDate) && ( */}
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
              {/* )} */}
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

export function TeamAvailabilityTable({ isOpen, onClose, setSelectedProject, setIsProjectClick, setSelectedMember, team }: TeamAvailabilityTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null })
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const companyId = user.data.company?.id;

  // Fetch team members when dialog opens
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    teamMembers.forEach(member => {
      member?.projects?.forEach(project => {
        // Format time in UK format (24-hour clock)
        const formatTimeUK = (hour: number) => {
          if (hour === 0) return '12:00 AM';
          if (hour === 12) return '12:00 PM';
          return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
        };

        const timeSlot = project.startHour && project.endHour
          ? `${formatTimeUK(project.startHour)} - ${formatTimeUK(project.endHour)}`
          : "All day";

        // Format dates as "10 Oct 2024"
        const formatDateUK = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        };

        const dates = project.startDate === project.endDate
          ? formatDateUK(project.startDate)
          : `${formatDateUK(project.startDate)} - ${formatDateUK(project.endDate)}`;

        entries.push({
          memberName: member.name,
          memberColor: member.ringColor,
          memberPhoto: member.profilePhoto,
          memberRole: member.role,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          dates,
          timeSlot,
          responsibility: project.newRole || "No Role Assigned",
          startDate: project.startDate,
          endDate: project.endDate,
          memberId: member.id // Add memberId here
        });
      });
    });

    // Sort by startDate first, then by memberName
    return entries.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      return a.memberName.localeCompare(b.memberName);
    });
  }, [teamMembers]);

  // Filter bookings based on search query
  const filteredBookings = useMemo(() => {
    let res = bookingEntries;

    if (dateRange.startDate && dateRange.endDate) {
      res = res.filter(booking => {
        const selectedStart = new Date(format(dateRange.startDate, "yyyy-MM-dd")).getTime();
        const selectedEnd = new Date(format(dateRange.endDate, "yyyy-MM-dd")).getTime();

        const bookingStart = new Date(booking.startDate).getTime();
        const bookingEnd = new Date(booking.endDate).getTime();

        // Ranges overlap
        return bookingStart <= selectedEnd && bookingEnd >= selectedStart;
      });

    } else if (dateRange.startDate && !dateRange.endDate) {
      const selectedDate = new Date(format(dateRange.startDate, "yyyy-MM-dd")).getTime();

      res = res.filter(booking => {
        const bookingStart = new Date(booking.startDate).getTime();
        const bookingEnd = new Date(booking.endDate).getTime();

        return selectedDate >= bookingStart && selectedDate <= bookingEnd;
      });

    } else if (!dateRange.startDate && dateRange.endDate) {
      const selectedDate = new Date(format(dateRange.endDate, "yyyy-MM-dd")).getTime();

      res = res.filter(booking => {
        const bookingStart = new Date(booking.startDate).getTime();
        const bookingEnd = new Date(booking.endDate).getTime();

        return selectedDate >= bookingStart && selectedDate <= bookingEnd;
      });

    }
    // if (!searchQuery.trim()) return bookingEntries;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      res = res.filter(booking =>
        booking.memberName.toLowerCase().includes(query) ||
        booking.memberRole.toLowerCase().includes(query) ||
        booking.projectName.toLowerCase().includes(query) ||
        booking.responsibility.toLowerCase().includes(query)
      );
    }

    return res

  }, [bookingEntries, searchQuery, dateRange]);

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setIsProjectClick(true);
    onClose();
  }

  const handleMemberClick = (memberId: string) => {
    // Find the member in the team array
    const member = team.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      onClose();
    } else {
      console.warn(`Member with id ${memberId} not found in team array`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Team Availability & Bookings
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
                    placeholder="Search team members, roles & projects"
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
                Showing {filteredBookings.length} of {bookingEntries.length} bookings
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[150px]">Team Member</TableHead>
                        <TableHead className="min-w-[150px]">Role</TableHead>
                        <TableHead className="min-w-[150px]">Project</TableHead>
                        <TableHead className="min-w-[200px]">Dates</TableHead>
                        <TableHead className="min-w-[120px]">Time Slot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => handleMemberClick(booking.memberId)}
                              >
                                <Avatar className="w-10 h-10"
                                  style={{
                                    borderColor: booking.memberColor || 'hsl(var(--muted))',
                                    boxShadow: `0 0 0 2px ${booking.memberColor || 'hsl(var(--muted))'}`
                                  }}>
                                  <AvatarImage
                                    src={`${S3_URL}/${booking.memberPhoto}`}
                                    alt={booking.memberName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback>
                                    <User className="w-4 h-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium truncate">{booking.memberName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground truncate">{booking.responsibility}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border cursor-pointer truncate"
                                style={{
                                  backgroundColor: `${booking.projectColor}`,
                                  border: `${booking.projectColor}`
                                }}
                                onClick={() => handleProjectClick(booking.projectId)}
                              >
                                {booking.projectName}
                              </Badge>
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
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                {searchQuery ? "No bookings found matching your search." : "No bookings found."}
                              </p>
                              {searchQuery && (
                                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                                  Clear search
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