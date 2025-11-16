// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getRolesByCompanyId } from "@/api/role";

type UserType = "company" | "member";

interface AuthUser {
    type: UserType;
    data: any;
    token: string;
}

interface AuthContextProps {
    user: any | null;
    login: (userType: UserType, data: any) => void;
    logout: () => void;
    isCompany: boolean;
    isMember: boolean;
    roles: any[];
    loadingRoles: boolean;
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

    // Function to refresh user data from localStorage
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem("auth-token");
        const type = localStorage.getItem("user-type");
        const details = localStorage.getItem("user-details");

        if (token && type && details) {
            setUser({
                token,
                type: type as UserType,
                data: JSON.parse(details),
            });
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
        const token = localStorage.getItem("auth-token");
        const type = localStorage.getItem("user-type");
        const details = localStorage.getItem("user-details");

        if (token && type && details) {
            setUser({
                token,
                type: type as UserType,
                data: JSON.parse(details),
            });
        }
    }, []);

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
                login,
                logout,
                isCompany: user?.type === "company",
                isMember: user?.type === "member",
                roles,
                loadingRoles,
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
