"use client";

import * as React from "react";
import { TradeEntity } from "@/lib/data/trade-analytics";
import {
  AdvancedAnalyticsSummary,
  calculateAdvancedAnalytics,
} from "@/lib/data/advanced-analytics";
import { CoachInsightsPanel } from "./coach-insights-panel";
import { StrategyPerformanceComparisonTable } from "./strategy-performance-comparison-table";
import { DisciplineVsOutcomeChart } from "./discipline-vs-outcome-chart";
import { PlaybookAdherenceTrendChart } from "./playbook-adherence-trend-chart";
import { MissedOpportunityBreakdownView } from "./missed-opportunity-breakdown";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Target,
  DollarSign,
  Percent,
} from "lucide-react";

interface AdvancedAnalyticsViewProps {
  initialTrades: TradeEntity[];
  strategies: Array<{ id: string; name: string; confluences: Array<{ id: string; name: string }> }>;
}

type DatePreset = "all" | "30d" | "90d" | "ytd";

export function AdvancedAnalyticsView({
  initialTrades,
  strategies,
}: AdvancedAnalyticsViewProps) {
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");

  // Filter trades based on date preset
  const filteredTrades = React.useMemo(() => {
    if (datePreset === "all") return initialTrades;

    const now = new Date();
    let cutoff: Date;

    if (datePreset === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (datePreset === "90d") {
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (datePreset === "ytd") {
      cutoff = new Date(now.getFullYear(), 0, 1);
    } else {
      return initialTrades;
    }

    return initialTrades.filter((t) => new Date(t.entryAt) >= cutoff);
  }, [initialTrades, datePreset]);

  // Compute analytics dynamically
  const summary: AdvancedAnalyticsSummary = React.useMemo(() => {
    return calculateAdvancedAnalytics(filteredTrades, strategies);
  }, [filteredTrades, strategies]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Advanced Analytics & Insights
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cross-feature intelligence: playbook adherence, strategy expectancy, hesitation patterns, and coach notes.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1 self-start md:self-auto rounded-lg border border-border bg-secondary/30 p-1 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1.5 mr-0.5" />
          <button
            onClick={() => setDatePreset("all")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              datePreset === "all"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDatePreset("90d")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              datePreset === "90d"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setDatePreset("30d")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              datePreset === "30d"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDatePreset("ytd")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              datePreset === "ytd"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Win Rate */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase font-semibold tracking-wider">
              Win Rate
            </span>
            <Percent className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono-numbers ${
                summary.overallWinRate !== null && summary.overallWinRate >= 50
                  ? "text-[#22A06B]"
                  : summary.overallWinRate !== null && summary.overallWinRate < 40
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {summary.overallWinRate !== null ? `${summary.overallWinRate}%` : "—"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">
            {summary.activeTradesCount} active trades
          </p>
        </div>

        {/* Expectancy */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase font-semibold tracking-wider">
              Expectancy
            </span>
            <Target className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono-numbers ${
                summary.overallExpectancy !== null && summary.overallExpectancy > 0
                  ? "text-[#22A06B]"
                  : summary.overallExpectancy !== null && summary.overallExpectancy < 0
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {summary.overallExpectancy !== null
                ? `${summary.overallExpectancy > 0 ? "+" : ""}${summary.overallExpectancy}R`
                : "—"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">
            Avg return: {summary.overallAvgR !== null ? `${summary.overallAvgR > 0 ? "+" : ""}${summary.overallAvgR}R` : "—"}
          </p>
        </div>

        {/* Playbook Confluence Discipline */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase font-semibold tracking-wider">
              Avg Confluence
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono-numbers ${
                summary.avgConfluenceMatch !== null && summary.avgConfluenceMatch >= 80
                  ? "text-[#22A06B]"
                  : summary.avgConfluenceMatch !== null && summary.avgConfluenceMatch >= 50
                  ? "text-[#F59E0B]"
                  : summary.avgConfluenceMatch !== null
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {summary.avgConfluenceMatch !== null ? `${summary.avgConfluenceMatch}%` : "—"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">
            {summary.gradeableTradesCount} graded trades
          </p>
        </div>

        {/* Total Gross PnL */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase font-semibold tracking-wider">
              Total P&L
            </span>
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono-numbers ${
                summary.totalGrossPnl > 0
                  ? "text-[#22A06B]"
                  : summary.totalGrossPnl < 0
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {formatCurrency(summary.totalGrossPnl)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">
            {summary.missedEntriesCount} missed • {summary.noTradeDaysCount} no-trade
          </p>
        </div>
      </div>

      {/* 1. Strengths & Mistakes Coach Notes */}
      <CoachInsightsPanel
        strengths={summary.strengths}
        mistakes={summary.mistakes}
      />

      {/* 2. Strategy Performance & Confluence Discipline Table */}
      <StrategyPerformanceComparisonTable
        data={summary.strategyComparison}
      />

      {/* 3. Charts Grid: Discipline vs Outcome & Playbook Adherence Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DisciplineVsOutcomeChart data={summary.disciplineVsOutcome} />
        <PlaybookAdherenceTrendChart data={summary.adherenceTrend} />
      </div>

      {/* 4. Missed Opportunities & Hesitation Breakdown */}
      <MissedOpportunityBreakdownView data={summary.missedOpportunities} />
    </div>
  );
}
