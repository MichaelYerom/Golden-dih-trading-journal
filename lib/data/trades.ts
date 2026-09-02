import { prisma } from "@/lib/prisma";

export interface RuleEntity {
  id: string;
  sessionId: string;
  text: string;
  createdAt: Date;
}

export interface TradeRuleCheckEntity {
  id: string;
  tradeId: string;
  ruleId: string;
  followed: boolean;
  rule?: {
    id: string;
    text: string;
  };
}

export interface TradeImageEntity {
  id: string;
  tradeId: string;
  url: string;
  label: string | null;
  createdAt: Date;
}

export interface TradeEntity {
  id: string;
  sessionId: string;
  symbol: string;
  direction: string;
  entryAt: Date;
  exitAt: Date;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number | null;
  rMultiple: number | null;
  grossPnl: number;
  result: string;
  notes: string | null;
  createdAt: Date;
  htfBias: string | null;
  newsToday: string | null;
  riskPercent: number | null;
  drawDirection: string | null;
  setupModel: string | null;
  emotionalState: string | null;
  rulesFollowed: boolean | null;
  rr: string | null;
  ruleChecks?: TradeRuleCheckEntity[];
  images?: TradeImageEntity[];
}

export interface EquityPoint {
  index: number;
  date: string;
  rawDate: Date;
  balance: number;
  pnl: number;
  tradePnl: number;
  symbol?: string;
  direction?: string;
  result?: string;
  label: string;
}

export interface RBucket {
  bucket: string;
  count: number;
  type: "loss" | "win" | "neutral";
}

export interface DrawdownResult {
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  maxDrawdownStart: EquityPoint | null;
  maxDrawdownEnd: EquityPoint | null;
  recoveryTradeCount: number | null;
  recoveryDate: string | null;
}

export interface StreakResult {
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

export interface RulePerformanceStats {
  count: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  expectancy: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
}

export interface PerRuleBreakdown {
  ruleId: string;
  text: string;
  timesFollowed: number;
  timesBroken: number;
  totalEvaluations: number;
  winRateWhenFollowed: number | null;
  winRateWhenBroken: number | null;
  avgRWhenFollowed: number | null;
  avgRWhenBroken: number | null;
  avgPnlWhenFollowed: number | null;
  avgPnlWhenBroken: number | null;
}

export interface RuleComplianceResult {
  overallComplianceRate: number | null;
  totalEvaluatedTrades: number;
  followedTradesCount: number;
  brokenTradesCount: number;
  unspecifiedTradesCount: number;
  performanceSplit: {
    followed: RulePerformanceStats;
    broken: RulePerformanceStats;
  };
  perRuleBreakdown: PerRuleBreakdown[];
}

export interface SessionStats {
  netPnl: number;
  netPnlPercent: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  totalGains: number;
  totalLosses: number;
  currentBalance: number;
  expectancy: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  totalTradesWithR: number;
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  recoveryTradeCount: number | null;
  recoveryDate: string | null;
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  ruleComplianceRate: number | null;
}

export interface HourlyPerformance {
  hour: number;
  label: string;
  count: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  totalPnl: number;
  avgPnl: number | null;
  avgR: number | null;
}

export interface DayOfWeekPerformance {
  dayIndex: number;
  dayName: string;
  shortName: string;
  count: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  totalPnl: number;
  avgPnl: number | null;
  avgR: number | null;
}

export interface SessionDurationPerformance {
  bucket: string;
  description: string;
  count: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  totalPnl: number;
  avgPnl: number | null;
  avgR: number | null;
}

export interface TimeAnalyticsResult {
  hasSufficientData: boolean;
  totalTradesEvaluated: number;
  hourly: HourlyPerformance[];
  dayOfWeek: DayOfWeekPerformance[];
  sessionDuration: SessionDurationPerformance[];
  bestHour: { hour: number; label: string; totalPnl: number; winRate: number | null } | null;
  worstHour: { hour: number; label: string; totalPnl: number; winRate: number | null } | null;
  bestDay: { dayName: string; totalPnl: number; winRate: number | null } | null;
  worstDay: { dayName: string; totalPnl: number; winRate: number | null } | null;
}

export interface SetupConditionPerformance {
  condition: string;
  count: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  totalPnl: number;
  avgPnl: number | null;
  avgR: number | null;
  expectancy: number | null;
  isLowConfidence: boolean;
}

export interface SetupPerformance {
  setup: string;
  count: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  avgR: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  totalPnl: number;
  avgPnl: number | null;
  largestWin: number;
  largestLoss: number;
  isLowConfidence: boolean;
  conditions: SetupConditionPerformance[];
}

export interface SetupAnalyticsResult {
  setups: SetupPerformance[];
  totalSetupsCount: number;
  bestSetup: SetupPerformance | null;
  mostProfitableSetup: SetupPerformance | null;
  highestWinRateSetup: SetupPerformance | null;
}

export interface TradeFilterCriteria {
  setup?: string[];
  result?: ("win" | "loss" | "breakeven")[];
  symbol?: string[];
  dateRange?: { start?: string | Date | null; end?: string | Date | null };
  rulesFollowed?: boolean | null;
  emotionalState?: string[];
  minR?: number | null;
  maxR?: number | null;
  searchText?: string | null;
}

export function filterTrades(
  trades: TradeEntity[],
  filters: TradeFilterCriteria
): TradeEntity[] {
  return trades.filter((trade) => {
    // 1. Setup multi-select
    if (filters.setup && filters.setup.length > 0) {
      if (!trade.setupModel || trade.setupModel.trim() === "") {
        if (!filters.setup.includes("Unspecified")) return false;
      } else {
        const tradeSetups = trade.setupModel
          .split(",")
          .map((s) => s.trim().toLowerCase());
        const hasMatch = filters.setup.some((s) =>
          tradeSetups.includes(s.trim().toLowerCase())
        );
        if (!hasMatch) return false;
      }
    }

    // 2. Result multi-select
    if (filters.result && filters.result.length > 0) {
      if (!filters.result.includes(trade.result as "win" | "loss" | "breakeven")) {
        return false;
      }
    }

    // 3. Symbol multi-select
    if (filters.symbol && filters.symbol.length > 0) {
      const targetSymbols = filters.symbol.map((s) => s.toUpperCase().trim());
      if (!targetSymbols.includes(trade.symbol.toUpperCase().trim())) {
        return false;
      }
    }

    // 4. Date Range
    if (filters.dateRange) {
      const tradeDate = new Date(trade.entryAt).getTime();
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start).getTime();
        if (!isNaN(startDate) && tradeDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (typeof filters.dateRange.end === "string" && !filters.dateRange.end.includes("T")) {
          endDate.setHours(23, 59, 59, 999);
        }
        const endTime = endDate.getTime();
        if (!isNaN(endTime) && tradeDate > endTime) return false;
      }
    }

    // 5. Rules Followed
    if (filters.rulesFollowed !== undefined && filters.rulesFollowed !== null) {
      if (trade.rulesFollowed !== filters.rulesFollowed) {
        return false;
      }
    }

    // 6. Emotional State multi-select
    if (filters.emotionalState && filters.emotionalState.length > 0) {
      if (!trade.emotionalState || trade.emotionalState.trim() === "") {
        if (!filters.emotionalState.includes("Unspecified")) return false;
      } else {
        const tradeStates = trade.emotionalState
          .split(",")
          .map((s) => s.trim().toLowerCase());
        const hasMatch = filters.emotionalState.some((s) =>
          tradeStates.includes(s.trim().toLowerCase())
        );
        if (!hasMatch) return false;
      }
    }

    // 7. Min R
    if (filters.minR !== undefined && filters.minR !== null && !isNaN(filters.minR)) {
      if (trade.rMultiple === null || isNaN(trade.rMultiple) || trade.rMultiple < filters.minR) {
        return false;
      }
    }

    // 8. Max R
    if (filters.maxR !== undefined && filters.maxR !== null && !isNaN(filters.maxR)) {
      if (trade.rMultiple === null || isNaN(trade.rMultiple) || trade.rMultiple > filters.maxR) {
        return false;
      }
    }

    // 9. Full-Text Search (Notes, Setup, Symbol, Draw, HTF Bias)
    if (filters.searchText && filters.searchText.trim() !== "") {
      const q = filters.searchText.trim().toLowerCase();
      const matchNotes = trade.notes ? trade.notes.toLowerCase().includes(q) : false;
      const matchSetup = trade.setupModel ? trade.setupModel.toLowerCase().includes(q) : false;
      const matchSymbol = trade.symbol ? trade.symbol.toLowerCase().includes(q) : false;
      const matchDraw = trade.drawDirection ? trade.drawDirection.toLowerCase().includes(q) : false;
      const matchBias = trade.htfBias ? trade.htfBias.toLowerCase().includes(q) : false;

      if (!matchNotes && !matchSetup && !matchSymbol && !matchDraw && !matchBias) {
        return false;
      }
    }

    return true;
  });
}

