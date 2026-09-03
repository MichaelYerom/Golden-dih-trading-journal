# Golden DIH Trading Journal (ReplayJournal)

A minimal, ultra-fast, and reliable backtesting trade journal and performance tracker built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase JS SDK (`@supabase/supabase-js`, `@supabase/ssr`), and Recharts.

---

## ⚡ Key Highlights & Architecture

- **Low Error Surface & High Speed**: Focused architecture designed specifically for backtesting analysis without unnecessary bloat.
- **Pure Supabase JS Client**: Direct HTTP/REST data access via `@supabase/supabase-js` and `@supabase/ssr` respecting Row Level Security (RLS) policies. Zero Prisma runtime or database connection pooler bottlenecks.
- **Contained Sessions**: A `Session` encapsulates a specific backtest run (name, instrument, date range, starting balance, status) with associated `Trade` entries.
- **Direct Database Service Layer**: All database queries are isolated in `lib/data/*.ts` (`sessions.ts`, `trades.ts`, `user.ts`). No UI component interacts directly with the database.
- **Single-Query Stats & Equity Aggregation**: Net P&L, Win Rate, Profit Factor, Average Win/Loss, and historical Equity Curve points are computed efficiently per page load.
- **Backtest-Log Scalars**: Clean scalar columns for HTF Bias, News Today, Risk %, Draw Direction, Setup / Model, Emotional State, Rules Followed, and Planned R:R.
- **Row Level Security (RLS)**: Enforced per-user data isolation across all tables.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Dark Mode & trading color system
- **Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- **Charts**: [Recharts](https://recharts.org/) (Interactive Equity Curve with baseline)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17+ or v20+)
- `npm` or `pnpm` or `yarn`
- A [Supabase](https://supabase.com/) project

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/MichaelYerom/Golden-dih-trading-journal.git
cd Golden-dih-trading-journal

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### 4. Database Schema
Reference SQL schema and RLS policies are available in `supabase/schema.sql`.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 App Pages & Features

### 1. Homepage (`/`)
- Grid of backtest session cards with instant quick stats (Net P&L, Win Rate, Total Trades, Return %).
- Interactive **"New Session"** card and modal dialog (Session name, instrument, date range, starting balance, status).
- **Import / Export Session Snapshots**: Full JSON snapshot portability.

### 2. Session View (`/sessions/[id]`)
- **Metric Cards**: Net P&L (amount & return %), Win Rate (wins/losses/breakevens), Profit Factor, Avg Win / Avg Loss payoff ratio.
- **Equity Curve & Drawdown Analysis**: Interactive area chart showing account trajectory from starting balance baseline with peak-to-trough drawdown tracking.
- **Time Analysis**: Hourly performance distribution, day of week edge detection, and duration analysis.
- **Setup Leaderboard**: Multi-setup model cross-tabulation with condition filters.
- **Calendar & Daily P&L Heatmap**: Sunday-to-Saturday calendar grid with weekly summaries, flat color-block daily P&L, and click-to-edit day popup.
- **PDF Analysis Report**: Printable executive performance report with heuristic recommendations.
- **Add / Edit Trade Drawer**: Slide-over drawer with screenshot attachments, multi-rule evaluation checklist, and validation.

---

## 🧪 Build & Lint Verification

```bash
# Run TypeScript compilation
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

---

## 📄 License
MIT License.
