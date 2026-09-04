"use client";

import * as React from "react";
import { CoachInsightFlag } from "@/lib/data/advanced-analytics";
import {
  Sparkles,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

interface CoachInsightsPanelProps {
  strengths: CoachInsightFlag[];
  mistakes: CoachInsightFlag[];
}

export function CoachInsightsPanel({ strengths, mistakes }: CoachInsightsPanelProps) {
  const getCategoryIcon = (category: CoachInsightFlag["category"], type: "strength" | "mistake") => {
    switch (category) {
      case "confluence":
        return type === "strength" ? (
          <Sparkles className="h-4 w-4 text-emerald-400" />
        ) : (
          <Flame className="h-4 w-4 text-rose-400" />
        );
      case "strategy":
        return type === "strength" ? (
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-rose-400" />
        );
      case "time":
        return <Clock className="h-4 w-4 text-amber-400" />;
      case "rules":
        return type === "strength" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-rose-400" />
        );
      case "hesitation":
        return <HelpCircle className="h-4 w-4 text-amber-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Strengths & Edge Highlights */}
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-card/40 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Trading Strengths & Edges
              </h3>
              <p className="text-[11px] text-muted-foreground">
                High-expectancy patterns and disciplined behaviors
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {strengths.length} {strengths.length === 1 ? "flag" : "flags"}
          </span>
        </div>

        <div className="space-y-2.5">
          {strengths.map((flag) => (
            <div
              key={flag.id}
              className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
            >
              <div className="mt-0.5 flex-shrink-0">
                {getCategoryIcon(flag.category, "strength")}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {flag.title}
                  </h4>
                  {flag.metricHighlight && (
                    <span className="flex-shrink-0 text-[10px] font-medium font-mono-numbers px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {flag.metricHighlight}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {flag.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mistakes & Blindspots */}
      <div className="rounded-xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-card/40 p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-500/10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Mistakes & Systemic Blindspots
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Recurring loss drivers and overrepresented slip-ups
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {mistakes.length} {mistakes.length === 1 ? "flag" : "flags"}
          </span>
        </div>

        <div className="space-y-2.5">
          {mistakes.map((flag) => (
            <div
              key={flag.id}
              className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
            >
              <div className="mt-0.5 flex-shrink-0">
                {getCategoryIcon(flag.category, "mistake")}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {flag.title}
                  </h4>
                  {flag.metricHighlight && (
                    <span
                      className={`flex-shrink-0 text-[10px] font-medium font-mono-numbers px-1.5 py-0.5 rounded border ${
                        flag.severity === "high"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : flag.severity === "medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {flag.metricHighlight}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {flag.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
