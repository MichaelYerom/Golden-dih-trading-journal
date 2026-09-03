"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import {
  CalendarAnalyticsResult,
  DailyPnLRecord,
  TradeEntity,
  RuleEntity,
  calculateWeeklyPnL,
  WeeklyPnLRecord,
} from "@/lib/data/trade-analytics";
import { formatCurrency, formatPrice } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  ArrowRight,
  Pencil,
  Plus,
  Settings,
  Info,
  Calendar as CalendarIcon,
  Check,
  X,
} from "lucide-react";
import { StrategyEntity } from "@/lib/data/strategies";
import { ConfluenceEntity } from "@/lib/data/confluences";

interface CalendarHeatmapViewProps {
  calendarAnalytics: CalendarAnalyticsResult;
  trades?: TradeEntity[];
  sessionId?: string;
  sessionPeriodStart?: Date;
  sessionPeriodEnd?: Date;
  rules?: RuleEntity[];
  strategies?: StrategyEntity[];
  confluences?: ConfluenceEntity[];
  defaultSymbol?: string;
  onSelectDate?: (dateString: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Compact currency formatter matching the reference screenshot:
// $1.05K, -$638, $5.13K, $556, -$37.5, $0
function formatCompactCurrency(val: number): string {
  if (val === 0 || Math.abs(val) < 0.001) return "$0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";

  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(2).replace(/\.?0+$/, "");
    return `${sign}$${k}K`;
  }
  if (abs >= 100) {
    return `${sign}$${abs.toFixed(0)}`;
  }
  return `${sign}$${abs.toFixed(abs % 1 === 0 ? 0 : 1)}`;
}

export function CalendarHeatmapView({
  calendarAnalytics,
  trades = [],
  sessionId,
  sessionPeriodStart,
  sessionPeriodEnd,
  rules = [],
  strategies = [],
  confluences = [],
  defaultSymbol,
  onSelectDate,
}: CalendarHeatmapViewProps) {
  const { dailyPnLMap, availableMonths, defaultMonthKey } = calendarAnalytics;

  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string>(defaultMonthKey);

  // Modal states for Day Trades popup and Edit Trade Drawer
  const [selectedDayDate, setSelectedDayDate] = React.useState<string | null>(null);
  const [editingTrade, setEditingTrade] = React.useState<TradeEntity | null>(null);

  // Parse currently selected year & month
  const [selectedYear, selectedMonth] = React.useMemo(() => {
    const parts = selectedMonthKey.split("-");
    const y = parseInt(parts[0], 10) || new Date().getFullYear();
    const m = parseInt(parts[1], 10) || new Date().getMonth() + 1;
    return [y, m];
  }, [selectedMonthKey]);

  const monthLabel = React.useMemo(() => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(d);
  }, [selectedYear, selectedMonth]);

  // Navigate months strictly within availableMonths
  const currentMonthIdx = availableMonths.findIndex((m) => m.key === selectedMonthKey);
  const hasPrevMonth = currentMonthIdx > 0;
  const hasNextMonth = currentMonthIdx >= 0 && currentMonthIdx < availableMonths.length - 1;

  const handlePrevMonth = () => {
    if (hasPrevMonth) {
      setSelectedMonthKey(availableMonths[currentMonthIdx - 1].key);
    }
  };

  const handleNextMonth = () => {
    if (hasNextMonth) {
      setSelectedMonthKey(availableMonths[currentMonthIdx + 1].key);
    }
  };

  // Quick jump to "This month"
  const handleJumpToCurrentMonth = () => {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    const exactMatch = availableMonths.find((m) => m.key === nowKey);
    if (exactMatch) {
      setSelectedMonthKey(exactMatch.key);
    } else if (availableMonths.length > 0) {
      setSelectedMonthKey(availableMonths[availableMonths.length - 1].key);
    }
  };

