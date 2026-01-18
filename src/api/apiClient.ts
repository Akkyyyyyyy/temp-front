import { toast } from "sonner";
export function logoutUser() {
    localStorage.clear();
    toast.error("Session expired. Logging out...");
    window.location.href = '/login';
}
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 401) {
        logoutUser();
        throw new Error("Session expired");
    }

    return response;
}
