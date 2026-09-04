import { createClient } from "@/lib/supabase/server";
import {
  TradeEntity,
  calculateTradeOutcomeR,
  calculateRMultiple,
} from "./trade-analytics";
import {
  AdvancedAnalyticsSummary,
  calculateAdvancedAnalytics,
} from "./advanced-analytics";

export * from "./advanced-analytics";

/**
 * Server-side loader fetching all trades and strategies for the authenticated user.
 */
export async function getAdvancedAnalyticsData(): Promise<{
  trades: TradeEntity[];
  strategies: Array<{ id: string; name: string; confluences: Array<{ id: string; name: string }> }>;
  summary: AdvancedAnalyticsSummary;
}> {
  const supabase = await createClient();

  const [tradesRes, strategiesRes] = await Promise.all([
    supabase
      .from("Trade")
      .select(`
        *,
        session:Session(id, name, instrument, startingBalance),
        strategy:Strategy(
          id,
          name,
          strategyConfluences:StrategyConfluence(
            confluence:Confluence(*)
          )
        ),
        tradeConfluences:TradeConfluence(
          confluence:Confluence(*)
        ),
        ruleChecks:TradeRuleCheck(*, rule:Rule(id, text)),
        images:TradeImage(*)
      `)
      .order("entryAt", { ascending: true })
      .order("createdAt", { ascending: true }),
    supabase
      .from("Strategy")
      .select(`
        id,
        name,
        strategyConfluences:StrategyConfluence(
          confluence:Confluence(*)
        )
      `)
      .order("name", { ascending: true }),
  ]);

  if (tradesRes.error) {
    console.error("Error fetching trades for advanced analytics:", tradesRes.error);
  }

  const rawStrategies = strategiesRes.data || [];
  const strategies = rawStrategies.map((s: any) => {
    const rawConfluences = Array.isArray(s.strategyConfluences)
      ? s.strategyConfluences.map((sc: any) => sc.confluence).filter(Boolean)
      : [];
    return {
      id: s.id,
      name: s.name,
      confluences: rawConfluences.map((c: any) => ({ id: c.id, name: c.name })),
    };
  });

  const rawTrades = tradesRes.data || [];
  const trades: TradeEntity[] = rawTrades.map((t: any) => {
    const entryPrice = t.entryPrice !== null && t.entryPrice !== undefined ? Number(t.entryPrice) : null;
    const exitPrice = t.exitPrice !== null && t.exitPrice !== undefined ? Number(t.exitPrice) : null;
    const stopLoss = t.stopLoss !== null && t.stopLoss !== undefined ? Number(t.stopLoss) : null;
    const grossPnl = Number(t.grossPnl || 0);
    const riskAmount = t.riskAmount !== null && t.riskAmount !== undefined ? Number(t.riskAmount) : null;
    const riskPercent = t.riskPercent !== null && t.riskPercent !== undefined ? Number(t.riskPercent) : null;
    const rrAchieved = t.rrAchieved !== null && t.rrAchieved !== undefined ? Number(t.rrAchieved) : null;
    const potentialRR = t.potentialRR !== null && t.potentialRR !== undefined ? Number(t.potentialRR) : null;
    const lossR = t.lossR !== null && t.lossR !== undefined ? Number(t.lossR) : null;
    const outcomeType = (t.outcomeType as "trade" | "missed_entry" | "no_trade") || "trade";

    let derivedR: number | null = null;
    if (t.rMultiple !== null && t.rMultiple !== undefined) {
      derivedR = Number(t.rMultiple);
    } else if (outcomeType === "trade") {
      derivedR = calculateTradeOutcomeR(t.result, rrAchieved, lossR);
      if (derivedR === null && entryPrice !== null && exitPrice !== null && t.direction) {
        derivedR = calculateRMultiple(entryPrice, exitPrice, stopLoss, t.direction);
      }
    }

    const sortedImages = (Array.isArray(t.images) ? t.images : []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const rawConfluences = Array.isArray(t.tradeConfluences)
      ? t.tradeConfluences.map((tc: any) => tc.confluence).filter(Boolean)
      : [];

    const rawStratConfluences =
      t.strategy && Array.isArray(t.strategy.strategyConfluences)
        ? t.strategy.strategyConfluences.map((sc: any) => sc.confluence).filter(Boolean)
        : [];

    const stratConfluences = rawStratConfluences.map((c: any) => ({
      id: c.id,
      name: c.name,
    }));

    const confluences = rawConfluences.map((c: any) => ({
      id: c.id,
      name: c.name,
    }));

    const strategy = t.strategy
      ? {
          id: t.strategy.id,
          name: t.strategy.name,
          confluences: stratConfluences,
        }
      : null;

    return {
      id: t.id,
      sessionId: t.sessionId,
      symbol: t.symbol,
      direction: t.direction ?? null,
      entryAt: new Date(t.entryAt),
      exitAt: new Date(t.exitAt),
      entryPrice,
      exitPrice,
      stopLoss,
      rMultiple: derivedR,
      grossPnl,
      result: t.result ?? null,
      notes: t.notes ?? null,
      createdAt: new Date(t.createdAt),
      htfBias: t.htfBias ?? null,
      newsToday: t.newsToday ?? null,
      riskAmount,
      riskPercent,
      rrAchieved,
      potentialRR,
      lossR,
      beforeTradeNotes: t.beforeTradeNotes ?? null,
      reasonNotes: t.reasonNotes ?? null,
      outcomeType,
      strategyId: t.strategyId ?? null,
      strategy,
      confluences,
      drawDirection: t.drawDirection ?? null,
      setupModel: t.strategy ? t.strategy.name : (t.setupModel ?? null),
      emotionalState: t.emotionalState ?? null,
      rulesFollowed: t.rulesFollowed ?? null,
      rr: t.rr ?? (derivedR !== null ? `${derivedR > 0 ? "+" : ""}${derivedR}R` : null),
      ruleChecks: (Array.isArray(t.ruleChecks) ? t.ruleChecks : []).map((rc: any) => ({
        id: rc.id,
        tradeId: rc.tradeId,
        ruleId: rc.ruleId,
        followed: Boolean(rc.followed),
        rule: rc.rule ? { id: rc.rule.id, text: rc.rule.text } : undefined,
      })),
      images: sortedImages.map((img: any) => ({
        id: img.id,
        tradeId: img.tradeId,
        url: img.url,
        label: img.label ?? null,
        role: (img.role as "before_trade" | "outcome") || "outcome",
        createdAt: new Date(img.createdAt),
      })),
    };
  });

  const summary = calculateAdvancedAnalytics(trades, strategies);

  return {
    trades,
    strategies,
    summary,
  };
}
