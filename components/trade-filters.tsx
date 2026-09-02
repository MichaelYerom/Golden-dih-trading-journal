"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradeFilterCriteria } from "@/lib/data/trades";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ShieldCheck,
  Tag,
  Smile,
  Calendar,
  Layers,
} from "lucide-react";

interface TradeFiltersProps {
  filters: TradeFilterCriteria;
  onFilterChange: (filters: TradeFilterCriteria) => void;
  onResetFilters: () => void;
  distinctSetups: string[];
  distinctSymbols: string[];
  distinctEmotionalStates: string[];
  totalTradesCount: number;
  filteredTradesCount: number;
}

export function TradeFilters({
  filters,
  onFilterChange,
  onResetFilters,
  distinctSetups,
  distinctSymbols,
  distinctEmotionalStates,
  totalTradesCount,
  filteredTradesCount,
}: TradeFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [setupDropdownOpen, setSetupDropdownOpen] = React.useState(false);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = React.useState(false);
  const [emotionDropdownOpen, setEmotionDropdownOpen] = React.useState(false);

  const setupRef = React.useRef<HTMLDivElement>(null);
  const symbolRef = React.useRef<HTMLDivElement>(null);
  const emotionRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (setupRef.current && !setupRef.current.contains(e.target as Node)) {
        setSetupDropdownOpen(false);
      }
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setSymbolDropdownOpen(false);
      }
      if (emotionRef.current && !emotionRef.current.contains(e.target as Node)) {
        setEmotionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.searchText && filters.searchText.trim()) count++;
    if (filters.result && filters.result.length > 0) count++;
    if (filters.setup && filters.setup.length > 0) count += filters.setup.length;
    if (filters.symbol && filters.symbol.length > 0) count += filters.symbol.length;
    if (filters.rulesFollowed !== undefined && filters.rulesFollowed !== null) count++;
    if (filters.emotionalState && filters.emotionalState.length > 0) count += filters.emotionalState.length;
    if (filters.minR !== undefined && filters.minR !== null) count++;
    if (filters.maxR !== undefined && filters.maxR !== null) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  const toggleSetup = (setupName: string) => {
    const current = filters.setup || [];
    const updated = current.includes(setupName)
      ? current.filter((s) => s !== setupName)
      : [...current, setupName];
    onFilterChange({ ...filters, setup: updated.length > 0 ? updated : undefined });
  };

  const toggleSymbol = (sym: string) => {
    const current = filters.symbol || [];
    const updated = current.includes(sym)
      ? current.filter((s) => s !== sym)
      : [...current, sym];
    onFilterChange({ ...filters, symbol: updated.length > 0 ? updated : undefined });
  };

  const toggleEmotionalState = (stateName: string) => {
    const current = filters.emotionalState || [];
    const updated = current.includes(stateName)
      ? current.filter((s) => s !== stateName)
      : [...current, stateName];
    onFilterChange({ ...filters, emotionalState: updated.length > 0 ? updated : undefined });
  };

  const setResultFilter = (resultType: "win" | "loss" | "breakeven" | "all") => {
    if (resultType === "all") {
      onFilterChange({ ...filters, result: undefined });
    } else {
      const current = filters.result || [];
      const updated = current.includes(resultType)
        ? current.filter((r) => r !== resultType)
        : [...current, resultType];
      onFilterChange({ ...filters, result: updated.length > 0 ? updated : undefined });
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      {/* ROW 1: PRIMARY FILTER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filters.searchText || ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                searchText: e.target.value || undefined,
              })
            }
            placeholder="Search notes, symbol, setup..."
            className="pl-8 h-8 text-xs bg-secondary/50 border-border"
          />
          {filters.searchText && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, searchText: undefined })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick buttons & dropdowns */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Result Filter Segmented Buttons */}
          <div className="inline-flex rounded-md border border-border bg-secondary/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, result: undefined })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                !filters.result || filters.result.length === 0
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setResultFilter("win")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filters.result?.includes("win")
                  ? "bg-[#22A06B]/20 text-[#22A06B] font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Wins
            </button>
            <button
              type="button"
              onClick={() => setResultFilter("loss")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filters.result?.includes("loss")
                  ? "bg-[#DB5461]/20 text-[#DB5461] font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Losses
            </button>
            <button
              type="button"
              onClick={() => setResultFilter("breakeven")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filters.result?.includes("breakeven")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              BE
            </button>
          </div>

          {/* Setup Multi-Select Dropdown */}
          {distinctSetups.length > 0 && (
            <div className="relative" ref={setupRef}>
              <button
                type="button"
                onClick={() => setSetupDropdownOpen(!setupDropdownOpen)}
                className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  filters.setup && filters.setup.length > 0
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tag className="h-3 w-3" />
                <span>Setups</span>
                {filters.setup && filters.setup.length > 0 && (
                  <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-1 font-mono-numbers">
                    {filters.setup.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </button>

              {setupDropdownOpen && (
                <div className="absolute left-0 mt-1 w-52 rounded-md border border-border bg-card p-1.5 shadow-xl z-50 text-xs space-y-1">
                  <div className="font-semibold text-[11px] text-muted-foreground uppercase px-2 py-1 border-b border-border">
                    Select Setups
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {distinctSetups.map((setup) => {
                      const isSelected = filters.setup?.includes(setup);
                      return (
                        <div
                          key={setup}
                          onClick={() => toggleSetup(setup)}
                          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer select-none transition-colors ${
                            isSelected
                              ? "bg-primary/15 text-primary font-medium"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span className="truncate">{setup}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Symbol Dropdown */}
          {distinctSymbols.length > 1 && (
            <div className="relative" ref={symbolRef}>
              <button
                type="button"
                onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
                className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  filters.symbol && filters.symbol.length > 0
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Symbol</span>
                {filters.symbol && filters.symbol.length > 0 && (
                  <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-1 font-mono-numbers">
                    {filters.symbol.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </button>

              {symbolDropdownOpen && (
                <div className="absolute left-0 mt-1 w-44 rounded-md border border-border bg-card p-1.5 shadow-xl z-50 text-xs space-y-1">
                  <div className="font-semibold text-[11px] text-muted-foreground uppercase px-2 py-1 border-b border-border">
                    Select Symbols
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {distinctSymbols.map((sym) => {
                      const isSelected = filters.symbol?.includes(sym);
                      return (
                        <div
                          key={sym}
                          onClick={() => toggleSymbol(sym)}
                          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer select-none transition-colors ${
                            isSelected
                              ? "bg-primary/15 text-primary font-medium"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span className="font-mono-numbers uppercase">{sym}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rules Followed Filter */}
          <div className="inline-flex rounded-md border border-border bg-secondary/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, rulesFollowed: null })}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filters.rulesFollowed === null || filters.rulesFollowed === undefined
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rules: All
            </button>
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  rulesFollowed: filters.rulesFollowed === true ? null : true,
                })
              }
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filters.rulesFollowed === true
                  ? "bg-[#22A06B]/20 text-[#22A06B] font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Followed
            </button>
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  rulesFollowed: filters.rulesFollowed === false ? null : false,
                })
              }
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filters.rulesFollowed === false
                  ? "bg-[#DB5461]/20 text-[#DB5461] font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Broken
            </button>
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isAdvancedOpen ||
              filters.minR !== undefined ||
              filters.maxR !== undefined ||
              filters.dateRange?.start ||
              filters.dateRange?.end ||
              (filters.emotionalState && filters.emotionalState.length > 0)
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>More</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Reset Filters Button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-8 px-2 rounded-md border border-border bg-secondary/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: ADVANCED EXPANDABLE FILTERS TRAY */}
      {isAdvancedOpen && (
        <div className="pt-2.5 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* R-Multiple Range */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              R-Multiple Range
            </label>
            <div className="flex items-center gap-1.5 font-mono-numbers">
              <Input
                type="number"
                step="any"
                placeholder="Min R (e.g. 1)"
                value={filters.minR !== undefined && filters.minR !== null ? filters.minR : ""}
                onChange={(e) => {
                  const val = e.target.value !== "" ? parseFloat(e.target.value) : undefined;
                  onFilterChange({ ...filters, minR: val });
                }}
                className="h-7 text-xs font-mono-numbers"
              />
              <span className="text-muted-foreground">&rarr;</span>
              <Input
                type="number"
                step="any"
                placeholder="Max R (e.g. 3)"
                value={filters.maxR !== undefined && filters.maxR !== null ? filters.maxR : ""}
                onChange={(e) => {
                  const val = e.target.value !== "" ? parseFloat(e.target.value) : undefined;
                  onFilterChange({ ...filters, maxR: val });
                }}
                className="h-7 text-xs font-mono-numbers"
              />
            </div>
          </div>

          {/* Date Range Picker */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Date Range
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={
                  filters.dateRange?.start
                    ? new Date(filters.dateRange.start).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) => {
                  const start = e.target.value ? e.target.value : undefined;
                  onFilterChange({
                    ...filters,
                    dateRange: {
                      start,
                      end: filters.dateRange?.end,
                    },
                  });
                }}
                className="h-7 text-[11px] font-mono-numbers"
              />
              <span className="text-muted-foreground">&rarr;</span>
              <Input
                type="date"
                value={
                  filters.dateRange?.end
                    ? new Date(filters.dateRange.end).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) => {
                  const end = e.target.value ? e.target.value : undefined;
                  onFilterChange({
                    ...filters,
                    dateRange: {
                      start: filters.dateRange?.start,
                      end,
                    },
                  });
                }}
                className="h-7 text-[11px] font-mono-numbers"
              />
            </div>
          </div>

          {/* Emotional State Filter */}
          {distinctEmotionalStates.length > 0 ? (
            <div className="relative" ref={emotionRef}>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Emotional State
              </label>
              <button
                type="button"
                onClick={() => setEmotionDropdownOpen(!emotionDropdownOpen)}
                className="h-7 px-2.5 w-full rounded-md border border-border bg-secondary/40 text-xs font-medium flex items-center justify-between text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Smile className="h-3 w-3" />
                  <span>
                    {filters.emotionalState && filters.emotionalState.length > 0
                      ? `${filters.emotionalState.length} selected`
                      : "Filter by emotion..."}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {emotionDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-card p-1.5 shadow-xl z-50 text-xs space-y-0.5">
                  {distinctEmotionalStates.map((state) => {
                    const isSelected = filters.emotionalState?.includes(state);
                    return (
                      <div
                        key={state}
                        onClick={() => toggleEmotionalState(state)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer select-none transition-colors ${
                          isSelected
                            ? "bg-primary/15 text-primary font-medium"
                            : "hover:bg-secondary text-foreground"
                        }`}
                      >
                        <span className="truncate">{state}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* ROW 3: ACTIVE FILTER PILLS & COUNT STATUS */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-foreground font-mono-numbers font-medium">
            Showing <strong className="text-foreground">{filteredTradesCount}</strong> of{" "}
            <strong className="text-foreground">{totalTradesCount}</strong> trades
          </span>

          {/* Active filter badges */}
          {filters.searchText && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-secondary text-foreground border border-border">
              Search: &ldquo;{filters.searchText}&rdquo;
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, searchText: undefined })}
                className="hover:text-primary"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}

          {filters.result?.map((r) => (
            <span
              key={r}
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-medium border ${
                r === "win"
                  ? "bg-[#22A06B]/10 border-[#22A06B]/30 text-[#22A06B]"
                  : r === "loss"
                  ? "bg-[#DB5461]/10 border-[#DB5461]/30 text-[#DB5461]"
                  : "bg-secondary border-border text-foreground"
              }`}
            >
              {r.toUpperCase()}
              <button
                type="button"
                onClick={() => setResultFilter(r)}
                className="hover:opacity-75"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {filters.setup?.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary/10 border border-primary/25 text-primary"
            >
              Setup: {s}
              <button
                type="button"
                onClick={() => toggleSetup(s)}
                className="hover:opacity-75"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {filters.symbol?.map((sym) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-secondary border border-border text-foreground font-mono-numbers"
            >
              {sym}
              <button
                type="button"
                onClick={() => toggleSymbol(sym)}
                className="hover:opacity-75"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {filters.rulesFollowed === true && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#22A06B]/10 border border-[#22A06B]/30 text-[#22A06B]">
              Rules Followed
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, rulesFollowed: null })}
                className="hover:opacity-75"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}

          {filters.rulesFollowed === false && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#DB5461]/10 border border-[#DB5461]/30 text-[#DB5461]">
              Rules Broken
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, rulesFollowed: null })}
                className="hover:opacity-75"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}

          {filters.minR !== undefined && filters.minR !== null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-secondary border border-border text-foreground font-mono-numbers">
              Min R: &ge;{filters.minR}R
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, minR: undefined })}
                className="hover:text-primary"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}

          {filters.maxR !== undefined && filters.maxR !== null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-secondary border border-border text-foreground font-mono-numbers">
              Max R: &le;{filters.maxR}R
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, maxR: undefined })}
                className="hover:text-primary"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] text-primary hover:underline flex-shrink-0"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
