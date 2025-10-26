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
    timeView: "week" | "month";
}) {
    const { user, isCompany, isMember } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] =  useState<boolean>(true);
    

    const refresh = useCallback(async () => {
        if(isRefreshing)setLoading(true);
        try {
            // If user is a member, fetch their specific data using company ID and member ID
            if (isMember && user?.data) {
                const companyId = user.data.company?.id;
                const memberId = user.data.id;


                if (!companyId) {
                    toast.error("Company information not found");
                    return;
                }

                // Fetch specific member data from API
                const response = await getMembersByCompanyId(companyId, {
                    viewType: timeView,
                    week: selectedWeek,
                    month: selectedMonth,
                    year: selectedYear,
                    memberId: memberId, // Pass member ID to get specific member data
                });

                let members: Member[] = [];

                if (Array.isArray(response.data)) {
                    members = response.data;
                } else if (response.data?.members) {
                    members = response.data.members;
                }
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
                    active:m.active
                }));
                
                setTeamMembers(transformed);
                return;
            }

            // If user is a company, fetch all members
            if (isCompany && user?.data?.id) {
                const companyId = user.data.id;

                const response = await getMembersByCompanyId(companyId, {
                    viewType: timeView,
                    week: selectedWeek,
                    month: selectedMonth,
                    year: selectedYear,
                });

                let members: Member[] = [];

                if (Array.isArray(response.data)) {
                    members = response.data;
                } else if (response.data?.members) {
                    members = response.data.members;
                }

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
                }));

                setTeamMembers(transformed);
            }
        } catch (err) {
            toast.error("Failed to fetch team members");
            console.error(err);
        } finally {
            setLoading(false);
            setIsRefreshing(false); 
        }
    }, [user, selectedMonth, selectedYear, selectedWeek, timeView, isMember, isCompany]);

    return { teamMembers, loading, refresh, setTeamMembers };
}