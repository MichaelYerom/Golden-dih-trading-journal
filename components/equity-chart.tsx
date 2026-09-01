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
import { TrendingUp } from "lucide-react";

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
      <div className="rounded-md border border-border bg-card p-2.5 text-xs min-w-[170px]">
        <div className="font-medium text-foreground flex items-center justify-between border-b border-border pb-1 mb-1.5">
          <span>{isStart ? "Start" : `Trade #${point.index}`}</span>
          <span className="text-[10px] text-muted-foreground font-mono-numbers">{point.date}</span>
        </div>

        <div className="space-y-1 font-mono-numbers text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-semibold text-foreground">
              {formatCurrencyNeutral(point.balance)}
            </span>
          </div>

          {!isStart && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade P&L:</span>
                <span
                  className={`font-medium ${
                    point.tradePnl > 0
                      ? "text-[#22A06B]"
                      : point.tradePnl < 0
                      ? "text-[#DB5461]"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(point.tradePnl)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Cumulative P&L:</span>
                <span
                  className={`font-medium ${
                    point.pnl > 0
                      ? "text-[#22A06B]"
                      : point.pnl < 0
                      ? "text-[#DB5461]"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(point.pnl)}
                </span>
              </div>

              {point.symbol && (
                <div className="flex justify-between pt-1 border-t border-border text-[10px]">
                  <span className="text-muted-foreground">Symbol:</span>
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
      <div className="flex flex-col items-center justify-center h-52 rounded-md border border-border bg-card p-4 text-center">
        <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">No equity curve data</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
          Log trades to visualize your cumulative balance trajectory over time.
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

  // TradeZella dark emerald curve
  const strokeColor = isOverallProfitable ? "#22A06B" : "#C9A227";

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="tradezellaEquityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="2 2"
            stroke="hsl(var(--border))"
            opacity={0.7}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickMargin={6}
          />

          <YAxis
            domain={yDomain}
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
            tickMargin={6}
            orientation="right"
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Baseline at Starting Balance */}
          <ReferenceLine
            y={startingBalance}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            opacity={0.5}
            label={{
              value: `Base ($${(startingBalance / 1000).toFixed(1)}k)`,
              position: "insideLeft",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 10,
            }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#tradezellaEquityGradient)"
            activeDot={{
              r: 4,
              fill: strokeColor,
              stroke: "hsl(var(--background))",
              strokeWidth: 1.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
