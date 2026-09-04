"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { PlaybookAdherenceTrendResult, AdherenceTrendPoint } from "@/lib/data/advanced-analytics";
import { Activity, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface PlaybookAdherenceTrendChartProps {
  data: PlaybookAdherenceTrendResult;
}

export function PlaybookAdherenceTrendChart({
  data,
}: PlaybookAdherenceTrendChartProps) {
  if (!data || !data.hasSufficientData) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-muted-foreground mx-auto">
          <Activity className="h-5 w-5 opacity-60" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-foreground">
            Insufficient Data for Playbook Adherence Trend
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {data?.message ||
              `At least 10 gradeable trades are required to establish an adherence trend (currently ${data?.totalGradeableTrades || 0}/10).`}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-[11px] text-muted-foreground font-mono-numbers">
          <Info className="h-3 w-3" />
          <span>Keep tagging setup confluences as you execute backtests.</span>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload as AdherenceTrendPoint;

      return (
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[160px]">
          <div className="font-semibold text-foreground border-b border-border pb-1 flex items-center justify-between">
            <span>{pt.date}</span>
            <span className="text-[10px] text-muted-foreground font-mono-numbers">
              {pt.tradeCount} trades
            </span>
          </div>
          <div className="space-y-1 font-mono-numbers text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adherence Match:</span>
              <span className="font-semibold text-emerald-400">
                {pt.avgMatchPercent}%
              </span>
            </div>
            {pt.rollingAvgMatch !== undefined && (
              <div className="flex justify-between text-indigo-400">
                <span className="text-muted-foreground">Rolling Avg:</span>
                <span className="font-semibold">{pt.rollingAvgMatch}%</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <span>Perfect (100%):</span>
              <span>{pt.perfectMatchCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTrendBadge = () => {
    switch (data.trendDirection) {
      case "improving":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono-numbers px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-3 w-3" />
            <span>Improving (+{data.overallChangePercent}%)</span>
          </span>
        );
      case "declining":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono-numbers px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="h-3 w-3" />
            <span>Declining ({data.overallChangePercent}%)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium font-mono-numbers px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            <Minus className="h-3 w-3" />
            <span>Consistent / Flat</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Playbook Adherence Trend
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Average Confluence Match % over chronological periods ({data.totalGradeableTrades} trades tracked)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getTrendBadge()}
          {data.overallAvgMatch !== null && (
            <span className="text-xs font-mono-numbers text-muted-foreground">
              Avg: <strong className="text-foreground">{data.overallAvgMatch}%</strong>
            </span>
          )}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.points}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="label"
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
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={80}
              stroke="#22A06B"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: "80% Target",
                fill: "#22A06B",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="avgMatchPercent"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#10B981" }}
              activeDot={{ r: 5, fill: "#34D399" }}
            />
            {data.points.some((p) => p.rollingAvgMatch !== undefined) && (
              <Line
                type="monotone"
                dataKey="rollingAvgMatch"
                stroke="#6366F1"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
