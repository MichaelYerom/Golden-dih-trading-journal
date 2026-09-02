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

export interface SessionTradesAndStats {
  trades: TradeEntity[];
  stats: SessionStats;
  equityCurve: EquityPoint[];
  rDistribution: RBucket[];
  drawdownDetails: DrawdownResult;
  rules: RuleEntity[];
  compliance: RuleComplianceResult;
  timeAnalytics: TimeAnalyticsResult;
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

  for (const dayTrades of tradesByDay.values()) {
    const earliestTime = Math.min(...dayTrades.map((t) => new Date(t.entryAt).getTime()));

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
  }

  for (const b of buckets) {
    if (b.count > 0) {
      b.winRate = Math.round((b.winCount / b.count) * 1000) / 10;
      b.avgPnl = Math.round((b.totalPnl / b.count) * 100) / 100;
      b.totalPnl = Math.round(b.totalPnl * 100) / 100;

      // Avg R
      const bucketTrades: TradeEntity[] = [];
      for (const dayTrades of tradesByDay.values()) {
        const earliestTime = Math.min(...dayTrades.map((t) => new Date(t.entryAt).getTime()));
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
      }

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

export async function getSessionTradesAndStats(
  sessionId: string,
  startingBalance: number,
  sessionStartDate?: Date
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

  // Calculate Drawdown and Streaks from equity curve and trades
  const drawdownDetails = calculateDrawdown(equityCurve);
  const streaks = calculateStreaks(trades);
  const compliance = calculateRuleCompliance(trades, rules);
  const timeAnalytics = calculateTimeAnalytics(trades);

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
