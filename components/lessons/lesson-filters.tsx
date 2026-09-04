"use client";

import * as React from "react";
import { LessonFilterCriteria } from "@/lib/data/lessons-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Search,
  FilterX,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface LessonFiltersProps {
  filters: LessonFilterCriteria;
  onFilterChange: (filters: LessonFilterCriteria) => void;
  onResetFilters: () => void;
  distinctSessions: Array<{ id: string; name: string }>;
  distinctStrategies: Array<{ id: string; name: string }>;
  distinctSymbols: string[];
  totalLessonsCount: number;
  filteredLessonsCount: number;
}

export function LessonFilters({
  filters,
  onFilterChange,
  onResetFilters,
  distinctSessions,
  distinctStrategies,
  distinctSymbols,
  totalLessonsCount,
  filteredLessonsCount,
}: LessonFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.searchText?.trim()) count++;
    if (filters.sessionId && filters.sessionId.length > 0) count++;
    if (filters.outcomeType && filters.outcomeType.length > 0) count++;
    if (filters.result && filters.result.length > 0) count++;
    if (filters.strategyId && filters.strategyId.length > 0) count++;
    if (filters.symbol && filters.symbol.length > 0) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3 shadow-sm">
      {/* Top Search Bar & Toggle Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reflections, takeaways, symbols, strategies, sessions..."
            value={filters.searchText || ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                searchText: e.target.value || undefined,
              })
            }
            className="pl-8 text-xs h-8 bg-background"
          />
          {filters.searchText && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  searchText: undefined,
                })
              }
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle + Reset */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`h-8 text-xs gap-1.5 transition-colors ${
              hasActiveFilters
                ? "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground font-mono-numbers">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 opacity-60 ml-0.5" />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <FilterX className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filter Controls */}
      {isExpanded && (
        <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Session Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Session
            </label>
            <Select
              value={filters.sessionId?.[0] || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  sessionId: e.target.value ? [e.target.value] : undefined,
                })
              }
              className="text-xs h-8 bg-background"
            >
              <option value="">All Sessions ({distinctSessions.length})</option>
              {distinctSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Outcome Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Outcome Mode
            </label>
            <Select
              value={filters.outcomeType?.[0] || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  outcomeType: e.target.value
                    ? [e.target.value as "trade" | "missed_entry" | "no_trade"]
                    : undefined,
                })
              }
              className="text-xs h-8 bg-background"
            >
              <option value="">All Modes</option>
              <option value="trade">Took a Trade</option>
              <option value="missed_entry">Missed Entry</option>
              <option value="no_trade">No Trade Day</option>
            </Select>
          </div>

          {/* 3. Trade Result */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Trade Result
            </label>
            <Select
              value={filters.result?.[0] || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  result: e.target.value
                    ? [e.target.value as "win" | "loss" | "breakeven"]
                    : undefined,
                })
              }
              className="text-xs h-8 bg-background"
            >
              <option value="">All Results</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="breakeven">Breakeven</option>
            </Select>
          </div>

          {/* 4. Strategy Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Playbook Strategy
            </label>
            <Select
              value={filters.strategyId?.[0] || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  strategyId: e.target.value ? [e.target.value] : undefined,
                })
              }
              className="text-xs h-8 bg-background"
            >
              <option value="">All Strategies ({distinctStrategies.length})</option>
              {distinctStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Symbol Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Symbol
            </label>
            <Select
              value={filters.symbol?.[0] || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  symbol: e.target.value ? [e.target.value] : undefined,
                })
              }
              className="text-xs h-8 bg-background uppercase font-mono-numbers"
            >
              <option value="">All Symbols</option>
              {distinctSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </Select>
          </div>

          {/* 6. Date Range Start / End */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              From Date
            </label>
            <Input
              type="date"
              value={
                typeof filters.dateRange?.start === "string"
                  ? filters.dateRange.start
                  : filters.dateRange?.start
                  ? filters.dateRange.start.toISOString().slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  dateRange: {
                    ...filters.dateRange,
                    start: e.target.value || undefined,
                  },
                })
              }
              className="text-xs h-8 bg-background font-mono-numbers"
            />
          </div>
        </div>
      )}

      {/* Filter summary status bar */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span>
          Showing <strong className="text-foreground font-mono-numbers">{filteredLessonsCount}</strong> of{" "}
          <strong className="text-foreground font-mono-numbers">{totalLessonsCount}</strong> reflections
        </span>

        {hasActiveFilters && (
          <span className="text-[10px] text-amber-400 font-medium">
            Active filters applied
          </span>
        )}
      </div>
    </div>
  );
}
