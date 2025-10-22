import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditableTimeSlot } from '@/components/EditableTimeSlot';
import { TeamMember } from './TeamMembers';
import { EditableBooking } from '@/hooks/useBookingEditor';

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
}

export function DayCalendar({ date, day, teamMembers, setSelectedDay, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,selectedWeek, setSelectedWeek }: DayCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const targetDate = new Date(selectedYear, selectedMonth - 1, day);

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const normalizedTarget = normalizeDate(targetDate);

  // Helper to parse "HH:mm:ss" to number hour
  const parseHour = (hourStr: string): number => {
    return Number(hourStr.split(':')[0]);
  };

  // Build editableBookings directly from projects
  const editableBookings: EditableBooking[] = [];
  
  teamMembers.forEach(member => {
    member.projects?.forEach((project, index) => {
      if (!project.startDate || !project.endDate) return;
      const start = normalizeDate(new Date(project.startDate));
      const end = normalizeDate(new Date(project.endDate));

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      if (normalizedTarget >= start && normalizedTarget <= end) {
        if (project.startHour === undefined || project.endHour === undefined) return;
        
        editableBookings.push({
          id: `${member.name}-${project.name}-${index}`,
          projectName: project.name,
          memberName: member.name,
          color: project.color,
          memberRingColor:member.ringColor,
          startHour: typeof project.startHour === 'string' ? parseHour(project.startHour) : project.startHour,
          endHour: typeof project.endHour === 'string' ? parseHour(project.endHour) : project.endHour,
          description: project.description || '',
          location: project.location || '',
          memberPhoto: member.profilePhoto || '',
          client: project.client || {},
          newRole: project.newRole || '',
          brief: project.brief,
          logistics: project.logistics,
        });
      }
    });
  });

  const [isEditing, setIsEditing] = useState(false);

  // Functions to update/delete booking - here just placeholders as you have no editing logic now
  const updateBooking = (id: string, updates: Partial<EditableBooking>) => {
    // You can implement this if you want editing later
    console.log('Update booking:', id, updates);
  };

  const deleteBooking = (id: string) => {
    // You can implement this if you want deleting later
    console.log('Delete booking:', id);
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  // For each hour, find all bookings that cover this hour
  const getBookingsForHour = (hour: number) => {
    return editableBookings.filter(
      booking => hour >= booking.startHour && hour < booking.endHour
    );
  };

  // Navigation functions
const getWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  // Use getTime() for arithmetic operations
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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-background rounded-lg border border-border/20 p-6 my-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-lg font-bold justify-between w-full">
          <div>
            Hourly Schedule
          </div>
          <div className='flex gap-2'>
            <h4 className="text-lg font-semibold text-foreground mx-2">
              {formatDisplayDate(date)}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            
          </div>

        </div>

        <div className="flex items-center gap-2">
          {/* <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            {isEditing ? 'Done' : 'Edit'}
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {hours.map(hour => {
          const bookingsThisHour = getBookingsForHour(hour);
          return (
            <div key={hour} className="flex flex-col gap-1">
              {bookingsThisHour.length > 0 ? (
                bookingsThisHour.map((booking, idx) => (
                  <EditableTimeSlot
                    key={booking.id}
                    hour={hour}
                    booking={booking}
                    isEditing={isEditing}
                    isStartOfBooking={hour === booking.startHour}
                    formatHour={formatHour}
                    onUpdateBooking={updateBooking}
                    onDeleteBooking={deleteBooking}
                    showHourLabel={idx === 0}
                  />
                ))
              ) : (
                <EditableTimeSlot
                  hour={hour}
                  isEditing={isEditing}
                  isStartOfBooking={false}
                  formatHour={formatHour}
                  onUpdateBooking={() => { }}
                  onDeleteBooking={() => { }}
                  showHourLabel={true}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}