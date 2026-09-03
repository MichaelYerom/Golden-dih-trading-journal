"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import { EquityChart } from "@/components/equity-chart";
import { RDistributionChart } from "@/components/r-distribution-chart";
import { TradeTable } from "@/components/trade-table";
import { RuleComplianceCard } from "@/components/rule-compliance-card";
import { TimeAnalyticsView } from "@/components/time-analytics-view";
import { SetupLeaderboardView } from "@/components/setup-leaderboard-view";
import { CalendarHeatmapView } from "@/components/calendar-heatmap-view";
import {
  TradeEntity,
  SessionStats,
  EquityPoint,
  RBucket,
  DrawdownResult,
  RuleEntity,
  RuleComplianceResult,
  TimeAnalyticsResult,
  SetupAnalyticsResult,
  CalendarAnalyticsResult,
} from "@/lib/data/trade-analytics";
import { formatCurrency, formatPercent, formatCurrencyNeutral } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  Trophy,
  CalendarDays,
} from "lucide-react";

interface SessionDashboardViewProps {
  session: {
    id: string;
    instrument: string;
    startingBalance: number;
    periodStart: Date;
    periodEnd: Date;
  };
  trades: TradeEntity[];
  stats: SessionStats;
  equityCurve: EquityPoint[];
  rDistribution: RBucket[];
  drawdownDetails: DrawdownResult;
  rules: RuleEntity[];
  compliance: RuleComplianceResult;
  timeAnalytics: TimeAnalyticsResult;
  setupAnalytics: SetupAnalyticsResult;
  calendarAnalytics: CalendarAnalyticsResult;
}

