import { motion, useReducedMotion } from "motion/react";
import { money } from "@/lib/finance/format";
import { useLedger } from "@/lib/finance/use-ledger";

const ease = [0.16, 1, 0.3, 1] as const;

export function PhoneReveal() {
  const reduce = useReducedMotion();
  const ledger = useLedger();
  const recent = ledger.transactions.slice(0, 3);

  return (
    <motion.div
      className="hero-phone"
      initial={reduce ? false : { opacity: 0, y: 72, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, delay: 0.28, ease }}
      style={{ transformPerspective: 1200 }}
    >
      <div className="iphone-bezel hero-bezel" aria-hidden={false}>
        <span className="hardware-btn btn-silent" />
        <span className="hardware-btn btn-vol-up" />
        <span className="hardware-btn btn-vol-down" />
        <span className="hardware-btn btn-power" />
        <div className="iphone-screen">
          <div className="dynamic-island" />
          <motion.div
            className="screen-veil"
            initial={reduce ? false : { opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.82, ease }}
          />
          <motion.div
            className="relative z-[1] pt-9"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.92, ease }}
          >
            <p className="text-[10px] font-medium tracking-[0.14em] text-zinc-500">FINOVA</p>
            <p className="mt-4 text-[10px] text-zinc-500">Balance</p>
            <p className="mt-1 text-[1.35rem] font-semibold leading-none tracking-tight">
              {money(ledger.worth, ledger.settings.currency)}
            </p>
            <p className="mt-2 text-[11px] text-zinc-400">
              {money(ledger.flow, ledger.settings.currency, { sign: true })} this month
            </p>
            <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate text-zinc-300">{tx.description}</span>
                  <span className={tx.type === "income" ? "text-income" : "text-zinc-400"}>
                    {money(tx.type === "expense" ? -tx.amount : tx.amount, ledger.settings.currency, {
                      sign: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
          <span className="screen-glare" />
          <span className="home-bar" />
        </div>
      </div>
    </motion.div>
  );
}
