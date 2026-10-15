import { useLayoutEffect, type ReactNode } from "react";
import { useFinanceStore } from "@/lib/finance/store";

export function FinanceHydration({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const unsubLedger = useFinanceStore.persist.onFinishHydration(() => {
      const s = useFinanceStore.getState();
      if (!s.settings.onboarded) s.loadDemo();
    });
    void useFinanceStore.persist.rehydrate();
    return () => {
      unsubLedger();
    };
  }, []);
  return children;
}
