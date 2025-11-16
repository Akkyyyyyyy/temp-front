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
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] =  useState<boolean>(true);
    

    const refresh = useCallback(async () => {
        if(isRefreshing)setLoading(true);
        try {
                
                const companyId = user.data.company.id;
                const memberId = user.data.id;


                const response = await getMembersByCompanyId(companyId, {
                    viewType: timeView,
                    week: selectedWeek,
                    month: selectedMonth,
                    year: selectedYear,
                memberId});

  
                 const members = response.data.members;

                const transformed = members.map((m: Member) => ({
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
                    projects: m.projects || [],
                    active: m.active,
                    isAdmin:m.isAdmin,
                    roleId:m.roleId,
                    isInvited:m.isInvited,
                    isOwner:m.isOwner
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

    return { teamMembers, loading, refresh, setTeamMembers };
}