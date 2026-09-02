"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { RBucket } from "@/lib/data/trades";
import { BarChart3 } from "lucide-react";

interface RDistributionChartProps {
  data: RBucket[];
  totalTradesWithR: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RBucket;
    value: number;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const isLoss = item.type === "loss";

    return (
      <div className="rounded-md border border-border bg-card p-2.5 text-xs shadow-lg min-w-[140px]">
        <div className="font-semibold text-foreground border-b border-border pb-1 mb-1.5 flex items-center justify-between">
          <span>Range: {item.bucket}</span>
        </div>
        <div className="space-y-1 font-mono-numbers text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trades:</span>
            <span
              className={`font-semibold ${
                isLoss ? "text-[#DB5461]" : "text-[#22A06B]"
              }`}
            >
              {item.count}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function RDistributionChart({
  data,
  totalTradesWithR,
}: RDistributionChartProps) {
  if (!data || totalTradesWithR === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-md border border-border bg-card p-4 text-center">
        <BarChart3 className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">
          No R-Multiple distribution data
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
          Provide a stop loss on trade entries to visualize return distribution across R multiples.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
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
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={4}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            domain={[0, Math.ceil(maxCount * 1.2)]}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === "loss" ? "#DB5461" : "#22A06B"}
                fillOpacity={entry.count > 0 ? 0.85 : 0.25}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
