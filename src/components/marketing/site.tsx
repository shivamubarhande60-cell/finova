import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock, MessageSquareText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";
import { useLedger } from "@/lib/finance/use-ledger";
import { money } from "@/lib/finance/format";

export function MarketingSite() {
  const ledger = useLedger();
  const c = ledger.settings.currency;

  return (
    <div className="web">
      <header className="web-nav">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-sm text-white">
            F
          </span>
          FINOVA
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-500 md:flex" aria-label="Product">
          <a href="#product" className="hover:text-zinc-950">
            Product
          </a>
          <a href="#platform" className="hover:text-zinc-950">
            Platform
          </a>
          <a href="#security" className="hover:text-zinc-950">
            Security
          </a>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-zinc-950 text-white hover:bg-zinc-800">
            <Link to="/app">Open app</Link>
          </Button>
        </div>
      </header>

      <section className="web-band">
        <div className="web-hero">
          <p className="web-kicker">Personal finance OS</p>
          <h1 className="web-h1">The operating system for your money.</h1>
          <p className="web-lede">
            Ledger, budgets, goals, and a copilot that reads this book — not the internet. Private on this device. Ready in guest mode.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-zinc-950 text-white hover:bg-zinc-800">
              <Link to="/app">
                Start with demo data <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Sign in with OTP</Link>
            </Button>
          </div>
          <dl className="web-metrics">
            <div>
              <dt>Net this month</dt>
              <dd className="amount">{money(ledger.flow, c)}</dd>
            </div>
            <div>
              <dt>Savings rate</dt>
              <dd>{Math.round(ledger.savingsRate)}%</dd>
            </div>
            <div>
              <dt>Upcoming</dt>
              <dd>{ledger.upcoming.length} bills</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="product" className="web-band web-band-soft" aria-label="Product preview">
        <div className="web-frame">
          <ProductPreview />
        </div>
      </section>

      <section id="platform" className="web-band">
        <div className="web-section">
          <p className="web-kicker">Platform</p>
          <h2 className="web-h2">Everything the books need. Nothing they don’t.</h2>
          <div className="web-bento">
            <article className="web-tile web-tile-lg">
              <Wallet className="h-5 w-5" />
              <h3>Live ledger</h3>
              <p>
                Capture a purchase in English. Income, spend, and envelopes stay in one book — {ledger.transactions.length} movements already in this demo.
              </p>
            </article>
            <article className="web-tile">
              <MessageSquareText className="h-5 w-5" />
              <h3>Copilot</h3>
              <p>Ask what to cut this month. Answers use your numbers only.</p>
            </article>
            <article className="web-tile">
              <Lock className="h-5 w-5" />
              <h3>On-device</h3>
              <p>No cloud wallet. Export a backup when you want a copy.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="security" className="web-band web-band-soft">
        <div className="web-section">
          <div className="web-split">
            <div>
              <p className="web-kicker">Access</p>
              <h2 className="web-h2">Guest first. Named session when you want it.</h2>
            </div>
            <ol className="web-steps">
              <li>
                <strong>Open the app.</strong>
                <span> Demo money is loaded so the desk is not empty.</span>
              </li>
              <li>
                <strong>Log a movement.</strong>
                <span> Type it, or add from the table. Budgets update themselves.</span>
              </li>
              <li>
                <strong>Sign in with OTP.</strong>
                <span> Email or phone, then a six-digit code. No password.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="web-band">
        <div className="web-cta">
          <h2 className="web-h2">Open FINOVA.</h2>
          <p>The dashboard on this page is the real product.</p>
          <Button asChild size="lg" className="mt-6 bg-zinc-950 text-white hover:bg-zinc-800">
            <Link to="/app">Go to dashboard</Link>
          </Button>
        </div>
      </section>

      <footer className="web-band">
        <div className="web-foot">
          <p className="font-semibold text-zinc-950">FINOVA</p>
          <Link to="/app">App</Link>
          <Link to="/login">Sign in</Link>
          <p>Private ledger. Not financial advice.</p>
        </div>
      </footer>
    </div>
  );
}
