"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { LessonItem } from "@/lib/data/lessons-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  BookOpen,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Camera,
  Quote,
  Clock,
  Compass,
} from "lucide-react";

interface LessonCardProps {
  lesson: LessonItem;
  onOpenLightbox?: (lesson: LessonItem, imageIndex: number) => void;
}

export function LessonCard({ lesson, onOpenLightbox }: LessonCardProps) {
  const isTrade = lesson.outcomeType === "trade";
  const isMissed = lesson.outcomeType === "missed_entry";
  const isNoTrade = lesson.outcomeType === "no_trade";
  const isProfit = isTrade && lesson.result === "win";
  const isLoss = isTrade && lesson.result === "loss";
  const isBE = isTrade && lesson.result === "breakeven";

  return (
    <article className="group rounded-xl border border-border/80 bg-card hover:border-border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between">
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* TOP METADATA ROW */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-border/50">
          {/* Left: Date / Time + Session */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono-numbers font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {format(new Date(lesson.entryAt), "MMM d, yyyy")}
              <span className="text-muted-foreground font-normal">
                {format(new Date(lesson.entryAt), "HH:mm")}
              </span>
            </span>

            <span className="text-muted-foreground/40">•</span>

            {/* Session Tag */}
            <Link
              href={`/sessions/${lesson.sessionId}`}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground bg-secondary/70 hover:bg-secondary border border-border/60 px-2 py-0.5 rounded transition-colors"
              title={`Session: ${lesson.sessionName}`}
            >
              {lesson.sessionName}
            </Link>

            {/* Symbol Tag */}
            <span className="font-mono-numbers text-[11px] font-bold text-foreground bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded uppercase">
              {lesson.symbol}
            </span>
          </div>

          {/* Right: Outcome / R-Multiple Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isMissed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertCircle className="h-3 w-3" />
                MISSED ENTRY
              </span>
            ) : isNoTrade ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                <MinusCircle className="h-3 w-3" />
                NO TRADE DAY
              </span>
            ) : isProfit ? (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#22A06B]/15 text-[#22A06B] border border-[#22A06B]/30 font-mono-numbers">
                  <TrendingUp className="h-3 w-3" />
                  WIN {lesson.rMultiple !== null ? `+${lesson.rMultiple.toFixed(1)}R` : ""}
                </span>
                {lesson.grossPnl > 0 && (
                  <span className="text-[11px] font-mono-numbers text-[#22A06B] font-semibold">
                    +{formatCurrency(lesson.grossPnl)}
                  </span>
                )}
              </div>
            ) : isLoss ? (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DB5461]/15 text-[#DB5461] border border-[#DB5461]/30 font-mono-numbers">
                  <TrendingDown className="h-3 w-3" />
                  LOSS {lesson.rMultiple !== null ? `${lesson.rMultiple.toFixed(1)}R` : ""}
                </span>
                {lesson.grossPnl < 0 && (
                  <span className="text-[11px] font-mono-numbers text-[#DB5461] font-semibold">
                    {formatCurrency(lesson.grossPnl)}
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-600/20 text-slate-300 border border-slate-600/40 font-mono-numbers">
                <MinusCircle className="h-3 w-3" />
                BREAKEVEN 0.0R
              </span>
            )}
          </div>
        </div>

        {/* MIDDLE: PROMINENT LESSON / REFLECTION TEXT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-primary uppercase tracking-wider text-[10px]">
              <Quote className="h-3 w-3 rotate-180 opacity-80" />
              {lesson.noteType === "missed_reason"
                ? "Missed Entry Realization"
                : lesson.noteType === "no_trade_reason"
                ? "No-Trade Market Insight"
                : "Post-Trade Reflection & Takeaway"}
            </span>

            {/* HTF Bias or Emotional State if present */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {lesson.htfBias && (
                <span className="flex items-center gap-1 font-medium bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                  <Compass className="h-2.5 w-2.5 text-primary" />
                  {lesson.htfBias}
                </span>
              )}
              {lesson.rulesFollowed === true && (
                <span className="flex items-center gap-0.5 text-[#22A06B] font-medium bg-[#22A06B]/10 px-1.5 py-0.2 rounded border border-[#22A06B]/20">
                  <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                  Rules followed
                </span>
              )}
              {lesson.rulesFollowed === false && (
                <span className="flex items-center gap-0.5 text-[#DB5461] font-medium bg-[#DB5461]/10 px-1.5 py-0.2 rounded border border-[#DB5461]/20">
                  <X className="h-2.5 w-2.5 stroke-[2.5]" />
                  Rule broken
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-secondary/30 border border-border/60 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
            {lesson.note}
          </div>
        </div>

        {/* ATTACHED SCREENSHOTS (IF ANY) */}
        {lesson.images && lesson.images.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Camera className="h-3 w-3 text-primary" />
              <span>Chart Screenshots ({lesson.images.length})</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {lesson.images.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => onOpenLightbox?.(lesson, idx)}
                  className="relative group/img cursor-pointer aspect-video rounded-md overflow-hidden border border-border bg-black/40 flex items-center justify-center hover:border-primary/60 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label || `Screenshot ${idx + 1}`}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded">
                      Zoom
                    </span>
                  </div>
                  {img.label && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium text-white/90 bg-black/70 px-1 rounded truncate max-w-[90%]">
                      {img.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BAR: STRATEGY & VIEW LINK */}
      <div className="px-4 sm:px-5 py-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {lesson.strategyName ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[11px]">
              <BookOpen className="h-3 w-3 text-primary" />
              <span>{lesson.strategyName}</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/60 italic">
              No Playbook strategy linked
            </span>
          )}
        </div>

        <Link
          href={`/sessions/${lesson.sessionId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group/link"
        >
          <span>View in Session</span>
          <ArrowUpRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
