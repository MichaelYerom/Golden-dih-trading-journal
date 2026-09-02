"use client";

import * as React from "react";
import { RuleComplianceResult, RuleEntity } from "@/lib/data/trades";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Scale,
  ListChecks,
} from "lucide-react";

interface RuleComplianceCardProps {
  compliance: RuleComplianceResult;
  rules: RuleEntity[];
}

export function RuleComplianceCard({
  compliance,
  rules,
}: RuleComplianceCardProps) {
  const { followed, broken } = compliance.performanceSplit;
  const hasEvaluations = compliance.totalEvaluatedTrades > 0;

  const winRateDiff =
    followed.count > 0 && broken.count > 0
      ? followed.winRate - broken.winRate
      : null;

  const avgPnlDiff =
    followed.count > 0 && broken.count > 0
      ? followed.avgPnl - broken.avgPnl
      : null;

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border bg-secondary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                Rule Compliance & Discipline Edge
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quantify performance disparities between disciplined execution and broken rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {compliance.overallComplianceRate !== null ? (
              <Badge
                variant={
                  compliance.overallComplianceRate >= 80
                    ? "win"
                    : compliance.overallComplianceRate >= 50
                    ? "neutral"
                    : "loss"
                }
                className="font-mono-numbers text-xs px-2.5 py-0.5"
              >
                {compliance.overallComplianceRate.toFixed(1)}% Compliant
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No Compliance Data
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* SECTION 1: SIDE-BY-SIDE SPLIT STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* FOLLOWED BLOCK */}
          <div className="rounded-lg border border-[#22A06B]/20 bg-[#22A06B]/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#22A06B]/20 pb-2">
              <div className="flex items-center gap-1.5 text-[#22A06B] font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Rules Followed ({followed.count} Trades)</span>
              </div>
              <span className="text-[11px] font-mono-numbers text-muted-foreground">
                {hasEvaluations
                  ? `${Math.round((followed.count / compliance.totalEvaluatedTrades) * 100)}% of trades`
                  : "—"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono-numbers">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Win Rate
                </span>
                <span className="text-sm font-bold text-foreground">
                  {followed.count > 0 ? formatPercent(followed.winRate) : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {followed.winCount}W / {followed.lossCount}L
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Net P&L
                </span>
                <span
                  className={`text-sm font-bold ${
                    followed.totalPnl > 0
                      ? "text-[#22A06B]"
                      : followed.totalPnl < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {followed.count > 0 ? formatCurrency(followed.totalPnl) : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Avg {followed.count > 0 ? formatCurrency(followed.avgPnl) : "$0"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Expectancy
                </span>
                <span
                  className={`text-sm font-bold ${
                    followed.expectancy !== null && followed.expectancy > 0
                      ? "text-[#22A06B]"
                      : followed.expectancy !== null && followed.expectancy < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {followed.expectancy !== null
                    ? `${followed.expectancy > 0 ? "+" : ""}${followed.expectancy.toFixed(2)}R`
                    : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {followed.avgWinR !== null ? `+${followed.avgWinR}R win` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* BROKEN BLOCK */}
          <div className="rounded-lg border border-[#DB5461]/20 bg-[#DB5461]/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DB5461]/20 pb-2">
              <div className="flex items-center gap-1.5 text-[#DB5461] font-semibold text-xs">
                <XCircle className="h-4 w-4" />
                <span>Rules Broken ({broken.count} Trades)</span>
              </div>
              <span className="text-[11px] font-mono-numbers text-muted-foreground">
                {hasEvaluations
                  ? `${Math.round((broken.count / compliance.totalEvaluatedTrades) * 100)}% of trades`
                  : "—"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono-numbers">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Win Rate
                </span>
                <span className="text-sm font-bold text-foreground">
                  {broken.count > 0 ? formatPercent(broken.winRate) : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {broken.winCount}W / {broken.lossCount}L
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Net P&L
                </span>
                <span
                  className={`text-sm font-bold ${
                    broken.totalPnl > 0
                      ? "text-[#22A06B]"
                      : broken.totalPnl < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {broken.count > 0 ? formatCurrency(broken.totalPnl) : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Avg {broken.count > 0 ? formatCurrency(broken.avgPnl) : "$0"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">
                  Expectancy
                </span>
                <span
                  className={`text-sm font-bold ${
                    broken.expectancy !== null && broken.expectancy > 0
                      ? "text-[#22A06B]"
                      : broken.expectancy !== null && broken.expectancy < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }`}
                >
                  {broken.expectancy !== null
                    ? `${broken.expectancy > 0 ? "+" : ""}${broken.expectancy.toFixed(2)}R`
                    : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {broken.avgLossR !== null ? `-${broken.avgLossR}R loss` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DISCIPLINE ALPHA HIGHLIGHT (when both followed & broken trades exist) */}
        {winRateDiff !== null && avgPnlDiff !== null && (
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-md bg-secondary border border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Discipline Edge:</span>
              <span className="text-muted-foreground">
                Following rules yields{" "}
                <span
                  className={`font-semibold ${
                    winRateDiff >= 0 ? "text-[#22A06B]" : "text-[#DB5461]"
                  }`}
                >
                  {winRateDiff >= 0 ? "+" : ""}
                  {(winRateDiff * 100).toFixed(1)}% win rate
                </span>{" "}
                and{" "}
                <span
                  className={`font-semibold ${
                    avgPnlDiff >= 0 ? "text-[#22A06B]" : "text-[#DB5461]"
                  }`}
                >
                  {avgPnlDiff >= 0 ? "+" : ""}
                  {formatCurrency(avgPnlDiff)}/trade
                </span>
                .
              </span>
            </div>
          </div>
        )}

        {/* SECTION 2: PER-RULE BREAKDOWN TABLE (if rules exist) */}
        {rules.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ListChecks className="h-3.5 w-3.5 text-primary" />
                <span>Per-Rule Checklist Breakdown</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Impact of individual rules on outcome
              </span>
            </div>

            <div className="rounded-md border border-border overflow-x-auto bg-card">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-[11px] font-medium text-muted-foreground uppercase">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Rule Description</th>
                    <th className="px-3 py-2 text-center">Times Followed</th>
                    <th className="px-3 py-2 text-center">Times Broken</th>
                    <th className="px-3 py-2 text-right">Win % When Followed</th>
                    <th className="px-3 py-2 text-right">Avg R Followed</th>
                    <th className="px-3 py-2 text-right">Avg P&L Followed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {compliance.perRuleBreakdown.map((item, idx) => {
                    const followRate =
                      item.totalEvaluations > 0
                        ? Math.round((item.timesFollowed / item.totalEvaluations) * 100)
                        : null;

                    return (
                      <tr key={item.ruleId} className="hover:bg-secondary/30">
                        <td className="px-3 py-2 text-muted-foreground font-mono-numbers">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {item.text}
                        </td>
                        <td className="px-3 py-2 text-center font-mono-numbers">
                          <span className="inline-flex items-center gap-1 text-[#22A06B] font-semibold">
                            {item.timesFollowed}
                          </span>
                          {followRate !== null && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              ({followRate}%)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center font-mono-numbers">
                          <span
                            className={
                              item.timesBroken > 0
                                ? "text-[#DB5461] font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {item.timesBroken}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono-numbers font-medium text-foreground">
                          {item.winRateWhenFollowed !== null
                            ? `${item.winRateWhenFollowed.toFixed(1)}%`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-numbers font-semibold">
                          {item.avgRWhenFollowed !== null ? (
                            <span
                              className={
                                item.avgRWhenFollowed > 0
                                  ? "text-[#22A06B]"
                                  : item.avgRWhenFollowed < 0
                                  ? "text-[#DB5461]"
                                  : "text-muted-foreground"
                              }
                            >
                              {item.avgRWhenFollowed > 0 ? "+" : ""}
                              {item.avgRWhenFollowed.toFixed(2)}R
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-numbers font-semibold">
                          {item.avgPnlWhenFollowed !== null ? (
                            <span
                              className={
                                item.avgPnlWhenFollowed > 0
                                  ? "text-[#22A06B]"
                                  : item.avgPnlWhenFollowed < 0
                                  ? "text-[#DB5461]"
                                  : "text-muted-foreground"
                              }
                            >
                              {formatCurrency(item.avgPnlWhenFollowed)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
