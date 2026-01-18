// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getRolesByCompanyId } from "@/api/role";
import { getMe } from "@/api/member";

type UserType = "company" | "member";

interface AuthUser {
    type: UserType;
    data: any;
    token: string;
}

interface AuthContextProps {
    user: any | null;
    setUser: (any:any)=>void;
    login: (userType: UserType, data: any) => void;
    logout: () => void;
    isCompany: boolean;
    isMember: boolean;
    roles: any[];
    loadingRoles: boolean;
    loadingUser: boolean;
    refreshRoles: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUser: (updates: any) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const navigate = useNavigate();
    const [loadingUser, setLoadingUser] = useState(false);

    // Function to refresh user data from localStorage
    // Function to refresh user data from API or localStorage
    const refreshUser = useCallback(async (forceCompanyId?: string) => {
        const token = localStorage.getItem("auth-token");
        const type = localStorage.getItem("user-type");
        const details = localStorage.getItem("user-details");

        if (!token || !type) {
            setUser(null);
            return;
        }

        try {
            setLoadingUser(true);

            if (type === "member" && details) {
                const userData = JSON.parse(details);
                const companyId = forceCompanyId || userData.company?.id;
                const memberId = userData.id;
                console.log("companyId", companyId);
                console.log("memberId", memberId);


                if (companyId && memberId) {
                    try {

                        const response = await getMe(companyId, memberId);

                        if (response.success && response.data) {
                            const freshUserData = response.data.user;

                            // Update localStorage
                            localStorage.setItem("user-details", JSON.stringify(freshUserData));

                            // Update state
                            setUser({
                                token,
                                type: type as UserType,
                                data: freshUserData,
                            });
                        } else {
                            // Fall back to localStorage
                            setUser({
                                token,
                                type: type as UserType,
                                data: userData,
                            });
                        }
                    } catch (apiError) {
                        console.error("API error refreshing user:", apiError);
                        // Fall back to localStorage
                        setUser({
                            token,
                            type: type as UserType,
                            data: userData,
                        });
                    }
                } else {
                    // Missing companyId or memberId
                    setUser({
                        token,
                        type: type as UserType,
                        data: userData,
                    });
                }
            } else {
                // For company users or when no details
                if (details) {
                    setUser({
                        token,
                        type: type as UserType,
                        data: JSON.parse(details),
                    });
                }
            }
        } catch (error) {
            console.error("Error in refreshUser:", error);
            // Fallback to localStorage data
            const details = localStorage.getItem("user-details");
            if (token && type && details) {
                setUser({
                    token,
                    type: type as UserType,
                    data: JSON.parse(details),
                });
            }
        } finally {
            setLoadingUser(false);
        }
    }, []);

    // Function to update user data
    const updateUser = useCallback((updates: any) => {
        setUser((prevUser: any) => {
            if (!prevUser) return prevUser;

            const updatedUser = {
                ...prevUser,
                data: {
                    ...prevUser.data,
                    ...updates
                }
            };

            // Also update localStorage to persist the changes
            localStorage.setItem("user-details", JSON.stringify(updatedUser.data));

            return updatedUser;
        });
    }, []);
    const loadRoles = useCallback(async () => {
        if (!user) {
            setRoles([]);
            return;
        }

        try {
            setLoadingRoles(true);
            const companyId = user.data.company.id;
            if (!companyId) {
                setRoles([]);
                return;
            }

            const response = await getRolesByCompanyId(companyId);
            if (response.success && response.data) {
                let rolesData: any[] = [];
                if (Array.isArray(response.data)) {
                    rolesData = response.data;
                } else if (response.data?.roles && Array.isArray(response.data.roles)) {
                    rolesData = response.data.roles;
                } else if (response.data?.data?.roles && Array.isArray(response.data.data.roles)) {
                    rolesData = response.data.data.roles;
                }
                setRoles(rolesData);
            }
        } catch (error) {
            console.error("Error loading roles:", error);
            setRoles([]);
        } finally {
            setLoadingRoles(false);
        }
    }, [user]);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("auth-token");
            const type = localStorage.getItem("user-type");
            const details = localStorage.getItem("user-details");

            if (token && type && details) {
                const userData = JSON.parse(details);

                // Set initial state from localStorage
                setUser({
                    token,
                    type: type as UserType,
                    data: userData,
                });

                // If it's a member user with company and member IDs, fetch fresh data
                if (userData.company?.id && userData.id) {
                    try {
                        const response = await getMe(userData.company.id, userData.id);

                        if (response.success && response.data) {
                            const freshUserData = response.data.user;

                            // Update localStorage
                            localStorage.setItem("user-details", JSON.stringify(freshUserData));

                            // Update state with fresh data
                            setUser({
                                token,
                                type: type as UserType,
                                data: freshUserData,
                            });
                        }
                    } catch (error) {
                        console.error("Error fetching fresh user data on mount:", error);
                        // Keep using localStorage data if API fails
                    }
                }
            }
        };

        initializeAuth();
    }, []); // Only run on mount

    // Load roles when user is set
    useEffect(() => {
        if (user) {
            loadRoles();
        } else {
            setRoles([]);
        }
    }, [user, loadRoles]);

    const login = (type: UserType, data: any) => {
        localStorage.setItem("auth-token", data.token);
        localStorage.setItem("user-type", type);
        localStorage.setItem("user-details", JSON.stringify(data.member));

        setUser({
            type,
            token: data.token,
            data: data.member,
        });
    };

    const logout = () => {
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        const userType = localStorage.getItem("user-type");

        localStorage.clear();
        if (rememberedEmail) {
            localStorage.setItem("rememberedEmail", rememberedEmail);
            localStorage.setItem("user-type", userType);

        }
        setUser(null);
        navigate("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                isCompany: user?.type === "company",
                isMember: user?.type === "member",
                roles,
                loadingRoles,
                loadingUser,
                refreshRoles: loadRoles,
                refreshUser,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};
