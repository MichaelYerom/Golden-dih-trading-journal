"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  TradeEntity,
  RuleEntity,
  TradeFilterCriteria,
  filterTrades,
  calculateCalendarAnalytics,
  CalendarAnalyticsResult,
} from "@/lib/data/trade-analytics";
import { StrategyEntity } from "@/lib/data/strategies";
import { ConfluenceEntity } from "@/lib/data/confluences";
import { TradeFilters } from "@/components/trade-filters";
import { TradeTable } from "@/components/trade-table";
import { CalendarHeatmapView } from "@/components/calendar-heatmap-view";
import { TradeScreenshotGallery } from "@/components/trade-screenshot-gallery";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Table as TableIcon,
  Image as ImageIcon,
  FilterX,
  RotateCcw,
  Plus,
} from "lucide-react";

export type TradeViewMode = "calendar" | "table" | "screenshots";

const STORAGE_KEY = "trade_view_mode_preference";

interface TradeViewTabProps {
  trades: TradeEntity[];
  sessionId: string;
  sessionPeriodStart?: Date | string;
  sessionPeriodEnd?: Date | string;
  sessionRules?: RuleEntity[];
  strategies?: StrategyEntity[];
  confluences?: ConfluenceEntity[];
  sessionStartingBalance?: number;
  sessionCurrentBalance?: number;
  defaultSymbol?: string;
  initialSetupFilter?: string | null;
  calendarAnalytics?: CalendarAnalyticsResult;
  onSelectDate?: (dateString: string) => void;
}

