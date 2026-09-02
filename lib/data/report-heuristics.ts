import {
  SessionStats,
  TimeAnalyticsResult,
  SetupAnalyticsResult,
  RuleComplianceResult,
  DrawdownResult,
  TradeEntity,
} from "@/lib/data/trades";

export interface HeuristicRecommendation {
  id: string;
  category: "discipline" | "timing" | "risk" | "setup" | "execution";
  title: string;
  description: string;
  severity: "positive" | "warning" | "neutral";
}

export function generateReportRecommendations(params: {
  trades: TradeEntity[];
  stats: SessionStats;
  timeAnalytics: TimeAnalyticsResult;
  setupAnalytics: SetupAnalyticsResult;
  compliance: RuleComplianceResult;
  drawdownDetails: DrawdownResult;
}): HeuristicRecommendation[] {
  const { trades, stats, timeAnalytics, setupAnalytics, compliance, drawdownDetails } = params;
  const recommendations: HeuristicRecommendation[] = [];

  if (!trades || trades.length === 0) {
    return [
      {
        id: "no-data",
        category: "execution",
        title: "Log initial trades to generate recommendations",
        description: "As you record backtest executions, the analysis engine will detect statistical patterns in your timing, setups, and discipline.",
        severity: "neutral",
      },
    ];
  }

  // 1. RULE COMPLIANCE HEURISTIC
  if (compliance.totalTradesWithCheck > 0) {
    const followedWR = compliance.followedWinRate;
    const brokenWR = compliance.brokenWinRate;

    if (followedWR !== null && brokenWR !== null && followedWR > brokenWR + 10) {
      recommendations.push({
        id: "compliance-edge",
        category: "discipline",
        title: "Rule Adherence Directly Drives Your Edge",
        description: `Trades following all execution rules achieved a ${(followedWR * 100).toFixed(0)}% win rate compared to just ${(brokenWR * 100).toFixed(0)}% on broken rules. Eliminating rule deviations is your fastest path to higher expectancy.`,
        severity: "warning",
      });
    }

    if (compliance.worstRule) {
      recommendations.push({
        id: "worst-rule",
        category: "discipline",
        title: `Watch Rule Violations: "${compliance.worstRule.text}"`,
        description: `This rule was broken ${compliance.worstRule.brokenCount} times (${(compliance.worstRule.complianceRate * 100).toFixed(0)}% adherence). Focus specifically on confirming this condition before entering.`,
        severity: "warning",
      });
    }
  }

  // 2. TIMING & SESSION WINDOW HEURISTICS
  if (timeAnalytics.hourly.length > 0) {
    const activeHours = timeAnalytics.hourly.filter((h) => h.tradeCount >= 2);
    const worstHour = activeHours.reduce<typeof timeAnalytics.hourly[0] | null>((worst, curr) => {
      if (curr.totalPnl < 0 && (!worst || curr.totalPnl < worst.totalPnl)) return curr;
      return worst;
    }, null);

    const bestHour = activeHours.reduce<typeof timeAnalytics.hourly[0] | null>((best, curr) => {
      if (curr.totalPnl > 0 && (!best || curr.totalPnl > best.totalPnl)) return curr;
      return best;
    }, null);

    if (worstHour && worstHour.totalPnl < -50) {
      recommendations.push({
        id: "timing-hour-leak",
        category: "timing",
        title: `Reduce Exposure During ${worstHour.hourLabel}`,
        description: `The ${worstHour.hourLabel} window generated a net P&L of -$${Math.abs(worstHour.totalPnl).toFixed(0)} across ${worstHour.tradeCount} trades (Win Rate: ${worstHour.winRate !== null ? (worstHour.winRate * 100).toFixed(0) : 0}%). Consider skipping entries during this timeframe.`,
        severity: "warning",
      });
    }

    if (bestHour && bestHour.totalPnl > 100) {
      recommendations.push({
        id: "timing-hour-edge",
        category: "timing",
        title: `Prime Execution Window: ${bestHour.hourLabel}`,
        description: `Your highest performance occurs at ${bestHour.hourLabel} with +$${bestHour.totalPnl.toFixed(0)} net return and a ${(bestHour.winRate! * 100).toFixed(0)}% win rate. Prioritize setups formed in this period.`,
        severity: "positive",
      });
    }
  }

  // Day of week anomaly
  if (timeAnalytics.dayOfWeek.length > 0) {
    const activeDays = timeAnalytics.dayOfWeek.filter((d) => d.tradeCount >= 2);
    const worstDay = activeDays.find((d) => d.totalPnl < 0 && (d.winRate === null || d.winRate < 0.35));
    if (worstDay) {
      recommendations.push({
        id: "timing-day-leak",
        category: "timing",
        title: `Underperforming Weekday: ${worstDay.dayName}`,
        description: `${worstDay.dayName} executions have a low win rate of ${worstDay.winRate !== null ? (worstDay.winRate * 100).toFixed(0) : 0}% and -$${Math.abs(worstDay.totalPnl).toFixed(0)} P&L. Validate if volatility or macroeconomic news frequency degrades setups on this day.`,
        severity: "warning",
      });
    }
  }

  // 3. SETUP MODEL ANALYSIS
  if (setupAnalytics.setups.length > 1) {
    const activeSetups = setupAnalytics.setups.filter((s) => s.tradeCount >= 2);
    if (activeSetups.length > 0) {
      const topSetup = activeSetups[0];
      const bottomSetup = activeSetups[activeSetups.length - 1];

      if (topSetup && topSetup.expectancy !== null && topSetup.expectancy > 0.5) {
        recommendations.push({
          id: "setup-top-performer",
          category: "setup",
          title: `Primary Strategy: "${topSetup.setupModel}"`,
          description: `"${topSetup.setupModel}" is your top edge, producing +${topSetup.expectancy.toFixed(2)}R expectancy across ${topSetup.tradeCount} trades with ${(topSetup.winRate * 100).toFixed(0)}% win rate.`,
          severity: "positive",
        });
      }

      if (bottomSetup && bottomSetup.expectancy !== null && bottomSetup.expectancy < 0 && bottomSetup !== topSetup) {
        recommendations.push({
          id: "setup-lagging",
          category: "setup",
          title: `Refine or Prune Setup: "${bottomSetup.setupModel}"`,
          description: `"${bottomSetup.setupModel}" generated a negative expectancy of ${bottomSetup.expectancy.toFixed(2)}R across ${bottomSetup.tradeCount} trades. Review screenshots and entry criteria before trading live.`,
          severity: "warning",
        });
      }
    }
  }

  // 4. DRAWDOWN & RISK SIZING
  if (drawdownDetails.maxDrawdownPercent >= 8 || drawdownDetails.longestLosingStreak >= 4) {
    recommendations.push({
      id: "risk-drawdown-resilience",
      category: "risk",
      title: "Enforce Daily Loss Circuit Breakers",
      description: `Max drawdown reached -${drawdownDetails.maxDrawdownPercent.toFixed(1)}% with a peak consecutive losing streak of ${drawdownDetails.longestLosingStreak} trades. Capping daily risk at 2–3R will protect accumulated gains during choppy market regimes.`,
      severity: "warning",
    });
  } else if (stats.profitFactor !== null && stats.profitFactor > 1.8 && stats.totalTrades >= 5) {
    recommendations.push({
      id: "risk-healthy-profile",
      category: "risk",
      title: "Strong Profit Factor & Risk-Reward Balance",
      description: `With a profit factor of ${stats.profitFactor.toFixed(2)} and controlled drawdown (-${drawdownDetails.maxDrawdownPercent.toFixed(1)}%), your execution model demonstrates strong statistical sustainability.`,
      severity: "positive",
    });
  }

  return recommendations.slice(0, 6);
}
