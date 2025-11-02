import { useState, useMemo } from "react";
import { Search, X, Calendar, Clock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "./TeamMembers";
const S3_URL = import.meta.env.VITE_S3_BASE_URL

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
  teamMembers: TeamMember[];
}

interface BookingEntry {
  memberName: string;
  memberColor: string;
  memberPhoto: string;
  memberRole: string;
  projectName: string;
  projectColor: string;
  dates: string;
  timeSlot: string;
  responsibility: string;
  startDate: string;

}

export function TeamAvailabilityTable({ isOpen, onClose, teamMembers }: TeamAvailabilityTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
const bookingEntries = useMemo((): BookingEntry[] => {
  const entries: BookingEntry[] = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  
  teamMembers?.forEach(member => {
    member?.projects?.forEach(project => {
      // Check if project has an end date and if it's less than today
      if (project.endDate) {
        const projectEndDate = new Date(project.endDate);
        projectEndDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        // Skip projects that ended before today
        // if (projectEndDate < today) {
        //   return; // Skip this project
        // }
      }
      
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
        projectName: project.name,
        projectColor: project.color,
        dates,
        timeSlot,
        responsibility: project.newRole || "No Role Assigned",
        startDate: project.startDate // Add this for sorting
      });
    });
  });

  // Sort by startDate first, then by memberName
  return entries.sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    
    if (dateA !== dateB) {
      return dateA - dateB; // Ascending order by date
    }
    
    // If dates are the same, sort by member name
    return a.memberName.localeCompare(b.memberName);
  });
}, [teamMembers]);

  // Filter bookings based on search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookingEntries;

    const query = searchQuery.toLowerCase();
    return bookingEntries.filter(booking =>
      booking.memberName.toLowerCase().includes(query) ||
      booking.memberRole.toLowerCase().includes(query) ||
      booking.projectName.toLowerCase().includes(query) ||
      booking.responsibility.toLowerCase().includes(query)
    );
  }, [bookingEntries, searchQuery]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Team Availability & Bookings
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-2">
          {/* Search Bar */}
          <div className="flex-shrink-0 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search team members, roles & projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
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

          {/* Results Summary */}
          <div className="flex-shrink-0 mb-4 text-sm text-muted-foreground">
            Showing {filteredBookings.length} of {bookingEntries.length} bookings
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto ">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[150px]">Team Member</TableHead>
                    <TableHead className="min-w-[150px]">Role</TableHead>
                    <TableHead className="min-w-[150px]">Project</TableHead>
                    <TableHead className="min-w-[200px]">Dates</TableHead>
                    <TableHead className="min-w-[120px]">Time Slot</TableHead>
                    {/* <TableHead className="min-w-[200px]">Responsibility</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3 cursor-pointer">
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
                              border:`${booking.projectColor}`
                            }}
                          >
                            {booking.projectName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm truncate">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {booking.dates}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm truncate">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {booking.timeSlot}
                          </div>
                        </TableCell>
                        {/* <TableCell>
                          <span className="text-sm">{booking.responsibility}</span>
                        </TableCell> */}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}