  // Build calendar grid weeks (Sunday-first, Sun to Sat)
  const { weeks, weeklyRecords, monthTotalPnl, monthDaysTraded } = React.useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const totalDaysInPrevMonth = new Date(selectedYear, selectedMonth - 1, 0).getDate();

    // Sunday-first starting index (0=Sun, 1=Mon, ..., 6=Sat)
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const totalCells = Math.ceil((startingDayOfWeek + totalDaysInMonth) / 7) * 7;
    const numWeeks = totalCells / 7;

    const allCells: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateString: string;
      record?: DailyPnLRecord;
    }> = [];

    // 1. Leading days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = totalDaysInPrevMonth - i;
      const prevMonthNum = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYearNum = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const dateStr = `${prevYearNum}-${prevMonthNum.toString().padStart(2, "0")}-${prevDay
        .toString()
        .padStart(2, "0")}`;
      allCells.push({
        dayNumber: prevDay,
        isCurrentMonth: false,
        dateString: dateStr,
        record: dailyPnLMap[dateStr],
      });
    }

    // 2. Days of current month
    let monthPnl = 0;
    let monthDays = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const rec = dailyPnLMap[dateStr];
      if (rec && rec.tradeCount > 0) {
        monthPnl += rec.totalPnl;
        monthDays++;
      }
      allCells.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateString: dateStr,
        record: rec,
      });
    }

    // 3. Trailing days for next month
    const remainingCells = totalCells - allCells.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthNum = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextYearNum = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const dateStr = `${nextYearNum}-${nextMonthNum.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      allCells.push({
        dayNumber: day,
        isCurrentMonth: false,
        dateString: dateStr,
        record: dailyPnLMap[dateStr],
      });
    }

    // Slice cells into weeks (7 days per week)
    const weekRows: Array<typeof allCells> = [];
    for (let w = 0; w < numWeeks; w++) {
      weekRows.push(allCells.slice(w * 7, (w + 1) * 7));
    }

    // Calculate weekly summary records
    const weeklyData = calculateWeeklyPnL(trades, selectedYear, selectedMonth);

    return {
      weeks: weekRows,
      weeklyRecords: weeklyData,
      monthTotalPnl: Math.round(monthPnl * 100) / 100,
      monthDaysTraded: monthDays,
    };
  }, [selectedYear, selectedMonth, dailyPnLMap, trades]);

  // Day trades for the currently opened day modal
  const dayTrades = React.useMemo(() => {
    if (!selectedDayDate || !trades) return [];
    return trades.filter((t) => {
      if (!t.entryAt) return false;
      const dStr = format(new Date(t.entryAt), "yyyy-MM-dd");
      return dStr === selectedDayDate;
    });
  }, [selectedDayDate, trades]);

  const selectedRecord = selectedDayDate ? dailyPnLMap[selectedDayDate] : null;

  const handleCellClick = (cellDate: string, hasTrades: boolean) => {
    if (!hasTrades) return;
    setSelectedDayDate(cellDate);
  };

  const handleSelectTradeToEdit = (trade: TradeEntity) => {
    setSelectedDayDate(null);
    setEditingTrade(trade);
  };

  return (
    <div className="space-y-4">
      {/* 1. CALENDAR CONTAINER CARD */}
      <div className="rounded-2xl border border-border bg-[#101114] p-4 sm:p-5 shadow-2xl space-y-4">
        {/* HEADER ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
          {/* Left: Prev/Next Month + Month Label + 'This month' quick button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!hasPrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-20 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm sm:text-base font-bold text-foreground min-w-[120px] text-center">
              {monthLabel}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!hasNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-20 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleJumpToCurrentMonth}
              className="ml-2 px-3 py-1 rounded-full text-xs font-medium border border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              This month
            </button>
          </div>

          {/* Right: Monthly stats summary pills + Display settings */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Monthly stats:</span>

            {/* Total Month P&L Pill */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono-numbers border ${
                monthTotalPnl > 0
                  ? "bg-[#0e3020] text-[#22A06B] border-[#22A06B]/30"
                  : monthTotalPnl < 0
                  ? "bg-[#331317] text-[#DB5461] border-[#DB5461]/30"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {monthTotalPnl > 0 ? `+${formatCompactCurrency(monthTotalPnl)}` : formatCompactCurrency(monthTotalPnl)}
            </div>

            {/* Total Month Days Traded Pill */}
            <div className="px-3 py-1 rounded-full text-xs font-semibold font-mono-numbers bg-[#312E81]/50 text-[#A5B4FC] border border-[#6366F1]/30">
              {monthDaysTraded} {monthDaysTraded === 1 ? "day" : "days"}
            </div>

            <div className="flex items-center gap-1 ml-1 text-muted-foreground">
              <button
                type="button"
                className="p-1 rounded hover:text-foreground transition-colors"
                title="Calendar display"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="p-1 rounded hover:text-foreground transition-colors"
                title="Monthly Performance Heatmap"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. CALENDAR GRID WITH 7 DAY COLUMNS + 1 WEEKLY SIDEBAR COLUMN */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[760px] space-y-2">
            {/* COLUMN HEADERS */}
            <div className="grid grid-cols-8 gap-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="bg-[#18191E] border border-border/50 text-center py-2 text-xs font-semibold text-muted-foreground rounded-lg select-none"
                >
                  {day}
                </div>
              ))}
              {/* 8th column header for Weekly summary */}
              <div className="text-center py-2 text-xs font-semibold text-muted-foreground/60 select-none">
                {/* Empty header for alignment */}
              </div>
            </div>

            {/* WEEK ROWS */}
            <div className="space-y-2">
              {weeks.map((weekCells, weekIdx) => {
                const weekRec = weeklyRecords[weekIdx] || {
                  weekIndex: weekIdx + 1,
                  totalPnl: 0,
                  daysTraded: 0,
                  isProfit: false,
                  isLoss: false,
                };

                return (
                  <div key={`week-row-${weekIdx}`} className="grid grid-cols-8 gap-2">
                    {/* 7 DAY CELLS */}
                    {weekCells.map((cell, cellIdx) => {
                      const hasTrades = Boolean(cell.record && cell.record.tradeCount > 0);
                      const rec = cell.record;

                      if (!cell.isCurrentMonth) {
                        // Leading/trailing adjacent month cell
                        return (
                          <div
                            key={`adjacent-${cell.dateString}-${cellIdx}`}
                            className="bg-[#121316]/30 border border-border/20 rounded-xl min-h-[96px] p-2 flex flex-col justify-between opacity-20 pointer-events-none select-none"
                          >
                            <div className="text-right text-xs font-mono-numbers text-muted-foreground">
                              {cell.dayNumber}
                            </div>
                          </div>
                        );
                      }

                      if (!hasTrades || !rec) {
                        // Current month, NO trades cell
                        return (
                          <div
                            key={cell.dateString}
                            className="bg-[#141519] border border-border/40 rounded-xl min-h-[96px] p-2 flex flex-col justify-between select-none"
                          >
                            <div className="flex items-center justify-between">
                              <span />
                              <span className="text-xs font-mono-numbers text-muted-foreground/60 font-medium">
                                {cell.dayNumber}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Current month WITH trades cell (Flat color block matching reference)
                      const isProfit = rec.totalPnl > 0;
                      const isLoss = rec.totalPnl < 0;

                      return (
                        <div
                          key={cell.dateString}
                          onClick={() => handleCellClick(cell.dateString, true)}
                          className={`rounded-xl min-h-[96px] p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-lg ${
                            isProfit
                              ? "bg-[#0e3020] border border-[#22A06B]/50 hover:border-[#22A06B] text-white hover:shadow-[#22A06B]/15"
                              : isLoss
                              ? "bg-[#331317] border border-[#DB5461]/50 hover:border-[#DB5461] text-white hover:shadow-[#DB5461]/15"
                              : "bg-[#1E2028] border border-border/80 hover:border-foreground/40 text-white"
                          }`}
                          title={`Click to view ${rec.tradeCount} trade${rec.tradeCount > 1 ? "s" : ""} on ${cell.dateString}`}
                        >
                          {/* Top row: Small file/doc icon + Day number */}
                          <div className="flex items-center justify-between">
                            <FileText className="h-3 w-3 opacity-70" />
                            <span className="text-xs font-mono-numbers font-semibold opacity-90">
                              {cell.dayNumber}
                            </span>
                          </div>

                          {/* Center content: Large bold P&L, trade count, win rate */}
                          <div className="text-center my-auto py-1">
                            <div className="text-xs sm:text-sm font-bold font-mono-numbers tracking-tight">
                              {isProfit
                                ? formatCompactCurrency(rec.totalPnl)
                                : isLoss
                                ? formatCompactCurrency(rec.totalPnl)
                                : "$0"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium opacity-80 leading-tight mt-0.5">
                              {rec.tradeCount} {rec.tradeCount === 1 ? "trade" : "trades"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono-numbers opacity-80 leading-tight">
                              {rec.winRate !== null ? `${rec.winRate.toFixed(1)}%` : "—"}
                            </div>
                          </div>

                          {/* Bottom spacer for balance */}
                          <div className="h-1" />
                        </div>
                      );
                    })}

                    {/* 8TH COLUMN: WEEKLY SUMMARY CARD */}
                    <div className="bg-[#18191E] border border-border/50 rounded-xl min-h-[96px] p-2.5 flex flex-col justify-between text-left select-none">
                      <div className="text-[11px] font-medium text-muted-foreground">
                        Week {weekRec.weekIndex}
                      </div>

                      <div className="my-auto py-0.5">
                        <div
                          className={`text-xs sm:text-sm font-bold font-mono-numbers ${
                            weekRec.isProfit
                              ? "text-[#22A06B]"
                              : weekRec.isLoss
                              ? "text-[#DB5461]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {weekRec.isProfit
                            ? formatCompactCurrency(weekRec.totalPnl)
                            : weekRec.isLoss
                            ? formatCompactCurrency(weekRec.totalPnl)
                            : "$0"}
                        </div>
                      </div>

                      <div
                        className={`text-[10px] font-medium ${
                          weekRec.daysTraded > 0 ? "text-[#818CF8]" : "text-muted-foreground/60"
                        }`}
                      >
                        {weekRec.daysTraded} {weekRec.daysTraded === 1 ? "day" : "days"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CLICK-TO-VIEW DAY TRADES MODAL */}
      <Dialog
        open={Boolean(selectedDayDate)}
        onOpenChange={(open) => {
          if (!open) setSelectedDayDate(null);
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>
                Trades for{" "}
                {selectedDayDate ? format(new Date(selectedDayDate + "T12:00:00"), "MMMM d, yyyy") : ""}
              </span>
            </div>

            {selectedRecord && (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`font-mono-numbers text-xs font-semibold ${
                    selectedRecord.totalPnl > 0
                      ? "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/30"
                      : selectedRecord.totalPnl < 0
                      ? "bg-[#DB5461]/10 text-[#DB5461] border-[#DB5461]/30"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {selectedRecord.totalPnl > 0 ? `+${formatCurrency(selectedRecord.totalPnl)}` : formatCurrency(selectedRecord.totalPnl)}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono-numbers">
                  {selectedRecord.winCount}W &bull; {selectedRecord.lossCount}L &bull; {selectedRecord.breakevenCount}BE (
                  {selectedRecord.winRate !== null ? `${selectedRecord.winRate.toFixed(0)}%` : "0%"} WR)
                </Badge>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Click any trade row below to open and edit its parameters in the Trade Drawer.
          </DialogDescription>
        </DialogHeader>

        {/* DAY TRADES LIST */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {dayTrades.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary text-[10px] uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Symbol</th>
                    <th className="px-3 py-2">Direction</th>
                    <th className="px-3 py-2 text-right">Entry &rarr; Exit</th>
                    <th className="px-3 py-2 text-right">Gross P&amp;L</th>
                    <th className="px-3 py-2 text-right">R-Mult</th>
                    <th className="px-3 py-2 text-center">Result</th>
                    <th className="px-3 py-2">Setup</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dayTrades.map((t) => {
                    const isWin = t.grossPnl > 0;
                    const isLoss = t.grossPnl < 0;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleSelectTradeToEdit(t)}
                        className="hover:bg-secondary/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-3 py-2 font-mono-numbers text-muted-foreground whitespace-nowrap">
                          {format(new Date(t.entryAt), "HH:mm")} &rarr;{" "}
                          {format(new Date(t.exitAt), "HH:mm")}
                        </td>

                        <td className="px-3 py-2 font-bold font-mono-numbers text-foreground uppercase">
                          {t.symbol}
                        </td>

                        <td className="px-3 py-2">
                          {t.outcomeType === "missed_entry" ? (
                            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                              MISSED
                            </span>
                          ) : t.outcomeType === "no_trade" ? (
                            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400">
                              NO TRADE
                            </span>
                          ) : t.direction === "long" ? (
                            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-[#22A06B]/15 text-[#22A06B]">
                              LONG
                            </span>
                          ) : t.direction === "short" ? (
                            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-[#DB5461]/15 text-[#DB5461]">
                              SHORT
                            </span>
                          ) : (
                            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                              TRADE
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2 text-right font-mono-numbers text-muted-foreground whitespace-nowrap">
                          {t.entryPrice !== null && t.exitPrice !== null
                            ? `${formatPrice(t.entryPrice)} \u2192 ${formatPrice(t.exitPrice)}`
                            : t.riskAmount !== null
                            ? formatCurrency(t.riskAmount)
                            : "—"}
                        </td>

                        <td
                          className={`px-3 py-2 text-right font-mono-numbers font-bold whitespace-nowrap ${
                            isWin ? "text-[#22A06B]" : isLoss ? "text-[#DB5461]" : "text-muted-foreground"
                          }`}
                        >
                          {isWin ? `+${formatCurrency(t.grossPnl)}` : formatCurrency(t.grossPnl)}
                        </td>

                        <td
                          className={`px-3 py-2 text-right font-mono-numbers font-medium ${
                            t.rMultiple !== null && t.rMultiple > 0
                              ? "text-[#22A06B]"
                              : t.rMultiple !== null && t.rMultiple < 0
                              ? "text-[#DB5461]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {t.rMultiple !== null ? `${t.rMultiple > 0 ? "+" : ""}${t.rMultiple.toFixed(1)}R` : "—"}
                        </td>

                        <td className="px-3 py-2 text-center">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                              t.result === "win"
                                ? "bg-[#22A06B]/10 text-[#22A06B] border border-[#22A06B]/25"
                                : t.result === "loss"
                                ? "bg-[#DB5461]/10 text-[#DB5461] border border-[#DB5461]/25"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {t.result}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">
                          {t.setupModel || "—"}
                        </td>

                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTradeToEdit(t);
                            }}
                            className="h-6 px-2 text-xs gap-1 text-primary group-hover:bg-primary/10"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No trades recorded for this date.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedDayDate(null)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 4. EDIT TRADE DRAWER INTEGRATION */}
      {editingTrade && sessionId && (
        <AddTradeDrawer
          sessionId={sessionId}
          defaultSymbol={defaultSymbol || editingTrade.symbol}
          defaultDate={sessionPeriodStart?.toISOString()}
          sessionPeriodStart={sessionPeriodStart}
          sessionPeriodEnd={sessionPeriodEnd}
          sessionRules={rules}
          strategies={strategies}
          confluences={confluences}
          tradeToEdit={editingTrade}
          open={Boolean(editingTrade)}
          onOpenChange={(open) => {
            if (!open) setEditingTrade(null);
          }}
        />
      )}
    </div>
  );
}
