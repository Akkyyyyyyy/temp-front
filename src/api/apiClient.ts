import { toast } from "sonner";
let sessionExpiredToastShown = false;
export function logoutUser() {
    localStorage.clear();
    if (!sessionExpiredToastShown) {
        sessionExpiredToastShown = true;
        toast.error("Session expired. Logging out...");
    }
    window.location.href = '/login';
}
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 498) {
        logoutUser();
        throw new Error("Session expired");
    }

    return response;
}