export interface DailyPnLRecord {
  date: string; // YYYY-MM-DD
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  avgR: number | null;
  isProfit: boolean;
  isLoss: boolean;
  isBreakeven: boolean;
}

export interface DayStreakStats {
  currentDayStreak: number;
  longestGreenDayStreak: number;
  longestRedDayStreak: number;
  totalTradingDays: number;
  profitableDaysCount: number;
  losingDaysCount: number;
  breakevenDaysCount: number;
  dayWinRate: number | null;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  avgDailyPnl: number | null;
}

export interface WeeklyPnLRecord {
  weekIndex: number;
  totalPnl: number;
  daysTraded: number;
  isProfit: boolean;
  isLoss: boolean;
}

export interface CalendarAnalyticsResult {
  dailyRecords: DailyPnLRecord[];
  dailyPnLMap: Record<string, DailyPnLRecord>;
  dayStreaks: DayStreakStats;
  availableMonths: Array<{ year: number; month: number; label: string; key: string }>;
  defaultMonthKey: string;
}

export interface SessionTradesAndStats {
  trades: TradeEntity[];
  stats: SessionStats;
  equityCurve: EquityPoint[];
  rDistribution: RBucket[];
  drawdownDetails: DrawdownResult;
  rules: RuleEntity[];
  compliance: RuleComplianceResult;
  timeAnalytics: TimeAnalyticsResult;
  setupAnalytics: SetupAnalyticsResult;
  calendarAnalytics: CalendarAnalyticsResult;
}

export interface CreateTradeInput {
  sessionId: string;
  symbol: string;
  direction: "long" | "short";
  entryAt: Date;
  exitAt: Date;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number | null;
  grossPnl: number;
  result: "win" | "loss" | "breakeven";
  notes?: string | null;
  htfBias?: string | null;
  newsToday?: string | null;
  riskPercent?: number | null;
  drawDirection?: string | null;
  setupModel?: string | null;
  emotionalState?: string | null;
  rulesFollowed?: boolean | null;
  rr?: string | null;
  ruleChecks?: Array<{ ruleId: string; followed: boolean }>;
}

export interface UpdateTradeInput {
  symbol?: string;
  direction?: "long" | "short";
  entryAt?: Date;
  exitAt?: Date;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number | null;
  grossPnl?: number;
  result?: "win" | "loss" | "breakeven";
  notes?: string | null;
  htfBias?: string | null;
  newsToday?: string | null;
  riskPercent?: number | null;
  drawDirection?: string | null;
  setupModel?: string | null;
  emotionalState?: string | null;
  rulesFollowed?: boolean | null;
  rr?: string | null;
  ruleChecks?: Array<{ ruleId: string; followed: boolean }>;
}

export function calculateRMultiple(
  entryPrice: number,
  exitPrice: number,
  stopLoss: number | null | undefined,
  direction: string
): number | null {
  if (stopLoss === null || stopLoss === undefined || isNaN(stopLoss)) {
    return null;
  }

  const isLong = direction.toLowerCase() === "long";
  const isShort = direction.toLowerCase() === "short";

  if (!isLong && !isShort) {
    return null;
  }

  // Risk distance in price units
  const risk = isLong ? entryPrice - stopLoss : stopLoss - entryPrice;

  // Stop loss must be on the protective side to define positive risk
  if (risk <= 0) {
    return null;
  }

  // Direction-adjusted price change
  const priceDiff = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  const r = priceDiff / risk;

  return Math.round(r * 100) / 100;
}

export interface ExpectancyResult {
  expectancy: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  winRateR: number | null;
  lossRateR: number | null;
  validTradesCount: number;
}

export function calculateExpectancy(
  trades: Array<{ rMultiple?: number | null }>
): ExpectancyResult {
  const tradesWithR = trades.filter(
    (t): t is { rMultiple: number } =>
      t.rMultiple !== null && t.rMultiple !== undefined && !isNaN(t.rMultiple)
  );

  if (tradesWithR.length === 0) {
    return {
      expectancy: null,
      avgWinR: null,
      avgLossR: null,
      winRateR: null,
      lossRateR: null,
      validTradesCount: 0,
    };
  }

  const total = tradesWithR.length;
  const winTrades = tradesWithR.filter((t) => t.rMultiple > 0);
  const lossTrades = tradesWithR.filter((t) => t.rMultiple < 0);

  const winCount = winTrades.length;
  const lossCount = lossTrades.length;

  const winRate = winCount / total;
  const lossRate = lossCount / total;

  const avgWinR =
    winCount > 0
      ? winTrades.reduce((acc, t) => acc + t.rMultiple, 0) / winCount
      : 0;

  // avgLossR is the average magnitude of loss (positive number)
  const avgLossR =
    lossCount > 0
      ? lossTrades.reduce((acc, t) => acc + Math.abs(t.rMultiple), 0) / lossCount
      : 0;

  // Formula: Expectancy = (WinRate × AvgWinR) − (LossRate × AvgLossR)
  const expectancy = (winRate * avgWinR) - (lossRate * avgLossR);

  return {
    expectancy: Math.round(expectancy * 100) / 100,
    avgWinR: Math.round(avgWinR * 100) / 100,
    avgLossR: Math.round(avgLossR * 100) / 100,
    winRateR: winRate,
    lossRateR: lossRate,
    validTradesCount: total,
  };
}

export function calculateRDistribution(
  trades: Array<{ rMultiple: number | null }>
): RBucket[] {
  const buckets: RBucket[] = [
    { bucket: "<-2R", count: 0, type: "loss" },
    { bucket: "-2R to -1R", count: 0, type: "loss" },
    { bucket: "-1R to 0R", count: 0, type: "loss" },
    { bucket: "0R to 1R", count: 0, type: "win" },
    { bucket: "1R to 2R", count: 0, type: "win" },
    { bucket: "2R to 3R", count: 0, type: "win" },
    { bucket: ">3R", count: 0, type: "win" },
  ];

  for (const trade of trades) {
    if (trade.rMultiple === null || isNaN(trade.rMultiple)) continue;
    const r = trade.rMultiple;

    if (r < -2) {
      buckets[0].count++;
    } else if (r >= -2 && r < -1) {
      buckets[1].count++;
    } else if (r >= -1 && r < 0) {
      buckets[2].count++;
    } else if (r >= 0 && r < 1) {
      buckets[3].count++;
    } else if (r >= 1 && r < 2) {
      buckets[4].count++;
    } else if (r >= 2 && r < 3) {
      buckets[5].count++;
    } else {
      buckets[6].count++;
    }
  }

  return buckets;
}

