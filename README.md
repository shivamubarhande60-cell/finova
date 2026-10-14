
# FINOVA

**A personal finance OS for tracking transactions, managing budgets, setting goals, and understanding your finances with AI-assisted insights.**

FINOVA is a full-stack personal finance application featuring a public landing page, guest access, OTP authentication, a financial dashboard, analytics, and an AI copilot grounded in the user's own financial data.

> **Disclaimer:** FINOVA provides financial insights for informational purposes only and does not provide financial advice. Demo data is included so the dashboard has something to display from the start.

![FINOVA Marketing Website](docs/github-home.png)

![FINOVA Dashboard](docs/github-app.png)

---

## ✨ Features

| Feature | What it does |
|:---|:---|
| **Financial Dashboard** | Summarizes net balance, income, spending, savings rate, cash flow, and recent activity. |
| **Transaction Ledger** | Enter transactions using natural language, such as `coffee 120` or `salary 45000`, or use the transaction form. |
| **Budgets & Goals** | Organizes spending into budget envelopes and tracks financial targets against ledger activity. |
| **Analytics** | Visualizes spending categories, financial trends, and overall financial health. |
| **AI Copilot** | Provides insights from the user's financial data, with optional live responses through the xAI API. |
| **OTP Authentication** | Supports email or phone verification using six-digit codes, hashed code storage, and rate-limited attempts. |
| **Guest Access** | Allows users to explore the application without creating an account. |
| **Local Data & Backups** | Keeps the finance book in the browser and provides an export option for backups. |

---

## 🏗️ Architecture & Engineering Highlights

FINOVA was built to demonstrate practical application engineering beyond basic CRUD operations.

| Area | Implementation |
|:---|:---|
| **Frontend** | React 19, TypeScript, TanStack Router, Tailwind CSS v4 |
| **UI & Visualization** | shadcn/Radix, Lucide, Recharts, Motion |
| **State Management** | Zustand with computed financial totals |
| **Authentication** | Custom OTP flow, hashed codes, rate limiting, and session tokens |
| **AI Integration** | On-device financial analysis with optional server-side xAI Grok enhancement |
| **Data Handling** | Typed models, input sanitization, and export/backup functionality |

### Engineering decisions

- **Computed ledger balances:** Financial totals are derived from transaction records instead of maintaining a separate stored net balance.
- **Authentication safeguards:** OTP codes are hashed and verification attempts are rate-limited.
- **Privacy-conscious AI:** The copilot is designed to answer using the signed-in user's own financial data.
- **Graceful AI fallback:** Core financial insights remain available without an API key.
- **Testing and security:** The project includes unit tests and security-audit work.

---

## 🛠️ Tech Stack

**Languages:** TypeScript · JavaScript

**Frontend:** React 19 · TanStack Router · TanStack Query · Tailwind CSS v4

**UI & Charts:** shadcn/Radix · Lucide · Recharts · Motion

**State Management:** Zustand

**AI Integration:** xAI Grok API

**Authentication:** Custom OTP and session handling

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Git

### Installation

```bash
git clone https://github.com/shivamubarhande60-cell/finova.git
cd finova
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal. The project is configured to use port `8080` by default.

### Optional: Enable live AI responses

The financial copilot can provide local insights without an API key. To enable the optional live xAI integration, configure your local environment with:

```env
XAI_API_KEY=your_key_here
```

Use the environment configuration expected by the server. Never expose API keys in frontend code or commit secrets to Git.

### Run type checking

```bash
npm run typecheck
```

---

## 🧭 Application Routes

| Route | Purpose |
|:---|:---|
| `/` | Public marketing website |
| `/app` | Financial dashboard; guest access supported |
| `/login` | Email or phone OTP authentication |
| `/ledger` | Transaction management |
| `/budgets` | Budget management |
| `/goals` | Financial targets |
| `/analytics` | Financial analytics |
| `/advisor` | AI-powered financial insights |

---

## 📁 Project Structure

```text
src/
├── routes/          # Landing page, dashboard, ledger, auth and copilot
├── components/
│   ├── marketing/   # Public website
│   ├── finance/     # Charts, transaction capture and money components
│   └── layout/      # Application shell
└── lib/
    ├── finance/     # Store, calculations, parsing and types
    ├── auth/        # OTP and session logic
    └── ai/          # Grok copilot integration

docs/                # Project screenshots and documentation
```

---

## 📚 Further Documentation

- [Architecture](ARCHITECTURE.md)
- [Interview Notes](INTERVIEW.md)
- [GitHub Project Notes](GITHUB.md)

---

## 💼 Project Summary

**FINOVA — Personal Finance Management Platform**

Built with React and TypeScript, featuring a computed transaction ledger, budget and goal tracking, OTP authentication, financial analytics, and an AI copilot with user-scoped financial insights.

---

## ⚖️ License

MIT License. See [LICENSE](LICENSE).
