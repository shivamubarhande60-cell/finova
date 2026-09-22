import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useFinanceStore } from "@/lib/finance/store";
import { money } from "@/lib/finance/format";
import { useLedger } from "@/lib/finance/use-ledger";
import { useFinovaAuth } from "@/lib/auth/finova-session";
import { Button } from "@/components/ui/button";
import { CashflowChart } from "@/components/finance/charts";

const KEY = "finova-intro-seen";
const ease = [0.16, 1, 0.3, 1] as const;

export function replayIntro() {
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event("finova-replay-intro"));
}

export function LiveIntro() {
  const name = useFinanceStore((s) => s.settings.displayName) || "there";
  const ledger = useLedger();
  const reduce = useReducedMotion();
  const user = useFinovaAuth((s) => s.user);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    if (user) {
      sessionStorage.setItem(KEY, "1");
      return;
    }
    if (!sessionStorage.getItem(KEY)) show();
    window.addEventListener("finova-replay-intro", show);
    return () => window.removeEventListener("finova-replay-intro", show);
  }, [user]);

  const enter = () => {
    sessionStorage.setItem(KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  const recent = ledger.transactions.slice(0, 4);

  return (
    <div className="market fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="market-title">
      <header className="market-nav">
        <p className="flex items-center gap-2 font-medium tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            F
          </span>
          FINOVA
        </p>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Marketing">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#analytics" className="hover:text-foreground">Analytics</a>
          <a href="#plans" className="hover:text-foreground">Plans</a>
        </nav>
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login" onClick={enter}>Sign in</Link>
          </Button>
          <Button size="sm" onClick={enter}>Get Started</Button>
        </div>
      </header>

      <section className="market-hero">
        <div className="hero-glow" aria-hidden />
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs"
        >
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">NEW</span>
          AI copilot for your ledger
        </motion.p>
        <motion.h1
          id="market-title"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mt-6 max-w-4xl text-[2.4rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.6rem]"
        >
          Transform your money
          <br />
          with <span className="italic-word text-white/90">AI precision</span>
        </motion.h1>
        <p className="mt-5 max-w-xl text-sm text-muted-foreground sm:text-base">
          Track spending, budgets, and goals in one live command centre — then ask the copilot what to do next.
        </p>
        <Button className="mt-8 rounded-full bg-white text-black hover:bg-white/90" onClick={enter}>
          Start free trial <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="market-mock">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3">FINOVA · {name}</span>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[14rem_1fr]">
            <aside className="hidden rounded-xl bg-secondary/50 p-3 text-sm lg:block">
              <p className="px-2 py-2 text-xs uppercase tracking-wider text-muted-foreground">General</p>
              <p className="rounded-lg bg-card px-3 py-2">Dashboard</p>
              <p className="px-3 py-2 text-muted-foreground">Ledger</p>
              <p className="px-3 py-2 text-muted-foreground">Budgets</p>
              <p className="px-3 py-2 text-muted-foreground">Copilot</p>
            </aside>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Welcome back, {name}</p>
              <p className="mt-1 text-xl font-medium">Here is this month's pulse.</p>
              <p className="mt-4 text-sm">
                Net cash <span className="text-primary">{money(ledger.flow, ledger.settings.currency)}</span>
              </p>
              <div className="mt-2 hidden h-28 sm:block">
                <CashflowChart data={ledger.series} />
              </div>
              <div className="mt-3 hidden space-y-2 lg:block">
                {recent.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-muted-foreground">{tx.description}</span>
                    <span>{money(tx.type === "expense" ? -tx.amount : tx.amount, ledger.settings.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-5 py-24 text-center">
        <h2 className="text-3xl font-semibold sm:text-5xl">
          AI-powered money <span className="italic-word">made simple</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
          Capture a purchase in plain English. See cashflow, health, and upcoming bills without switching apps.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "Live capture", body: "Type “coffee 180” and FINOVA files it." },
            { icon: BarChart3, title: "Clear insights", body: "Cashflow, categories, and health in one view." },
            { icon: FileText, title: "Your ledger", body: "Export a backup. Nothing leaves this device unless you send it." },
          ].map((item) => (
            <div key={item.title} className="market-card p-6 text-left">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-4 font-medium">{item.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="analytics" className="mx-auto max-w-5xl px-5 pb-20 text-center">
        <h2 className="text-3xl font-semibold sm:text-5xl">
          Intelligent finance <span className="italic-word">dashboard</span>
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="market-card p-6 text-left">
            <p className="font-medium">Cash this month</p>
            <p className="mt-3 text-3xl">{money(ledger.income, ledger.settings.currency)}</p>
            <p className="mt-1 text-sm text-income">Inflow</p>
            <p className="mt-6 text-3xl">{money(ledger.expense, ledger.settings.currency)}</p>
            <p className="text-sm text-expense">Outflow</p>
          </div>
          <div className="market-card p-6 text-left">
            <p className="font-medium">Health & savings</p>
            <p className="mt-3 text-3xl">{Math.round(ledger.savingsRate)}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Savings rate</p>
            <p className="mt-6 text-sm text-muted-foreground">{ledger.upcoming.length} upcoming bills on the radar.</p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-3xl px-5 py-24 text-center">
        <div className="orbit-ring h-56 w-56" aria-hidden />
        <div className="orbit-ring h-80 w-80" aria-hidden />
        <div className="orbit-ring h-[28rem] w-[28rem]" aria-hidden />
        <h2 className="relative text-3xl font-semibold sm:text-5xl">Copilot in the loop</h2>
        <div className="relative mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Wallet className="h-7 w-7 text-primary-foreground" />
        </div>
        <Button className="relative mt-10 rounded-full bg-white text-black hover:bg-white/90" onClick={enter}>
          Open the command centre <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      <section id="plans" className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="text-3xl font-semibold sm:text-5xl">
          A ledger that suits <span className="italic-word">your needs</span>
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="market-card p-8 text-left">
            <p className="text-sm text-muted-foreground">Guest</p>
            <p className="mt-2 text-4xl font-semibold">Free</p>
            <p className="mt-3 text-sm text-muted-foreground">Ledger, budgets, goals, and demo data on this device.</p>
            <Button className="mt-8 w-full rounded-full bg-white text-black hover:bg-white/90" onClick={enter}>
              Continue as guest
            </Button>
          </div>
          <div className="market-card p-8 text-left ring-1 ring-primary/40">
            <p className="text-sm text-muted-foreground">Signed in</p>
            <p className="mt-2 text-4xl font-semibold">OTP</p>
            <p className="mt-3 text-sm text-muted-foreground">Email or phone code. Same features, named session.</p>
            <Button asChild className="mt-8 w-full rounded-full">
              <Link to="/login" onClick={enter}>Sign in with OTP</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="market-card relative overflow-hidden px-6 py-16 text-center">
          <div className="hero-glow opacity-70" aria-hidden />
          <h2 className="relative text-3xl font-semibold sm:text-5xl">
            Ready to see your <span className="italic-word">money</span>?
          </h2>
          <Button className="relative mt-8 rounded-full bg-white text-black hover:bg-white/90" onClick={enter}>
            Let's get started
          </Button>
        </div>
      </section>

      <footer className="mx-auto grid max-w-5xl gap-8 px-5 py-16 text-sm text-muted-foreground sm:grid-cols-4">
        <p>
          <span className="text-foreground">FINOVA</span>
          <br />
          Private wealth ledger with an AI copilot.
        </p>
        <div>
          <p className="text-foreground">Product</p>
          <p className="mt-2">Ledger · Budgets · Goals</p>
        </div>
        <div>
          <p className="text-foreground">Intelligence</p>
          <p className="mt-2">Copilot · Capture · Health</p>
        </div>
        <div>
          <p className="text-foreground">Account</p>
          <button type="button" className="mt-2 hover:text-foreground" onClick={enter}>Enter app</button>
        </div>
      </footer>
    </div>
  );
}
