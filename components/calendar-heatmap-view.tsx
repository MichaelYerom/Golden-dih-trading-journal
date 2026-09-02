"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  CalendarAnalyticsResult,
  DailyPnLRecord,
} from "@/lib/data/trades";
import { formatCurrency, formatCurrencyNeutral, formatPercent } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  ArrowRight,
  Info,
} from "lucide-react";

interface CalendarHeatmapViewProps {
  calendarAnalytics: CalendarAnalyticsResult;
  onSelectDate: (dateString: string) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarHeatmapView({
  calendarAnalytics,
  onSelectDate,
}: CalendarHeatmapViewProps) {
  const { dailyPnLMap, dayStreaks, availableMonths, defaultMonthKey } =
    calendarAnalytics;

  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string>(defaultMonthKey);
  const [hoveredRecord, setHoveredRecord] = React.useState<DailyPnLRecord | null>(null);

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

  // Build calendar grid days (Monday-first)
  const calendarCells = React.useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const totalDaysInPrevMonth = new Date(selectedYear, selectedMonth - 1, 0).getDate();

    // Monday-first starting index: 0=Mon, 1=Tue, ..., 6=Sun
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateString: string;
      record?: DailyPnLRecord;
    }> = [];

    // 1. Leading days from previous month
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const prevDay = totalDaysInPrevMonth - i;
      const prevMonthNum = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYearNum = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const dateStr = `${prevYearNum}-${prevMonthNum.toString().padStart(2, "0")}-${prevDay
        .toString()
        .padStart(2, "0")}`;
      cells.push({
        dayNumber: prevDay,
        isCurrentMonth: false,
        dateString: dateStr,
        record: dailyPnLMap[dateStr],
      });
    }

    // 2. Days of the current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      cells.push({
        dayNumber: day,
        isCurrentMonth: true,
        dateString: dateStr,
        record: dailyPnLMap[dateStr],
      });
    }

    // 3. Trailing days from next month to complete the week (total multiple of 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const nextMonthNum = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextYearNum = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const dateStr = `${nextYearNum}-${nextMonthNum.toString().padStart(2, "0")}-${nextDay
        .toString()
        .padStart(2, "0")}`;
      cells.push({
        dayNumber: nextDay,
        isCurrentMonth: false,
        dateString: dateStr,
        record: dailyPnLMap[dateStr],
      });
      nextDay++;
    }

    return cells;
  }, [selectedYear, selectedMonth, dailyPnLMap]);

  // Compute monthly stats for current view
  const currentMonthStats = React.useMemo(() => {
    let monthlyPnl = 0;
    let monthlyTrades = 0;
    let greenDays = 0;
    let redDays = 0;
    let beDays = 0;

    for (const cell of calendarCells) {
      if (cell.isCurrentMonth && cell.record) {
        monthlyPnl += cell.record.totalPnl;
        monthlyTrades += cell.record.tradeCount;
        if (cell.record.isProfit) greenDays++;
        else if (cell.record.isLoss) redDays++;
        else beDays++;
      }
    }

    return {
      monthlyPnl: Math.round(monthlyPnl * 100) / 100,
      monthlyTrades,
      greenDays,
      redDays,
      beDays,
      totalActiveDays: greenDays + redDays + beDays,
    };
  }, [calendarCells]);

  return (
    <div className="space-y-4">
      {/* 1. TOP STREAK & SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Current Day Streak */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Day Streak</span>
              <Flame className="h-3.5 w-3.5 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div
              className={`text-xl font-semibold font-mono-numbers ${
                dayStreaks.currentDayStreak > 0
                  ? "text-[#22A06B]"
                  : dayStreaks.currentDayStreak < 0
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {dayStreaks.currentDayStreak > 0
                ? `${dayStreaks.currentDayStreak} Green Days`
                : dayStreaks.currentDayStreak < 0
                ? `${Math.abs(dayStreaks.currentDayStreak)} Red Days`
                : "0 Days (Neutral)"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
              Best: {dayStreaks.longestGreenDayStreak}G | Worst: {dayStreaks.longestRedDayStreak}R
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Day Win Rate */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Day Win Rate</span>
              <Activity className="h-3.5 w-3.5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-semibold font-mono-numbers text-foreground">
              {dayStreaks.dayWinRate !== null ? formatPercent(dayStreaks.dayWinRate) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
              {dayStreaks.profitableDaysCount} Green / {dayStreaks.losingDaysCount} Red
              {dayStreaks.breakevenDaysCount > 0 ? ` / ${dayStreaks.breakevenDaysCount} BE` : ""}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Best Trading Day */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Best Trading Day</span>
              <Award className="h-3.5 w-3.5 text-[#22A06B]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-semibold font-mono-numbers text-[#22A06B] truncate">
              {dayStreaks.bestDay ? `+${formatCurrency(dayStreaks.bestDay.pnl)}` : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
              {dayStreaks.bestDay ? `on ${dayStreaks.bestDay.date}` : "No trade days"}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Avg Daily Return */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Avg Daily P&L</span>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div
              className={`text-xl font-semibold font-mono-numbers ${
                dayStreaks.avgDailyPnl !== null && dayStreaks.avgDailyPnl > 0
                  ? "text-[#22A06B]"
                  : dayStreaks.avgDailyPnl !== null && dayStreaks.avgDailyPnl < 0
                  ? "text-[#DB5461]"
                  : "text-foreground"
              }`}
            >
              {dayStreaks.avgDailyPnl !== null ? formatCurrency(dayStreaks.avgDailyPnl) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono-numbers truncate">
              Across {dayStreaks.totalTradingDays} active trading days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. CALENDAR HEATMAP CONTAINER */}
      <Card className="border border-border bg-card">
        {/* Month Navigation Header */}
        <CardHeader className="p-4 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Daily P&L Calendar
              </h2>
              <Badge variant="outline" className="text-[11px] font-mono-numbers">
                {monthLabel}
              </Badge>
            </div>

            {/* Controls: Prev / Next / Quick Select */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-border bg-secondary/30 p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={!hasPrevMonth}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="Previous month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={!hasNextMonth}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="Next month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {availableMonths.length > 1 && (
                <div className="w-[160px]">
                  <Select
                    value={selectedMonthKey}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="h-7 text-xs bg-card"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-3 space-y-3">
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1 border-b border-border/60">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const { dayNumber, isCurrentMonth, dateString, record } = cell;

              if (!isCurrentMonth) {
                return (
                  <div
                    key={`${dateString}-${idx}`}
                    className="min-h-[72px] sm:min-h-[82px] rounded-md border border-border/25 bg-secondary/10 p-1.5 opacity-30 select-none flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-mono-numbers text-muted-foreground">
                      {dayNumber}
                    </span>
                  </div>
                );
              }

              if (!record) {
                return (
                  <div
                    key={dateString}
                    className="min-h-[72px] sm:min-h-[82px] rounded-md border border-border/40 bg-card/60 p-1.5 flex flex-col justify-between transition-colors hover:border-border"
                  >
                    <span className="text-[10px] font-mono-numbers text-muted-foreground">
                      {dayNumber}
                    </span>
                    <div className="text-center text-[10px] text-muted-foreground/40 font-mono-numbers py-2">
                      —
                    </div>
                  </div>
                );
              }

              // Populated Trading Day
              const isProfit = record.isProfit;
              const isLoss = record.isLoss;
              const absPnl = Math.abs(record.totalPnl);

              return (
                <div
                  key={dateString}
                  onClick={() => onSelectDate(dateString)}
                  onMouseEnter={() => setHoveredRecord(record)}
                  onMouseLeave={() => setHoveredRecord(null)}
                  className={`min-h-[72px] sm:min-h-[82px] rounded-md border p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md ${
                    isProfit
                      ? "bg-[#22A06B]/15 border-[#22A06B]/40 hover:bg-[#22A06B]/25 hover:border-[#22A06B]/60"
                      : isLoss
                      ? "bg-[#DB5461]/15 border-[#DB5461]/40 hover:bg-[#DB5461]/25 hover:border-[#DB5461]/60"
                      : "bg-secondary border-border hover:bg-secondary/80"
                  }`}
                  title={`${dateString} | P&L: ${formatCurrency(record.totalPnl)} | ${record.tradeCount} trades (${record.winCount}W/${record.lossCount}L) | Click to filter trades`}
                >
                  {/* Top Bar: Day Number & Trades Count */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold font-mono-numbers ${
                        isProfit
                          ? "text-[#22A06B]"
                          : isLoss
                          ? "text-[#DB5461]"
                          : "text-foreground"
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono-numbers font-medium ${
                        isProfit
                          ? "bg-[#22A06B]/20 text-[#22A06B]"
                          : isLoss
                          ? "bg-[#DB5461]/20 text-[#DB5461]"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {record.tradeCount} tr
                    </span>
                  </div>

                  {/* Center: Daily P&L Figure */}
                  <div className="my-auto text-center">
                    <div
                      className={`text-xs sm:text-sm font-bold font-mono-numbers leading-tight truncate ${
                        isProfit
                          ? "text-[#22A06B]"
                          : isLoss
                          ? "text-[#DB5461]"
                          : "text-foreground"
                      }`}
                    >
                      {isProfit
                        ? `+${formatCurrency(record.totalPnl)}`
                        : isLoss
                        ? `-${formatCurrency(absPnl)}`
                        : "$0"}
                    </div>
                  </div>

                  {/* Bottom: Win Rate % or R-multiple */}
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono-numbers">
                    <span>
                      {record.winRate !== null ? `${record.winRate.toFixed(0)}% WR` : "—"}
                    </span>
                    {record.avgR !== null && (
                      <span
                        className={
                          record.avgR > 0
                            ? "text-[#22A06B] font-semibold"
                            : record.avgR < 0
                            ? "text-[#DB5461] font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {record.avgR > 0 ? `+${record.avgR}R` : `${record.avgR}R`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. MONTH SUMMARY RIBBON & HOVER DETAILS */}
          <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground font-mono-numbers flex-wrap">
              <span>
                Month Net:{" "}
                <strong
                  className={
                    currentMonthStats.monthlyPnl > 0
                      ? "text-[#22A06B]"
                      : currentMonthStats.monthlyPnl < 0
                      ? "text-[#DB5461]"
                      : "text-foreground"
                  }
                >
                  {formatCurrency(currentMonthStats.monthlyPnl)}
                </strong>
              </span>
              <span>
                Active Days:{" "}
                <strong className="text-foreground">
                  {currentMonthStats.totalActiveDays}
                </strong>{" "}
                ({currentMonthStats.greenDays}G / {currentMonthStats.redDays}R)
              </span>
              <span>
                Total Trades:{" "}
                <strong className="text-foreground">
                  {currentMonthStats.monthlyTrades}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Click any trading day cell to view and filter matching trades.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
