import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user")) || null; }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);

    // keep localStorage in sync whenever state changes
    useEffect(() => {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    }, [token]);

    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    const login = useCallback((userData, accessToken) => {
        setUser(userData);
        setToken(accessToken);
    }, []);

    const updateUser = useCallback((updatedUserData) => {
        setUser((prev) => (prev ? { ...prev, ...updatedUserData } : null));
    }, []);

    const refreshUser = useCallback(async () => {
        const currentToken = localStorage.getItem("token") || token;
        if (!currentToken) return;
        try {
            const res = await API.get("/profile");
            if (res.data && res.data.user) {
                setUser(res.data.user);
            }
        } catch (err) {
            console.error("Failed to refresh user profile:", err);
        }
    }, [token]);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("recentProducts");
    }, []);

    const isAdmin = user?.role === "admin";
    const isSeller = user?.role === "seller";

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, refreshUser, isAdmin, isSeller }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}

