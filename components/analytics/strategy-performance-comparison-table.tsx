"use client";

import * as React from "react";
import { StrategyPerformanceComparisonItem } from "@/lib/data/advanced-analytics";
import { formatCurrency } from "@/lib/utils";
import {
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface StrategyPerformanceComparisonTableProps {
  data: StrategyPerformanceComparisonItem[];
}

export function StrategyPerformanceComparisonTable({
  data,
}: StrategyPerformanceComparisonTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Layers className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground">
          No Strategy Performance Data
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Tag your trades with Playbook strategies and setup confluences to unlock deep strategy-level adherence comparisons.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-secondary/20">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Strategy Performance & Discipline Comparison
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-tabulated returns: Does following your playbook (≥80% confluence) improve your win rate and expectancy?
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 px-4 font-semibold">Strategy</th>
              <th className="py-3 px-3 font-semibold text-right">Trades</th>
              <th className="py-3 px-3 font-semibold text-right">Win Rate</th>
              <th className="py-3 px-3 font-semibold text-right">Expectancy</th>
              <th className="py-3 px-3 font-semibold text-right">Avg R</th>
              <th className="py-3 px-3 font-semibold text-right">Avg Match</th>
              <th className="py-3 px-4 font-semibold text-center border-l border-border/50 bg-emerald-950/10">
                High Match (≥80%)
              </th>
              <th className="py-3 px-4 font-semibold text-center bg-rose-950/10">
                Low Match (&lt;80%)
              </th>
              <th className="py-3 px-4 font-semibold text-right border-l border-border/50">
                Playbook Edge
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.map((item) => {
              const hasHighStats = item.highMatchStats.evaluatedCount > 0;
              const hasLowStats = item.lowMatchStats.evaluatedCount > 0;
              const edge = item.disciplineImpact.winRateDiff;

              return (
                <tr
                  key={item.strategyId}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  {/* Strategy Name */}
                  <td className="py-3 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[180px] font-semibold">
                        {item.strategyName}
                      </span>
                    </div>
                  </td>

                  {/* Trades Count */}
                  <td className="py-3 px-3 text-right font-mono-numbers text-muted-foreground">
                    <span>{item.totalTrades}</span>
                    {item.gradeableCount > 0 && (
                      <span className="text-[10px] text-muted-foreground/70 ml-1">
                        ({item.gradeableCount} graded)
                      </span>
                    )}
                  </td>

                  {/* Overall Win Rate */}
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    {item.winRate !== null ? (
                      <span
                        className={`font-semibold ${
                          item.winRate >= 50
                            ? "text-[#22A06B]"
                            : item.winRate < 40
                            ? "text-[#DB5461]"
                            : "text-foreground"
                        }`}
                      >
                        {item.winRate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Expectancy */}
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    {item.expectancy !== null ? (
                      <span
                        className={`font-semibold ${
                          item.expectancy > 0
                            ? "text-[#22A06B]"
                            : item.expectancy < 0
                            ? "text-[#DB5461]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.expectancy > 0 ? `+${item.expectancy}R` : `${item.expectancy}R`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Avg R */}
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    {item.avgR !== null ? (
                      <span
                        className={
                          item.avgR > 0
                            ? "text-[#22A06B]"
                            : item.avgR < 0
                            ? "text-[#DB5461]"
                            : "text-muted-foreground"
                        }
                      >
                        {item.avgR > 0 ? `+${item.avgR}R` : `${item.avgR}R`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Avg Confluence Match */}
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    {item.avgConfluenceMatch !== null ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
                          item.avgConfluenceMatch >= 80
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : item.avgConfluenceMatch >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {item.avgConfluenceMatch}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 text-[11px]">N/A</span>
                    )}
                  </td>

                  {/* High Match (≥80%) Stats */}
                  <td className="py-3 px-4 text-center border-l border-border/50 bg-emerald-950/5">
                    {hasHighStats ? (
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-center gap-1 font-mono-numbers font-medium text-emerald-400">
                          <span>
                            {item.highMatchStats.winRate !== null
                              ? `${item.highMatchStats.winRate}% WR`
                              : "—"}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            • {item.highMatchStats.avgR !== null ? `${item.highMatchStats.avgR > 0 ? "+" : ""}${item.highMatchStats.avgR}R` : ""}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono-numbers">
                          {item.highMatchStats.evaluatedCount} trades
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-[11px]">No trades</span>
                    )}
                  </td>

                  {/* Low Match (<80%) Stats */}
                  <td className="py-3 px-4 text-center bg-rose-950/5">
                    {hasLowStats ? (
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-center gap-1 font-mono-numbers font-medium text-rose-400">
                          <span>
                            {item.lowMatchStats.winRate !== null
                              ? `${item.lowMatchStats.winRate}% WR`
                              : "—"}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            • {item.lowMatchStats.avgR !== null ? `${item.lowMatchStats.avgR > 0 ? "+" : ""}${item.lowMatchStats.avgR}R` : ""}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono-numbers">
                          {item.lowMatchStats.evaluatedCount} trades
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-[11px]">No trades</span>
                    )}
                  </td>

                  {/* Playbook Edge / Impact */}
                  <td className="py-3 px-4 text-right border-l border-border/50 font-mono-numbers">
                    {edge !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {edge > 0 ? (
                          <>
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-semibold text-emerald-400">
                              +{edge}%
                            </span>
                          </>
                        ) : edge < 0 ? (
                          <>
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                            <span className="font-semibold text-rose-400">
                              {edge}%
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground font-medium">0%</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-[11px]">Insufficient data</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
