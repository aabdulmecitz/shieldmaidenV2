import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, getToken, removeToken } from '../services/api';
import type { User } from '../services/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        const token = getToken();
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const data = await authApi.getProfile();
            // Backend returns { user: ... } structure wrapped in response
            if (data && 'user' in data) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            removeToken();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (email: string, password: string) => {
        const data = await authApi.login({ email, password });
        setUser(data?.user || null);
    };

    const register = async (username: string, email: string, password: string) => {
        await authApi.register({ username, email, password });
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
