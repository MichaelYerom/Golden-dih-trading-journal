# Golden DIH Trading Journal (ReplayJournal)

A minimal, ultra-fast, and reliable backtesting trade journal and performance tracker built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM with Supabase (PostgreSQL), and Recharts.

---

## ⚡ Key Highlights & Architecture

- **Low Error Surface & High Speed**: Focused MVP architecture designed specifically for backtesting analysis without unnecessary bloat.
- **Contained Sessions**: A `Session` encapsulates a specific backtest run (name, instrument, date range, starting balance, status) with associated `Trade` entries.
- **Direct Database Service Layer**: All database queries are isolated in `lib/data/*.ts` (`sessions.ts`, `trades.ts`, `user.ts`). No UI component interacts directly with Prisma.
- **Single-Query Stats & Equity Aggregation**: Net P&L, Win Rate, Profit Factor, Average Win/Loss, and historical Equity Curve points are computed from a single query per page load.
- **Backtest-Log Scalars**: Clean scalar columns for HTF Bias, News Today, Risk %, Draw Direction, Setup / Model, Emotional State, Rules Followed, and Planned R:R.
- **Cloud-Ready PostgreSQL (Supabase)**: Powered by Supabase PostgreSQL with transaction pooling (`DATABASE_URL`) and direct migration support (`DIRECT_URL`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Dark Mode & trading color system
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) + [Supabase Postgres](https://supabase.com/)
- **Charts**: [Recharts](https://recharts.org/) (Interactive Equity Curve with baseline)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17+ or v20+)
- `npm` or `pnpm` or `yarn`
- A [Supabase](https://supabase.com/) project (PostgreSQL database)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/MichaelYerom/Golden-dih-trading-journal.git
cd Golden-dih-trading-journal

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase connection strings:
```bash
cp .env.example .env
```

```env
# Supabase Transaction Pooler URL (Port 6543)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection URL (Port 5432)
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 4. Initialize Database
```bash
# Push schema to Supabase Postgres
npx prisma generate
npx prisma db push
```

### 5. (Optional) Migrate Data from Local SQLite Backup
If you have existing backtest data in `prisma/dev.db`, run the migration script:
```bash
npx tsx scripts/migrate-to-supabase.ts
```

### 6. Run Development Server
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
