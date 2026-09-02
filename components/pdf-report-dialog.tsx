"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
} from "@/lib/data/trades";
import { generateReportRecommendations } from "@/lib/data/report-heuristics";
import { formatCurrency, formatPrice, formatCurrencyNeutral } from "@/lib/utils";
import {
  Printer,
  FileText,
  TrendingUp,
  Award,
  ShieldCheck,
  Clock,
  Zap,
  BarChart2,
  Calendar,
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface PdfReportDialogProps {
  session: {
    id: string;
    name?: string | null;
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfReportDialog({
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
  open,
  onOpenChange,
}: PdfReportDialogProps) {
  const recommendations = React.useMemo(() => {
    return generateReportRecommendations({
      trades,
      stats,
      timeAnalytics,
      setupAnalytics,
      compliance,
      drawdownDetails,
    });
  }, [trades, stats, timeAnalytics, setupAnalytics, compliance, drawdownDetails]);

  const handlePrint = () => {
    window.print();
  };

  const netEndingBalance = session.startingBalance + stats.netPnl;
  const isNetProfit = stats.netPnl > 0;
  const isNetLoss = stats.netPnl < 0;

  // SVG Chart Dimensions for Equity Curve
  const chartWidth = 600;
  const chartHeight = 160;
  const padding = 20;

  const equitySvgPath = React.useMemo(() => {
    if (!equityCurve || equityCurve.length < 2) return "";
    const balances = equityCurve.map((p) => p.balance);
    const minB = Math.min(...balances);
    const maxB = Math.max(...balances);
    const range = maxB - minB || 1;

    const points = equityCurve.map((p, i) => {
      const x = padding + (i / (equityCurve.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - ((p.balance - minB) / range) * (chartHeight - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(" L ")}`;
  }, [equityCurve]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="print:hidden">
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span>Session Performance &amp; Analysis Report</span>
        </DialogTitle>
        <DialogDescription>
          Export PDF Report (for review, not re-importable). Formatted for high-quality printing and archiving.
        </DialogDescription>
      </DialogHeader>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div
        id="printable-session-report"
        className="space-y-5 p-4 sm:p-6 bg-card text-foreground rounded-lg border border-border print:border-none print:p-0 print:bg-white print:text-black overflow-y-auto max-h-[75vh] print:max-h-none"
      >
        {/* REPORT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground print:text-black">
                {session.name || `${session.instrument} Backtest Session`}
              </h1>
              <Badge variant="outline" className="font-mono-numbers uppercase text-xs">
                {session.instrument}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground print:text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(session.periodStart), "MMM d, yyyy")} &ndash;{" "}
                {format(new Date(session.periodEnd), "MMM d, yyyy")}
              </span>
              <span>&bull;</span>
              <span>{stats.totalTrades} Total Trades Logged</span>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <div className="text-xs text-muted-foreground print:text-gray-600">Net Ending Balance</div>
            <div
              className={`text-lg font-bold font-mono-numbers ${
                isNetProfit
                  ? "text-[#22A06B]"
                  : isNetLoss
                  ? "text-[#DB5461]"
                  : "text-foreground print:text-black"
              }`}
            >
              {formatCurrency(netEndingBalance)}
            </div>
            <div className="text-[11px] font-mono-numbers text-muted-foreground print:text-gray-600">
              Start: {formatCurrencyNeutral(session.startingBalance)} ({isNetProfit ? "+" : ""}
              {((stats.netPnl / session.startingBalance) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* 1. EXECUTIVE KPI METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-2.5 rounded-md border border-border bg-secondary/30 print:bg-gray-100 print:border-gray-300">
            <div className="text-[10px] text-muted-foreground print:text-gray-600 uppercase font-medium">
              Net P&amp;L
            </div>
            <div
              className={`text-sm font-bold font-mono-numbers ${
                isNetProfit ? "text-[#22A06B]" : isNetLoss ? "text-[#DB5461]" : "text-foreground"
              }`}
            >
              {isNetProfit ? `+${formatCurrency(stats.netPnl)}` : formatCurrency(stats.netPnl)}
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-border bg-secondary/30 print:bg-gray-100 print:border-gray-300">
            <div className="text-[10px] text-muted-foreground print:text-gray-600 uppercase font-medium">
              Win Rate
            </div>
            <div className="text-sm font-bold font-mono-numbers text-foreground print:text-black">
              {(stats.winRate * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground print:text-gray-600 font-mono-numbers">
              {stats.winCount}W &bull; {stats.lossCount}L &bull; {stats.breakevenCount}BE
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-border bg-secondary/30 print:bg-gray-100 print:border-gray-300">
            <div className="text-[10px] text-muted-foreground print:text-gray-600 uppercase font-medium">
              Profit Factor
            </div>
            <div className="text-sm font-bold font-mono-numbers text-foreground print:text-black">
              {stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "—"}
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-border bg-secondary/30 print:bg-gray-100 print:border-gray-300">
            <div className="text-[10px] text-muted-foreground print:text-gray-600 uppercase font-medium">
              Expectancy
            </div>
            <div
              className={`text-sm font-bold font-mono-numbers ${
                stats.expectancy !== null && stats.expectancy > 0
                  ? "text-[#22A06B]"
                  : stats.expectancy !== null && stats.expectancy < 0
                  ? "text-[#DB5461]"
                  : "text-foreground print:text-black"
              }`}
            >
              {stats.expectancy !== null ? `${stats.expectancy > 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R` : "—"}
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-border bg-secondary/30 print:bg-gray-100 print:border-gray-300">
            <div className="text-[10px] text-muted-foreground print:text-gray-600 uppercase font-medium">
              Max Drawdown
            </div>
            <div className="text-sm font-bold font-mono-numbers text-[#DB5461]">
              -{drawdownDetails.maxDrawdownPercent.toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground print:text-gray-600 font-mono-numbers">
              -${drawdownDetails.maxDrawdownAmount.toFixed(0)}
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-border bg-secondary/30 print:bg-gray-100 print:border-gray-300">
            <div className="text-[10px] text-muted-foreground print:text-gray-600 uppercase font-medium">
              Rule Adherence
            </div>
            <div className="text-sm font-bold font-mono-numbers text-[#22A06B]">
              {compliance.overallComplianceRate !== null
                ? `${(compliance.overallComplianceRate * 100).toFixed(0)}%`
                : "—"}
            </div>
          </div>
        </div>

        {/* 2. EQUITY CURVE PREVIEW (STATIC SVG) */}
        {equityCurve.length > 1 && (
          <div className="space-y-1.5 p-3 rounded-lg border border-border bg-card/60">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground print:text-black">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Equity Trajectory
              </span>
              <span className="text-[10px] font-normal text-muted-foreground print:text-gray-600 font-mono-numbers">
                {equityCurve.length} execution data points
              </span>
            </div>

            <div className="w-full bg-secondary/20 rounded p-2 overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 stroke-current">
                <defs>
                  <linearGradient id="reportEquityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22A06B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22A06B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={equitySvgPath}
                  fill="none"
                  stroke={isNetProfit ? "#22A06B" : "#DB5461"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 3. SETUP MODEL PERFORMANCE LEADERBOARD */}
        {setupAnalytics.setups.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-foreground print:text-black flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="h-3.5 w-3.5 text-primary" />
              Setup / Model Performance Breakdown
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary text-[10px] uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-1.5">Setup / Model</th>
                    <th className="px-3 py-1.5 text-right">Trades</th>
                    <th className="px-3 py-1.5 text-right">Win Rate</th>
                    <th className="px-3 py-1.5 text-right">Expectancy</th>
                    <th className="px-3 py-1.5 text-right">Net P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {setupAnalytics.setups.slice(0, 5).map((s, idx) => (
                    <tr key={`${s.setup}-${idx}`} className="hover:bg-secondary/30">
                      <td className="px-3 py-1.5 font-medium text-foreground print:text-black">
                        {s.setup}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono-numbers">{s.count}</td>
                      <td className="px-3 py-1.5 text-right font-mono-numbers">
                        {s.winRate !== null ? `${(s.winRate * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono-numbers">
                        {s.expectancy !== null ? `${s.expectancy > 0 ? "+" : ""}${s.expectancy.toFixed(2)}R` : "—"}
                      </td>
                      <td
                        className={`px-3 py-1.5 text-right font-mono-numbers font-semibold ${
                          s.totalPnl > 0
                            ? "text-[#22A06B]"
                            : s.totalPnl < 0
                            ? "text-[#DB5461]"
                            : "text-foreground"
                        }`}
                      >
                        {formatCurrency(s.totalPnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. TIME ANALYSIS HIGHLIGHTS & DISCIPLINE IMPACT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-border bg-secondary/20 space-y-2">
            <h4 className="font-semibold text-foreground print:text-black flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Time Analysis Highlights
            </h4>
            <div className="space-y-1 text-muted-foreground print:text-gray-700 text-[11px]">
              <div>
                <strong className="text-foreground print:text-black">Peak Performance Hour: </strong>
                {timeAnalytics.bestHour?.label || timeAnalytics.hourly.find((h) => h.totalPnl > 0)?.label || "N/A"}
              </div>
              <div>
                <strong className="text-foreground print:text-black">Best Trading Day: </strong>
                {timeAnalytics.bestDay?.dayName || timeAnalytics.dayOfWeek.find((d) => d.totalPnl > 0)?.dayName || "N/A"}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-secondary/20 space-y-2">
            <h4 className="font-semibold text-foreground print:text-black flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#22A06B]" />
              Rule Compliance Breakdown
            </h4>
            <div className="space-y-1 text-muted-foreground print:text-gray-700 text-[11px]">
              <div>
                <strong className="text-foreground print:text-black">Followed Rules WR: </strong>
                {compliance.performanceSplit.followed.count > 0
                  ? `${(compliance.performanceSplit.followed.winRate * 100).toFixed(0)}% (${compliance.performanceSplit.followed.count} trades)`
                  : "N/A"}
              </div>
              <div>
                <strong className="text-foreground print:text-black">Broken Rules WR: </strong>
                {compliance.performanceSplit.broken.count > 0
                  ? `${(compliance.performanceSplit.broken.winRate * 100).toFixed(0)}% (${compliance.performanceSplit.broken.count} trades)`
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* 5. STRATEGIC HEURISTIC RECOMMENDATIONS */}
        <div className="space-y-2 pt-2 border-t border-border">
          <h3 className="text-xs font-semibold text-foreground print:text-black flex items-center gap-1.5 uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Strategic Heuristic Recommendations ({recommendations.length})
          </h3>

          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`p-2.5 rounded-md border text-xs space-y-0.5 ${
                  rec.severity === "warning"
                    ? "bg-[#DB5461]/10 border-[#DB5461]/30 text-[#DB5461]"
                    : rec.severity === "positive"
                    ? "bg-[#22A06B]/10 border-[#22A06B]/30 text-[#22A06B]"
                    : "bg-secondary/40 border-border text-foreground"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {rec.severity === "warning" ? (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  ) : rec.severity === "positive" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : null}
                  <span>{rec.title}</span>
                </div>
                <p className="text-[11px] text-foreground/90 print:text-gray-800 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* REPORT FOOTER */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground print:text-gray-500">
          <span>Golden DIH Trading Journal &bull; Backtest Performance Snapshot</span>
          <span>Generated on {format(new Date(), "yyyy-MM-dd HH:mm:ss")} &bull; One-way review document</span>
        </div>
      </div>

      <DialogFooter className="print:hidden">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button onClick={handlePrint} className="gap-1.5">
          <Printer className="h-4 w-4" />
          <span>Print / Save as PDF</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
