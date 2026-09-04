"use client";

import * as React from "react";
import {
  LessonItem,
  LessonFilterCriteria,
  filterLessons,
  calculateLessonsStats,
} from "@/lib/data/lessons-analytics";
import { LessonCard } from "./lesson-card";
import { LessonFilters } from "./lesson-filters";
import { ImageLightboxModal, LightboxImageItem } from "@/components/image-lightbox-modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Lightbulb,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
  FilterX,
  Compass,
} from "lucide-react";

interface LessonsViewProps {
  initialLessons: LessonItem[];
  sessions: Array<{ id: string; name: string }>;
  strategies: Array<{ id: string; name: string }>;
}

export function LessonsView({
  initialLessons,
  sessions = [],
  strategies = [],
}: LessonsViewProps) {
  const [filters, setFilters] = React.useState<LessonFilterCriteria>({});

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = React.useState<LightboxImageItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxTitle, setLightboxTitle] = React.useState<string>("");

  const handleOpenLightbox = (lesson: LessonItem, index: number) => {
    if (!lesson.images || lesson.images.length === 0) return;
    setLightboxImages(
      lesson.images.map((img) => ({
        id: img.id,
        url: img.url,
        label: img.label || (img.role === "before_trade" ? "Pre-Trade Setup" : "Outcome / Exit"),
      }))
    );
    setLightboxIndex(index);
    setLightboxTitle(
      `${lesson.symbol} Reflection (${
        lesson.outcomeType === "trade"
          ? lesson.result?.toUpperCase() || "TRADE"
          : lesson.outcomeType.toUpperCase()
      })`
    );
    setLightboxOpen(true);
  };

  // Distinct symbols across all lessons
  const distinctSymbols = React.useMemo(() => {
    const set = new Set<string>();
    initialLessons.forEach((l) => {
      if (l.symbol) set.add(l.symbol.toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [initialLessons]);

  // Filtered lessons
  const filteredLessons = React.useMemo(() => {
    return filterLessons(initialLessons, filters);
  }, [initialLessons, filters]);

  // Summary stats computed on all lessons
  const stats = React.useMemo(() => {
    return calculateLessonsStats(initialLessons);
  }, [initialLessons]);

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Lightbox Modal */}
      <ImageLightboxModal
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        tradeTitle={lightboxTitle}
      />

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <Lightbulb className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Lessons Learned
            </h1>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Automatic chronological log of your post-trade realizations, execution reviews,
            and missed entry insights aggregated across all backtest sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-border/80 hover:bg-secondary/60"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              <span>Back to Sessions</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Total Lessons */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Total Reflections</span>
              <Sparkles className="h-3 w-3 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold font-mono-numbers text-foreground">
              {stats.totalLessons}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Across all journaled trades
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>This Month</span>
              <Calendar className="h-3 w-3 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold font-mono-numbers text-foreground">
              {stats.lessonsThisMonth}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {stats.lessonsThisWeek} logged this week
            </p>
          </CardContent>
        </Card>

        {/* Win Reflections */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Winning Setups</span>
              <TrendingUp className="h-3 w-3 text-[#22A06B]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold font-mono-numbers text-[#22A06B]">
              {stats.winLessons}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Winning execution notes
            </p>
          </CardContent>
        </Card>

        {/* Loss Reflections */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Loss Takeaways</span>
              <TrendingDown className="h-3 w-3 text-[#DB5461]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold font-mono-numbers text-[#DB5461]">
              {stats.lossLessons}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Loss management reviews
            </p>
          </CardContent>
        </Card>

        {/* Missed / No-Trade Insights */}
        <Card className="border border-border bg-card col-span-2 sm:col-span-4 lg:col-span-1">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Missed &amp; Discipline</span>
              <AlertCircle className="h-3 w-3 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold font-mono-numbers text-amber-400">
              {stats.missedOrNoTradeLessons}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Discipline &amp; hesitation notes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CONTROLS */}
      <LessonFilters
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        distinctSessions={sessions}
        distinctStrategies={strategies}
        distinctSymbols={distinctSymbols}
        totalLessonsCount={initialLessons.length}
        filteredLessonsCount={filteredLessons.length}
      />

      {/* TIMELINE FEED / CARDS */}
      {initialLessons.length === 0 ? (
        /* Global Empty State */
        <div className="rounded-xl border border-dashed border-border/80 bg-card p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-foreground">
              No lessons or reflections logged yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Whenever you log post-trade review notes, describe why an entry was missed,
              or reflect on a no-trade day, your realizations will automatically appear here.
            </p>
          </div>
          <Link href="/">
            <Button size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold">
              <span>Open Backtest Sessions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      ) : filteredLessons.length === 0 ? (
        /* Filtered Empty State */
        <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
          <FilterX className="h-7 w-7 text-muted-foreground mx-auto opacity-60" />
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-foreground">
              No lessons match your current filters
            </h3>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Try modifying your search keywords or clearing some of the active filter criteria.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs"
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        /* Render Timeline of Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Timeline Feed (Newest first)
            </span>
            <span className="font-mono-numbers">
              {filteredLessons.length} entries
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onOpenLightbox={handleOpenLightbox}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
