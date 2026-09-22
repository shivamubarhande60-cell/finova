# FINOVA architecture

```
Browser
  Marketing  /          light public site
  App        /app …     navy dashboard
  Auth       /login     email / phone OTP
       │
       ├── Zustand finance store  (transactions, budgets, goals)
       │     └── compute.ts       derived net, savings rate, series
       └── OTP session            local token after verify
              │
Server (TanStack Start)
  sendOtp / verifyOtp   hashed 6-digit code, expiry, rate limit
  Grok copilot          fenced ledger snapshot only (if XAI_API_KEY)
```

**One book.** Income, spend, budgets, goals, and the copilot all read the same ledger. Net is never stored — it is computed.

| File | Job |
| --- | --- |
| `src/lib/finance/store.ts` | Source of truth |
| `src/lib/finance/compute.ts` | Totals, series, health |
| `src/lib/finance/parse.ts` | English capture (`coffee 120`) |
| `src/lib/auth/otp.ts` | OTP send / verify |
| `src/lib/ai/grok.ts` | Server copilot |
