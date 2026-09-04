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
import { MissedOpportunityBreakdown } from "@/lib/data/advanced-analytics";
import {
  EyeOff,
  Clock,
  Calendar,
  Layers,
  FileQuestion,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface MissedOpportunityBreakdownProps {
  data: MissedOpportunityBreakdown;
}

type SubTab = "strategy" | "hour" | "day" | "notrade";

export function MissedOpportunityBreakdownView({
  data,
}: MissedOpportunityBreakdownProps) {
  const [activeTab, setActiveTab] = React.useState<SubTab>("strategy");

  const {
    totalMissedEntries,
    totalNoTradeDays,
    missedByStrategy,
    missedByHour,
    missedByDayOfWeek,
    topHesitationSetup,
    topHesitationHour,
    topHesitationDay,
    noTradeByDayOfWeek,
    noTradeCommonThemes,
  } = data;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur text-xs space-y-1 min-w-[130px]">
          <span className="font-semibold text-foreground">{item.label || item.dayName || item.strategyName}</span>
          <div className="flex justify-between font-mono-numbers text-[11px] text-muted-foreground">
            <span>Occurrences:</span>
            <span className="font-semibold text-amber-400">{item.count}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">
              Missed Opportunities & Hesitation Patterns
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify when and on which setups you are most prone to hesitating or holding back
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("strategy")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === "strategy"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>By Setup</span>
          </button>
          <button
            onClick={() => setActiveTab("hour")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === "hour"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Hourly</span>
          </button>
          <button
            onClick={() => setActiveTab("day")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === "day"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Day of Week</span>
          </button>
          <button
            onClick={() => setActiveTab("notrade")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === "notrade"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileQuestion className="h-3 w-3" />
            <span>No-Trade Days</span>
          </button>
        </div>
      </div>

      {/* Hesitation Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">
            Top Hesitation Setup
          </span>
          <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
            {topHesitationSetup || "None recorded"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">
            Peak Hesitation Window
          </span>
          <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
            {topHesitationHour ? `${topHesitationHour} (Hourly)` : "Evenly distributed"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">
            Peak Hesitation Day
          </span>
          <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
            {topHesitationDay || "None recorded"}
          </p>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "strategy" && (
        <div>
          {missedByStrategy.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No missed entry setups logged yet.
            </div>
          ) : (
            <div className="space-y-2">
              {missedByStrategy.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-secondary/15 p-2.5 text-xs"
                >
                  <span className="font-semibold text-foreground truncate">
                    {s.strategyName}
                  </span>
                  <div className="flex items-center gap-2 font-mono-numbers">
                    <span className="text-muted-foreground">{s.count} missed</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {s.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "hour" && (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={missedByHour}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#F59E0B" radius={[3, 3, 0, 0]}>
                {missedByHour.map((entry, index) => (
                  <Cell
                    key={`cell-hour-${index}`}
                    fill="#F59E0B"
                    fillOpacity={entry.count > 0 ? 0.85 : 0.15}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === "day" && (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={missedByDayOfWeek}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="shortName"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#F59E0B" radius={[3, 3, 0, 0]}>
                {missedByDayOfWeek.map((entry, index) => (
                  <Cell
                    key={`cell-day-${index}`}
                    fill="#F59E0B"
                    fillOpacity={entry.count > 0 ? 0.85 : 0.15}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === "notrade" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span>Total No-Trade Sessions Logged: <strong className="text-foreground">{totalNoTradeDays}</strong></span>
          </div>

          {noTradeCommonThemes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {noTradeCommonThemes.map((theme, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-secondary/20 text-xs"
                >
                  <span className="font-medium text-foreground">{theme.theme}</span>
                  <span className="font-mono-numbers text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {theme.count} {theme.count === 1 ? "day" : "days"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No &apos;No-Trade&apos; days or reason notes logged yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
