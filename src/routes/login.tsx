import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, AtSign, ShieldCheck, Smartphone } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { parseMobileNumber } from "@/lib/auth/phone";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
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
  const { user, isPending } = useCurrentUserState();
  const setName = useFinanceStore((s) => s.setName);

  const [method, setMethod] = useState<"email" | "phone">("email");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"dest" | "otp">("dest");
  const [busy, setBusy] = useState(false);

  if (!isPending && user) return <Navigate to="/app" />;

  const send = async () => {
    if (!destination.trim()) {
      toast.error(method === "email" ? "Enter your email." : "Enter your phone number.");
      return;
    }
    const nextDestination = method === "email"
      ? destination.trim().toLowerCase()
      : parseMobileNumber(destination);
    if (!nextDestination) {
      toast.error("Enter a valid mobile number, including its country code if outside India.");
      return;
    }
    setBusy(true);
    try {
      const result = method === "email"
        ? await authClient.emailOtp.sendVerificationOtp({ email: nextDestination, type: "sign-in" })
        : await authClient.phoneNumber.sendOtp({ phoneNumber: nextDestination });
      if (result.error) {
        toast.error(result.error.message || "Could not send a code.");
        return;
      }
      setDestination(nextDestination);
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
      const result = method === "email"
        ? await authClient.signIn.emailOtp({ email: destination, otp: code })
        : await authClient.phoneNumber.verify({ phoneNumber: destination, code });
      if (result.error) {
        toast.error(result.error.message || "That code could not be verified.");
        return;
      }
      const account = result.data?.user;
      if (!account) {
        toast.error("Your account could not be loaded. Try again.");
        return;
      }
      await authClient.getSession();
      const ownerKey = "finova-ledger-owner";
      if (localStorage.getItem(ownerKey) !== account.id) {
        useFinanceStore.getState().resetEmpty();
        localStorage.setItem(ownerKey, account.id);
      }
      setName(account.name || (method === "email" ? destination.split("@")[0]! : destination));
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
      <header className="web-nav login-nav">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-sm text-white">F</span>
          FINOVA
        </Link>
        <Button asChild size="sm" variant="ghost">
          <Link to="/app">Continue as guest <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </header>

      <main className="login-stage">
        <section className="login-story" aria-label="FINOVA account security">
          <div className="login-story-top">
            <span className="login-orbit" aria-hidden="true"><ShieldCheck /></span>
            <p>PRIVATE BY DESIGN</p>
          </div>
          <div>
            <p className="web-kicker">Your money, in focus</p>
            <h1>Good decisions start with a clear picture.</h1>
            <p className="login-story-copy">Sign in with a one-time code. No password to remember, no account details to expose.</p>
          </div>
          <div className="login-ledger" aria-hidden="true">
            <div className="login-ledger-head"><span>FINOVA / PRIVATE LEDGER</span><span>01 — 03</span></div>
            <div className="login-ledger-line"><span>01</span><span>Income</span><i /><b>Tracked</b></div>
            <div className="login-ledger-line"><span>02</span><span>Spending</span><i /><b>Organized</b></div>
            <div className="login-ledger-line"><span>03</span><span>Next steps</span><i /><b>In view</b></div>
          </div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel-head">
            <p className="web-kicker">Welcome to FINOVA</p>
            <h2 id="login-title">{step === "dest" ? "Sign in" : "Check your messages"}</h2>
            <p>{step === "dest" ? "Choose where to receive your secure sign-in code." : `Enter the 6-digit code sent to ${destination}.`}</p>
          </div>

          <div className="login-methods" role="tablist" aria-label="Sign-in method">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={method === m}
                disabled={busy}
                onClick={() => {
                  setMethod(m);
                  setStep("dest");
                  setCode("");
                }}
                className={cn("login-method", method === m && "is-active")}
              >
                {m === "email" ? <AtSign /> : <Smartphone />}
                {m === "email" ? "Email" : "Mobile"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {step === "dest" ? (
              <motion.form
                key="destination"
                className="login-form"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease }}
                onSubmit={(e) => { e.preventDefault(); void send(); }}
              >
                <Label htmlFor="dest">{method === "email" ? "Email address" : "Mobile number"}</Label>
                <Input
                  id="dest"
                  inputMode={method === "email" ? "email" : "tel"}
                  autoComplete={method === "email" ? "email" : "tel"}
                  type={method === "email" ? "email" : "tel"}
                  placeholder={method === "email" ? "name@example.com" : "+91 98765 43210"}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={busy}
                  required
                />
                <Button className="login-submit" disabled={busy || !destination.trim()} type="submit">
                  {busy ? "Sending code…" : "Send sign-in code"}
                  {!busy ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="verification"
                className="login-form"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease }}
                onSubmit={(e) => { e.preventDefault(); void verify(); }}
              >
                <Label htmlFor="otp">6-digit verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                  className="login-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={busy}
                  required
                />
                <Button className="login-submit" disabled={busy || code.length !== 6} type="submit">
                  {busy ? "Verifying…" : "Verify and sign in"}
                  {!busy ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
                <div className="login-actions">
                  <button type="button" disabled={busy} onClick={() => void send()}>Resend code</button>
                  <button type="button" disabled={busy} onClick={() => { setStep("dest"); setCode(""); }}>
                    <ArrowLeft /> Change {method === "email" ? "email" : "number"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          <p className="login-privacy"><ShieldCheck /> Your code is private and expires after 5 minutes.</p>
        </section>
      </main>
    </div>
  );
}
