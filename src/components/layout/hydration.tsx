import { useLayoutEffect, type ReactNode } from "react";
import { useFinanceStore } from "@/lib/finance/store";
import { useFinovaAuth } from "@/lib/auth/finova-session";

export function FinanceHydration({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const unsubLedger = useFinanceStore.persist.onFinishHydration(() => {
      const s = useFinanceStore.getState();
      if (!s.settings.onboarded) s.loadDemo();
    });
    const unsubAuth = useFinovaAuth.persist.onFinishHydration(() => {
      useFinovaAuth.getState().setHydrated();
    });
    void useFinanceStore.persist.rehydrate();
    void useFinovaAuth.persist.rehydrate();
    if (useFinovaAuth.persist.hasHydrated()) useFinovaAuth.getState().setHydrated();
    return () => {
      unsubLedger();
      unsubAuth();
    };
  }, []);
  return children;
}
