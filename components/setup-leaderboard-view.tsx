"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SetupAnalyticsResult,
  SetupPerformance,
} from "@/lib/data/trade-analytics";
import { formatCurrency } from "@/lib/utils";
import {
  Trophy,
  TrendingUp,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Compass,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface SetupLeaderboardViewProps {
  setupAnalytics: SetupAnalyticsResult;
  onSelectSetup?: (setupName: string) => void;
}

type SortField =
  | "setup"
  | "count"
  | "winRate"
  | "avgR"
  | "expectancy"
  | "profitFactor"
  | "totalPnl"
  | "avgPnl";

type SortOrder = "asc" | "desc";

export function SetupLeaderboardView({
  setupAnalytics,
  onSelectSetup,
}: SetupLeaderboardViewProps) {
  const {
    setups,
    totalSetupsCount,
    bestSetup,
    mostProfitableSetup,
    highestWinRateSetup,
  } = setupAnalytics;

  const [sortField, setSortField] = React.useState<SortField>("expectancy");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [expandedSetup, setExpandedSetup] = React.useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedSetups = React.useMemo(() => {
    const list = [...setups];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle nulls
      if (valA === null || valA === undefined) valA = sortOrder === "asc" ? 999999 : -999999;
      if (valB === null || valB === undefined) valB = sortOrder === "asc" ? 999999 : -999999;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
    return list;
  }, [setups, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary ml-1 inline" />
    );
  };

  if (!setups || setups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-foreground">No Setups Recorded</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Add tags in the &ldquo;Setup / Model&rdquo; field when logging trades (e.g. &ldquo;15m FVG&rdquo;, &ldquo;Turtle Soup&rdquo;) to generate setup-level edge reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP INSIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Best Expectancy Setup */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Highest Expectancy
              </span>
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
            </div>
            {bestSetup ? (
              <div>
                <div className="text-base font-bold text-foreground truncate" title={bestSetup.setup}>
                  {bestSetup.setup}
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono-numbers text-xs">
                  <span
                    className={`font-semibold ${
                      (bestSetup.expectancy ?? 0) > 0 ? "text-[#22A06B]" : "text-[#DB5461]"
                    }`}
                  >
                    {bestSetup.expectancy !== null
                      ? `${bestSetup.expectancy > 0 ? "+" : ""}${bestSetup.expectancy.toFixed(2)}R`
                      : "—"}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({bestSetup.count} {bestSetup.count === 1 ? "trade" : "trades"})
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">None</div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Most Profitable Setup */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Most Profitable Model
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            {mostProfitableSetup ? (
              <div>
                <div
                  className="text-base font-bold text-foreground truncate"
                  title={mostProfitableSetup.setup}
                >
                  {mostProfitableSetup.setup}
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono-numbers text-xs">
                  <span
                    className={`font-semibold ${
                      mostProfitableSetup.totalPnl > 0
                        ? "text-[#22A06B]"
                        : mostProfitableSetup.totalPnl < 0
                        ? "text-[#DB5461]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatCurrency(mostProfitableSetup.totalPnl)}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({mostProfitableSetup.count} tr)
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">None</div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Highest Win Rate Setup */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Highest Win Rate
              </span>
              <Target className="h-3.5 w-3.5 text-primary" />
            </div>
            {highestWinRateSetup ? (
              <div>
                <div
                  className="text-base font-bold text-foreground truncate"
                  title={highestWinRateSetup.setup}
                >
                  {highestWinRateSetup.setup}
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono-numbers text-xs">
                  <span
                    className={`font-semibold ${
                      (highestWinRateSetup.winRate ?? 0) >= 50
                        ? "text-[#22A06B]"
                        : "text-[#DB5461]"
                    }`}
                  >
                    {highestWinRateSetup.winRate !== null
                      ? `${highestWinRateSetup.winRate}% WR`
                      : "—"}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({highestWinRateSetup.count} tr)
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">None</div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Total Setups Tracked */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Active Setups
              </span>
              <Layers className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono-numbers text-foreground">
                {totalSetupsCount}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Models evaluated in session
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LEADERBOARD TABLE */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span>Setup Leaderboard ({sortedSetups.length})</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Click column headers to sort. Expand any row to review setup performance by market condition (HTF Bias).
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                  <th
                    className="px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("setup")}
                  >
                    Setup / Model {renderSortIcon("setup")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("count")}
                  >
                    Trades {renderSortIcon("count")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("winRate")}
                  >
                    Win Rate {renderSortIcon("winRate")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("avgR")}
                  >
                    Avg R {renderSortIcon("avgR")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("expectancy")}
                  >
                    Expectancy {renderSortIcon("expectancy")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("profitFactor")}
                  >
                    PF {renderSortIcon("profitFactor")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("totalPnl")}
                  >
                    Net P&L {renderSortIcon("totalPnl")}
                  </th>
                  <th
                    className="px-3.5 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("avgPnl")}
                  >
                    Avg P&L {renderSortIcon("avgPnl")}
                  </th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedSetups.map((s, idx) => {
                  const isExpanded = expandedSetup === s.setup;
                  const isProfit = s.totalPnl > 0;
                  const isLoss = s.totalPnl < 0;

                  return (
                    <React.Fragment key={s.setup}>
                      <tr
                        className={`hover:bg-secondary/40 transition-colors ${
                          isExpanded ? "bg-secondary/30" : ""
                        }`}
                      >
                        {/* Setup Name + Low Confidence indicator */}
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground text-xs">
                              {s.setup}
                            </span>
                            {s.isLowConfidence && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono-numbers bg-amber-500/15 border border-amber-500/30 text-amber-300"
                                title="Low sample size (< 3 trades) - performance may not be statistically significant"
                              >
                                <AlertCircle className="h-2.5 w-2.5" />
                                n={s.count}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono-numbers mt-0.5">
                            {s.winCount}W / {s.lossCount}L
                            {s.breakevenCount > 0 ? ` / ${s.breakevenCount}BE` : ""}
                          </div>
                        </td>

                        {/* Trades Count */}
                        <td className="px-3.5 py-2.5 text-center font-mono-numbers text-foreground">
                          {s.count}
                        </td>

                        {/* Win Rate */}
                        <td className="px-3.5 py-2.5 text-center font-mono-numbers whitespace-nowrap">
                          {s.winRate !== null ? (
                            <span
                              className={`font-semibold ${
                                s.winRate >= 50 ? "text-[#22A06B]" : "text-[#DB5461]"
                              }`}
                            >
                              {s.winRate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Avg R */}
                        <td className="px-3.5 py-2.5 text-right font-mono-numbers whitespace-nowrap">
                          {s.avgR !== null ? (
                            <span
                              className={`font-semibold ${
                                s.avgR > 0
                                  ? "text-[#22A06B]"
                                  : s.avgR < 0
                                  ? "text-[#DB5461]"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {s.avgR > 0 ? `+${s.avgR.toFixed(2)}R` : `${s.avgR.toFixed(2)}R`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Expectancy */}
                        <td className="px-3.5 py-2.5 text-right font-mono-numbers whitespace-nowrap">
                          {s.expectancy !== null ? (
                            <span
                              className={`font-semibold ${
                                s.expectancy > 0
                                  ? "text-[#22A06B]"
                                  : s.expectancy < 0
                                  ? "text-[#DB5461]"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {s.expectancy > 0
                                ? `+${s.expectancy.toFixed(2)}R`
                                : `${s.expectancy.toFixed(2)}R`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Profit Factor */}
                        <td className="px-3.5 py-2.5 text-right font-mono-numbers text-foreground whitespace-nowrap">
                          {s.profitFactor !== null
                            ? s.profitFactor === Infinity
                              ? "∞"
                              : s.profitFactor.toFixed(2)
                            : "—"}
                        </td>

                        {/* Total P&L */}
                        <td
                          className={`px-3.5 py-2.5 text-right font-mono-numbers font-semibold whitespace-nowrap ${
                            isProfit
                              ? "text-[#22A06B]"
                              : isLoss
                              ? "text-[#DB5461]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatCurrency(s.totalPnl)}
                        </td>

                        {/* Avg P&L */}
                        <td
                          className={`px-3.5 py-2.5 text-right font-mono-numbers whitespace-nowrap ${
                            (s.avgPnl ?? 0) > 0
                              ? "text-[#22A06B]"
                              : (s.avgPnl ?? 0) < 0
                              ? "text-[#DB5461]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.avgPnl !== null ? formatCurrency(s.avgPnl) : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onSelectSetup && s.setup !== "Unspecified" && (
                              <button
                                type="button"
                                onClick={() => onSelectSetup(s.setup)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                                title={`View all ${s.setup} trades in table`}
                              >
                                <span>Filter</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setExpandedSetup(isExpanded ? null : s.setup)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Market condition breakdown"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDABLE ROW: SETUP × MARKET CONDITION BREAKDOWN */}
                      {isExpanded && (
                        <tr className="bg-secondary/20">
                          <td colSpan={9} className="px-5 py-3.5">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <Compass className="h-3.5 w-3.5 text-primary" />
                                  <span>
                                    {s.setup} &times; Market Condition (HTF Bias) Breakdown
                                  </span>
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Performance cross-tabulated against higher timeframe bias
                                </span>
                              </div>

                              {s.conditions.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  No condition data recorded for this setup.
                                </p>
                              ) : (
                                <div className="rounded-md border border-border bg-card/80 overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-border bg-secondary/70 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        <th className="px-3 py-1.5">HTF Bias Condition</th>
                                        <th className="px-3 py-1.5 text-center">Trades</th>
                                        <th className="px-3 py-1.5 text-center">Win Rate</th>
                                        <th className="px-3 py-1.5 text-right">Avg R</th>
                                        <th className="px-3 py-1.5 text-right">Expectancy</th>
                                        <th className="px-3 py-1.5 text-right">Net P&L</th>
                                        <th className="px-3 py-1.5 text-right">Avg P&L</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {s.conditions.map((c) => (
                                        <tr
                                          key={c.condition}
                                          className="hover:bg-secondary/30 transition-colors"
                                        >
                                          <td className="px-3 py-2 font-medium text-foreground flex items-center gap-1.5">
                                            <span>{c.condition}</span>
                                            {c.isLowConfidence && (
                                              <span
                                                className="text-[9px] font-mono-numbers px-1 py-0.2 rounded bg-amber-500/10 text-amber-300"
                                                title="Small sample size"
                                              >
                                                n={c.count}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-center font-mono-numbers text-foreground">
                                            {c.count}
                                          </td>
                                          <td className="px-3 py-2 text-center font-mono-numbers">
                                            {c.winRate !== null ? (
                                              <span
                                                className={`font-semibold ${
                                                  c.winRate >= 50
                                                    ? "text-[#22A06B]"
                                                    : "text-[#DB5461]"
                                                }`}
                                              >
                                                {c.winRate}%
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono-numbers">
                                            {c.avgR !== null ? (
                                              <span
                                                className={`font-semibold ${
                                                  c.avgR > 0
                                                    ? "text-[#22A06B]"
                                                    : c.avgR < 0
                                                    ? "text-[#DB5461]"
                                                    : "text-muted-foreground"
                                                }`}
                                              >
                                                {c.avgR > 0
                                                  ? `+${c.avgR.toFixed(2)}R`
                                                  : `${c.avgR.toFixed(2)}R`}
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono-numbers">
                                            {c.expectancy !== null ? (
                                              <span
                                                className={`font-semibold ${
                                                  c.expectancy > 0
                                                    ? "text-[#22A06B]"
                                                    : c.expectancy < 0
                                                    ? "text-[#DB5461]"
                                                    : "text-muted-foreground"
                                                }`}
                                              >
                                                {c.expectancy > 0
                                                  ? `+${c.expectancy.toFixed(2)}R`
                                                  : `${c.expectancy.toFixed(2)}R`}
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </td>
                                          <td
                                            className={`px-3 py-2 text-right font-mono-numbers font-semibold ${
                                              c.totalPnl > 0
                                                ? "text-[#22A06B]"
                                                : c.totalPnl < 0
                                                ? "text-[#DB5461]"
                                                : "text-muted-foreground"
                                            }`}
                                          >
                                            {formatCurrency(c.totalPnl)}
                                          </td>
                                          <td
                                            className={`px-3 py-2 text-right font-mono-numbers ${
                                              (c.avgPnl ?? 0) > 0
                                                ? "text-[#22A06B]"
                                                : (c.avgPnl ?? 0) < 0
                                                ? "text-[#DB5461]"
                                                : "text-muted-foreground"
                                            }`}
                                          >
                                            {c.avgPnl !== null ? formatCurrency(c.avgPnl) : "—"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
