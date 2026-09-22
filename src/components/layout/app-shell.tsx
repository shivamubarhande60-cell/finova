import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Flag,
  LayoutDashboard,
  List,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  Target,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/lib/finance/store";
import { useLedger } from "@/lib/finance/use-ledger";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TransactionFormDialog } from "@/components/finance/transaction-form";
import { Money } from "@/components/finance/money";
import { motion } from "motion/react";
import { PageFade } from "@/components/motion/page-fade";
import { useFinovaAuth } from "@/lib/auth/finova-session";

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ledger", label: "Ledger", icon: List },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/advisor", label: "Copilot", icon: MessageSquareText },
] as const;

const MOBILE = [
  { to: "/app", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/ledger", label: "Ledger", icon: List },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/advisor", label: "AI", icon: MessageSquareText },
] as const;

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === "/app";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openForm = useFinanceStore((s) => s.openForm);
  const ledger = useLedger();
  const user = useFinovaAuth((s) => s.user);
  const [more, setMore] = useState(false);
  const isMarketing = pathname === "/" || pathname === "/login";
  const display = user?.displayName || ledger.settings.displayName || "Guest";
  const initial = display.slice(0, 1).toUpperCase();
  const alerts = ledger.upcoming.length;

  if (isMarketing) {
    return (
      <div className="min-h-dvh max-w-[100vw] overflow-x-hidden">
        <main id="main">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-desk">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="app-frame">
        <aside className="app-side">
          <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              F
            </span>
            <p className="text-sm font-semibold tracking-tight">FINOVA</p>
          </Link>
          <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Main">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to, "exact" in item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-secondary"
                      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                    />
                  ) : null}
                  <item.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-border px-3 py-4">
            <Link to="/settings" className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{display}</p>
                <p className="text-[11px] text-muted-foreground">{user ? "Signed in" : "Guest"}</p>
              </span>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </aside>

        <div className="app-main">
          <header className="app-topbar">
            <p className="truncate text-sm font-semibold lg:hidden">FINOVA</p>
            <Link
              to="/ledger"
              className="hidden h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/80 px-3 text-sm text-muted-foreground lg:flex"
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="relative hidden sm:inline-flex">
                    Notifications
                    {alerts ? (
                      <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] text-white">
                        {alerts}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))]">
                  <p className="text-sm font-medium">Upcoming</p>
                  <div className="mt-3 space-y-3">
                    {ledger.upcoming.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p>{r.description}</p>
                          <p className="text-xs text-muted-foreground">{r.nextDate}</p>
                        </div>
                        <Money
                          value={r.type === "expense" ? -r.amount : r.amount}
                          signed
                          className="text-xs font-semibold"
                        />
                      </div>
                    ))}
                    {ledger.upcoming.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming bills.</p>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="outline" className="relative" aria-label="Alerts">
                    <Bell className="h-4 w-4" />
                    {alerts ? <span className="alert-dot" /> : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] sm:hidden">
                  <p className="text-sm font-medium">Upcoming</p>
                  <div className="mt-3 space-y-3">
                    {ledger.upcoming.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex justify-between gap-3 text-sm">
                        <p className="truncate">{r.description}</p>
                        <Money value={r.type === "expense" ? -r.amount : r.amount} signed className="text-xs" />
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button size="sm" className="hidden lg:inline-flex" onClick={() => openForm()}>
                <Plus className="h-4 w-4" />
                Add transaction
              </Button>
            </div>
          </header>
          <main id="main" tabIndex={-1} className="app-content">
            <PageFade pathname={pathname}>{children}</PageFade>
          </main>
        </div>
      </div>

      <button type="button" className="fab" onClick={() => openForm()} aria-label="Add transaction">
        <Plus className="h-6 w-6" />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Primary">
        <div className="grid grid-cols-5">
          {MOBILE.map((item) => {
            const active = isActive(pathname, item.to, "exact" in item);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] tracking-wide",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMore(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] tracking-wide text-muted-foreground"
          >
            <Menu className="h-4 w-4" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold">More</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-1 pb-6">
            {[
              { to: "/goals", label: "Goals", icon: Flag },
              { to: "/analytics", label: "Analytics", icon: BarChart3 },
              { to: "/settings", label: "Settings", icon: Settings },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMore(false)}
                className="flex h-12 items-center gap-3 rounded-xl px-2 text-sm hover:bg-accent"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <TransactionFormDialog />
    </div>
  );
}
