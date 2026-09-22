import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FinovaUser = {
  id: string;
  displayName: string;
  destination: string;
  method: "email" | "phone";
};

interface FinovaAuthState {
  user: FinovaUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (user: FinovaUser, token: string) => void;
  clearSession: () => void;
  setHydrated: () => void;
}

export const useFinovaAuth = create<FinovaAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setSession: (user, token) => set({ user, token }),
      clearSession: () => set({ user: null, token: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "finova-auth-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
