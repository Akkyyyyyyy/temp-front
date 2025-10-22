// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type UserType = "company" | "member";

interface AuthUser {
    type: UserType;
    data: any;
    token: string;
}

interface AuthContextProps {
    user: AuthUser | null;
    login: (userType: UserType, data: any) => void;
    logout: () => void;
    isCompany: boolean;
    isMember: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const navigate = useNavigate();


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

    const login = (type: UserType, data: any) => {
        localStorage.setItem("auth-token", data.token);
        localStorage.setItem("user-type", type);
        localStorage.setItem("user-details", JSON.stringify(data[type === "company" ? "companyDetails" : "member"]));

        setUser({
            type,
            token: data.token,
            data: data[type === "company" ? "companyDetails" : "member"],
        });
    };

    const logout = () => {
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        localStorage.clear();
        if (rememberedEmail) {
            localStorage.setItem("rememberedEmail", rememberedEmail);
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
