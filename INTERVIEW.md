# FINOVA — 2-minute interview script

Use this tomorrow. Speak slowly. Click while you talk.

## 30-second pitch

> FINOVA is a personal finance OS. It is not a CRUD table. The product is a live ledger: you type “coffee 120”, it files the category and sign, budgets and savings rate update from that book, and a copilot answers only from those numbers. Guest mode works with no account. OTP is optional.

## Demo path (90 seconds)

1. **Landing (`/`)** — “This is the public site. The screenshot is the real dashboard, not a mock.”
2. **Open app (`/app`)** — Point to net, income, spend, savings rate, cash-flow chart.
3. **Add** — Capture bar: type `coffee 80` and submit. Show the row appear and net move.
4. **Budgets** — “Envelopes are derived from the same transactions, not a second spreadsheet.”
5. **Copilot** — Ask: `What should I cut this month?`  
   If live AI is off, say: “Without an API key it still parses captures locally. With `XAI_API_KEY` the server sends a fenced snapshot only — no other user data.”
6. **Sign in** — Email or phone, 6-digit OTP, no password.

## If they ask “why this stack?”

- React + TypeScript for UI
- Zustand store, **computed** ledger (net is never stored)
- TanStack Router for app vs marketing
- Custom OTP: hashed code, expiry, rate limit
- Grok on the **server**, never the browser

## If they ask “what would you add next?”

1. Real SMS/email OTP provider (Twilio / Resend)
2. Bank CSV import
3. Encrypted backup to the user’s own cloud
4. Tests around `compute.ts` and OTP

Do **not** say “AI generated this.” Say you designed the product around a single ledger and then built auth and copilot on top.
