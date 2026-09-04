import {
  TradeEntity,
  calculateExpectancy,
  calculateConfluenceMatch,
  calculateTradeOutcomeR,
  calculateRMultiple,
} from "./trade-analytics";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface StrategyDisciplineStats {
  count: number;
  evaluatedCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  avgR: number | null;
  expectancy: number | null;
  totalPnl: number;
}

export interface StrategyPerformanceComparisonItem {
  strategyId: string;
  strategyName: string;
  totalTrades: number;
  activeTradesCount: number;
  evaluatedCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  expectancy: number | null;
  avgR: number | null;
  totalPnl: number;
  gradeableCount: number;
  avgConfluenceMatch: number | null;
  perfectMatchCount: number;
  highMatchStats: StrategyDisciplineStats; // match >= 80%
  lowMatchStats: StrategyDisciplineStats;  // match < 80%
  disciplineImpact: {
    winRateDiff: number | null; // high - low
    avgRDiff: number | null;
    expectancyDiff: number | null;
  };
}

export interface DisciplineBucket {
  bucket: "100%+" | "80-99%" | "50-79%" | "<50%";
  label: string;
  minPercent: number;
  maxPercent: number;
  totalTrades: number;
  evaluatedCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number | null;
  avgR: number | null;
  expectancy: number | null;
  totalPnl: number;
}

export interface DisciplineVsOutcomeResult {
  buckets: DisciplineBucket[];
  totalGradeableTrades: number;
  highMatchWinRate: number | null; // >=80%
  lowMatchWinRate: number | null;  // <80%
  highMatchAvgR: number | null;
  lowMatchAvgR: number | null;
  summaryInsight: string | null;
}

export interface MissedOpportunityBreakdown {
  totalMissedEntries: number;
  totalNoTradeDays: number;
  missedByStrategy: Array<{
    strategyId: string | null;
    strategyName: string;
    count: number;
    percent: number;
  }>;
  missedByHour: Array<{
    hour: number;
    label: string;
    count: number;
  }>;
  missedByDayOfWeek: Array<{
    day: number;
    dayName: string;
    shortName: string;
    count: number;
  }>;
  topHesitationSetup: string | null;
  topHesitationHour: string | null;
  topHesitationDay: string | null;
  noTradeByDayOfWeek: Array<{
    day: number;
    dayName: string;
    shortName: string;
    count: number;
  }>;
  noTradeCommonThemes: Array<{
    theme: string;
    count: number;
  }>;
  recentNoTradeRecords: Array<{
    id: string;
    date: Date;
    reason: string;
    sessionName?: string;
  }>;
}

export interface AdherenceTrendPoint {
  periodKey: string;
  label: string;
  date: string;
  avgMatchPercent: number;
  tradeCount: number;
  perfectMatchCount: number;
  rollingAvgMatch?: number;
}

export interface PlaybookAdherenceTrendResult {
  hasSufficientData: boolean;
  totalGradeableTrades: number;
  thresholdRequired: number;
  message?: string;
  points: AdherenceTrendPoint[];
  overallAvgMatch: number | null;
  trendDirection: "improving" | "declining" | "stable" | "insufficient_data";
  overallChangePercent: number | null;
}

export interface CoachInsightFlag {
  id: string;
  type: "strength" | "mistake";
  category: "confluence" | "strategy" | "time" | "rules" | "hesitation";
  severity?: "high" | "medium" | "info";
  title: string;
  description: string;
  metricHighlight?: string;
  ratio?: number;
}

