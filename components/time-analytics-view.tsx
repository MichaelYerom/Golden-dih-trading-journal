"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TimeAnalyticsResult,
  HourlyPerformance,
  DayOfWeekPerformance,
  SessionDurationPerformance,
} from "@/lib/data/trade-analytics";
import { formatCurrency } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Flame,
  BatteryCharging,
} from "lucide-react";

interface TimeAnalyticsViewProps {
  timeAnalytics: TimeAnalyticsResult;
}

type MetricMode = "pnl" | "winRate" | "rMultiple";

export function TimeAnalyticsView({ timeAnalytics }: TimeAnalyticsViewProps) {
  const [metricMode, setMetricMode] = React.useState<MetricMode>("pnl");
  const [showActiveHoursOnly, setShowActiveHoursOnly] = React.useState(false);

  const {
    hasSufficientData,
    totalTradesEvaluated,
    hourly,
    dayOfWeek,
    sessionDuration,
    bestHour,
    worstHour,
    bestDay,
    worstDay,
  } = timeAnalytics;

  // Filter hourly data if active hours only is toggled
  const filteredHourly = React.useMemo(() => {
    if (!showActiveHoursOnly) return hourly;
    const active = hourly.filter((h) => h.count > 0);
    return active.length > 0 ? active : hourly;
  }, [hourly, showActiveHoursOnly]);

  // Hourly Custom Tooltip
  const HourlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HourlyPerformance;
      if (data.count === 0) {
        return (
          <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur text-xs">
            <span className="font-semibold text-foreground">{data.label}</span>
            <p className="text-muted-foreground mt-0.5">No trades recorded</p>
          </div>
        );
      }
      return (
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[170px]">
          <div className="font-semibold text-foreground border-b border-border pb-1 flex items-center justify-between">
            <span>{data.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono-numbers">
              {data.count} {data.count === 1 ? "trade" : "trades"}
            </span>
          </div>
          <div className="space-y-1 pt-0.5 font-mono-numbers">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total P&L:</span>
              <span
                className={`font-semibold ${
                  data.totalPnl > 0
                    ? "text-[#22A06B]"
                    : data.totalPnl < 0
                    ? "text-[#DB5461]"
                    : "text-muted-foreground"
                }`}
              >
                {formatCurrency(data.totalPnl)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Win Rate:</span>
              <span
                className={`font-semibold ${
                  (data.winRate ?? 0) >= 50 ? "text-[#22A06B]" : "text-[#DB5461]"
                }`}
              >
                {data.winRate !== null ? `${data.winRate}%` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Record:</span>
              <span className="text-foreground">
                {data.winCount}W / {data.lossCount}L
                {data.breakevenCount > 0 ? ` / ${data.breakevenCount}BE` : ""}
              </span>
            </div>
            {data.avgR !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg R:</span>
                <span
                  className={`font-semibold ${
                    data.avgR > 0
                      ? "text-[#22A06B]"
                      : data.avgR < 0
                      ? "text-[#DB5461]"
                      : "text-muted-foreground"
                  }`}
                >
                  {data.avgR > 0 ? `+${data.avgR.toFixed(2)}R` : `${data.avgR.toFixed(2)}R`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Day of Week Custom Tooltip
  const DayTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayOfWeekPerformance;
      if (data.count === 0) {
        return (
          <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur text-xs">
            <span className="font-semibold text-foreground">{data.dayName}</span>
            <p className="text-muted-foreground mt-0.5">No trades recorded</p>
          </div>
        );
      }
      return (
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[170px]">
          <div className="font-semibold text-foreground border-b border-border pb-1 flex items-center justify-between">
            <span>{data.dayName}</span>
            <span className="text-[10px] text-muted-foreground font-mono-numbers">
              {data.count} {data.count === 1 ? "trade" : "trades"}
            </span>
          </div>
          <div className="space-y-1 pt-0.5 font-mono-numbers">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total P&L:</span>
              <span
                className={`font-semibold ${
                  data.totalPnl > 0
                    ? "text-[#22A06B]"
                    : data.totalPnl < 0
                    ? "text-[#DB5461]"
                    : "text-muted-foreground"
                }`}
              >
                {formatCurrency(data.totalPnl)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Win Rate:</span>
              <span
                className={`font-semibold ${
                  (data.winRate ?? 0) >= 50 ? "text-[#22A06B]" : "text-[#DB5461]"
                }`}
              >
                {data.winRate !== null ? `${data.winRate}%` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Record:</span>
              <span className="text-foreground">
                {data.winCount}W / {data.lossCount}L
                {data.breakevenCount > 0 ? ` / ${data.breakevenCount}BE` : ""}
              </span>
            </div>
            {data.avgR !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg R:</span>
                <span
                  className={`font-semibold ${
                    data.avgR > 0
                      ? "text-[#22A06B]"
                      : data.avgR < 0
                      ? "text-[#DB5461]"
                      : "text-muted-foreground"
                  }`}
                >
                  {data.avgR > 0 ? `+${data.avgR.toFixed(2)}R` : `${data.avgR.toFixed(2)}R`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Session Duration Custom Tooltip
  const DurationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SessionDurationPerformance;
      return (
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur text-xs space-y-1.5 min-w-[180px]">
          <div className="font-semibold text-foreground border-b border-border pb-1 flex items-center justify-between">
            <span>{data.bucket}</span>
            <span className="text-[10px] text-muted-foreground">{data.description}</span>
          </div>
          <div className="space-y-1 pt-0.5 font-mono-numbers">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trades:</span>
              <span className="font-semibold text-foreground">{data.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total P&L:</span>
              <span
                className={`font-semibold ${
                  data.totalPnl > 0
                    ? "text-[#22A06B]"
                    : data.totalPnl < 0
                    ? "text-[#DB5461]"
                    : "text-muted-foreground"
                }`}
              >
                {formatCurrency(data.totalPnl)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Win Rate:</span>
              <span
                className={`font-semibold ${
                  (data.winRate ?? 0) >= 50 ? "text-[#22A06B]" : "text-[#DB5461]"
                }`}
              >
                {data.winRate !== null ? `${data.winRate}%` : "—"}
              </span>
            </div>
            {data.avgPnl !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg P&L / Trade:</span>
                <span
                  className={`font-semibold ${
                    data.avgPnl > 0
                      ? "text-[#22A06B]"
                      : data.avgPnl < 0
                      ? "text-[#DB5461]"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(data.avgPnl)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarValue = (item: HourlyPerformance | DayOfWeekPerformance | SessionDurationPerformance) => {
    if (metricMode === "pnl") return item.totalPnl;
    if (metricMode === "winRate") return item.winRate ?? 0;
    return item.avgR ?? 0;
  };

  const getBarColor = (item: HourlyPerformance | DayOfWeekPerformance | SessionDurationPerformance) => {
    if (item.count === 0) return "rgba(255, 255, 255, 0.05)";
    if (metricMode === "pnl") {
      return item.totalPnl >= 0 ? "#22A06B" : "#DB5461";
    }
    if (metricMode === "winRate") {
      return (item.winRate ?? 0) >= 50 ? "#22A06B" : "#DB5461";
    }
    return (item.avgR ?? 0) >= 0 ? "#22A06B" : "#DB5461";
  };

  return (
    <div className="space-y-6">
      {/* INSUFFICIENT DATA NOTICE IF < 5 TRADES */}
      {!hasSufficientData && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300">
              Limited Sample Size ({totalTradesEvaluated} {totalTradesEvaluated === 1 ? "trade" : "trades"})
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Time-of-day and day-of-week patterns require at least 5–10 trades to reveal statistically meaningful edges. As you log more executions, these distributions will highlight your peak focus hours and fatigue zones.
            </p>
          </div>
        </div>
      )}

      {/* TOP INSIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Best Hour Card */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Peak Hour
              </span>
              <Clock className="h-3.5 w-3.5 text-primary" />
            </div>
            {bestHour ? (
              <div>
                <div className="text-lg font-bold font-mono-numbers text-foreground flex items-center gap-1.5">
                  <span>{bestHour.label}</span>
                  <Badge variant="win" className="text-[10px] font-mono-numbers py-0 px-1">
                    {bestHour.winRate !== null ? `${bestHour.winRate}% WR` : "Win"}
                  </Badge>
                </div>
                <div className="text-xs font-mono-numbers mt-0.5 text-[#22A06B] font-semibold">
                  +{formatCurrency(bestHour.totalPnl)} P&L
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1 font-mono-numbers">
                No active hours
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worst Hour Card */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Lowest Hour
              </span>
              <TrendingDown className="h-3.5 w-3.5 text-[#DB5461]" />
            </div>
            {worstHour ? (
              <div>
                <div className="text-lg font-bold font-mono-numbers text-foreground flex items-center gap-1.5">
                  <span>{worstHour.label}</span>
                  <Badge variant="loss" className="text-[10px] font-mono-numbers py-0 px-1">
                    {worstHour.winRate !== null ? `${worstHour.winRate}% WR` : "Loss"}
                  </Badge>
                </div>
                <div className="text-xs font-mono-numbers mt-0.5 text-[#DB5461] font-semibold">
                  {formatCurrency(worstHour.totalPnl)} P&L
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1 font-mono-numbers">
                No active hours
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Day Card */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Strongest Day
              </span>
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            {bestDay ? (
              <div>
                <div className="text-lg font-bold font-mono-numbers text-foreground flex items-center gap-1.5">
                  <span>{bestDay.dayName}</span>
                  <Badge variant="win" className="text-[10px] font-mono-numbers py-0 px-1">
                    {bestDay.winRate !== null ? `${bestDay.winRate}% WR` : "Win"}
                  </Badge>
                </div>
                <div className="text-xs font-mono-numbers mt-0.5 text-[#22A06B] font-semibold">
                  +{formatCurrency(bestDay.totalPnl)} P&L
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1 font-mono-numbers">
                No active days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Duration Fatigue Card */}
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">
                Session Fatigue
              </span>
              <BatteryCharging className="h-3.5 w-3.5 text-primary" />
            </div>
            {(() => {
              const h1 = sessionDuration.find((b) => b.bucket === "Hour 1");
              const h3 = sessionDuration.find((b) => b.bucket === "Hour 3+");
              if (!h1 || h1.count === 0) {
                return (
                  <div className="text-xs text-muted-foreground mt-1 font-mono-numbers">
                    Awaiting session trades
                  </div>
                );
              }
              const h1Wr = h1.winRate ?? 0;
              const h3Wr = h3 && h3.count > 0 ? (h3.winRate ?? 0) : null;
              return (
                <div>
                  <div className="text-lg font-bold font-mono-numbers text-foreground">
                    H1: {h1Wr}% WR
                  </div>
                  <div className="text-xs text-muted-foreground font-mono-numbers mt-0.5">
                    {h3Wr !== null ? `Late session (H3+): ${h3Wr}% WR` : "No late trades logged"}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* METRIC MODE TOGGLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Display Metric:
          </span>
          <div className="inline-flex rounded-lg border border-border bg-secondary p-0.5">
            <button
              type="button"
              onClick={() => setMetricMode("pnl")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                metricMode === "pnl"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Net P&L ($)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("winRate")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                metricMode === "winRate"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Win Rate (%)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("rMultiple")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                metricMode === "rMultiple"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Avg R-Multiple
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showActiveHoursOnly}
              onChange={(e) => setShowActiveHoursOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-0 h-3.5 w-3.5 bg-secondary"
            />
            <span>Active hours only</span>
          </label>
        </div>
      </div>

      {/* CHART 1: HOUR OF DAY DISTRIBUTION */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Hour-of-Day Performance</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Trade execution breakdown grouped by local entry hour (00:00 to 23:00).
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredHourly}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255, 255, 255, 0.05)"
                />
                <XAxis
                  dataKey="label"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  interval={showActiveHoursOnly ? 0 : 1}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  tickFormatter={(val) => {
                    if (metricMode === "pnl") return `$${val}`;
                    if (metricMode === "winRate") return `${val}%`;
                    return `${val}R`;
                  }}
                />
                <Tooltip
                  content={<HourlyTooltip />}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                />
                <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" />
                <Bar
                  dataKey={getBarValue}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                >
                  {filteredHourly.map((entry, index) => (
                    <Cell key={`cell-hour-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* TWO-COLUMN GRID: DAY OF WEEK + SESSION DURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CHART 2: DAY OF WEEK */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Day-of-Week Performance</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Performance aggregated from Monday through Sunday.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeek}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255, 255, 255, 0.05)"
                  />
                  <XAxis
                    dataKey="shortName"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                    tickFormatter={(val) => {
                      if (metricMode === "pnl") return `$${val}`;
                      if (metricMode === "winRate") return `${val}%`;
                      return `${val}R`;
                    }}
                  />
                  <Tooltip
                    content={<DayTooltip />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" />
                  <Bar
                    dataKey={getBarValue}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={42}
                  >
                    {dayOfWeek.map((entry, index) => (
                      <Cell key={`cell-day-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CHART 3: SESSION DURATION (FATIGUE DECAY) */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <span>Session Duration & Fatigue</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Elapsed time from first trade of each trading day.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sessionDuration}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255, 255, 255, 0.05)"
                  />
                  <XAxis
                    dataKey="bucket"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
                    tickFormatter={(val) => {
                      if (metricMode === "pnl") return `$${val}`;
                      if (metricMode === "winRate") return `${val}%`;
                      return `${val}R`;
                    }}
                  />
                  <Tooltip
                    content={<DurationTooltip />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" />
                  <Bar
                    dataKey={getBarValue}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={48}
                  >
                    {sessionDuration.map((entry, index) => (
                      <Cell key={`cell-duration-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TIME PERFORMANCE SUMMARY TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Day & Duration Summary Table
          </h3>
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Time Segment</th>
                  <th className="px-3.5 py-2.5 text-center">Trades</th>
                  <th className="px-3.5 py-2.5 text-center">Win Rate</th>
                  <th className="px-3.5 py-2.5 text-right">Net P&L</th>
                  <th className="px-3.5 py-2.5 text-right">Avg P&L</th>
                  <th className="px-3.5 py-2.5 text-right">Avg R</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Days */}
                {dayOfWeek
                  .filter((d) => d.count > 0)
                  .map((d) => (
                    <tr key={d.dayName} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-3.5 py-2 font-medium text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>{d.dayName}</span>
                      </td>
                      <td className="px-3.5 py-2 text-center font-mono-numbers text-foreground">
                        {d.count}
                      </td>
                      <td className="px-3.5 py-2 text-center font-mono-numbers">
                        <span
                          className={`font-semibold ${
                            (d.winRate ?? 0) >= 50 ? "text-[#22A06B]" : "text-[#DB5461]"
                          }`}
                        >
                          {d.winRate !== null ? `${d.winRate}%` : "—"}
                        </span>
                      </td>
                      <td
                        className={`px-3.5 py-2 text-right font-mono-numbers font-semibold ${
                          d.totalPnl > 0
                            ? "text-[#22A06B]"
                            : d.totalPnl < 0
                            ? "text-[#DB5461]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(d.totalPnl)}
                      </td>
                      <td
                        className={`px-3.5 py-2 text-right font-mono-numbers ${
                          (d.avgPnl ?? 0) > 0
                            ? "text-[#22A06B]"
                            : (d.avgPnl ?? 0) < 0
                            ? "text-[#DB5461]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {d.avgPnl !== null ? formatCurrency(d.avgPnl) : "—"}
                      </td>
                      <td
                        className={`px-3.5 py-2 text-right font-mono-numbers font-semibold ${
                          (d.avgR ?? 0) > 0
                            ? "text-[#22A06B]"
                            : (d.avgR ?? 0) < 0
                            ? "text-[#DB5461]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {d.avgR !== null
                          ? d.avgR > 0
                            ? `+${d.avgR.toFixed(2)}R`
                            : `${d.avgR.toFixed(2)}R`
                          : "—"}
                      </td>
                    </tr>
                  ))}

                {/* Duration Buckets */}
                {sessionDuration.map((b) => (
                  <tr key={b.bucket} className="hover:bg-secondary/40 transition-colors bg-secondary/10">
                    <td className="px-3.5 py-2 font-medium text-foreground flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span>{b.bucket} ({b.description})</span>
                    </td>
                    <td className="px-3.5 py-2 text-center font-mono-numbers text-foreground">
                      {b.count}
                    </td>
                    <td className="px-3.5 py-2 text-center font-mono-numbers">
                      {b.count > 0 ? (
                        <span
                          className={`font-semibold ${
                            (b.winRate ?? 0) >= 50 ? "text-[#22A06B]" : "text-[#DB5461]"
                          }`}
                        >
                          {b.winRate !== null ? `${b.winRate}%` : "—"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td
                      className={`px-3.5 py-2 text-right font-mono-numbers font-semibold ${
                        b.totalPnl > 0
                          ? "text-[#22A06B]"
                          : b.totalPnl < 0
                          ? "text-[#DB5461]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {b.count > 0 ? formatCurrency(b.totalPnl) : "—"}
                    </td>
                    <td
                      className={`px-3.5 py-2 text-right font-mono-numbers ${
                        (b.avgPnl ?? 0) > 0
                          ? "text-[#22A06B]"
                          : (b.avgPnl ?? 0) < 0
                          ? "text-[#DB5461]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {b.avgPnl !== null ? formatCurrency(b.avgPnl) : "—"}
                    </td>
                    <td
                      className={`px-3.5 py-2 text-right font-mono-numbers font-semibold ${
                        (b.avgR ?? 0) > 0
                          ? "text-[#22A06B]"
                          : (b.avgR ?? 0) < 0
                          ? "text-[#DB5461]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {b.avgR !== null
                        ? b.avgR > 0
                          ? `+${b.avgR.toFixed(2)}R`
                          : `${b.avgR.toFixed(2)}R`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
