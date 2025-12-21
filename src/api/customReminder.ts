// services/customReminderApi.ts
import { toast } from "sonner";
import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;

// Payload Interfaces
export interface CreateCustomReminderPayload {
  eventId: string;
  reminderDate: string; // YYYY-MM-DD format
  reminderHour: number; // 0-23
}

export interface UpdateCustomReminderPayload {
  reminderDate?: string;
  reminderHour?: number;
}

export interface ToggleSentStatusPayload {
  isSent: boolean;
}

export interface CustomReminder {
  id: string;
  eventId: string;
  reminderDate: string;
  reminderHour: number;
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    name: string;
    date: string;
    project?: {
      id: string;
      name: string;
      company?: {
        id: string;
        name: string;
      }
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  reminders?: T[];
  count?: number;
}

// Custom Reminder Functions
export async function createCustomReminder(
  payload: CreateCustomReminderPayload
): Promise<ApiResponse<CustomReminder>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to create custom reminder",
        data: data.errors 
      };
    }

    return { 
      success: true, 
      message: data.message,
      data: data.customReminder 
    };
  } catch (error: any) {
    console.error("Error creating custom reminder:", error);
    toast.error("Failed to create custom reminder");
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

export async function getEventCustomReminders(
  eventId: string
): Promise<ApiResponse<CustomReminder[]>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders/event/${eventId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to fetch custom reminders",
      };
    }

    return { 
      success: true, 
      message: data.message,
      reminders: data.reminders 
    };
  } catch (error: any) {
    console.error("Error fetching custom reminders:", error);
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

export async function getAllCustomReminders(): Promise<ApiResponse<CustomReminder[]>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to fetch custom reminders",
      };
    }

    return { 
      success: true, 
      message: data.message,
      reminders: data.reminders 
    };
  } catch (error: any) {
    console.error("Error fetching all custom reminders:", error);
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

export async function updateCustomReminder(
  reminderId: string,
  payload: UpdateCustomReminderPayload
): Promise<ApiResponse<CustomReminder>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders/${reminderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to update custom reminder",
      };
    }

    return { 
      success: true, 
      message: data.message,
      data: data.customReminder 
    };
  } catch (error: any) {
    console.error("Error updating custom reminder:", error);
    toast.error("Failed to update custom reminder");
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

export async function deleteCustomReminder(
  reminderId: string
): Promise<ApiResponse<void>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders/${reminderId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to delete custom reminder",
      };
    }

    toast.success("Custom reminder deleted successfully");
    return { 
      success: true, 
      message: data.message 
    };
  } catch (error: any) {
    console.error("Error deleting custom reminder:", error);
    toast.error("Failed to delete custom reminder");
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

export async function toggleReminderSentStatus(
  reminderId: string,
  payload: ToggleSentStatusPayload
): Promise<ApiResponse<CustomReminder>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders/${reminderId}/toggle-sent`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to update reminder status",
      };
    }

    return { 
      success: true, 
      message: data.message,
      data: data.customReminder 
    };
  } catch (error: any) {
    console.error("Error toggling reminder status:", error);
    toast.error("Failed to update reminder status");
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

export async function getPendingCustomReminders(): Promise<ApiResponse<CustomReminder[]>> {
  try {
    const token = localStorage.getItem('auth-token');
    const response = await apiFetch(`${baseUrl}/custom-reminders/pending`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to fetch pending reminders",
      };
    }

    return { 
      success: true, 
      message: data.message,
      reminders: data.reminders,
      count: data.count 
    };
  } catch (error: any) {
    console.error("Error fetching pending reminders:", error);
    return { 
      success: false, 
      message: error.message || "Network error" 
    };
  }
}

// Helper function to format reminder date and time
export function formatReminderDateTime(reminder: CustomReminder): string {
  const date = new Date(reminder.reminderDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const hour = reminder.reminderHour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${formattedDate} at ${displayHour}:00 ${ampm}`;
}

// Helper function to check if reminder is due
export function isReminderDue(reminder: CustomReminder): boolean {
  const now = new Date();
  const reminderDate = new Date(reminder.reminderDate);
  reminderDate.setHours(reminder.reminderHour, 0, 0, 0);
  
  return now >= reminderDate && !reminder.isSent;
}

// Helper function to get upcoming reminders
export function getUpcomingReminders(reminders: CustomReminder[]): CustomReminder[] {
  const now = new Date();
  return reminders
    .filter(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      reminderDate.setHours(reminder.reminderHour, 0, 0, 0);
      return reminderDate >= now && !reminder.isSent;
    })
    .sort((a, b) => {
      const dateA = new Date(a.reminderDate);
      dateA.setHours(a.reminderHour, 0, 0, 0);
      const dateB = new Date(b.reminderDate);
      dateB.setHours(b.reminderHour, 0, 0, 0);
      return dateA.getTime() - dateB.getTime();
    });
}