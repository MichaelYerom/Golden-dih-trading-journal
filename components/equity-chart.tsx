"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { EquityPoint } from "@/lib/data/trades";
import { formatCurrencyNeutral, formatCurrency } from "@/lib/utils";

interface EquityChartProps {
  data: EquityPoint[];
  startingBalance: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: EquityPoint;
    value: number;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    const isStart = point.index === 0;

    return (
      <div className="rounded-xl border border-border/90 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[180px]">
        <div className="font-semibold text-foreground flex items-center justify-between border-b border-border/60 pb-1.5 mb-2">
          <span>{isStart ? "Starting Balance" : `Trade #${point.index}`}</span>
          <span className="text-[10px] text-muted-foreground font-mono-numbers">{point.date}</span>
        </div>

        <div className="space-y-1.5 font-mono-numbers">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-bold text-foreground">
              {formatCurrencyNeutral(point.balance)}
            </span>
          </div>

          {!isStart && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade P&L:</span>
                <span
                  className={`font-semibold ${
                    point.tradePnl > 0
                      ? "text-emerald-400"
                      : point.tradePnl < 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(point.tradePnl)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Cumulative P&L:</span>
                <span
                  className={`font-semibold ${
                    point.pnl > 0
                      ? "text-emerald-400"
                      : point.pnl < 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(point.pnl)}
                </span>
              </div>

              {point.symbol && (
                <div className="flex justify-between pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">Symbol / Dir:</span>
                  <span className="text-foreground uppercase font-medium">
                    {point.symbol} ({point.direction})
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export function EquityChart({ data, startingBalance }: EquityChartProps) {
  // If only start point exists (no trades logged yet)
  if (!data || data.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border/70 bg-card/30 p-6 text-center">
        <div className="p-3 rounded-full bg-muted/40 text-muted-foreground mb-3">
          <svg
            className="h-6 w-6 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">No equity data yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Log trades to see your balance growth and drawdown curve in real time.
        </p>
      </div>
    );
  }

  // Calculate domain bounds
  const balances = data.map((d) => d.balance);
  const minBalance = Math.min(...balances, startingBalance);
  const maxBalance = Math.max(...balances, startingBalance);
  const padding = Math.max((maxBalance - minBalance) * 0.15, 100);

  const yDomain = [
    Math.floor(minBalance - padding),
    Math.ceil(maxBalance + padding),
  ];

  const lastBalance = data[data.length - 1].balance;
  const isOverallProfitable = lastBalance >= startingBalance;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isOverallProfitable ? "#10b981" : "#3b82f6"}
                stopOpacity={0.35}
              />
              <stop
                offset="95%"
                stopColor={isOverallProfitable ? "#10b981" : "#3b82f6"}
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.4}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickMargin={8}
          />

          <YAxis
            domain={yDomain}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
            tickMargin={8}
            orientation="right"
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Baseline at Starting Balance */}
          <ReferenceLine
            y={startingBalance}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            opacity={0.6}
            label={{
              value: `Start ($${(startingBalance / 1000).toFixed(1)}k)`,
              position: "insideLeft",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 10,
            }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke={isOverallProfitable ? "#10b981" : "#3b82f6"}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#equityGradient)"
            activeDot={{
              r: 5,
              fill: isOverallProfitable ? "#10b981" : "#3b82f6",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
