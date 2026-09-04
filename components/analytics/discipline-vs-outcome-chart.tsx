"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { DisciplineVsOutcomeResult, DisciplineBucket } from "@/lib/data/advanced-analytics";
import { ShieldCheck, BarChart3, TrendingUp } from "lucide-react";

interface DisciplineVsOutcomeChartProps {
  data: DisciplineVsOutcomeResult;
}

type MetricMode = "winRate" | "avgR";

export function DisciplineVsOutcomeChart({ data }: DisciplineVsOutcomeChartProps) {
  const [metricMode, setMetricMode] = React.useState<MetricMode>("winRate");

  if (!data || data.totalGradeableTrades === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 rounded-xl border border-border bg-card p-6 text-center">
        <ShieldCheck className="h-7 w-7 text-muted-foreground mb-2 opacity-50" />
        <h4 className="text-xs font-semibold text-foreground">
          No Playbook Confluence Grades Yet
        </h4>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
          Tag trades with setup confluences matching your Playbook to see how setup discipline correlates with profitability.
        </p>
      </div>
    );
  }

  const chartData = data.buckets.map((b) => ({
    bucket: b.bucket,
    label: b.label,
    winRate: b.winRate ?? 0,
    avgR: b.avgR ?? 0,
    evaluatedCount: b.evaluatedCount,
    totalTrades: b.totalTrades,
    winCount: b.winCount,
    lossCount: b.lossCount,
    raw: b,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const raw = item.raw as DisciplineBucket;

      return (
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur text-xs space-y-2 min-w-[170px]">
          <div className="font-semibold text-foreground border-b border-border pb-1 flex items-center justify-between">
            <span>{item.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono-numbers">
              {raw.totalTrades} {raw.totalTrades === 1 ? "trade" : "trades"}
            </span>
          </div>

          <div className="space-y-1 font-mono-numbers text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win Rate:</span>
              <span className="font-semibold text-foreground">
                {raw.winRate !== null ? `${raw.winRate}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Return (R):</span>
              <span
                className={`font-semibold ${
                  raw.avgR !== null && raw.avgR > 0
                    ? "text-[#22A06B]"
                    : raw.avgR !== null && raw.avgR < 0
                    ? "text-[#DB5461]"
                    : "text-muted-foreground"
                }`}
              >
                {raw.avgR !== null ? `${raw.avgR > 0 ? "+" : ""}${raw.avgR}R` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <span>W / L / BE:</span>
              <span>
                {raw.winCount} / {raw.lossCount} / {raw.breakevenCount}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (bucket: string, value: number) => {
    if (metricMode === "winRate") {
      if (value >= 60) return "#22A06B";
      if (value >= 45) return "#3B82F6";
      if (value >= 30) return "#F59E0B";
      return "#DB5461";
    } else {
      if (value > 0) return "#22A06B";
      if (value < 0) return "#DB5461";
      return "#9CA3AF";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Discipline vs. Outcome Correlation
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Performance across Confluence Match quality tiers (100%+, 80-99%, 50-79%, &lt;50%)
          </p>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
          <button
            onClick={() => setMetricMode("winRate")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              metricMode === "winRate"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Win Rate (%)
          </button>
          <button
            onClick={() => setMetricMode("avgR")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              metricMode === "avgR"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Average R
          </button>
        </div>
      </div>

      {data.summaryInsight && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{data.summaryInsight}</span>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="bucket"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={4}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit={metricMode === "winRate" ? "%" : "R"}
              domain={metricMode === "winRate" ? [0, 100] : ["auto", "auto"]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            />
            <Bar
              dataKey={metricMode === "winRate" ? "winRate" : "avgR"}
              radius={[4, 4, 0, 0]}
              maxBarSize={55}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(
                    entry.bucket,
                    metricMode === "winRate" ? entry.winRate : entry.avgR
                  )}
                  fillOpacity={entry.evaluatedCount > 0 ? 0.9 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