export function calculateDrawdown(equityCurve: EquityPoint[]): DrawdownResult {
  if (!equityCurve || equityCurve.length <= 1) {
    return {
      maxDrawdownAmount: 0,
      maxDrawdownPercent: 0,
      maxDrawdownStart: null,
      maxDrawdownEnd: null,
      recoveryTradeCount: null,
      recoveryDate: null,
    };
  }

  let runningPeak = equityCurve[0];
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;
  let maxPeak: EquityPoint | null = null;
  let maxTrough: EquityPoint | null = null;

  for (let i = 1; i < equityCurve.length; i++) {
    const currentPoint = equityCurve[i];

    if (currentPoint.balance > runningPeak.balance) {
      runningPeak = currentPoint;
    } else {
      const dropAmount = runningPeak.balance - currentPoint.balance;
      if (dropAmount > maxDrawdownAmount) {
        maxDrawdownAmount = dropAmount;
        maxDrawdownPercent =
          runningPeak.balance > 0 ? (dropAmount / runningPeak.balance) * 100 : 0;
        maxPeak = runningPeak;
        maxTrough = currentPoint;
      }
    }
  }

  if (maxDrawdownAmount <= 0 || !maxPeak || !maxTrough) {
    return {
      maxDrawdownAmount: 0,
      maxDrawdownPercent: 0,
      maxDrawdownStart: null,
      maxDrawdownEnd: null,
      recoveryTradeCount: null,
      recoveryDate: null,
    };
  }

  // Check for recovery after trough
  let recoveryTradeCount: number | null = null;
  let recoveryDate: string | null = null;

  for (let j = maxTrough.index + 1; j < equityCurve.length; j++) {
    const point = equityCurve[j];
    if (point.balance >= maxPeak.balance) {
      recoveryTradeCount = j - maxTrough.index;
      recoveryDate = point.date;
      break;
    }
  }

  return {
    maxDrawdownAmount: Math.round(maxDrawdownAmount * 100) / 100,
    maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
    maxDrawdownStart: maxPeak,
    maxDrawdownEnd: maxTrough,
    recoveryTradeCount,
    recoveryDate,
  };
}

export function calculateStreaks(trades: TradeEntity[]): StreakResult {
  if (!trades || trades.length === 0) {
    return {
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
    };
  }

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let runningWins = 0;
  let runningLosses = 0;

  for (const trade of trades) {
    if (trade.result === "win") {
      runningWins++;
      runningLosses = 0;
      if (runningWins > longestWinStreak) {
        longestWinStreak = runningWins;
      }
    } else if (trade.result === "loss") {
      runningLosses++;
      runningWins = 0;
      if (runningLosses > longestLossStreak) {
        longestLossStreak = runningLosses;
      }
    } else {
      // breakeven resets consecutive win/loss streaks
      runningWins = 0;
      runningLosses = 0;
    }
  }

  // Current streak from the end of the chronological list
  let currentStreak = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    const trade = trades[i];
    if (trade.result === "win") {
      if (currentStreak >= 0) {
        currentStreak++;
      } else {
        break;
      }
    } else if (trade.result === "loss") {
      if (currentStreak <= 0) {
        currentStreak--;
      } else {
        break;
      }
    } else {
      // breakeven ends the current streak
      break;
    }
  }

  return {
    currentStreak,
    longestWinStreak,
    longestLossStreak,
  };
}

