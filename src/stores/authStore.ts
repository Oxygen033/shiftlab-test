import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    phone: string | null;
    isAuthenticated: boolean;
    token: string | null;
    setPhone: (phone: string | null) => void;
    setToken: (token: string | null) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            phone: null,
            isAuthenticated: false,
            token: null,
            setPhone: (phone) => set({ phone }),
            setToken: (token) => set({ token, isAuthenticated: !!token }),
            reset: () => set({ phone: null, isAuthenticated: false, token: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);