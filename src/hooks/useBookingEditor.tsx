
import { useState, useCallback, ReactNode } from 'react';

const baseUrl = import.meta.env.VITE_BACKEND_URL;
export interface EditableBooking {
  memberRingColor?: string;
  brief?: any[] | null;
  logistics?: any[] | null;
  newRole: ReactNode;
  memberPhoto?: string;
  id: string;
  startHour: number;
  endHour: number;
  projectName: string;
  memberName: string;
  color: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  teamAssignments?: any[];
  client?: {
    cc: string;
    name: string;
    mobile: string;
    email: string;
  };
}

export function useBookingEditor(initialBookings: EditableBooking[]) {
  const [bookings, setBookings] = useState<EditableBooking[]>(initialBookings);
  const [isEditing, setIsEditing] = useState(false);

  const addBooking = useCallback(async (booking: Omit<EditableBooking, 'id'>) => {
    try {
      // Generate ID for frontend use
      const newBooking: EditableBooking = {
        ...booking,
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      // Update local state only if API call succeeds
      setBookings(prev => [...prev, newBooking]);

    } catch (error) {
      console.error("Failed to add booking:", error);
    }
  }, []);
  const updateBooking = useCallback((id: string, updates: Partial<EditableBooking>) => {
    setBookings(prev => prev.map(booking =>
      booking.id === id ? { ...booking, ...updates } : booking
    ));
  }, []);

  const deleteBooking = useCallback((id: string) => {
    setBookings(prev => prev.filter(booking => booking.id !== id));
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  return {
    bookings,
    isEditing,
    addBooking,
    updateBooking,
    deleteBooking,
    toggleEditing
  };
}