export function TradeViewTab({
  trades,
  sessionId,
  sessionPeriodStart,
  sessionPeriodEnd,
  sessionRules = [],
  strategies = [],
  confluences = [],
  sessionStartingBalance = 10000,
  sessionCurrentBalance = 10000,
  defaultSymbol,
  initialSetupFilter = null,
  calendarAnalytics: initialCalendarAnalytics,
  onSelectDate,
}: TradeViewTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active view mode (Calendar, Table, Screenshots) with localStorage persistence
  const [viewMode, setViewMode] = React.useState<TradeViewMode>("calendar");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "calendar" || saved === "table" || saved === "screenshots") {
        setViewMode(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleViewModeChange = (mode: TradeViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  // State for editing a trade across any view mode
  const [editingTrade, setEditingTrade] = React.useState<TradeEntity | null>(null);

  // Initialize filters from URL search params (or initialSetupFilter)
  const [filters, setFilters] = React.useState<TradeFilterCriteria>(() => {
    const q = searchParams.get("q") || undefined;
    const resultParam = searchParams.get("result");
    const setupParam = searchParams.get("setup");
    const symbolParam = searchParams.get("symbol");
    const rulesParam = searchParams.get("rules");
    const emotionParam = searchParams.get("emotion");
    const minRParam = searchParams.get("minR");
    const maxRParam = searchParams.get("maxR");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const setupList = setupParam
      ? setupParam.split(",").map((s) => s.trim()).filter(Boolean)
      : initialSetupFilter
      ? [initialSetupFilter]
      : undefined;

    return {
      searchText: q,
      result: resultParam
        ? (resultParam.split(",") as ("win" | "loss" | "breakeven")[])
        : undefined,
      setup: setupList,
      symbol: symbolParam ? symbolParam.split(",") : undefined,
      rulesFollowed:
        rulesParam === "true" ? true : rulesParam === "false" ? false : null,
      emotionalState: emotionParam ? emotionParam.split(",") : undefined,
      minR: minRParam && !isNaN(parseFloat(minRParam)) ? parseFloat(minRParam) : undefined,
      maxR: maxRParam && !isNaN(parseFloat(maxRParam)) ? parseFloat(maxRParam) : undefined,
      dateRange:
        startParam || endParam
          ? {
              start: startParam || undefined,
              end: endParam || undefined,
            }
          : undefined,
    };
  });

  // Sync initialSetupFilter if passed dynamically
  React.useEffect(() => {
    if (initialSetupFilter) {
      setFilters((prev) => ({
        ...prev,
        setup: [initialSetupFilter],
      }));
    }
  }, [initialSetupFilter]);

  // Sync filters to URL query params
  const updateUrlParams = React.useCallback(
    (newFilters: TradeFilterCriteria) => {
      const params = new URLSearchParams();

      if (newFilters.searchText?.trim()) params.set("q", newFilters.searchText.trim());
      if (newFilters.result && newFilters.result.length > 0)
        params.set("result", newFilters.result.join(","));
      if (newFilters.setup && newFilters.setup.length > 0)
        params.set("setup", newFilters.setup.join(","));
      if (newFilters.symbol && newFilters.symbol.length > 0)
        params.set("symbol", newFilters.symbol.join(","));
      if (newFilters.rulesFollowed !== undefined && newFilters.rulesFollowed !== null)
        params.set("rules", newFilters.rulesFollowed ? "true" : "false");
      if (newFilters.emotionalState && newFilters.emotionalState.length > 0)
        params.set("emotion", newFilters.emotionalState.join(","));
      if (newFilters.minR !== undefined && newFilters.minR !== null)
        params.set("minR", newFilters.minR.toString());
      if (newFilters.maxR !== undefined && newFilters.maxR !== null)
        params.set("maxR", newFilters.maxR.toString());
      if (newFilters.dateRange?.start) {
        const s =
          typeof newFilters.dateRange.start === "string"
            ? newFilters.dateRange.start
            : newFilters.dateRange.start.toISOString().slice(0, 10);
        params.set("start", s);
      }
      if (newFilters.dateRange?.end) {
        const e =
          typeof newFilters.dateRange.end === "string"
            ? newFilters.dateRange.end
            : newFilters.dateRange.end.toISOString().slice(0, 10);
        params.set("end", e);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router]
  );

  const handleFilterChange = (newFilters: TradeFilterCriteria) => {
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handleResetFilters = () => {
    const emptyFilters: TradeFilterCriteria = {};
    setFilters(emptyFilters);
    updateUrlParams(emptyFilters);
  };

  // Distinct setups, symbols, emotional states
  const distinctSetups = React.useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      const name = t.strategy?.name || t.setupModel;
      if (name) {
        name.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    strategies.forEach((s) => set.add(s.name));
    return Array.from(set).sort();
  }, [trades, strategies]);

  const distinctSymbols = React.useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      if (t.symbol) set.add(t.symbol.toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [trades]);

  const distinctEmotionalStates = React.useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      if (t.emotionalState) {
        t.emotionalState.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [trades]);

  // Unified filtered trades shared across all 3 view modes
  const filteredTrades = React.useMemo(() => {
    return filterTrades(trades, filters);
  }, [trades, filters]);

  // Compute dynamic calendar analytics based on filtered trades
  const calendarAnalytics = React.useMemo(() => {
    const startDate = sessionPeriodStart ? new Date(sessionPeriodStart) : undefined;
    const endDate = sessionPeriodEnd ? new Date(sessionPeriodEnd) : undefined;
    return calculateCalendarAnalytics(filteredTrades, startDate, endDate);
  }, [filteredTrades, sessionPeriodStart, sessionPeriodEnd]);

  const startDateObj = React.useMemo(
    () => (sessionPeriodStart ? new Date(sessionPeriodStart) : undefined),
    [sessionPeriodStart]
  );
  const endDateObj = React.useMemo(
    () => (sessionPeriodEnd ? new Date(sessionPeriodEnd) : undefined),
    [sessionPeriodEnd]
  );

  return (
    <>
      {/* Shared Edit Trade Drawer */}
      {editingTrade && sessionId && (
        <AddTradeDrawer
          sessionId={sessionId}
          defaultSymbol={defaultSymbol || editingTrade.symbol}
          defaultDate={startDateObj?.toISOString()}
          sessionPeriodStart={startDateObj}
          sessionPeriodEnd={endDateObj}
          sessionRules={sessionRules}
          strategies={strategies}
          confluences={confluences}
          sessionStartingBalance={sessionStartingBalance}
          sessionCurrentBalance={sessionCurrentBalance}
          tradeToEdit={editingTrade}
          open={Boolean(editingTrade)}
          onOpenChange={(open) => {
            if (!open) setEditingTrade(null);
          }}
        />
      )}

      <div className="space-y-4">
        {/* TOP BAR: Title, Trade Counts, View Mode Toggle, and Log Trade Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Trade View
              </h2>
              <span className="text-xs font-mono-numbers px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                {filteredTrades.length} {filteredTrades.length === 1 ? "trade" : "trades"}
                {filteredTrades.length !== trades.length && (
                  <span className="text-muted-foreground font-normal ml-1">
                    of {trades.length}
                  </span>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyze executions across calendar heatmap, tabular log, and chart screenshot gallery.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            {/* VIEW MODE SEGMENTED CONTROL */}
            <div className="inline-flex items-center rounded-lg bg-secondary/80 p-0.5 border border-border">
              {/* Calendar Toggle */}
              <button
                type="button"
                onClick={() => handleViewModeChange("calendar")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "calendar"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Calendar Heatmap View"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Calendar</span>
              </button>

              {/* Table Toggle */}
              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tabular Trade Log View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>

              {/* Screenshots Gallery Toggle */}
              <button
                type="button"
                onClick={() => handleViewModeChange("screenshots")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "screenshots"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Chart Screenshot Gallery View"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Screenshots</span>
              </button>
            </div>

            {/* Log Trade Action */}
            <AddTradeDrawer
              sessionId={sessionId}
              defaultSymbol={defaultSymbol || "NQ"}
              defaultDate={startDateObj?.toISOString()}
              sessionPeriodStart={startDateObj}
              sessionPeriodEnd={endDateObj}
              sessionRules={sessionRules}
              strategies={strategies}
              confluences={confluences}
              sessionStartingBalance={sessionStartingBalance}
              sessionCurrentBalance={sessionCurrentBalance}
            />
          </div>
        </div>

        {/* SHARED ADVANCED FILTER BAR */}
        <TradeFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          distinctSetups={distinctSetups}
          distinctSymbols={distinctSymbols}
          distinctEmotionalStates={distinctEmotionalStates}
          totalTradesCount={trades.length}
          filteredTradesCount={filteredTrades.length}
        />

        {/* MODE-SPECIFIC RENDERING OR EMPTY STATE */}
        {filteredTrades.length === 0 && trades.length > 0 ? (
          /* CONSISTENT ZERO-MATCHES EMPTY STATE ACROSS ALL THREE MODES */
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center mx-auto text-muted-foreground">
              <FilterX className="h-5 w-5 opacity-75" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No trades match these filters
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search criteria, clearing specific filters, or resetting all filters to see your backtest entries.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs gap-1.5 mt-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear all filters</span>
            </Button>
          </div>
        ) : trades.length === 0 ? (
          /* NO TRADES AT ALL IN SESSION */
          <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No trades logged yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Start backtesting this session by logging your first trade observation or setup.
              </p>
            </div>
          </div>
        ) : viewMode === "calendar" ? (
          /* 1. CALENDAR HEATMAP MODE */
          <CalendarHeatmapView
            calendarAnalytics={calendarAnalytics}
            trades={filteredTrades}
            sessionId={sessionId}
            sessionPeriodStart={startDateObj}
            sessionPeriodEnd={endDateObj}
            rules={sessionRules}
            strategies={strategies}
            confluences={confluences}
            defaultSymbol={defaultSymbol}
            onSelectDate={onSelectDate}
            onEditTrade={(trade) => setEditingTrade(trade)}
          />
        ) : viewMode === "table" ? (
          /* 2. TABULAR LOG MODE */
          <TradeTable
            trades={filteredTrades}
            sessionId={sessionId}
            sessionPeriodStart={sessionPeriodStart}
            sessionPeriodEnd={sessionPeriodEnd}
            sessionRules={sessionRules}
            strategies={strategies}
            confluences={confluences}
            sessionStartingBalance={sessionStartingBalance}
            sessionCurrentBalance={sessionCurrentBalance}
            hideFilters={true}
            onEditTrade={(trade) => setEditingTrade(trade)}
          />
        ) : (
          /* 3. SCREENSHOT GALLERY MODE */
          <TradeScreenshotGallery
            trades={filteredTrades}
            onEditTrade={(trade) => setEditingTrade(trade)}
          />
        )}
      </div>
    </>
  );
}
