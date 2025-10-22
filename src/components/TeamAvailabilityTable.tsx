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
  memberPhoto: string;
  memberRole: string;
  projectName: string;
  projectColor: string;
  dates: string;
  timeSlot: string;
  responsibility: string;
}

export function TeamAvailabilityTable({ isOpen, onClose, teamMembers }: TeamAvailabilityTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Transform team member data into booking entries
  const bookingEntries = useMemo((): BookingEntry[] => {
    const entries: BookingEntry[] = [];

    teamMembers?.forEach(member => {
      member?.projects?.forEach(project => {
        const timeSlot = project.startHour && project.endHour
          ? `${project.startHour}:00 - ${project.endHour}:00`
          : "All day";

        const dates = project.startDate === project.endDate
          ? `Aug ${project.startDate}`
          : `Aug ${project.startDate}-${project.endDate}`;

        entries.push({
          memberName: member.name,
          memberPhoto: member.profilePhoto,
          memberRole: member.role,
          projectName: project.name,
          projectColor: project.color,
          dates,
          timeSlot,
          responsibility: member.role
        });
      });
    });

    return entries.sort((a, b) => a.memberName.localeCompare(b.memberName));
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

  const getColorClasses = (colorClass: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-blue-500': 'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-500': 'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-500': 'bg-orange-100 text-orange-800 border-orange-200',
      'bg-green-500': 'bg-green-100 text-green-800 border-green-200',
      'bg-red-500': 'bg-red-100 text-red-800 border-red-200',
      'bg-indigo-500': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-yellow-500': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-pink-500': 'bg-pink-100 text-pink-800 border-pink-200',
      'bg-teal-500': 'bg-teal-100 text-teal-800 border-teal-200',
      'bg-cyan-500': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'bg-lime-500': 'bg-lime-100 text-lime-800 border-lime-200',
      'bg-rose-500': 'bg-rose-100 text-rose-800 border-rose-200',
      'bg-violet-500': 'bg-violet-100 text-violet-800 border-violet-200',
      'bg-emerald-500': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-amber-500': 'bg-amber-100 text-amber-800 border-amber-200',
      'bg-fuchsia-500': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'bg-sky-500': 'bg-sky-100 text-sky-800 border-sky-200',
      'bg-orange-600': 'bg-orange-100 text-orange-800 border-orange-200',
      'bg-purple-600': 'bg-purple-100 text-purple-800 border-purple-200',
      'bg-blue-600': 'bg-blue-100 text-blue-800 border-blue-200',
      'bg-gray-500': 'bg-gray-100 text-gray-800 border-gray-200',
      'bg-red-600': 'bg-red-100 text-red-800 border-red-200'
    };
    return colorMap[colorClass] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Team Availability & Bookings
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="flex-shrink-0 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by team member, role, project, or responsibility..."
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
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[200px]">Team Member</TableHead>
                  <TableHead className="w-[150px]">Role</TableHead>
                  <TableHead className="w-[250px]">Project</TableHead>
                  <TableHead className="w-[120px]">Dates</TableHead>
                  <TableHead className="w-[120px]">Time Slot</TableHead>
                  <TableHead>Responsibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={`${S3_URL}/${booking.memberPhoto}`}
                              alt={booking.memberName}
                              className="object-cover"
                            />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{booking.memberName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{booking.memberRole}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getColorClasses(booking.projectColor)} border`}>
                          {booking.projectName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {booking.dates}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {booking.timeSlot}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{booking.responsibility}</span>
                      </TableCell>
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
      </DialogContent>
    </Dialog>
  );
}