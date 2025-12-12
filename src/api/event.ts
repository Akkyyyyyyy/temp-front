import { toast } from "sonner";
import { apiFetch } from "./apiClient";

const baseUrl = import.meta.env.VITE_BACKEND_URL;
export interface EventAssignmentRequest {
    memberId: string;
    roleId: string;
    instructions: string;
}

export interface CreateEventRequest {
    projectId: string;
    name: string;
    date: string; // Format: YYYY-MM-DD
    startHour: number;
    endHour: number;
    location: string;
    reminders: {
        weekBefore: boolean;
        dayBefore: boolean;
    };
    assignments?: EventAssignmentRequest[];
}

export interface UpdateEventRequest {
    name?: string;
    date?: string;
    startHour?: number;
    endHour?: number;
    location?: string;
    reminders?: {
        weekBefore: boolean;
        dayBefore: boolean;
    };
    assignments?: EventAssignmentRequest[];
}

export interface EventResponse {
    id: string;
    projectId: string;
    name: string;
    date: string;
    startHour: number;
    endHour: number;
    location: string;
    reminders: {
        weekBefore: boolean;
        dayBefore: boolean;
    };
    assignments?: Array<{
        id: string;
        instructions: string;
        member: {
            id: string;
            name: string;
            email: string;
            profilePhoto?: string;
            ringColor?: string;
        };
        role: {
            id: string;
            name: string;
        };
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface DeleteEventRequest {
    eventId: string;
}

export async function createEvent(
    request: CreateEventRequest
): Promise<any> {
    try {
        const token = localStorage.getItem('auth-token');

        // Validation
        if (!request.projectId?.trim()) {
            toast.error("Project ID is required");
            return { success: false, message: "Project ID is required" };
        }

        if (!request.name?.trim()) {
            toast.error("Event name is required");
            return { success: false, message: "Event name is required" };
        }

        if (!request.date) {
            toast.error("Event date is required");
            return { success: false, message: "Event date is required" };
        }

        if (!request.location?.trim()) {
            toast.error("Location is required");
            return { success: false, message: "Location is required" };
        }

        // Validate time
        if (request.startHour >= request.endHour) {
            toast.error("End time must be after start time");
            return { success: false, message: "End time must be after start time" };
        }

        const response = await apiFetch(`${baseUrl}/event/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(request)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to create event");
        }

        if (result.success) {
            toast.success(result.message || "Event created successfully");
        } else {
            toast.error(result.message || "Failed to create event");
        }

        return result;
    } catch (error: any) {
        console.error("Error creating event:", error);
        toast.error(error.message || "Network error while creating event");
        return {
            success: false,
            message: error.message || "Network error while creating event"
        };
    }
}

export async function updateEvent(
    eventId: string,
    request: UpdateEventRequest
): Promise<any> {
    try {
        const token = localStorage.getItem('auth-token');

        if (!eventId?.trim()) {
            toast.error("Event ID is required");
            return { success: false, message: "Event ID is required" };
        }

        if (request.startHour !== undefined && request.endHour !== undefined) {
            if (request.startHour >= request.endHour) {
                toast.error("End time must be after start time");
                return { success: false, message: "End time must be after start time" };
            }
        }

        const cleanedRequest = Object.fromEntries(
            Object.entries(request).filter(([_, value]) => value !== undefined && value !== null)
        );

        const response = await apiFetch(`${baseUrl}/event/update/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cleanedRequest)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to update event");
        }

        if (result.success) {
            toast.success(result.message || "Event updated successfully");
        } else {
            toast.error(result.message || "Failed to update event");
        }

        return result;
    } catch (error: any) {
        console.error("Error updating event:", error);
        toast.error(error.message || "Network error while updating event");
        return {
            success: false,
            message: error.message || "Network error while updating event"
        };
    }
}
export async function deleteEvent(
    request: DeleteEventRequest
): Promise<any> {
    try {
        const token = localStorage.getItem('auth-token');

        if (!request.eventId?.trim()) {
            toast.error("event ID is required");
            return { success: false, message: "event ID is required" };
        }

        const response = await apiFetch(`${baseUrl}/event/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(request)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete event");
        }

        if (result.success) {
            toast.success(result.message || "event deleted successfully");
        } else {
            toast.error(result.message || "Failed to delete event");
        }

        return result;
    } catch (error: any) {
        console.error("Error deleting event:", error);
        toast.error(error.message || "Network error while deleting event");
        return {
            success: false,
            message: error.message || "Network error while deleting event"
        };
    }
}