export function SessionDashboardView({
  session,
  trades,
  stats,
  equityCurve,
  rDistribution,
  drawdownDetails,
  rules,
  compliance,
  timeAnalytics,
  setupAnalytics,
  calendarAnalytics,
}: SessionDashboardViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = React.useState<
    "overview" | "time" | "setups" | "calendar"
  >("overview");
  const [selectedSetupFilter, setSelectedSetupFilter] = React.useState<string | null>(null);

  const isProfit = stats.netPnl > 0;
  const isLoss = stats.netPnl < 0;

  const handleSelectSetupFromLeaderboard = (setupName: string) => {
    setSelectedSetupFilter(setupName);
    setActiveTab("overview");
  };

  const handleSelectDateFromCalendar = (dateString: string) => {
    // Jump to overview and filter trade table to this date
    router.replace(`${pathname}?start=${dateString}&end=${dateString}`, { scroll: false });
    setActiveTab("overview");
  };

  return (
    <div className="space-y-5">
      {/* TAB NAVIGATION HEADER */}
      <div className="flex items-center gap-2 border-b border-border pb-2.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Overview & Trades</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("time")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "time"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Time Analysis</span>
          {timeAnalytics.totalTradesEvaluated > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono-numbers ${
                activeTab === "time"
                  ? "bg-black/30 text-primary-foreground"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {timeAnalytics.totalTradesEvaluated}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("setups")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "setups"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Setup Leaderboard</span>
          {setupAnalytics.totalSetupsCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono-numbers ${
                activeTab === "setups"
                  ? "bg-black/30 text-primary-foreground"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {setupAnalytics.totalSetupsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "calendar"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Calendar Heatmap</span>
          {calendarAnalytics.dayStreaks.totalTradingDays > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono-numbers ${
                activeTab === "calendar"
                  ? "bg-black/30 text-primary-foreground"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {calendarAnalytics.dayStreaks.totalTradingDays}d
            </span>
          )}
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-5">
          {/* STAT CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {/* Card 1: Net P&L */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Net P&L
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
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
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
                  <span>bal: {formatCurrencyNeutral(stats.currentBalance)}</span>
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
                <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
                  {stats.winCount}W / {stats.lossCount}L
                  {stats.breakevenCount > 0 ? ` / ${stats.breakevenCount}BE` : ""}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Expectancy */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Expectancy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0">
                <div
                  className={`text-xl font-semibold font-mono-numbers ${
                    stats.expectancy !== null && stats.expectancy > 0
                      ? "text-[#22A06B]"
                      : stats.expectancy !== null && stats.expectancy < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {stats.expectancy !== null
                    ? `${stats.expectancy > 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R`
                    : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
                  {stats.expectancy !== null
                    ? `${stats.expectancy > 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R per trade`
                    : "Requires stop loss"}
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Profit Factor */}
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
                <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
                  +${Math.round(stats.totalGains).toLocaleString()} / -$
                  {Math.round(stats.totalLosses).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Rule Compliance */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Rule Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0">
                <div
                  className={`text-xl font-semibold font-mono-numbers ${
                    compliance.overallComplianceRate !== null &&
                    compliance.overallComplianceRate >= 80
                      ? "text-[#22A06B]"
                      : compliance.overallComplianceRate !== null &&
                        compliance.overallComplianceRate < 50
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {compliance.overallComplianceRate !== null
                    ? `${compliance.overallComplianceRate.toFixed(0)}%`
                    : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
                  {compliance.totalEvaluatedTrades > 0
                    ? `${compliance.followedTradesCount} / ${compliance.totalEvaluatedTrades} compliant`
                    : rules.length > 0
                    ? `${rules.length} rules active`
                    : "No rules set"}
                </div>
              </CardContent>
            </Card>

            {/* Card 6: Max Drawdown */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Max Drawdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0">
                <div
                  className={`text-xl font-semibold font-mono-numbers ${
                    stats.maxDrawdownAmount > 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {stats.maxDrawdownAmount > 0
                    ? `-${formatCurrency(stats.maxDrawdownAmount)}`
                    : "$0"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
                  <span
                    className={
                      stats.maxDrawdownPercent > 0
                        ? "text-[#DB5461]"
                        : "text-muted-foreground"
                    }
                  >
                    {stats.maxDrawdownPercent > 0
                      ? `-${stats.maxDrawdownPercent.toFixed(1)}%`
                      : "0.0%"}
                  </span>
                  <span>
                    {stats.recoveryTradeCount !== null
                      ? `Rec: ${stats.recoveryTradeCount} tr`
                      : stats.maxDrawdownAmount > 0
                      ? "Unrecovered"
                      : "No DD"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 7: Avg Win / Loss */}
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
                <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
                  Payoff:{" "}
                  {stats.avgLoss > 0
                    ? (stats.avgWin / stats.avgLoss).toFixed(2)
                    : "—"}
                  x
                </div>
              </CardContent>
            </Card>

            {/* Card 8: Current Streak */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0">
                <div
                  className={`text-xl font-semibold font-mono-numbers ${
                    stats.currentStreak > 0
                      ? "text-[#22A06B]"
                      : stats.currentStreak < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {stats.currentStreak > 0
                    ? `${stats.currentStreak}W`
                    : stats.currentStreak < 0
                    ? `${Math.abs(stats.currentStreak)}L`
                    : "—"}
                </div>
                <div
                  className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate"
                  title={`Longest Win: ${stats.longestWinStreak}W | Longest Loss: ${stats.longestLossStreak}L`}
                >
                  Best: {stats.longestWinStreak}W | Worst:{" "}
                  {stats.longestLossStreak}L
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS GRID (Equity Curve & R-Multiple Distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  drawdownDetails={drawdownDetails}
                />
              </CardContent>
            </Card>

            {/* R-MULTIPLE DISTRIBUTION CHART */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-foreground">
                      R-Multiple Distribution
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trade frequency across return buckets in R units.
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono-numbers">
                    Trades with R:{" "}
                    <span className="font-semibold text-foreground">
                      {stats.totalTradesWithR}
                    </span>{" "}
                    of {stats.totalTrades}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <RDistributionChart
                  data={rDistribution}
                  totalTradesWithR={stats.totalTradesWithR}
                />
              </CardContent>
            </Card>
          </div>

          {/* RULE COMPLIANCE & PERFORMANCE SPLIT CARD */}
          <RuleComplianceCard compliance={compliance} rules={rules} />

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
                sessionPeriodStart={session.periodStart}
                sessionPeriodEnd={session.periodEnd}
                sessionRules={rules}
              />
            </div>

            <TradeTable
              trades={trades}
              sessionId={session.id}
              sessionPeriodStart={session.periodStart}
              sessionPeriodEnd={session.periodEnd}
              sessionRules={rules}
              initialSetupFilter={selectedSetupFilter}
            />
          </div>
        </div>
      ) : activeTab === "time" ? (
        /* TIME ANALYTICS VIEW TAB */
        <TimeAnalyticsView timeAnalytics={timeAnalytics} />
      ) : activeTab === "setups" ? (
        /* SETUP LEADERBOARD TAB */
        <SetupLeaderboardView
          setupAnalytics={setupAnalytics}
          onSelectSetup={handleSelectSetupFromLeaderboard}
        />
      ) : (
        /* CALENDAR HEATMAP TAB */
        <CalendarHeatmapView
          calendarAnalytics={calendarAnalytics}
          trades={trades}
          sessionId={session.id}
          sessionPeriodStart={session.periodStart}
          sessionPeriodEnd={session.periodEnd}
          rules={rules}
          defaultSymbol={session.instrument}
          onSelectDate={handleSelectDateFromCalendar}
        />
      )}
    </div>
  );
}