export interface AdvancedAnalyticsSummary {
  totalAllTrades: number;
  activeTradesCount: number;
  missedEntriesCount: number;
  noTradeDaysCount: number;
  overallWinRate: number | null;
  overallAvgR: number | null;
  overallExpectancy: number | null;
  totalGrossPnl: number;
  avgConfluenceMatch: number | null;
  gradeableTradesCount: number;
  strengths: CoachInsightFlag[];
  mistakes: CoachInsightFlag[];
  strategyComparison: StrategyPerformanceComparisonItem[];
  disciplineVsOutcome: DisciplineVsOutcomeResult;
  missedOpportunities: MissedOpportunityBreakdown;
  adherenceTrend: PlaybookAdherenceTrendResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [
  { day: 0, dayName: "Sunday", shortName: "Sun" },
  { day: 1, dayName: "Monday", shortName: "Mon" },
  { day: 2, dayName: "Tuesday", shortName: "Tue" },
  { day: 3, dayName: "Wednesday", shortName: "Wed" },
  { day: 4, dayName: "Thursday", shortName: "Thu" },
  { day: 5, dayName: "Friday", shortName: "Fri" },
  { day: 6, dayName: "Saturday", shortName: "Sat" },
];

/**
 * Resolves confluence match percentage for a trade given a strategy mapping.
 */
export function getTradeConfluenceMatchPercent(
  trade: TradeEntity,
  strategyMap?: Map<string, { id: string; name: string; confluences: Array<{ id: string; name: string }> }>
): number | null {
  const stratId = trade.strategyId;
  if (!stratId) return null;

  const strat = strategyMap?.get(stratId);
  const stratConfluenceIds = (strat?.confluences || trade.strategy?.confluences || []).map((c) => c.id);
  const tradeConfluenceIds = (trade.confluences || []).map((c) => c.id);

  const match = calculateConfluenceMatch(tradeConfluenceIds, stratConfluenceIds);
  return match !== null ? match.percent : null;
}

/**
 * Builds a Strategy Map from an array of strategies or trade nested relations.
 */
export function buildStrategyMap(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): Map<string, { id: string; name: string; confluences: Array<{ id: string; name: string }> }> {
  const map = new Map<
    string,
    { id: string; name: string; confluences: Array<{ id: string; name: string }> }
  >();

  if (strategies) {
    strategies.forEach((s) => {
      map.set(s.id, {
        id: s.id,
        name: s.name,
        confluences: s.confluences || [],
      });
    });
  }

  trades.forEach((t) => {
    if (t.strategyId && t.strategy && !map.has(t.strategyId)) {
      map.set(t.strategyId, {
        id: t.strategyId,
        name: t.strategy.name,
        confluences: t.strategy.confluences || [],
      });
    }
  });

  return map;
}

function computeDisciplineStats(trades: TradeEntity[]): StrategyDisciplineStats {
  const active = trades.filter((t) => t.outcomeType === "trade" || !t.outcomeType);
  const evaluated = active.filter(
    (t) => t.result === "win" || t.result === "loss" || t.result === "breakeven"
  );
  const wins = evaluated.filter((t) => t.result === "win");
  const losses = evaluated.filter((t) => t.result === "loss");
  const breakevens = evaluated.filter((t) => t.result === "breakeven");

  const winRate =
    evaluated.length > 0
      ? Math.round((wins.length / evaluated.length) * 1000) / 10
      : null;

  const tradesWithR = active.filter((t) => t.rMultiple !== null && t.rMultiple !== undefined);
  const avgR =
    tradesWithR.length > 0
      ? Math.round(
          (tradesWithR.reduce((sum, t) => sum + Number(t.rMultiple), 0) /
            tradesWithR.length) *
            100
        ) / 100
      : null;

  const totalPnl = active.reduce((sum, t) => sum + Number(t.grossPnl || 0), 0);
  const expectancy = calculateExpectancy(active).expectancy;

  return {
    count: active.length,
    evaluatedCount: evaluated.length,
    winCount: wins.length,
    lossCount: losses.length,
    breakevenCount: breakevens.length,
    winRate,
    avgR,
    expectancy,
    totalPnl,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. calculateStrategyPerformanceComparison
// ─────────────────────────────────────────────────────────────────────────────

export function calculateStrategyPerformanceComparison(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): StrategyPerformanceComparisonItem[] {
  const stratMap = buildStrategyMap(trades, strategies);

  interface StrategyGroup {
    strategyId: string;
    strategyName: string;
    allTrades: TradeEntity[];
    highMatchTrades: TradeEntity[];
    lowMatchTrades: TradeEntity[];
    matchScores: number[];
    perfectCount: number;
  }

  const groups = new Map<string, StrategyGroup>();

  stratMap.forEach((strat, id) => {
    groups.set(id, {
      strategyId: id,
      strategyName: strat.name,
      allTrades: [],
      highMatchTrades: [],
      lowMatchTrades: [],
      matchScores: [],
      perfectCount: 0,
    });
  });

  trades.forEach((trade) => {
    const stratId = trade.strategyId || "unassigned";
    const stratName =
      (trade.strategyId && stratMap.get(trade.strategyId)?.name) ||
      trade.strategy?.name ||
      trade.setupModel ||
      (stratId === "unassigned" ? "Custom / Unassigned" : "Unknown Strategy");

    if (!groups.has(stratId)) {
      groups.set(stratId, {
        strategyId: stratId,
        strategyName: stratName,
        allTrades: [],
        highMatchTrades: [],
        lowMatchTrades: [],
        matchScores: [],
        perfectCount: 0,
      });
    }

    const group = groups.get(stratId)!;
    group.allTrades.push(trade);

    const matchPercent = getTradeConfluenceMatchPercent(trade, stratMap);
    if (matchPercent !== null) {
      group.matchScores.push(matchPercent);
      if (matchPercent >= 100) {
        group.perfectCount++;
      }
      if (matchPercent >= 80) {
        group.highMatchTrades.push(trade);
      } else {
        group.lowMatchTrades.push(trade);
      }
    }
  });

  const results: StrategyPerformanceComparisonItem[] = [];

  groups.forEach((g) => {
    if (g.allTrades.length === 0) return;

    const activeTrades = g.allTrades.filter(
      (t) => t.outcomeType === "trade" || !t.outcomeType
    );
    const evaluated = activeTrades.filter(
      (t) => t.result === "win" || t.result === "loss" || t.result === "breakeven"
    );
    const wins = evaluated.filter((t) => t.result === "win");
    const losses = evaluated.filter((t) => t.result === "loss");
    const breakevens = evaluated.filter((t) => t.result === "breakeven");

    const winRate =
      evaluated.length > 0
        ? Math.round((wins.length / evaluated.length) * 1000) / 10
        : null;

    const tradesWithR = activeTrades.filter(
      (t) => t.rMultiple !== null && t.rMultiple !== undefined
    );
    const avgR =
      tradesWithR.length > 0
        ? Math.round(
            (tradesWithR.reduce((sum, t) => sum + Number(t.rMultiple), 0) /
              tradesWithR.length) *
              100
          ) / 100
        : null;

    const totalPnl = activeTrades.reduce((sum, t) => sum + Number(t.grossPnl || 0), 0);
    const expectancy = calculateExpectancy(activeTrades).expectancy;

    const avgConfluenceMatch =
      g.matchScores.length > 0
        ? Math.round(
            (g.matchScores.reduce((a, b) => a + b, 0) / g.matchScores.length) * 10
          ) / 10
        : null;

    const highMatchStats = computeDisciplineStats(g.highMatchTrades);
    const lowMatchStats = computeDisciplineStats(g.lowMatchTrades);

    const winRateDiff =
      highMatchStats.winRate !== null && lowMatchStats.winRate !== null
        ? Math.round((highMatchStats.winRate - lowMatchStats.winRate) * 10) / 10
        : null;

    const avgRDiff =
      highMatchStats.avgR !== null && lowMatchStats.avgR !== null
        ? Math.round((highMatchStats.avgR - lowMatchStats.avgR) * 100) / 100
        : null;

    const expectancyDiff =
      highMatchStats.expectancy !== null && lowMatchStats.expectancy !== null
        ? Math.round((highMatchStats.expectancy - lowMatchStats.expectancy) * 100) / 100
        : null;

    results.push({
      strategyId: g.strategyId,
      strategyName: g.strategyName,
      totalTrades: g.allTrades.length,
      activeTradesCount: activeTrades.length,
      evaluatedCount: evaluated.length,
      winCount: wins.length,
      lossCount: losses.length,
      breakevenCount: breakevens.length,
      winRate,
      expectancy,
      avgR,
      totalPnl,
      gradeableCount: g.matchScores.length,
      avgConfluenceMatch,
      perfectMatchCount: g.perfectCount,
      highMatchStats,
      lowMatchStats,
      disciplineImpact: {
        winRateDiff,
        avgRDiff,
        expectancyDiff,
      },
    });
  });

  return results.sort((a, b) => b.totalTrades - a.totalTrades);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. calculateDisciplineVsOutcome
// ─────────────────────────────────────────────────────────────────────────────

export function calculateDisciplineVsOutcome(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): DisciplineVsOutcomeResult {
  const stratMap = buildStrategyMap(trades, strategies);

  const bucketDefs: Array<{
    bucket: "100%+" | "80-99%" | "50-79%" | "<50%";
    label: string;
    min: number;
    max: number;
    matches: (p: number) => boolean;
  }> = [
    {
      bucket: "100%+",
      label: "100%+ (Full Playbook)",
      min: 100,
      max: 100,
      matches: (p) => p >= 100,
    },
    {
      bucket: "80-99%",
      label: "80% – 99% (High Discipline)",
      min: 80,
      max: 99,
      matches: (p) => p >= 80 && p < 100,
    },
    {
      bucket: "50-79%",
      label: "50% – 79% (Partial Match)",
      min: 50,
      max: 79,
      matches: (p) => p >= 50 && p < 80,
    },
    {
      bucket: "<50%",
      label: "< 50% (Low / Forced Entry)",
      min: 0,
      max: 49,
      matches: (p) => p < 50,
    },
  ];

  const bucketTradesMap = new Map<string, TradeEntity[]>();
  bucketDefs.forEach((b) => bucketTradesMap.set(b.bucket, []));

  let totalGradeable = 0;
  const highMatchTrades: TradeEntity[] = [];
  const lowMatchTrades: TradeEntity[] = [];

  trades.forEach((trade) => {
    const match = getTradeConfluenceMatchPercent(trade, stratMap);
    if (match === null) return;

    totalGradeable++;
    if (match >= 80) {
      highMatchTrades.push(trade);
    } else {
      lowMatchTrades.push(trade);
    }

    for (const def of bucketDefs) {
      if (def.matches(match)) {
        bucketTradesMap.get(def.bucket)!.push(trade);
        break;
      }
    }
  });

  const buckets: DisciplineBucket[] = bucketDefs.map((def) => {
    const bTrades = bucketTradesMap.get(def.bucket) || [];
    const stats = computeDisciplineStats(bTrades);

    return {
      bucket: def.bucket,
      label: def.label,
      minPercent: def.min,
      maxPercent: def.max,
      totalTrades: bTrades.length,
      evaluatedCount: stats.evaluatedCount,
      winCount: stats.winCount,
      lossCount: stats.lossCount,
      breakevenCount: stats.breakevenCount,
      winRate: stats.winRate,
      avgR: stats.avgR,
      expectancy: stats.expectancy,
      totalPnl: stats.totalPnl,
    };
  });

  const highStats = computeDisciplineStats(highMatchTrades);
  const lowStats = computeDisciplineStats(lowMatchTrades);

  let summaryInsight: string | null = null;
  if (highStats.evaluatedCount >= 3 && lowStats.evaluatedCount >= 3) {
    const winRateDiff =
      highStats.winRate !== null && lowStats.winRate !== null
        ? Math.round(highStats.winRate - lowStats.winRate)
        : null;

    if (winRateDiff !== null && winRateDiff > 0) {
      summaryInsight = `Trades with high confluence adherence (≥80%) have a ${highStats.winRate}% win rate (+${winRateDiff}% vs low adherence).`;
    } else if (winRateDiff !== null && winRateDiff < 0) {
      summaryInsight = `High confluence trades (≥80%) currently show a ${highStats.winRate}% win rate vs ${lowStats.winRate}% on low confluence trades.`;
    }
  }

  return {
    buckets,
    totalGradeableTrades: totalGradeable,
    highMatchWinRate: highStats.winRate,
    lowMatchWinRate: lowStats.winRate,
    highMatchAvgR: highStats.avgR,
    lowMatchAvgR: lowStats.avgR,
    summaryInsight,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. calculateMissedOpportunityCost
// ─────────────────────────────────────────────────────────────────────────────

export function calculateMissedOpportunityCost(
  trades: TradeEntity[]
): MissedOpportunityBreakdown {
  const missedTrades = trades.filter((t) => t.outcomeType === "missed_entry");
  const noTradeRecords = trades.filter((t) => t.outcomeType === "no_trade");

  const stratCounts = new Map<string, { id: string | null; name: string; count: number }>();
  missedTrades.forEach((t) => {
    const id = t.strategyId || null;
    const name = t.strategy?.name || t.setupModel || "Unassigned Strategy";
    const key = id || name;

    const existing = stratCounts.get(key) || { id, name, count: 0 };
    existing.count++;
    stratCounts.set(key, existing);
  });

  const missedByStrategy = Array.from(stratCounts.values())
    .map((s) => ({
      strategyId: s.id,
      strategyName: s.name,
      count: s.count,
      percent:
        missedTrades.length > 0
          ? Math.round((s.count / missedTrades.length) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const hourCounts = new Array(24).fill(0);
  missedTrades.forEach((t) => {
    const date = new Date(t.entryAt);
    const hour = date.getHours();
    if (hour >= 0 && hour < 24) {
      hourCounts[hour]++;
    }
  });

  const missedByHour = hourCounts.map((count, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, "0")}:00`,
    count,
  }));

  const dayCounts = new Array(7).fill(0);
  missedTrades.forEach((t) => {
    const day = new Date(t.entryAt).getDay();
    dayCounts[day]++;
  });

  const missedByDayOfWeek = DAYS.map((d) => ({
    day: d.day,
    dayName: d.dayName,
    shortName: d.shortName,
    count: dayCounts[d.day],
  }));

  const topHesitationSetup = missedByStrategy.length > 0 ? missedByStrategy[0].strategyName : null;

  const maxHour = missedByHour.reduce(
    (max, cur) => (cur.count > max.count ? cur : max),
    { hour: 0, label: "00:00", count: 0 }
  );
  const topHesitationHour = maxHour.count > 0 ? maxHour.label : null;

  const maxDay = missedByDayOfWeek.reduce(
    (max, cur) => (cur.count > max.count ? cur : max),
    { day: 0, dayName: "None", shortName: "None", count: 0 }
  );
  const topHesitationDay = maxDay.count > 0 ? maxDay.dayName : null;

  const noTradeDayCounts = new Array(7).fill(0);
  noTradeRecords.forEach((t) => {
    const day = new Date(t.entryAt).getDay();
    noTradeDayCounts[day]++;
  });

  const noTradeByDayOfWeek = DAYS.map((d) => ({
    day: d.day,
    dayName: d.dayName,
    shortName: d.shortName,
    count: noTradeDayCounts[d.day],
  }));

  const themeKeywords = [
    { theme: "News & Macro Event", pattern: /news|cpi|fomc|nfp|fed|powell|gdp/i },
    { theme: "Low Volatility / Chop", pattern: /chop|consolidation|slow|low vol|tight|flat|dead/i },
    { theme: "No Setup / Criteria", pattern: /no setup|criteria|no entry|wait|invalid|conditions/i },
    { theme: "Discipline / Mental", pattern: /discipline|tired|patience|emotions|fomo|rest|off/i },
    { theme: "Spread / Liquidity", pattern: /spread|liquidity|slippage|holiday|weekend/i },
  ];

  const themeCounts = new Map<string, number>();
  themeKeywords.forEach((tk) => themeCounts.set(tk.theme, 0));
  let otherReasons = 0;

  noTradeRecords.forEach((t) => {
    const text = (t.reasonNotes || t.notes || "").trim();
    if (!text) return;

    let matched = false;
    for (const tk of themeKeywords) {
      if (tk.pattern.test(text)) {
        themeCounts.set(tk.theme, (themeCounts.get(tk.theme) || 0) + 1);
        matched = true;
      }
    }
    if (!matched) {
      otherReasons++;
    }
  });

  const noTradeCommonThemes = Array.from(themeCounts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  if (otherReasons > 0) {
    noTradeCommonThemes.push({ theme: "Custom / Specific Reasons", count: otherReasons });
  }

  const recentNoTradeRecords = noTradeRecords
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      date: new Date(t.entryAt),
      reason: (t.reasonNotes || t.notes || "No trade recorded").trim(),
      sessionName: t.setupModel || undefined,
    }));

  return {
    totalMissedEntries: missedTrades.length,
    totalNoTradeDays: noTradeRecords.length,
    missedByStrategy,
    missedByHour,
    missedByDayOfWeek,
    topHesitationSetup,
    topHesitationHour,
    topHesitationDay,
    noTradeByDayOfWeek,
    noTradeCommonThemes,
    recentNoTradeRecords,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. calculatePlaybookAdherenceTrend
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePlaybookAdherenceTrend(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): PlaybookAdherenceTrendResult {
  const stratMap = buildStrategyMap(trades, strategies);

  interface GradeableTradeItem {
    trade: TradeEntity;
    date: Date;
    matchPercent: number;
  }

  const gradeableTrades: GradeableTradeItem[] = [];

  trades.forEach((trade) => {
    const match = getTradeConfluenceMatchPercent(trade, stratMap);
    if (match !== null) {
      gradeableTrades.push({
        trade,
        date: new Date(trade.entryAt),
        matchPercent: match,
      });
    }
  });

  gradeableTrades.sort((a, b) => a.date.getTime() - b.date.getTime());

  const thresholdRequired = 10;
  if (gradeableTrades.length < thresholdRequired) {
    return {
      hasSufficientData: false,
      totalGradeableTrades: gradeableTrades.length,
      thresholdRequired,
      message: `At least ${thresholdRequired} gradeable trades are required to establish a meaningful adherence trend line (currently ${gradeableTrades.length}/${thresholdRequired}).`,
      points: [],
      overallAvgMatch:
        gradeableTrades.length > 0
          ? Math.round(
              (gradeableTrades.reduce((acc, cur) => acc + cur.matchPercent, 0) /
                gradeableTrades.length) *
                10
            ) / 10
          : null,
      trendDirection: "insufficient_data",
      overallChangePercent: null,
    };
  }

  const periodMap = new Map<
    string,
    {
      periodKey: string;
      label: string;
      date: string;
      scores: number[];
      perfectCount: number;
    }
  >();

  gradeableTrades.forEach((item) => {
    const d = item.date;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");

    const oneJan = new Date(d.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
    const periodKey = `${year}-W${weekNum.toString().padStart(2, "0")}`;
    const label = `${month}/${day}`;

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        periodKey,
        label,
        date: `${year}-${month}-${day}`,
        scores: [],
        perfectCount: 0,
      });
    }

    const entry = periodMap.get(periodKey)!;
    entry.scores.push(item.matchPercent);
    if (item.matchPercent >= 100) {
      entry.perfectCount++;
    }
  });

  const rawPoints: AdherenceTrendPoint[] = Array.from(periodMap.values()).map((p) => {
    const avg = Math.round((p.scores.reduce((a, b) => a + b, 0) / p.scores.length) * 10) / 10;
    return {
      periodKey: p.periodKey,
      label: p.label,
      date: p.date,
      avgMatchPercent: avg,
      tradeCount: p.scores.length,
      perfectMatchCount: p.perfectCount,
    };
  });

  const points: AdherenceTrendPoint[] = rawPoints.map((pt, idx, arr) => {
    const windowStart = Math.max(0, idx - 2);
    const windowPts = arr.slice(windowStart, idx + 1);
    const rollingAvg =
      Math.round(
        (windowPts.reduce((sum, p) => sum + p.avgMatchPercent, 0) / windowPts.length) * 10
      ) / 10;

    return {
      ...pt,
      rollingAvgMatch: rollingAvg,
    };
  });

  const totalSum = gradeableTrades.reduce((acc, cur) => acc + cur.matchPercent, 0);
  const overallAvgMatch = Math.round((totalSum / gradeableTrades.length) * 10) / 10;

  const splitSize = Math.max(3, Math.floor(gradeableTrades.length / 3));
  const earliestSlice = gradeableTrades.slice(0, splitSize);
  const latestSlice = gradeableTrades.slice(-splitSize);

  const earliestAvg =
    earliestSlice.reduce((acc, cur) => acc + cur.matchPercent, 0) / earliestSlice.length;
  const latestAvg =
    latestSlice.reduce((acc, cur) => acc + cur.matchPercent, 0) / latestSlice.length;

  const diff = Math.round((latestAvg - earliestAvg) * 10) / 10;

  let trendDirection: "improving" | "declining" | "stable" = "stable";
  if (diff >= 5) {
    trendDirection = "improving";
  } else if (diff <= -5) {
    trendDirection = "declining";
  }

  return {
    hasSufficientData: true,
    totalGradeableTrades: gradeableTrades.length,
    thresholdRequired,
    points,
    overallAvgMatch,
    trendDirection,
    overallChangePercent: diff,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. calculateTopMistakePatterns
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTopMistakePatterns(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): CoachInsightFlag[] {
  const stratMap = buildStrategyMap(trades, strategies);
  const activeTrades = trades.filter((t) => t.outcomeType === "trade" || !t.outcomeType);
  const evaluatedTrades = activeTrades.filter(
    (t) => t.result === "win" || t.result === "loss" || t.result === "breakeven"
  );
  const losses = evaluatedTrades.filter((t) => t.result === "loss");

  const flags: CoachInsightFlag[] = [];

  if (losses.length < 3 || evaluatedTrades.length < 5) {
    return [
      {
        id: "insufficient_loss_data",
        type: "mistake",
        category: "confluence",
        severity: "info",
        title: "Clean Record / Low Loss Volume",
        description: "Not enough losing trades recorded yet to identify recurring mistake patterns. Keep journaling execution details.",
        metricHighlight: `${losses.length} losses`,
      },
    ];
  }

  // 1. Low Confluence Match Overrepresentation
  let totalGradeableLosses = 0;
  let lowMatchLosses = 0;
  let totalGradeable = 0;
  let totalLowMatch = 0;

  evaluatedTrades.forEach((t) => {
    const match = getTradeConfluenceMatchPercent(t, stratMap);
    if (match !== null) {
      totalGradeable++;
      if (match < 50) totalLowMatch++;
      if (t.result === "loss") {
        totalGradeableLosses++;
        if (match < 50) lowMatchLosses++;
      }
    }
  });

  if (totalGradeableLosses >= 2 && totalLowMatch > 0) {
    const lossPct = (lowMatchLosses / totalGradeableLosses) * 100;
    const baselinePct = (totalLowMatch / totalGradeable) * 100;
    const ratio = baselinePct > 0 ? Math.round((lossPct / baselinePct) * 10) / 10 : 1;

    if (lossPct >= 40 || ratio >= 1.4) {
      flags.push({
        id: "mistake_low_confluence",
        type: "mistake",
        category: "confluence",
        severity: "high",
        title: "Forced Trades Under 50% Confluence",
        description: `${Math.round(lossPct)}% of your losses occur when setup confluence match is under 50% (${ratio}x baseline overrepresentation).`,
        metricHighlight: `${Math.round(lossPct)}% of losses`,
        ratio,
      });
    }
  }

  // 2. Strategy Overrepresentation in Losses
  const stratTotalMap = new Map<string, { name: string; total: number; losses: number }>();
  evaluatedTrades.forEach((t) => {
    const name = t.strategy?.name || t.setupModel || "Unassigned";
    const cur = stratTotalMap.get(name) || { name, total: 0, losses: 0 };
    cur.total++;
    if (t.result === "loss") cur.losses++;
    stratTotalMap.set(name, cur);
  });

  stratTotalMap.forEach((entry) => {
    if (entry.losses >= 2 && entry.total >= 3) {
      const lossShare = (entry.losses / losses.length) * 100;
      const tradeShare = (entry.total / evaluatedTrades.length) * 100;
      const ratio = tradeShare > 0 ? Math.round((lossShare / tradeShare) * 10) / 10 : 1;

      if (lossShare >= 35 && ratio >= 1.3) {
        flags.push({
          id: `mistake_strat_${entry.name}`,
          type: "mistake",
          category: "strategy",
          severity: "high",
          title: `High Loss Concentration in ${entry.name}`,
          description: `Strategy '${entry.name}' accounts for ${Math.round(lossShare)}% of all losses despite being only ${Math.round(tradeShare)}% of your trades.`,
          metricHighlight: `${entry.losses} losses (${Math.round(lossShare)}%)`,
          ratio,
        });
      }
    }
  });

  // 3. Day of Week Clustering in Losses
  const dayLossMap = new Map<number, { dayName: string; total: number; losses: number }>();
  DAYS.forEach((d) => dayLossMap.set(d.day, { dayName: d.dayName, total: 0, losses: 0 }));

  evaluatedTrades.forEach((t) => {
    const day = new Date(t.entryAt).getDay();
    const cur = dayLossMap.get(day)!;
    cur.total++;
    if (t.result === "loss") cur.losses++;
  });

  dayLossMap.forEach((entry) => {
    if (entry.losses >= 2 && entry.total >= 3) {
      const lossShare = (entry.losses / losses.length) * 100;
      const tradeShare = (entry.total / evaluatedTrades.length) * 100;
      const ratio = tradeShare > 0 ? Math.round((lossShare / tradeShare) * 10) / 10 : 1;

      if (lossShare >= 30 && ratio >= 1.4) {
        flags.push({
          id: `mistake_day_${entry.dayName}`,
          type: "mistake",
          category: "time",
          severity: "medium",
          title: `Losses Cluster on ${entry.dayName}s`,
          description: `${Math.round(lossShare)}% of your losses cluster on ${entry.dayName}s (${ratio}x overrepresented vs typical trading activity).`,
          metricHighlight: `${entry.losses} losses on ${entry.dayName}`,
          ratio,
        });
      }
    }
  });

  // 4. Rule Compliance Breakdown in Losses
  let ruleTrackedLosses = 0;
  let ruleBrokenLosses = 0;
  evaluatedTrades.forEach((t) => {
    if (t.rulesFollowed !== null && t.rulesFollowed !== undefined) {
      if (t.result === "loss") {
        ruleTrackedLosses++;
        if (t.rulesFollowed === false) {
          ruleBrokenLosses++;
        }
      }
    }
  });

  if (ruleTrackedLosses >= 3 && ruleBrokenLosses >= 2) {
    const pct = Math.round((ruleBrokenLosses / ruleTrackedLosses) * 100);
    if (pct >= 40) {
      flags.push({
        id: "mistake_rules_broken",
        type: "mistake",
        category: "rules",
        severity: "high",
        title: "Discipline Lapses Precede Losses",
        description: `${pct}% of evaluated losses coincided with broken execution rules or unchecked criteria.`,
        metricHighlight: `${pct}% rule violation in losses`,
      });
    }
  }

  // 5. Hesitation / Missed Entries cost
  const missedCount = trades.filter((t) => t.outcomeType === "missed_entry").length;
  if (missedCount >= 3) {
    flags.push({
      id: "mistake_hesitation_freq",
      type: "mistake",
      category: "hesitation",
      severity: "medium",
      title: "Hesitation Frequency",
      description: `You logged ${missedCount} missed entries where setups presented valid criteria but entry was avoided or delayed.`,
      metricHighlight: `${missedCount} missed setups`,
    });
  }

  if (flags.length === 0) {
    flags.push({
      id: "mistake_baseline",
      type: "mistake",
      category: "confluence",
      severity: "info",
      title: "Well-Distributed Risk",
      description: "Losses are evenly distributed across setups and times without major systemic clustering.",
      metricHighlight: "Balanced",
    });
  }

  const severityScore = { high: 3, medium: 2, info: 1 };
  return flags
    .sort((a, b) => (severityScore[b.severity || "info"] || 0) - (severityScore[a.severity || "info"] || 0))
    .slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. calculateTopStrengthPatterns
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTopStrengthPatterns(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): CoachInsightFlag[] {
  const stratMap = buildStrategyMap(trades, strategies);
  const activeTrades = trades.filter((t) => t.outcomeType === "trade" || !t.outcomeType);
  const evaluatedTrades = activeTrades.filter(
    (t) => t.result === "win" || t.result === "loss" || t.result === "breakeven"
  );
  const wins = evaluatedTrades.filter((t) => t.result === "win");
  const highRTrades = activeTrades.filter((t) => Number(t.rMultiple || 0) >= 2.0);

  const flags: CoachInsightFlag[] = [];

  if (wins.length < 2 || evaluatedTrades.length < 3) {
    return [
      {
        id: "insufficient_win_data",
        type: "strength",
        category: "strategy",
        severity: "info",
        title: "Building Sample Size",
        description: "Continue journaling setups to establish validated statistical strengths and high-expectancy patterns.",
        metricHighlight: `${wins.length} wins`,
      },
    ];
  }

  // 1. High Confluence Win Rate & R
  const highMatchTrades: TradeEntity[] = [];
  evaluatedTrades.forEach((t) => {
    const match = getTradeConfluenceMatchPercent(t, stratMap);
    if (match !== null && match >= 80) {
      highMatchTrades.push(t);
    }
  });

  if (highMatchTrades.length >= 3) {
    const highWins = highMatchTrades.filter((t) => t.result === "win");
    const winRate = Math.round((highWins.length / highMatchTrades.length) * 100);

    const highWithR = highMatchTrades.filter((t) => t.rMultiple !== null);
    const avgR =
      highWithR.length > 0
        ? Math.round(
            (highWithR.reduce((sum, t) => sum + Number(t.rMultiple), 0) / highWithR.length) * 100
          ) / 100
        : null;

    if (winRate >= 50) {
      flags.push({
        id: "strength_high_confluence",
        type: "strength",
        category: "confluence",
        title: "High Playbook Adherence Edge",
        description: `When adhering to ≥80% playbook confluences, your win rate reaches ${winRate}%${
          avgR !== null ? ` with an average of +${avgR}R per trade` : ""
        }.`,
        metricHighlight: `${winRate}% Win Rate (≥80% Confluence)`,
      });
    }
  }

  // 2. Highest-R Trades Confluence Quality
  if (highRTrades.length >= 2) {
    const highRMatches: number[] = [];
    highRTrades.forEach((t) => {
      const match = getTradeConfluenceMatchPercent(t, stratMap);
      if (match !== null) highRMatches.push(match);
    });

    if (highRMatches.length >= 2) {
      const avgMatch = Math.round(highRMatches.reduce((a, b) => a + b, 0) / highRMatches.length);
      if (avgMatch >= 75) {
        flags.push({
          id: "strength_high_r_quality",
          type: "strength",
          category: "confluence",
          title: "Outsized Winners Follow The Rules",
          description: `Your highest-R trades (≥2R) average ${avgMatch}% confluence match, showing your largest gains come from disciplined execution.`,
          metricHighlight: `${avgMatch}% Avg Confluence on ≥2R`,
        });
      }
    }
  }

  // 3. Top Expectancy Strategy
  const stratStats = calculateStrategyPerformanceComparison(activeTrades, strategies);
  const bestStrat = stratStats
    .filter((s) => s.evaluatedCount >= 2 && s.expectancy !== null && s.expectancy > 0)
    .sort((a, b) => (b.expectancy || 0) - (a.expectancy || 0))[0];

  if (bestStrat && bestStrat.expectancy !== null) {
    flags.push({
      id: `strength_top_strat_${bestStrat.strategyId}`,
      type: "strength",
      category: "strategy",
      title: `Top Performer: ${bestStrat.strategyName}`,
      description: `'${bestStrat.strategyName}' delivers your highest positive expectancy at +${bestStrat.expectancy}R with a ${bestStrat.winRate}% win rate across ${bestStrat.evaluatedCount} trades.`,
      metricHighlight: `+${bestStrat.expectancy}R Expectancy`,
    });
  }

  // 4. Optimal Trading Day
  const dayWinMap = new Map<number, { dayName: string; total: number; wins: number; pnl: number }>();
  DAYS.forEach((d) => dayWinMap.set(d.day, { dayName: d.dayName, total: 0, wins: 0, pnl: 0 }));

  evaluatedTrades.forEach((t) => {
    const day = new Date(t.entryAt).getDay();
    const cur = dayWinMap.get(day)!;
    cur.total++;
    if (t.result === "win") cur.wins++;
    cur.pnl += Number(t.grossPnl || 0);
  });

  const bestDay = Array.from(dayWinMap.values())
    .filter((d) => d.total >= 2 && d.wins > 0)
    .sort((a, b) => (b.wins / b.total) - (a.wins / a.total) || b.pnl - a.pnl)[0];

  if (bestDay) {
    const winRate = Math.round((bestDay.wins / bestDay.total) * 100);
    if (winRate >= 60) {
      flags.push({
        id: `strength_day_${bestDay.dayName}`,
        type: "strength",
        category: "time",
        title: `Prime Performance on ${bestDay.dayName}s`,
        description: `${bestDay.dayName}s yield your highest win rate at ${winRate}% (${bestDay.wins}/${bestDay.total} wins).`,
        metricHighlight: `${winRate}% Win Rate on ${bestDay.dayName}`,
      });
    }
  }

  // 5. Perfect Rule Compliance Edge
  const ruleFollowedTrades = evaluatedTrades.filter((t) => t.rulesFollowed === true);
  const ruleViolatedTrades = evaluatedTrades.filter((t) => t.rulesFollowed === false);

  if (ruleFollowedTrades.length >= 2 && ruleViolatedTrades.length >= 2) {
    const followedWins = ruleFollowedTrades.filter((t) => t.result === "win").length;
    const violatedWins = ruleViolatedTrades.filter((t) => t.result === "win").length;
    const fWinRate = Math.round((followedWins / ruleFollowedTrades.length) * 100);
    const vWinRate = Math.round((violatedWins / ruleViolatedTrades.length) * 100);

    if (fWinRate > vWinRate) {
      flags.push({
        id: "strength_rules_edge",
        type: "strength",
        category: "rules",
        title: "Discipline Dividend",
        description: `Trades executed with 100% rule compliance show a ${fWinRate}% win rate compared to ${vWinRate}% on rule-deviating trades.`,
        metricHighlight: `+${fWinRate - vWinRate}% Win Rate Edge`,
      });
    }
  }

  if (flags.length === 0) {
    flags.push({
      id: "strength_baseline",
      type: "strength",
      category: "strategy",
      title: "Consistent Execution Foundation",
      description: "Steady trade logging and risk execution across sessions.",
      metricHighlight: "Steady",
    });
  }

  return flags.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Full Analytics Engine
// ─────────────────────────────────────────────────────────────────────────────

export function calculateAdvancedAnalytics(
  trades: TradeEntity[],
  strategies?: Array<{ id: string; name: string; confluences?: Array<{ id: string; name: string }> }>
): AdvancedAnalyticsSummary {
  const activeTrades = trades.filter((t) => t.outcomeType === "trade" || !t.outcomeType);
  const missedTrades = trades.filter((t) => t.outcomeType === "missed_entry");
  const noTradeDays = trades.filter((t) => t.outcomeType === "no_trade");

  const evaluated = activeTrades.filter(
    (t) => t.result === "win" || t.result === "loss" || t.result === "breakeven"
  );
  const wins = evaluated.filter((t) => t.result === "win");

  const overallWinRate =
    evaluated.length > 0
      ? Math.round((wins.length / evaluated.length) * 1000) / 10
      : null;

  const tradesWithR = activeTrades.filter(
    (t) => t.rMultiple !== null && t.rMultiple !== undefined
  );
  const overallAvgR =
    tradesWithR.length > 0
      ? Math.round(
          (tradesWithR.reduce((sum, t) => sum + Number(t.rMultiple), 0) /
            tradesWithR.length) *
            100
        ) / 100
      : null;

  const overallExpectancy = calculateExpectancy(activeTrades).expectancy;
  const totalGrossPnl = activeTrades.reduce((sum, t) => sum + Number(t.grossPnl || 0), 0);

  const stratMap = buildStrategyMap(trades, strategies);
  const matchScores: number[] = [];
  trades.forEach((t) => {
    const match = getTradeConfluenceMatchPercent(t, stratMap);
    if (match !== null) matchScores.push(match);
  });

  const avgConfluenceMatch =
    matchScores.length > 0
      ? Math.round((matchScores.reduce((a, b) => a + b, 0) / matchScores.length) * 10) / 10
      : null;

  const strengths = calculateTopStrengthPatterns(trades, strategies);
  const mistakes = calculateTopMistakePatterns(trades, strategies);
  const strategyComparison = calculateStrategyPerformanceComparison(trades, strategies);
  const disciplineVsOutcome = calculateDisciplineVsOutcome(trades, strategies);
  const missedOpportunities = calculateMissedOpportunityCost(trades);
  const adherenceTrend = calculatePlaybookAdherenceTrend(trades, strategies);

  return {
    totalAllTrades: trades.length,
    activeTradesCount: activeTrades.length,
    missedEntriesCount: missedTrades.length,
    noTradeDaysCount: noTradeDays.length,
    overallWinRate,
    overallAvgR,
    overallExpectancy,
    totalGrossPnl,
    avgConfluenceMatch,
    gradeableTradesCount: matchScores.length,
    strengths,
    mistakes,
    strategyComparison,
    disciplineVsOutcome,
    missedOpportunities,
    adherenceTrend,
  };
}
