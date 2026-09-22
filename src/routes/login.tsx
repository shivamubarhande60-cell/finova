import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { sendOtpFn, verifyOtpFn } from "@/lib/auth/otp";
import { useFinovaAuth } from "@/lib/auth/finova-session";
import { useFinanceStore } from "@/lib/finance/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: LoginPage });

const ease = [0.16, 1, 0.3, 1] as const;

function LoginPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const user = useFinovaAuth((s) => s.user);
  const hydrated = useFinovaAuth((s) => s.hydrated);
  const setSession = useFinovaAuth((s) => s.setSession);
  const setName = useFinanceStore((s) => s.setName);

  const [method, setMethod] = useState<"email" | "phone">("email");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"dest" | "otp">("dest");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (hydrated && user) return <Navigate to="/app" />;

  const send = async () => {
    if (!destination.trim()) {
      toast.error(method === "email" ? "Enter your email." : "Enter your phone number.");
      return;
    }
    setBusy(true);
    try {
      const res = await sendOtpFn({ data: { method, destination } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDestination(res.destination);
      setPreview(res.previewCode);
      setStep("otp");
      setCode("");
      toast.success("Code sent.");
    } catch {
      toast.error("Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.replace(/\D/g, "").length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const res = await verifyOtpFn({ data: { method, destination, code } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSession(res.user, res.token);
      setName(res.user.displayName);
      sessionStorage.setItem("finova-intro-seen", "1");
      toast.success("Signed in.");
      void navigate({ to: "/app" });
    } catch {
      toast.error("Could not verify that code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="web web-auth">
      <header className="web-nav">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-sm text-white">
            F
          </span>
          FINOVA
        </Link>
        <div className="flex justify-end">
          <Button asChild size="sm" variant="ghost">
            <Link to="/app">Continue as guest</Link>
          </Button>
        </div>
      </header>

      <div className="web-auth-card">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-500">Email or phone, then a one-time 6-digit code. No password.</p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1">
          {(["email", "phone"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m);
                setStep("dest");
                setPreview(null);
                setCode("");
              }}
              className={cn(
                "flex h-11 items-center justify-center rounded-lg text-sm",
                method === m ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500",
              )}
            >
              {m === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === "dest" ? (
            <motion.form
              key="dest"
              className="mt-6 space-y-4"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Label htmlFor="dest">{method === "email" ? "Email" : "Phone number"}</Label>
              <Input
                id="dest"
                inputMode={method === "email" ? "email" : "tel"}
                autoComplete={method === "email" ? "email" : "tel"}
                placeholder={method === "email" ? "you@email.com" : "+91 98765 43210"}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <Button className="w-full bg-zinc-950 text-white hover:bg-zinc-800" disabled={busy} type="submit">
                {busy ? "Sending…" : "Send code"}
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              className="mt-6 space-y-4"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <Label htmlFor="otp">6-digit code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="000000"
                className="font-mono tracking-[0.4em]"
                value={code}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(next);
                  if (next.length === 6) {
                    window.setTimeout(() => {
                      const form = e.target.form;
                      form?.requestSubmit();
                    }, 50);
                  }
                }}
              />
              <p className="text-xs text-zinc-500">Sent to {destination}</p>
              {preview ? (
                <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs">
                  Demo code <span className="font-mono tracking-[0.3em]">{preview}</span>
                </p>
              ) : null}
              <Button className="w-full bg-zinc-950 text-white hover:bg-zinc-800" disabled={busy} type="submit">
                {busy ? "Checking…" : "Verify and enter"}
              </Button>
              <button type="button" className="w-full text-sm text-zinc-500 underline-offset-4 hover:underline" disabled={busy} onClick={() => void send()}>
                Resend code
              </button>
              <button
                type="button"
                className="w-full text-sm text-zinc-500 underline-offset-4 hover:underline"
                onClick={() => {
                  setStep("dest");
                  setPreview(null);
                }}
              >
                Use a different {method}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
