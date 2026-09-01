import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getSessionById } from "@/lib/data/sessions";
import { getSessionTradesAndStats } from "@/lib/data/trades";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import { EquityChart } from "@/components/equity-chart";
import { TradeTable } from "@/components/trade-table";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { formatCurrency, formatPercent, formatCurrencyNeutral } from "@/lib/utils";
import { ChevronLeft, Calendar, Layers, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await getSessionById(params.id);

  if (!session) {
    notFound();
  }

  // Fetch all trades and compute all session stats + equity curve in a single query
  const { trades, stats, equityCurve } = await getSessionTradesAndStats(
    session.id,
    session.startingBalance,
    session.periodStart
  );

  const formattedPeriod = `${format(
    new Date(session.periodStart),
    "MMM d, yyyy"
  )} – ${format(new Date(session.periodEnd), "MMM d, yyyy")}`;

  const isProfit = stats.netPnl > 0;
  const isLoss = stats.netPnl < 0;

  return (
    <div className="space-y-5">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-0.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Sessions</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {session.name}
            </h1>
            <Badge variant="outline" className="font-mono-numbers font-medium text-[11px]">
              {session.instrument}
            </Badge>
            <Badge
              variant={
                session.status === "active"
                  ? "active"
                  : session.status === "completed"
                  ? "completed"
                  : "archived"
              }
              className="text-[11px]"
            >
              {session.status}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedPeriod}
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Starting: {formatCurrencyNeutral(session.startingBalance)}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {stats.totalTrades} {stats.totalTrades === 1 ? "trade" : "trades"} logged
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <DeleteSessionButton sessionId={session.id} />
          <AddTradeDrawer
            sessionId={session.id}
            defaultSymbol={session.instrument}
            defaultDate={session.periodStart.toISOString()}
          />
        </div>
      </div>

      {/* STAT CARDS GRID (Flat panels matching TradeZella) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Net P&L */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Net Cumulative P&L
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div
              className={`text-xl font-semibold font-mono-numbers ${
                isProfit
                  ? "text-[#22A06B]"
                  : isLoss
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {formatCurrency(stats.netPnl)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 font-mono-numbers">
              <span
                className={
                  stats.netPnlPercent > 0
                    ? "text-[#22A06B]"
                    : stats.netPnlPercent < 0
                    ? "text-[#DB5461]"
                    : "text-muted-foreground"
                }
              >
                {stats.netPnlPercent >= 0 ? "+" : ""}
                {stats.netPnlPercent.toFixed(1)}%
              </span>
              <span>balance: {formatCurrencyNeutral(stats.currentBalance)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Win Rate */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Trade Win %
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-semibold font-mono-numbers text-foreground">
              {stats.totalTrades > 0 ? formatPercent(stats.winRate) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers">
              {stats.winCount}W / {stats.lossCount}L
              {stats.breakevenCount > 0 ? ` / ${stats.breakevenCount}BE` : ""}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Profit Factor */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-semibold font-mono-numbers text-foreground">
              {stats.totalTrades > 0
                ? stats.profitFactor === Infinity
                  ? "∞"
                  : stats.profitFactor.toFixed(2)
                : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers">
              Gains: ${Math.round(stats.totalGains).toLocaleString()} | Losses: $
              {Math.round(stats.totalLosses).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Avg Win / Loss */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Avg Win / Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline gap-1.5 font-mono-numbers">
              <span className="text-sm font-semibold text-[#22A06B]">
                {stats.winCount > 0
                  ? `+$${Math.round(stats.avgWin).toLocaleString()}`
                  : "$0"}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-semibold text-[#DB5461]">
                {stats.lossCount > 0
                  ? `-$${Math.round(stats.avgLoss).toLocaleString()}`
                  : "$0"}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers">
              Payoff:{" "}
              {stats.avgLoss > 0
                ? (stats.avgWin / stats.avgLoss).toFixed(2)
                : "—"}
              x
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EQUITY CURVE CHART */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-foreground">
                Equity Curve
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Account balance progression over backtest period.
              </p>
            </div>
            <div className="text-xs text-muted-foreground font-mono-numbers">
              Current:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrencyNeutral(stats.currentBalance)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <EquityChart
            data={equityCurve}
            startingBalance={session.startingBalance}
          />
        </CardContent>
      </Card>

      {/* TRADE LOG TABLE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Trade View ({trades.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Individual executions and backtest log observations.
            </p>
          </div>
          <AddTradeDrawer
            sessionId={session.id}
            defaultSymbol={session.instrument}
            defaultDate={session.periodStart.toISOString()}
          />
        </div>

        <TradeTable trades={trades} sessionId={session.id} />
      </div>
    </div>
  );
}
