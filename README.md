# Golden DIH Trading Journal (ReplayJournal)

A minimal, ultra-fast, and reliable backtesting trade journal and performance tracker built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM with SQLite, and Recharts.

---

## ⚡ Key Highlights & Architecture

- **Low Error Surface & High Speed**: Focused MVP architecture designed specifically for backtesting analysis without unnecessary bloat.
- **Contained Sessions**: A `Session` encapsulates a specific backtest run (name, instrument, date range, starting balance, status) with associated `Trade` entries.
- **Direct Database Service Layer**: All database queries are isolated in `lib/data/*.ts` (`sessions.ts`, `trades.ts`, `user.ts`). No UI component interacts directly with Prisma.
- **Single-Query Stats & Equity Aggregation**: Net P&L, Win Rate, Profit Factor, Average Win/Loss, and historical Equity Curve points are computed from a single query per page load.
- **Backtest-Log Scalars**: Clean scalar columns for HTF Bias, News Today, Risk %, Draw Direction, Setup / Model, Emotional State, Rules Followed, and Planned R:R.
- **Local SQLite Storage**: Fast, zero-setup, embedded database file (`dev.db`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Dark Mode & trading color system
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) + [SQLite](https://www.sqlite.org/)
- **Charts**: [Recharts](https://recharts.org/) (Interactive Equity Curve with baseline)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17+ or v20+)
- `npm` or `pnpm` or `yarn`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/MichaelYerom/Golden-dih-trading-journal.git
cd Golden-dih-trading-journal

# Install dependencies
npm install
```

### 3. Initialize Database
```bash
# Generate Prisma Client & push SQLite schema
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 App Pages & Features

### 1. Homepage (`/`)
- Grid of backtest session cards with instant quick stats (Net P&L, Win Rate, Total Trades, Return %).
- Interactive **"New Session"** card and modal dialog (Session name, instrument, date range, starting balance, status).

### 2. Session View (`/sessions/[id]`)
- **Metric Cards**: Net P&L (amount & return %), Win Rate (wins/losses/breakevens), Profit Factor, Avg Win / Avg Loss payoff ratio.
- **Equity Curve**: Interactive area chart showing account trajectory from starting balance baseline.
- **Add Trade Drawer**: Slide-over drawer with:
  - **Core Section (Required)**: Symbol, Direction (Long/Short), Entry/Exit Datetime, Entry/Exit Price, Gross P&L, Result (Win/Loss/BE).
  - **Backtest Section (Optional)**: HTF Bias, News Today, Risk %, Draw on Liquidity, Setup/Model, Emotional State, Rules Followed checkbox, Planned R:R, Notes.
- **Trade Table**: Chronological table highlighting Setup/Model and Rules Followed, with expandable row details for all backtest fields and trade deletion.

---

## 🧪 Build & Lint Verification

```bash
# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

---

## 📄 License
MIT License.
