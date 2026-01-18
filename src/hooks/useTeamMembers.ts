import { useEffect, useState, useCallback } from "react";
import { getMembersByCompanyId, Member } from "@/api/member";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TeamMember } from "@/components/TeamMembers";

export function useTeamMembers({
    selectedMonth,
    selectedYear,
    selectedWeek,
    timeView,
}: {
    selectedMonth: number | null;
    selectedYear: number | null;
    selectedWeek: number | null;
    timeView: any;
}) {
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [lockedDates, setLockedDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(true);

    const refresh = useCallback(async () => {
        if (isRefreshing) setLoading(true);
        try {
            const companyId = user.data.company.id;
            const memberId = user.data.id;

            const response = await getMembersByCompanyId(companyId, {
                viewType: timeView,
                week: selectedWeek,
                month: selectedMonth,
                year: selectedYear,
                memberId
            });
            const members = response.data.members;

            setLockedDates(response.data.lockedDates);


            const transformed = members.map((m: any) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
                phone: m.phone || '',
                location: m.location || '',
                ringColor: m.ringColor || '',
                bio: m.bio || '',
                profilePhoto: m.profilePhoto || '',
                skills: m.skills || [],
                companyId: companyId,
                events: m.events || [], // Changed from projects to events
                googleCalendarEvents: m.googleCalendarEvents || [], // Add Google Calendar events
                hasGoogleCalendar: m.hasGoogleCalendar || false, // Add connection status
                active: m.active,
                isAdmin: m.isAdmin,
                roleId: m.roleId,
                isInvited: m.isInvited,
                isOwner: m.isOwner,
                invitation: m.invitation,
            }));

            setTeamMembers(transformed);
        } catch (err) {
            toast.error("Failed to fetch team members");
            console.error(err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user, selectedMonth, selectedYear, selectedWeek, timeView]);

    return { teamMembers, loading, setLoading, refresh, setTeamMembers, lockedDates };
}