function calculateRulePerformanceGroup(groupTrades: TradeEntity[]): RulePerformanceStats {
  const count = groupTrades.length;
  if (count === 0) {
    return {
      count: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: 0,
      avgPnl: 0,
      totalPnl: 0,
      expectancy: null,
      avgWinR: null,
      avgLossR: null,
    };
  }

  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let totalPnl = 0;

  for (const t of groupTrades) {
    totalPnl += t.grossPnl;
    if (t.result === "win") winCount++;
    else if (t.result === "loss") lossCount++;
    else if (t.result === "breakeven") breakevenCount++;
  }

  const winRate = winCount / count;
  const avgPnl = totalPnl / count;
  const exp = calculateExpectancy(groupTrades);

  return {
    count,
    winCount,
    lossCount,
    breakevenCount,
    winRate: Math.round(winRate * 1000) / 1000,
    avgPnl: Math.round(avgPnl * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    expectancy: exp.expectancy,
    avgWinR: exp.avgWinR,
    avgLossR: exp.avgLossR,
  };
}

export function calculateRuleCompliance(
  trades: TradeEntity[],
  sessionRules: RuleEntity[] = []
): RuleComplianceResult {
  const followedTrades: TradeEntity[] = [];
  const brokenTrades: TradeEntity[] = [];
  let unspecifiedCount = 0;

  for (const trade of trades) {
    if (trade.ruleChecks && trade.ruleChecks.length > 0) {
      // Per-rule tracking exists
      const allFollowed = trade.ruleChecks.every((c) => c.followed);
      if (allFollowed) {
        followedTrades.push(trade);
      } else {
        brokenTrades.push(trade);
      }
    } else if (trade.rulesFollowed === true) {
      // Legacy boolean: true
      followedTrades.push(trade);
    } else if (trade.rulesFollowed === false) {
      // Legacy boolean: false
      brokenTrades.push(trade);
    } else {
      // Unspecified
      unspecifiedCount++;
    }
  }

  const followedCount = followedTrades.length;
  const brokenCount = brokenTrades.length;
  const totalEvaluated = followedCount + brokenCount;

  const overallComplianceRate =
    totalEvaluated > 0
      ? Math.round((followedCount / totalEvaluated) * 1000) / 10
      : null;

  const followedStats = calculateRulePerformanceGroup(followedTrades);
  const brokenStats = calculateRulePerformanceGroup(brokenTrades);

  // Per-rule breakdown
  const perRuleBreakdown: PerRuleBreakdown[] = sessionRules.map((rule) => {
    const checksForThisRule = trades
      .map((t) => {
        const check = t.ruleChecks?.find((c) => c.ruleId === rule.id);
        return check ? { trade: t, followed: check.followed } : null;
      })
      .filter((item): item is { trade: TradeEntity; followed: boolean } => item !== null);

    const followedList = checksForThisRule
      .filter((c) => c.followed)
      .map((c) => c.trade);
    const brokenList = checksForThisRule
      .filter((c) => !c.followed)
      .map((c) => c.trade);

    const timesFollowed = followedList.length;
    const timesBroken = brokenList.length;
    const totalEvals = timesFollowed + timesBroken;

    const winRateWhenFollowed =
      timesFollowed > 0
        ? Math.round(
            (followedList.filter((t) => t.result === "win").length / timesFollowed) * 1000
          ) / 10
        : null;

    const winRateWhenBroken =
      timesBroken > 0
        ? Math.round(
            (brokenList.filter((t) => t.result === "win").length / timesBroken) * 1000
          ) / 10
        : null;

    const rFollowed = followedList.filter(
      (t) => t.rMultiple !== null && !isNaN(t.rMultiple)
    );
    const avgRWhenFollowed =
      rFollowed.length > 0
        ? Math.round(
            (rFollowed.reduce((acc, t) => acc + (t.rMultiple || 0), 0) /
              rFollowed.length) *
              100
          ) / 100
        : null;

    const rBroken = brokenList.filter(
      (t) => t.rMultiple !== null && !isNaN(t.rMultiple)
    );
    const avgRWhenBroken =
      rBroken.length > 0
        ? Math.round(
            (rBroken.reduce((acc, t) => acc + (t.rMultiple || 0), 0) /
              rBroken.length) *
              100
          ) / 100
        : null;

    const avgPnlWhenFollowed =
      timesFollowed > 0
        ? Math.round(
            (followedList.reduce((acc, t) => acc + t.grossPnl, 0) / timesFollowed) *
              100
          ) / 100
        : null;

    const avgPnlWhenBroken =
      timesBroken > 0
        ? Math.round(
            (brokenList.reduce((acc, t) => acc + t.grossPnl, 0) / timesBroken) * 100
          ) / 100
        : null;

    return {
      ruleId: rule.id,
      text: rule.text,
      timesFollowed,
      timesBroken,
      totalEvaluations: totalEvals,
      winRateWhenFollowed,
      winRateWhenBroken,
      avgRWhenFollowed,
      avgRWhenBroken,
      avgPnlWhenFollowed,
      avgPnlWhenBroken,
    };
  });

  return {
    overallComplianceRate,
    totalEvaluatedTrades: totalEvaluated,
    followedTradesCount: followedCount,
    brokenTradesCount: brokenCount,
    unspecifiedTradesCount: unspecifiedCount,
    performanceSplit: {
      followed: followedStats,
      broken: brokenStats,
    },
    perRuleBreakdown,
  };
}

export async function getSessionRules(sessionId: string): Promise<RuleEntity[]> {
  return prisma.rule.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createRule(
  sessionId: string,
  text: string
): Promise<RuleEntity> {
  return prisma.rule.create({
    data: {
      sessionId,
      text: text.trim(),
    },
  });
}

export async function deleteRule(id: string): Promise<RuleEntity> {
  return prisma.rule.delete({
    where: { id },
  });
}

export function calculateHourlyPerformance(trades: TradeEntity[]): HourlyPerformance[] {
  const hours: HourlyPerformance[] = Array.from({ length: 24 }, (_, h) => {
    const label = `${h.toString().padStart(2, "0")}:00`;
    return {
      hour: h,
      label,
      count: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: null,
      totalPnl: 0,
      avgPnl: null,
      avgR: null,
    };
  });

  const validTrades = trades.filter((t) => t.entryAt && !isNaN(new Date(t.entryAt).getTime()));

  for (const trade of validTrades) {
    const h = new Date(trade.entryAt).getHours();
    const target = hours[h];
    target.count++;
    target.totalPnl += trade.grossPnl;

    if (trade.result === "win") target.winCount++;
    else if (trade.result === "loss") target.lossCount++;
    else if (trade.result === "breakeven") target.breakevenCount++;
  }

  for (const h of hours) {
    if (h.count > 0) {
      h.winRate = Math.round((h.winCount / h.count) * 1000) / 10;
      h.avgPnl = Math.round((h.totalPnl / h.count) * 100) / 100;
      h.totalPnl = Math.round(h.totalPnl * 100) / 100;

      const hourTrades = validTrades.filter(
        (t) => new Date(t.entryAt).getHours() === h.hour && t.rMultiple !== null && !isNaN(t.rMultiple)
      );
      if (hourTrades.length > 0) {
        h.avgR =
          Math.round(
            (hourTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / hourTrades.length) * 100
          ) / 100;
      }
    }
  }

  return hours;
}

export function calculateDayOfWeekPerformance(trades: TradeEntity[]): DayOfWeekPerformance[] {
  const daysMeta = [
    { dayName: "Monday", shortName: "Mon" },
    { dayName: "Tuesday", shortName: "Tue" },
    { dayName: "Wednesday", shortName: "Wed" },
    { dayName: "Thursday", shortName: "Thu" },
    { dayName: "Friday", shortName: "Fri" },
    { dayName: "Saturday", shortName: "Sat" },
    { dayName: "Sunday", shortName: "Sun" },
  ];

  const days: DayOfWeekPerformance[] = daysMeta.map((meta, idx) => ({
    dayIndex: idx,
    dayName: meta.dayName,
    shortName: meta.shortName,
    count: 0,
    winCount: 0,
    lossCount: 0,
    breakevenCount: 0,
    winRate: null,
    totalPnl: 0,
    avgPnl: null,
    avgR: null,
  }));

  const validTrades = trades.filter((t) => t.entryAt && !isNaN(new Date(t.entryAt).getTime()));

  for (const trade of validTrades) {
    const jsDay = new Date(trade.entryAt).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayIndex = (jsDay + 6) % 7; // 0=Mon, ..., 5=Sat, 6=Sun
    const target = days[dayIndex];
    target.count++;
    target.totalPnl += trade.grossPnl;

    if (trade.result === "win") target.winCount++;
    else if (trade.result === "loss") target.lossCount++;
    else if (trade.result === "breakeven") target.breakevenCount++;
  }

  for (const d of days) {
    if (d.count > 0) {
      d.winRate = Math.round((d.winCount / d.count) * 1000) / 10;
      d.avgPnl = Math.round((d.totalPnl / d.count) * 100) / 100;
      d.totalPnl = Math.round(d.totalPnl * 100) / 100;

      const dayTrades = validTrades.filter((t) => {
        const jsDay = new Date(t.entryAt).getDay();
        return (jsDay + 6) % 7 === d.dayIndex && t.rMultiple !== null && !isNaN(t.rMultiple);
      });
      if (dayTrades.length > 0) {
        d.avgR =
          Math.round(
            (dayTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / dayTrades.length) * 100
          ) / 100;
      }
    }
  }

  return days;
}

export function calculateSessionDurationPerformance(trades: TradeEntity[]): SessionDurationPerformance[] {
  const buckets: SessionDurationPerformance[] = [
    {
      bucket: "Hour 1",
      description: "0–60m into session day",
      count: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: null,
      totalPnl: 0,
      avgPnl: null,
      avgR: null,
    },
    {
      bucket: "Hour 2",
      description: "60–120m into session day",
      count: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: null,
      totalPnl: 0,
      avgPnl: null,
      avgR: null,
    },
    {
      bucket: "Hour 3+",
      description: "120m+ into session day",
      count: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: null,
      totalPnl: 0,
      avgPnl: null,
      avgR: null,
    },
  ];

  const validTrades = trades.filter((t) => t.entryAt && !isNaN(new Date(t.entryAt).getTime()));
  if (validTrades.length === 0) return buckets;

  // Group trades by calendar day
  const tradesByDay = new Map<string, TradeEntity[]>();
  for (const t of validTrades) {
    const d = new Date(t.entryAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const list = tradesByDay.get(dayKey) || [];
    list.push(t);
    tradesByDay.set(dayKey, list);
  }

  tradesByDay.forEach((dayTrades) => {
    const earliestTime = Math.min(...dayTrades.map((t: TradeEntity) => new Date(t.entryAt).getTime()));

    for (const trade of dayTrades) {
      const elapsedMinutes = (new Date(trade.entryAt).getTime() - earliestTime) / (1000 * 60);

      let target: SessionDurationPerformance;
      if (elapsedMinutes < 60) {
        target = buckets[0];
      } else if (elapsedMinutes < 120) {
        target = buckets[1];
      } else {
        target = buckets[2];
      }

      target.count++;
      target.totalPnl += trade.grossPnl;

      if (trade.result === "win") target.winCount++;
      else if (trade.result === "loss") target.lossCount++;
      else if (trade.result === "breakeven") target.breakevenCount++;
    }
  });

  for (const b of buckets) {
    if (b.count > 0) {
      b.winRate = Math.round((b.winCount / b.count) * 1000) / 10;
      b.avgPnl = Math.round((b.totalPnl / b.count) * 100) / 100;
      b.totalPnl = Math.round(b.totalPnl * 100) / 100;

      // Avg R
      const bucketTrades: TradeEntity[] = [];
      tradesByDay.forEach((dayTrades) => {
        const earliestTime = Math.min(...dayTrades.map((t: TradeEntity) => new Date(t.entryAt).getTime()));
        for (const trade of dayTrades) {
          const elapsed = (new Date(trade.entryAt).getTime() - earliestTime) / (1000 * 60);
          if (
            (b.bucket === "Hour 1" && elapsed < 60) ||
            (b.bucket === "Hour 2" && elapsed >= 60 && elapsed < 120) ||
            (b.bucket === "Hour 3+" && elapsed >= 120)
          ) {
            if (trade.rMultiple !== null && !isNaN(trade.rMultiple)) {
              bucketTrades.push(trade);
            }
          }
        }
      });

      if (bucketTrades.length > 0) {
        b.avgR =
          Math.round(
            (bucketTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / bucketTrades.length) * 100
          ) / 100;
      }
    }
  }

  return buckets;
}

export function calculateTimeAnalytics(trades: TradeEntity[]): TimeAnalyticsResult {
  const validTrades = trades.filter((t) => t.entryAt && !isNaN(new Date(t.entryAt).getTime()));
  const totalTradesEvaluated = validTrades.length;
  const hasSufficientData = totalTradesEvaluated >= 5;

  const hourly = calculateHourlyPerformance(validTrades);
  const dayOfWeek = calculateDayOfWeekPerformance(validTrades);
  const sessionDuration = calculateSessionDurationPerformance(validTrades);

  const activeHours = hourly.filter((h) => h.count > 0);
  let bestHour = null;
  let worstHour = null;
  if (activeHours.length > 0) {
    const sortedHours = [...activeHours].sort((a, b) => b.totalPnl - a.totalPnl);
    bestHour = {
      hour: sortedHours[0].hour,
      label: sortedHours[0].label,
      totalPnl: sortedHours[0].totalPnl,
      winRate: sortedHours[0].winRate,
    };
    worstHour = {
      hour: sortedHours[sortedHours.length - 1].hour,
      label: sortedHours[sortedHours.length - 1].label,
      totalPnl: sortedHours[sortedHours.length - 1].totalPnl,
      winRate: sortedHours[sortedHours.length - 1].winRate,
    };
  }

  const activeDays = dayOfWeek.filter((d) => d.count > 0);
  let bestDay = null;
  let worstDay = null;
  if (activeDays.length > 0) {
    const sortedDays = [...activeDays].sort((a, b) => b.totalPnl - a.totalPnl);
    bestDay = {
      dayName: sortedDays[0].dayName,
      totalPnl: sortedDays[0].totalPnl,
      winRate: sortedDays[0].winRate,
    };
    worstDay = {
      dayName: sortedDays[sortedDays.length - 1].dayName,
      totalPnl: sortedDays[sortedDays.length - 1].totalPnl,
      winRate: sortedDays[sortedDays.length - 1].winRate,
    };
  }

  return {
    hasSufficientData,
    totalTradesEvaluated,
    hourly,
    dayOfWeek,
    sessionDuration,
    bestHour,
    worstHour,
    bestDay,
    worstDay,
  };
}

export function calculateSetupPerformance(trades: TradeEntity[]): SetupAnalyticsResult {
  const setupTradesMap = new Map<string, TradeEntity[]>();

  for (const trade of trades) {
    if (trade.setupModel && trade.setupModel.trim() !== "") {
      const splitSetups = trade.setupModel
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (splitSetups.length > 0) {
        for (const s of splitSetups) {
          const list = setupTradesMap.get(s) || [];
          list.push(trade);
          setupTradesMap.set(s, list);
        }
      } else {
        const list = setupTradesMap.get("Unspecified") || [];
        list.push(trade);
        setupTradesMap.set("Unspecified", list);
      }
    } else {
      const list = setupTradesMap.get("Unspecified") || [];
      list.push(trade);
      setupTradesMap.set("Unspecified", list);
    }
  }

  const setups: SetupPerformance[] = [];

  setupTradesMap.forEach((setupTrades, setupName) => {
    const count = setupTrades.length;
    let winCount = 0;
    let lossCount = 0;
    let breakevenCount = 0;
    let totalPnl = 0;
    let totalGains = 0;
    let totalLosses = 0;

    for (const t of setupTrades) {
      totalPnl += t.grossPnl;
      if (t.result === "win") {
        winCount++;
        totalGains += Math.max(0, t.grossPnl);
      } else if (t.result === "loss") {
        lossCount++;
        totalLosses += Math.abs(Math.min(0, t.grossPnl));
      } else if (t.result === "breakeven") {
        breakevenCount++;
      }
    }

    const winRate = count > 0 ? Math.round((winCount / count) * 1000) / 10 : null;
    const avgPnl = count > 0 ? Math.round((totalPnl / count) * 100) / 100 : null;
    totalPnl = Math.round(totalPnl * 100) / 100;

    let profitFactor: number | null = null;
    if (totalLosses > 0) {
      profitFactor = Math.round((totalGains / totalLosses) * 100) / 100;
    } else if (totalGains > 0) {
      profitFactor = Infinity;
    }

    const largestWin =
      setupTrades.length > 0 ? Math.max(0, ...setupTrades.map((t: TradeEntity) => t.grossPnl)) : 0;
    const largestLoss =
      setupTrades.length > 0 ? Math.min(0, ...setupTrades.map((t: TradeEntity) => t.grossPnl)) : 0;

    const tradesWithR = setupTrades.filter((t: TradeEntity) => t.rMultiple !== null && !isNaN(t.rMultiple));
    const avgR =
      tradesWithR.length > 0
        ? Math.round(
            (tradesWithR.reduce((acc: number, t: TradeEntity) => acc + (t.rMultiple || 0), 0) / tradesWithR.length) *
              100
          ) / 100
        : null;

    const expectancyData = calculateExpectancy(setupTrades);
    const expectancy = expectancyData.expectancy;

    const isLowConfidence = count < 3;

    // Cross-tabulate condition performance for this setup
    const conditionTradesMap = new Map<string, TradeEntity[]>();
    for (const t of setupTrades) {
      const cond = t.htfBias?.trim() || "Unspecified";
      const list = conditionTradesMap.get(cond) || [];
      list.push(t);
      conditionTradesMap.set(cond, list);
    }

    const conditions: SetupConditionPerformance[] = [];
    conditionTradesMap.forEach((condTrades, condName) => {
      const condCount = condTrades.length;
      let cWins = 0;
      let cLosses = 0;
      let cBreakevens = 0;
      let cPnl = 0;

      for (const ct of condTrades) {
        cPnl += ct.grossPnl;
        if (ct.result === "win") cWins++;
        else if (ct.result === "loss") cLosses++;
        else if (ct.result === "breakeven") cBreakevens++;
      }

      const cWinRate = condCount > 0 ? Math.round((cWins / condCount) * 1000) / 10 : null;
      const cAvgPnl = condCount > 0 ? Math.round((cPnl / condCount) * 100) / 100 : null;
      cPnl = Math.round(cPnl * 100) / 100;

      const cTradesWithR = condTrades.filter((t: TradeEntity) => t.rMultiple !== null && !isNaN(t.rMultiple));
      const cAvgR =
        cTradesWithR.length > 0
          ? Math.round(
              (cTradesWithR.reduce((acc: number, t: TradeEntity) => acc + (t.rMultiple || 0), 0) /
                cTradesWithR.length) *
                100
            ) / 100
          : null;

      const cExpectancy = calculateExpectancy(condTrades).expectancy;

      conditions.push({
        condition: condName,
        count: condCount,
        winCount: cWins,
        lossCount: cLosses,
        breakevenCount: cBreakevens,
        winRate: cWinRate,
        totalPnl: cPnl,
        avgPnl: cAvgPnl,
        avgR: cAvgR,
        expectancy: cExpectancy,
        isLowConfidence: condCount < 3,
      });
    });

    conditions.sort((a, b) => b.count - a.count);

    setups.push({
      setup: setupName,
      count,
      winCount,
      lossCount,
      breakevenCount,
      winRate,
      avgR,
      expectancy,
      profitFactor,
      totalPnl,
      avgPnl,
      largestWin,
      largestLoss,
      isLowConfidence,
      conditions,
    });
  });

  setups.sort((a, b) => {
    if (a.setup === "Unspecified" && b.setup !== "Unspecified") return 1;
    if (b.setup === "Unspecified" && a.setup !== "Unspecified") return -1;
    if (a.expectancy !== null && b.expectancy !== null) {
      return b.expectancy - a.expectancy;
    }
    return b.totalPnl - a.totalPnl;
  });

  const namedSetups = setups.filter((s) => s.setup !== "Unspecified");
  const candidateSetups = namedSetups.length > 0 ? namedSetups : setups;

  const highConfSetups = candidateSetups.filter(
    (s) => !s.isLowConfidence && s.expectancy !== null
  );
  const bestSetup =
    highConfSetups.length > 0
      ? [...highConfSetups].sort((a, b) => (b.expectancy ?? -999) - (a.expectancy ?? -999))[0]
      : candidateSetups.length > 0
      ? [...candidateSetups].sort((a, b) => (b.expectancy ?? -999) - (a.expectancy ?? -999))[0]
      : null;

  const mostProfitableSetup =
    candidateSetups.length > 0
      ? [...candidateSetups].sort((a, b) => b.totalPnl - a.totalPnl)[0]
      : null;

  const highestWinRateSetup =
    candidateSetups.length > 0
      ? [...candidateSetups]
          .filter((s) => s.winRate !== null)
          .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))[0]
      : null;

  return {
    setups,
    totalSetupsCount: setups.length,
    bestSetup,
    mostProfitableSetup,
    highestWinRateSetup,
  };
}

export function calculateDailyPnL(trades: TradeEntity[]): DailyPnLRecord[] {
  const map = new Map<string, TradeEntity[]>();

  const validTrades = trades.filter((t) => t.entryAt && !isNaN(new Date(t.entryAt).getTime()));

  for (const trade of validTrades) {
    const d = new Date(trade.entryAt);
    const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    const list = map.get(dateKey) || [];
    list.push(trade);
    map.set(dateKey, list);
  }

  const records: DailyPnLRecord[] = [];

  map.forEach((dayTrades, dateKey) => {
    const d = new Date(dayTrades[0].entryAt);
    const count = dayTrades.length;
    let winCount = 0;
    let lossCount = 0;
    let breakevenCount = 0;
    let totalPnl = 0;

    for (const t of dayTrades) {
      totalPnl += t.grossPnl;
      if (t.result === "win") winCount++;
      else if (t.result === "loss") lossCount++;
      else if (t.result === "breakeven") breakevenCount++;
    }

    totalPnl = Math.round(totalPnl * 100) / 100;
    const winRate = count > 0 ? Math.round((winCount / count) * 1000) / 10 : null;

    const tradesWithR = dayTrades.filter((t: TradeEntity) => t.rMultiple !== null && !isNaN(t.rMultiple));
    const avgR =
      tradesWithR.length > 0
        ? Math.round(
            (tradesWithR.reduce((acc: number, t: TradeEntity) => acc + (t.rMultiple || 0), 0) / tradesWithR.length) *
              100
          ) / 100
        : null;

    records.push({
      date: dateKey,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      dayOfWeek: d.getDay(),
      totalPnl,
      tradeCount: count,
      winCount,
      lossCount,
      breakevenCount,
      winRate,
      avgR,
      isProfit: totalPnl > 0.001,
      isLoss: totalPnl < -0.001,
      isBreakeven: Math.abs(totalPnl) <= 0.001,
    });
  });

  records.sort((a, b) => a.date.localeCompare(b.date));
  return records;
}

export function calculateWeeklyPnL(
  trades: TradeEntity[],
  year: number,
  month: number
): WeeklyPnLRecord[] {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const tradesByDay = new Map<string, TradeEntity[]>();
  for (const t of trades) {
    if (t.entryAt && !isNaN(new Date(t.entryAt).getTime())) {
      const d = new Date(t.entryAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      const list = tradesByDay.get(key) || [];
      list.push(t);
      tradesByDay.set(key, list);
    }
  }

  const totalCells = Math.ceil((startingDayOfWeek + totalDaysInMonth) / 7) * 7;
  const numWeeks = totalCells / 7;
  const weeklyRecords: WeeklyPnLRecord[] = [];

  let currentDayCounter = 1 - startingDayOfWeek;

  for (let w = 0; w < numWeeks; w++) {
    let weekTotalPnl = 0;
    let weekDaysTraded = 0;

    for (let d = 0; d < 7; d++) {
      const dayNum = currentDayCounter;
      currentDayCounter++;

      if (dayNum >= 1 && dayNum <= totalDaysInMonth) {
        const dateKey = `${year}-${month.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
        const dayTrades = tradesByDay.get(dateKey);
        if (dayTrades && dayTrades.length > 0) {
          weekDaysTraded++;
          for (const t of dayTrades) {
            weekTotalPnl += t.grossPnl;
          }
        }
      }
    }

    weekTotalPnl = Math.round(weekTotalPnl * 100) / 100;
    weeklyRecords.push({
      weekIndex: w + 1,
      totalPnl: weekTotalPnl,
      daysTraded: weekDaysTraded,
      isProfit: weekTotalPnl > 0.001,
      isLoss: weekTotalPnl < -0.001,
    });
  }

  return weeklyRecords;
}

export function calculateStreaksByDay(dailyRecords: DailyPnLRecord[]): DayStreakStats {
  const totalTradingDays = dailyRecords.length;
  if (totalTradingDays === 0) {
    return {
      currentDayStreak: 0,
      longestGreenDayStreak: 0,
      longestRedDayStreak: 0,
      totalTradingDays: 0,
      profitableDaysCount: 0,
      losingDaysCount: 0,
      breakevenDaysCount: 0,
      dayWinRate: null,
      bestDay: null,
      worstDay: null,
      avgDailyPnl: null,
    };
  }

  let profitableDaysCount = 0;
  let losingDaysCount = 0;
  let breakevenDaysCount = 0;
  let totalPnl = 0;

  let bestDay: { date: string; pnl: number } | null = null;
  let worstDay: { date: string; pnl: number } | null = null;

  for (const d of dailyRecords) {
    totalPnl += d.totalPnl;
    if (d.isProfit) {
      profitableDaysCount++;
    } else if (d.isLoss) {
      losingDaysCount++;
    } else {
      breakevenDaysCount++;
    }

    if (!bestDay || d.totalPnl > bestDay.pnl) {
      bestDay = { date: d.date, pnl: d.totalPnl };
    }
    if (!worstDay || d.totalPnl < worstDay.pnl) {
      worstDay = { date: d.date, pnl: d.totalPnl };
    }
  }

  const dayWinRate =
    totalTradingDays > 0 ? Math.round((profitableDaysCount / totalTradingDays) * 1000) / 10 : null;
  const avgDailyPnl =
    totalTradingDays > 0 ? Math.round((totalPnl / totalTradingDays) * 100) / 100 : null;

  let longestGreenDayStreak = 0;
  let longestRedDayStreak = 0;
  let currentDayStreak = 0;
  let currentGreen = 0;
  let currentRed = 0;

  for (const d of dailyRecords) {
    if (d.isProfit) {
      currentGreen++;
      currentRed = 0;
      if (currentGreen > longestGreenDayStreak) {
        longestGreenDayStreak = currentGreen;
      }
    } else if (d.isLoss) {
      currentRed++;
      currentGreen = 0;
      if (currentRed > longestRedDayStreak) {
        longestRedDayStreak = currentRed;
      }
    } else {
      currentGreen = 0;
      currentRed = 0;
    }
  }

  const latest = dailyRecords[dailyRecords.length - 1];
  if (latest) {
    if (latest.isProfit) {
      let count = 0;
      for (let i = dailyRecords.length - 1; i >= 0; i--) {
        if (dailyRecords[i].isProfit) count++;
        else break;
      }
      currentDayStreak = count;
    } else if (latest.isLoss) {
      let count = 0;
      for (let i = dailyRecords.length - 1; i >= 0; i--) {
        if (dailyRecords[i].isLoss) count++;
        else break;
      }
      currentDayStreak = -count;
    } else {
      currentDayStreak = 0;
    }
  }

  return {
    currentDayStreak,
    longestGreenDayStreak,
    longestRedDayStreak,
    totalTradingDays,
    profitableDaysCount,
    losingDaysCount,
    breakevenDaysCount,
    dayWinRate,
    bestDay,
    worstDay,
    avgDailyPnl,
  };
}

export function calculateCalendarAnalytics(
  trades: TradeEntity[],
  sessionPeriodStart?: Date,
  sessionPeriodEnd?: Date
): CalendarAnalyticsResult {
  const dailyRecords = calculateDailyPnL(trades);
  const dailyPnLMap: Record<string, DailyPnLRecord> = {};
  for (const r of dailyRecords) {
    dailyPnLMap[r.date] = r;
  }

  const dayStreaks = calculateStreaksByDay(dailyRecords);

  const monthMap = new Map<string, { year: number; month: number; label: string; key: string }>();

  if (
    sessionPeriodStart &&
    sessionPeriodEnd &&
    !isNaN(new Date(sessionPeriodStart).getTime()) &&
    !isNaN(new Date(sessionPeriodEnd).getTime())
  ) {
    const s = new Date(sessionPeriodStart);
    const e = new Date(sessionPeriodEnd);
    let curr = new Date(s.getFullYear(), s.getMonth(), 1);
    const endMonth = new Date(e.getFullYear(), e.getMonth(), 1);

    while (curr.getTime() <= endMonth.getTime()) {
      const key = `${curr.getFullYear()}-${(curr.getMonth() + 1).toString().padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(curr);
      monthMap.set(key, { year: curr.getFullYear(), month: curr.getMonth() + 1, label, key });
      curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    }
  } else {
    if (sessionPeriodStart && !isNaN(new Date(sessionPeriodStart).getTime())) {
      const s = new Date(sessionPeriodStart);
      const key = `${s.getFullYear()}-${(s.getMonth() + 1).toString().padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(s);
      monthMap.set(key, { year: s.getFullYear(), month: s.getMonth() + 1, label, key });
    }

    if (sessionPeriodEnd && !isNaN(new Date(sessionPeriodEnd).getTime())) {
      const e = new Date(sessionPeriodEnd);
      const key = `${e.getFullYear()}-${(e.getMonth() + 1).toString().padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(e);
      monthMap.set(key, { year: e.getFullYear(), month: e.getMonth() + 1, label, key });
    }
  }

  for (const r of dailyRecords) {
    const key = `${r.year}-${r.month.toString().padStart(2, "0")}`;
    if (!monthMap.has(key)) {
      const d = new Date(r.year, r.month - 1, 1);
      const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
      monthMap.set(key, { year: r.year, month: r.month, label, key });
    }
  }

  if (monthMap.size === 0) {
    const now = new Date();
    const key = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);
    monthMap.set(key, { year: now.getFullYear(), month: now.getMonth() + 1, label, key });
  }

  const availableMonths = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  let defaultMonthKey = availableMonths[0]?.key || "";
  if (dailyRecords.length > 0) {
    const lastRecord = dailyRecords[dailyRecords.length - 1];
    const tradeMonthKey = `${lastRecord.year}-${lastRecord.month.toString().padStart(2, "0")}`;
    if (availableMonths.some((m) => m.key === tradeMonthKey)) {
      defaultMonthKey = tradeMonthKey;
    } else {
      defaultMonthKey = availableMonths[availableMonths.length - 1].key;
    }
  } else if (availableMonths.length > 0) {
    defaultMonthKey = availableMonths[0].key;
  }

  return {
    dailyRecords,
    dailyPnLMap,
    dayStreaks,
    availableMonths,
    defaultMonthKey,
  };
}

export async function getSessionTradesAndStats(
  sessionId: string,
  startingBalance: number,
  sessionStartDate?: Date,
  sessionEndDate?: Date
): Promise<SessionTradesAndStats> {
  const [rawTrades, rules] = await Promise.all([
    prisma.trade.findMany({
      where: { sessionId },
      include: {
        ruleChecks: {
          include: {
            rule: true,
          },
        },
        images: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: [
        { entryAt: "asc" },
        { createdAt: "asc" },
      ],
    }),
    getSessionRules(sessionId),
  ]);

  // Ensure rMultiple is derived if not stored, preserving backwards compatibility
  const trades: TradeEntity[] = rawTrades.map((t) => {
    const derivedR =
      t.rMultiple !== null && t.rMultiple !== undefined
        ? t.rMultiple
        : calculateRMultiple(t.entryPrice, t.exitPrice, t.stopLoss, t.direction);

    return {
      ...t,
      stopLoss: t.stopLoss ?? null,
      rMultiple: derivedR,
      ruleChecks: t.ruleChecks.map((rc) => ({
        id: rc.id,
        tradeId: rc.tradeId,
        ruleId: rc.ruleId,
        followed: rc.followed,
        rule: rc.rule ? { id: rc.rule.id, text: rc.rule.text } : undefined,
      })),
      images: (t.images || []).map((img) => ({
        id: img.id,
        tradeId: img.tradeId,
        url: img.url,
        label: img.label,
        createdAt: img.createdAt,
      })),
    };
  });

  let netPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let totalGains = 0;
  let totalLosses = 0;

  const totalTrades = trades.length;

  for (const trade of trades) {
    netPnl += trade.grossPnl;
    if (trade.result === "win") {
      winCount++;
      totalGains += Math.max(0, trade.grossPnl);
    } else if (trade.result === "loss") {
      lossCount++;
      totalLosses += Math.abs(Math.min(0, trade.grossPnl));
    } else if (trade.result === "breakeven") {
      breakevenCount++;
    }
  }

  const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
  const profitFactor =
    totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? totalGains : 0;
  const avgWin = winCount > 0 ? totalGains / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
  const netPnlPercent =
    startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const currentBalance = startingBalance + netPnl;

  // Expectancy and R distribution
  const expectancyData = calculateExpectancy(trades);
  const rDistribution = calculateRDistribution(trades);

  // Build Equity Curve
  const equityCurve: EquityPoint[] = [];

  // Point 0: Starting balance
  const initialDate =
    sessionStartDate || (trades.length > 0 ? trades[0].entryAt : new Date());
  equityCurve.push({
    index: 0,
    date: "Start",
    rawDate: initialDate,
    balance: startingBalance,
    pnl: 0,
    tradePnl: 0,
    label: "Starting Balance",
  });

  let runningBalance = startingBalance;
  trades.forEach((trade, idx) => {
    runningBalance += trade.grossPnl;
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(trade.entryAt));

    equityCurve.push({
      index: idx + 1,
      date: formattedDate,
      rawDate: trade.entryAt,
      balance: Math.round(runningBalance * 100) / 100,
      pnl: Math.round((runningBalance - startingBalance) * 100) / 100,
      tradePnl: trade.grossPnl,
      symbol: trade.symbol,
      direction: trade.direction,
      result: trade.result,
      label: `Trade #${idx + 1} (${trade.symbol})`,
    });
  });

  // Calculate Drawdown, Streaks, Compliance, Time, Setup, and Calendar Analytics
  const drawdownDetails = calculateDrawdown(equityCurve);
  const streaks = calculateStreaks(trades);
  const compliance = calculateRuleCompliance(trades, rules);
  const timeAnalytics = calculateTimeAnalytics(trades);
  const setupAnalytics = calculateSetupPerformance(trades);
  const calendarAnalytics = calculateCalendarAnalytics(
    trades,
    sessionStartDate,
    sessionEndDate
  );

  const stats: SessionStats = {
    netPnl,
    netPnlPercent,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    totalTrades,
    winCount,
    lossCount,
    breakevenCount,
    totalGains,
    totalLosses,
    currentBalance,
    expectancy: expectancyData.expectancy,
    avgWinR: expectancyData.avgWinR,
    avgLossR: expectancyData.avgLossR,
    totalTradesWithR: expectancyData.validTradesCount,
    maxDrawdownAmount: drawdownDetails.maxDrawdownAmount,
    maxDrawdownPercent: drawdownDetails.maxDrawdownPercent,
    recoveryTradeCount: drawdownDetails.recoveryTradeCount,
    recoveryDate: drawdownDetails.recoveryDate,
    currentStreak: streaks.currentStreak,
    longestWinStreak: streaks.longestWinStreak,
    longestLossStreak: streaks.longestLossStreak,
    ruleComplianceRate: compliance.overallComplianceRate,
  };

  return {
    trades,
    stats,
    equityCurve,
    rDistribution,
    drawdownDetails,
    rules,
    compliance,
    timeAnalytics,
    setupAnalytics,
    calendarAnalytics,
  };
}

export async function createTrade(data: CreateTradeInput) {
  const stopLoss =
    data.stopLoss !== undefined && data.stopLoss !== null && !isNaN(data.stopLoss)
      ? Number(data.stopLoss)
      : null;

  const rMultiple = calculateRMultiple(
    data.entryPrice,
    data.exitPrice,
    stopLoss,
    data.direction
  );

  let finalRulesFollowed =
    typeof data.rulesFollowed === "boolean" ? data.rulesFollowed : null;

  if (data.ruleChecks && data.ruleChecks.length > 0) {
    finalRulesFollowed = data.ruleChecks.every((rc) => rc.followed);
  }

  return prisma.trade.create({
    data: {
      sessionId: data.sessionId,
      symbol: data.symbol.trim().toUpperCase(),
      direction: data.direction,
      entryAt: data.entryAt,
      exitAt: data.exitAt,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      stopLoss,
      rMultiple,
      grossPnl: data.grossPnl,
      result: data.result,
      notes: data.notes?.trim() || null,
      htfBias: data.htfBias?.trim() || null,
      newsToday: data.newsToday?.trim() || null,
      riskPercent:
        data.riskPercent !== undefined && data.riskPercent !== null
          ? Number(data.riskPercent)
          : null,
      drawDirection: data.drawDirection?.trim() || null,
      setupModel: data.setupModel?.trim() || null,
      emotionalState: data.emotionalState?.trim() || null,
      rulesFollowed: finalRulesFollowed,
      rr: data.rr?.trim() || null,
      ruleChecks:
        data.ruleChecks && data.ruleChecks.length > 0
          ? {
              create: data.ruleChecks.map((rc) => ({
                ruleId: rc.ruleId,
                followed: rc.followed,
              })),
            }
          : undefined,
    },
    include: {
      ruleChecks: {
        include: {
          rule: true,
        },
      },
    },
  });
}

export async function updateTrade(id: string, data: UpdateTradeInput) {
  const current = await prisma.trade.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error(`Trade with id ${id} not found`);
  }

  const symbol = data.symbol !== undefined ? data.symbol.trim().toUpperCase() : current.symbol;
  const direction = data.direction !== undefined ? data.direction : (current.direction as "long" | "short");
  const entryPrice = data.entryPrice !== undefined ? data.entryPrice : current.entryPrice;
  const exitPrice = data.exitPrice !== undefined ? data.exitPrice : current.exitPrice;
  const stopLoss =
    data.stopLoss !== undefined
      ? (data.stopLoss !== null && !isNaN(data.stopLoss) ? Number(data.stopLoss) : null)
      : current.stopLoss;

  const rMultiple = calculateRMultiple(entryPrice, exitPrice, stopLoss, direction);

  let finalRulesFollowed =
    data.rulesFollowed !== undefined ? data.rulesFollowed : current.rulesFollowed;

  if (data.ruleChecks !== undefined && data.ruleChecks.length > 0) {
    finalRulesFollowed = data.ruleChecks.every((rc) => rc.followed);
  }

  return prisma.$transaction(async (tx) => {
    if (data.ruleChecks !== undefined) {
      await tx.tradeRuleCheck.deleteMany({
        where: { tradeId: id },
      });

      if (data.ruleChecks.length > 0) {
        await tx.tradeRuleCheck.createMany({
          data: data.ruleChecks.map((rc) => ({
            tradeId: id,
            ruleId: rc.ruleId,
            followed: rc.followed,
          })),
        });
      }
    }

    return tx.trade.update({
      where: { id },
      data: {
        symbol,
        direction,
        entryAt: data.entryAt !== undefined ? data.entryAt : current.entryAt,
        exitAt: data.exitAt !== undefined ? data.exitAt : current.exitAt,
        entryPrice,
        exitPrice,
        stopLoss,
        rMultiple,
        grossPnl: data.grossPnl !== undefined ? data.grossPnl : current.grossPnl,
        result: data.result !== undefined ? data.result : current.result,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : current.notes,
        htfBias: data.htfBias !== undefined ? (data.htfBias?.trim() || null) : current.htfBias,
        newsToday: data.newsToday !== undefined ? (data.newsToday?.trim() || null) : current.newsToday,
        riskPercent:
          data.riskPercent !== undefined
            ? (data.riskPercent !== null && !isNaN(data.riskPercent) ? Number(data.riskPercent) : null)
            : current.riskPercent,
        drawDirection:
          data.drawDirection !== undefined
            ? (data.drawDirection?.trim() || null)
            : current.drawDirection,
        setupModel:
          data.setupModel !== undefined
            ? (data.setupModel?.trim() || null)
            : current.setupModel,
        emotionalState:
          data.emotionalState !== undefined
            ? (data.emotionalState?.trim() || null)
            : current.emotionalState,
        rulesFollowed: finalRulesFollowed,
        rr: data.rr !== undefined ? (data.rr?.trim() || null) : current.rr,
      },
      include: {
        ruleChecks: {
          include: {
            rule: true,
          },
        },
      },
    });
  });
}

export async function deleteTrade(id: string) {
  return prisma.trade.delete({
    where: { id },
  });
}
