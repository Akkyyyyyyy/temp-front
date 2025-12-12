import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditableTimeSlot } from '@/components/EditableTimeSlot';
import { TeamMember } from './TeamMembers';
import { EditableBooking } from '@/hooks/useBookingEditor';
import { useAuth } from '@/context/AuthContext';

interface DayCalendarProps {
  date: string;
  day: number;
  teamMembers: TeamMember[];
  setSelectedDay: (day: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (month: number) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  setSelectedProject: (projectId: string | null) => void;
}

export function DayCalendar({ date, day, teamMembers, setSelectedDay, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, selectedWeek, setSelectedWeek, setSelectedProject }: DayCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const targetDate = new Date(selectedYear, selectedMonth - 1, day);
  const { user } = useAuth();
  
  // Build editableBookings from events instead of projects
  const editableBookings: any[] = [];
   const filteredTeamMembers = user.data.isAdmin 
    ? teamMembers 
    : teamMembers.filter(member => member.id === user.data.id);

  filteredTeamMembers.forEach(member => {
    member.events?.forEach((event, index) => {
      const eventDate = new Date(event.date);
      const targetDate = new Date(selectedYear, selectedMonth - 1, day);
      
      // Check if event is on the target date
      if (
        eventDate.getFullYear() === targetDate.getFullYear() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getDate() === targetDate.getDate()
      ) {
        editableBookings.push({
          id: event.eventId,
          projectName: event.project.name,
          memberName: member.name,
          color: event.project.color,
          memberRingColor: member.ringColor,
          startHour: event.startHour,
          endHour: event.endHour,
          description: event.project.description || '',
          location: event.location || '',
          memberPhoto: member.profilePhoto || '',
          client: event.project.client || {},
          newRole: event.assignment.role,
          brief: event.project.brief,
          logistics: event.project.logistics,
          instructions: event.assignment.instructions || '',
          eventId: event.eventId,
          eventName: event.name,
          isOther:event.isOther
        });
      }
    });
  });

  const [isEditing, setIsEditing] = useState(false);

  // Functions to update/delete booking
  const updateBooking = (id: string, updates: Partial<EditableBooking>) => {
    console.log('Update booking:', id, updates);
  };

  const deleteBooking = (id: string) => {
    console.log('Delete booking:', id);
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // For each hour, find all bookings that cover this hour
  const getBookingsForHour = (hour: number) => {
    return editableBookings.filter(
      booking => hour >= booking.startHour && hour < booking.endHour
    );
  };

  // Navigation functions
  const getWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const goToPreviousDay = () => {
    const currentDate = new Date(selectedYear, selectedMonth - 1, day);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);

    setSelectedDay(previousDate.getDate());
    setSelectedMonth(previousDate.getMonth() + 1);
    setSelectedYear(previousDate.getFullYear());
    setSelectedWeek(getWeek(previousDate));
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedYear, selectedMonth - 1, day);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    setSelectedDay(nextDate.getDate());
    setSelectedMonth(nextDate.getMonth() + 1);
    setSelectedYear(nextDate.getFullYear());
    setSelectedWeek(getWeek(nextDate));
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-UK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Compact format for mobile
  const formatDisplayDateMobile = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-UK', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-background rounded-lg border border-border/20 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-sm sm:text-base lg:text-lg">
            Hourly Schedule
          </span>
        </div>

        {/* Date Navigation */}
        {/* <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex-1 sm:flex-none">
            <h4 className="text-sm sm:text-base font-semibold text-foreground text-left">
              <span className="sm:hidden">{formatDisplayDateMobile(date)}</span>
              <span className="hidden sm:inline">{formatDisplayDate(date)}</span>
            </h4>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div> */}

        {/* Edit Button - Desktop */}
        {/* <div className="hidden sm:flex">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? 'Done Editing' : 'Edit Schedule'}
          </Button>
        </div> */}
      </div>


      {/* Calendar Grid */}
      <div className="grid grid-cols-1 gap-1 sm:gap-2">
        {hours.map(hour => {
          const bookingsThisHour = getBookingsForHour(hour);
          return (
            <div key={hour} className="flex flex-col gap-1 sm:gap-2">
              {bookingsThisHour.length > 0 ? (
                bookingsThisHour.map((booking, idx) => (
                  <EditableTimeSlot
                    key={booking.id}
                    hour={hour}
                    booking={booking}
                    isStartOfBooking={hour === booking.startHour}
                    formatHour={formatHour}
                    showHourLabel={idx === 0}
                    onProjectClick={() => setSelectedProject(booking.id)}
                  />
                ))
              ) : (
                <EditableTimeSlot
                  hour={hour}
                  isStartOfBooking={false}
                  formatHour={formatHour}
                  showHourLabel={true}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Edit Button Footer */}
      {isEditing && (
        <div className="sm:hidden mt-4 pt-4 border-t border-border/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Editing mode enabled
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="text-xs"
            >
              Done Editing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}