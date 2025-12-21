import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EditableTimeSlot } from '@/components/EditableTimeSlot';
import { TeamMember } from './TeamMembers';
import { useAuth } from '@/context/AuthContext';

interface DayCalendarProps {
  date: string;
  day: number;
  teamMembers: TeamMember[];
  setSelectedDay: (day: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedWeek?: number;
  setSelectedWeek?: (week: number) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSelectedEvent?: (eventId: string | null) => void;
}

export function DayCalendar({
  date,
  day,
  teamMembers,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedWeek,
  setSelectedWeek,
  setSelectedProject,
  setSelectedEvent
}: DayCalendarProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const targetDate = new Date(selectedYear, selectedMonth - 1, day);
  const { user } = useAuth();

  // Build editableBookings from events and googleCalendarEvents
  const editableBookings: any[] = [];
  const currentUserId = user.data.id;
  const isAdmin = user.data.isAdmin;

  // Filter team members based on user permissions
  const filteredTeamMembers = isAdmin
    ? teamMembers
    : teamMembers.filter(member => member.id === currentUserId);

  filteredTeamMembers.forEach(member => {
    const isCurrentUser = member.id === currentUserId;

    // Process regular events (always visible for admin, or for user's own events)
    if (isAdmin || isCurrentUser) {
      member.events?.forEach((event) => {
        const eventStartDate = new Date(event.date + 'T00:00:00');
        const targetDate = new Date(selectedYear, selectedMonth - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        
        // For multi-day events, check if they have endDate
        let eventEndDate = eventStartDate;
        if (event.endDate) {
          eventEndDate = new Date(event.endDate + 'T23:59:59');
        } else if (event.project?.endDate) {
          eventEndDate = new Date(event.project.endDate + 'T23:59:59');
        }
        
        // Check if target date is within the event date range
        if (targetDate >= eventStartDate && targetDate <= eventEndDate) {
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
            isOther: event.isOther,
            source: 'event',
            isAllDay: event.allDay || false,
            memberId: member.id,
            isCurrentUserEvent: isCurrentUser,
            date: event.date,
            endDate: event.endDate || event.project?.endDate
          });
        }
      });
    }

    if (isCurrentUser) {
      member.googleCalendarEvents?.forEach((googleEvent) => {
        const eventStartDate = new Date(googleEvent.date + 'T00:00:00');
        const targetDate = new Date(selectedYear, selectedMonth - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        
        // For Google Calendar multi-day events
        let eventEndDate = eventStartDate;
        if (googleEvent.endDate) {
          if (googleEvent.allDay) {
            // For all-day events, subtract 1 day to make it inclusive
            eventEndDate = new Date(googleEvent.endDate + 'T00:00:00');
            eventEndDate.setDate(eventEndDate.getDate() - 1); // Make exclusive end date inclusive
          } else {
            // For timed events, endDate is inclusive
            eventEndDate = new Date(googleEvent.endDate + 'T23:59:59');
          }
        }
        
        eventStartDate.setHours(0, 0, 0, 0);
        eventEndDate.setHours(0, 0, 0, 0);
        
        // Check if target date is within the Google Calendar event date range
        if (targetDate >= eventStartDate && targetDate <= eventEndDate) {
          // Determine if it's an all-day event
          const isAllDayEvent = googleEvent.allDay || (googleEvent.startHour === null && googleEvent.endHour === null);

          // For all-day events, set hours to cover the entire day
          const startHour = isAllDayEvent ? 0 : (googleEvent.startHour || 0);
          const endHour = isAllDayEvent ? 24 : (googleEvent.endHour || 24);

          editableBookings.push({
            id: googleEvent.id,
            projectName: googleEvent.name || 'Private Event',
            memberName: member.name,
            color: '#6B7280', // Gray color for Google Calendar events
            memberRingColor: member.ringColor,
            startHour: startHour,
            endHour: endHour,
            description: googleEvent.description || 'Details are private',
            location: googleEvent.location || '',
            memberPhoto: member.profilePhoto || '',
            client: { name: 'Private' },
            newRole: 'Busy',
            brief: [],
            logistics: [],
            instructions: 'Private event details are not visible',
            eventId: googleEvent.id,
            eventName: googleEvent.name || 'Private Event',
            isOther: true,
            source: 'google_calendar',
            isAllDay: isAllDayEvent,
            isGoogleCalendarEvent: true,
            isPrivate: true,
            memberId: member.id,
            isCurrentUserEvent: true,
            date: googleEvent.date,
            endDate: googleEvent.endDate,
            isFirstDayOfMultiDay: targetDate.getTime() === eventStartDate.getTime(),
            isLastDayOfMultiDay: targetDate.getTime() === eventEndDate.getTime()
          });
        }
      });
    } else if (isAdmin && member.googleCalendarEvents?.length > 0) {
      // For admin viewing other users: show that they have Google Calendar events, but not details
      member.googleCalendarEvents?.forEach((googleEvent) => {
        const eventStartDate = new Date(googleEvent.date + 'T00:00:00');
        const targetDate = new Date(selectedYear, selectedMonth - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        
        let eventEndDate = eventStartDate;
        if (googleEvent.endDate) {
          if (googleEvent.allDay) {
            eventEndDate = new Date(googleEvent.endDate + 'T00:00:00');
            eventEndDate.setDate(eventEndDate.getDate() - 1);
          } else {
            eventEndDate = new Date(googleEvent.endDate + 'T23:59:59');
          }
        }
        
        eventStartDate.setHours(0, 0, 0, 0);
        eventEndDate.setHours(0, 0, 0, 0);
        
        if (targetDate >= eventStartDate && targetDate <= eventEndDate) {
          const isAllDayEvent = googleEvent.allDay || (googleEvent.startHour === null && googleEvent.endHour === null);

          const startHour = isAllDayEvent ? 0 : (googleEvent.startHour || 0);
          const endHour = isAllDayEvent ? 24 : (googleEvent.endHour || 24);
          editableBookings.push({
            id: `google-private-${member.id}-${googleEvent.id}`,
            projectName: 'Busy (Google Calendar)',
            memberName: member.name,
            color: '#6B7280',
            memberRingColor: member.ringColor,
            startHour: startHour,
            endHour: endHour,
            description: 'Private Google Calendar event',
            location: '',
            memberPhoto: member.profilePhoto || '',
            client: { name: 'Private' },
            newRole: 'Busy',
            brief: [],
            logistics: [],
            instructions: 'Google Calendar event details are private',
            eventId: `google-private-${member.id}`,
            eventName: 'Busy',
            isOther: true,
            source: 'google_calendar_private',
            isAllDay: isAllDayEvent,
            isGoogleCalendarEvent: true,
            isPrivate: true,
            memberId: member.id,
            isCurrentUserEvent: false,
            date: googleEvent.date,
            endDate: googleEvent.endDate,
            isFirstDayOfMultiDay: targetDate.getTime() === eventStartDate.getTime(),
            isLastDayOfMultiDay: targetDate.getTime() === eventEndDate.getTime(),
            googleEventDetails: googleEvent
          });
        }
      });
    }
  });

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
    if (setSelectedWeek) {
      setSelectedWeek(getWeek(previousDate));
    }
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedYear, selectedMonth - 1, day);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    setSelectedDay(nextDate.getDate());
    setSelectedMonth(nextDate.getMonth() + 1);
    setSelectedYear(nextDate.getFullYear());
    if (setSelectedWeek) {
      setSelectedWeek(getWeek(nextDate));
    }
  };

  // Handle event click
  const handleEventClick = (booking: any) => {
    // Only allow clicks for regular company events (not private/Google events)
    if (booking.source === 'event' && !booking.isOther) {
      setSelectedProject(booking.id);
      if (setSelectedEvent) {
        setSelectedEvent(booking.eventId);
      }
    }
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
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex-1 sm:flex-none">
            <h4 className="text-sm sm:text-base font-semibold text-foreground text-left">
              <span className="sm:hidden">
                {new Date(selectedYear, selectedMonth - 1, day).toLocaleDateString('en-UK', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="hidden sm:inline">
                {new Date(selectedYear, selectedMonth - 1, day).toLocaleDateString('en-UK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
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
        </div>
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
                    key={`${booking.id}-${idx}`}
                    hour={hour}
                    booking={booking}
                    isStartOfBooking={hour === booking.startHour}
                    formatHour={formatHour}
                    showHourLabel={idx === 0}
                    onProjectClick={() => handleEventClick(booking)}
                    isMultiDay={!!booking.endDate && new Date(booking.date).getTime() !== new Date(booking.endDate).getTime()}
                    isFirstDay={booking.isFirstDayOfMultiDay}
                    isLastDay={booking.isLastDayOfMultiDay}
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
    </div>
  );
}