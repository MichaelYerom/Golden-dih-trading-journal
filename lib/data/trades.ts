import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  RuleEntity,
  TradeEntity,
  EquityPoint,
  SessionStats,
  SessionTradesAndStats,
  CreateTradeInput,
  UpdateTradeInput,
  calculateRMultiple,
  calculateTradeOutcomeR,
  calculateTradePnL,
  calculateRiskPercent,
  calculateExpectancy,
  calculateRDistribution,
  calculateDrawdown,
  calculateStreaks,
  calculateRuleCompliance,
  calculateTimeAnalytics,
  calculateSetupPerformance,
  calculateCalendarAnalytics,
  calculateSessionConfluenceStats,
} from "./trade-analytics";

// Re-export all pure types and calculations for server callers
export * from "./trade-analytics";

export async function getSessionRules(sessionId: string): Promise<RuleEntity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Rule")
    .select("*")
    .eq("sessionId", sessionId)
    .order("createdAt", { ascending: true });

  if (error || !data) {
    console.error("Error fetching session rules:", error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    sessionId: r.sessionId,
    text: r.text,
    createdAt: new Date(r.createdAt),
  }));
}

export async function createRule(
  sessionId: string,
  text: string
): Promise<RuleEntity> {
  const supabase = await createClient();
  const ruleId = crypto.randomUUID();

  const { data, error } = await supabase
    .from("Rule")
    .insert({
      id: ruleId,
      sessionId,
      text: text.trim(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create rule");
  }

  return {
    id: data.id,
    sessionId: data.sessionId,
    text: data.text,
    createdAt: new Date(data.createdAt),
  };
}

export async function deleteRule(id: string): Promise<RuleEntity> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Rule")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to delete rule");
  }

  return {
    id: data.id,
    sessionId: data.sessionId,
    text: data.text,
    createdAt: new Date(data.createdAt),
  };
}

export async function getSessionTradesAndStats(
  sessionId: string,
  startingBalance: number,
  sessionStartDate?: Date,
  sessionEndDate?: Date
): Promise<SessionTradesAndStats> {
  const supabase = await createClient();

  const [tradesRes, rules] = await Promise.all([
    supabase
      .from("Trade")
      .select(`
        *,
        ruleChecks:TradeRuleCheck(*, rule:Rule(id, text)),
        images:TradeImage(*),
        strategy:Strategy(
          id,
          name,
          strategyConfluences:StrategyConfluence(
            confluence:Confluence(*)
          )
        ),
        tradeConfluences:TradeConfluence(
          confluence:Confluence(*)
        )
      `)
      .eq("sessionId", sessionId)
      .order("entryAt", { ascending: true })
      .order("createdAt", { ascending: true }),
    getSessionRules(sessionId),
  ]);

  if (tradesRes.error) {
    console.error("Error fetching trades:", tradesRes.error);
  }

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
        ? t.strategy.strategyConfluences
            .map((sc: any) => sc.confluence)
            .filter(Boolean)
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

  // Filter active trades for core analytics
  const activeTrades = trades.filter(
    (t) => t.outcomeType === "trade" || !t.outcomeType
  );

  const missedEntriesCount = trades.filter(
    (t) => t.outcomeType === "missed_entry"
  ).length;

  const noTradeDaysCount = trades.filter(
    (t) => t.outcomeType === "no_trade"
  ).length;

  let netPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let totalGains = 0;
  let totalLosses = 0;

  const totalTrades = activeTrades.length;

  for (const trade of activeTrades) {
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
  const expectancyData = calculateExpectancy(activeTrades);
  const rDistribution = calculateRDistribution(activeTrades);

  // Build Equity Curve across all trades chronologically
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
    const isRealTrade = trade.outcomeType === "trade" || !trade.outcomeType;
    if (isRealTrade) {
      runningBalance += trade.grossPnl;
    }

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
      tradePnl: isRealTrade ? trade.grossPnl : 0,
      symbol: trade.symbol,
      direction: trade.direction ?? undefined,
      result: trade.result ?? undefined,
      label: isRealTrade
        ? `Trade #${idx + 1} (${trade.symbol})`
        : trade.outcomeType === "missed_entry"
        ? `Missed Entry (${trade.symbol})`
        : `No Trade Day (${trade.symbol})`,
    });
  });

  // Calculate Drawdown, Streaks, Compliance, Time, Setup, and Calendar Analytics
  const drawdownDetails = calculateDrawdown(equityCurve);
  const streaks = calculateStreaks(activeTrades);
  const compliance = calculateRuleCompliance(activeTrades, rules);
  const timeAnalytics = calculateTimeAnalytics(activeTrades);
  const setupAnalytics = calculateSetupPerformance(activeTrades);
  const calendarAnalytics = calculateCalendarAnalytics(
    trades,
    sessionStartDate,
    sessionEndDate
  );
  const confluenceStats = calculateSessionConfluenceStats(trades);

  const stats: SessionStats = {
    netPnl: Math.round(netPnl * 100) / 100,
    netPnlPercent: Math.round(netPnlPercent * 100) / 100,
    winRate: Math.round(winRate * 1000) / 1000,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    totalTrades,
    winCount,
    lossCount,
    breakevenCount,
    missedEntriesCount,
    noTradeDaysCount,
    totalGains: Math.round(totalGains * 100) / 100,
    totalLosses: Math.round(totalLosses * 100) / 100,
    currentBalance: Math.round(currentBalance * 100) / 100,
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
    confluenceStats,
  };
}

export async function createTrade(data: CreateTradeInput) {
  const supabase = await createClient();
  const tradeId = crypto.randomUUID();
  const outcomeType = data.outcomeType || "trade";

  let rMultiple: number | null = null;
  let grossPnl = 0;
  let result: string | null = null;

  if (outcomeType === "missed_entry" || outcomeType === "no_trade") {
    rMultiple = null;
    grossPnl = 0;
    result = null;
  } else {
    result = data.result || "win";

    if (data.result) {
      rMultiple = calculateTradeOutcomeR(data.result, data.rrAchieved, data.lossR);
    }

    if (rMultiple === null && data.entryPrice !== undefined && data.exitPrice !== undefined && data.entryPrice !== null && data.exitPrice !== null && data.direction) {
      rMultiple = calculateRMultiple(
        data.entryPrice,
        data.exitPrice,
        data.stopLoss,
        data.direction
      );
    }

    if (data.riskAmount !== undefined && data.riskAmount !== null && rMultiple !== null) {
      grossPnl = calculateTradePnL(data.riskAmount, rMultiple);
    } else if (data.grossPnl !== undefined && data.grossPnl !== null) {
      grossPnl = Number(data.grossPnl);
    }
  }

  // Calculate and store riskPercent at time of entry if riskAmount is provided
  let calculatedRiskPercent: number | null =
    data.riskPercent !== undefined && data.riskPercent !== null
      ? Number(data.riskPercent)
      : null;

  if (calculatedRiskPercent === null && data.riskAmount && outcomeType === "trade") {
    // Fetch session starting balance + prior trades P&L up to entryAt
    const { data: sessionData } = await supabase
      .from("Session")
      .select("startingBalance")
      .eq("id", data.sessionId)
      .single();

    if (sessionData) {
      const { data: priorTrades } = await supabase
        .from("Trade")
        .select("grossPnl")
        .eq("sessionId", data.sessionId)
        .lt("entryAt", data.entryAt.toISOString());

      const priorPnl = (priorTrades || []).reduce(
        (acc: number, t: any) => acc + Number(t.grossPnl || 0),
        0
      );
      const balanceAtEntry = Number(sessionData.startingBalance || 0) + priorPnl;
      calculatedRiskPercent = calculateRiskPercent(data.riskAmount, balanceAtEntry);
    }
  }

  let finalRulesFollowed =
    typeof data.rulesFollowed === "boolean" ? data.rulesFollowed : null;

  if (data.ruleChecks && data.ruleChecks.length > 0) {
    finalRulesFollowed = data.ruleChecks.every((rc) => rc.followed);
  }

  const { data: createdTrade, error: tradeErr } = await supabase
    .from("Trade")
    .insert({
      id: tradeId,
      sessionId: data.sessionId,
      symbol: data.symbol.trim().toUpperCase(),
      direction: data.direction || null,
      entryAt: data.entryAt.toISOString(),
      exitAt: data.exitAt.toISOString(),
      entryPrice: data.entryPrice ?? null,
      exitPrice: data.exitPrice ?? null,
      stopLoss: data.stopLoss ?? null,
      rMultiple,
      grossPnl,
      result,
      notes: data.notes?.trim() || null,
      htfBias: data.htfBias?.trim() || null,
      newsToday: data.newsToday?.trim() || null,
      riskAmount: data.riskAmount !== undefined && data.riskAmount !== null ? Number(data.riskAmount) : null,
      riskPercent: calculatedRiskPercent,
      rrAchieved: data.rrAchieved !== undefined && data.rrAchieved !== null ? Number(data.rrAchieved) : null,
      potentialRR: data.potentialRR !== undefined && data.potentialRR !== null ? Number(data.potentialRR) : null,
      lossR: data.lossR !== undefined && data.lossR !== null ? Number(data.lossR) : -1,
      beforeTradeNotes: data.beforeTradeNotes?.trim() || null,
      reasonNotes: data.reasonNotes?.trim() || null,
      outcomeType,
      strategyId: data.strategyId || null,
      drawDirection: data.drawDirection?.trim() || null,
      setupModel: data.setupModel?.trim() || null,
      emotionalState: data.emotionalState?.trim() || null,
      rulesFollowed: finalRulesFollowed,
      rr: data.rr?.trim() || (rMultiple !== null ? `${rMultiple > 0 ? "+" : ""}${rMultiple}R` : null),
    })
    .select()
    .single();

  if (tradeErr || !createdTrade) {
    throw new Error(tradeErr?.message || "Failed to create trade");
  }

  // Insert Confluence associations
  if (data.confluenceIds && data.confluenceIds.length > 0) {
    const uniqueConfIds = Array.from(new Set(data.confluenceIds)).filter(Boolean);
    const confInserts = uniqueConfIds.map((confluenceId) => ({
      id: crypto.randomUUID(),
      tradeId,
      confluenceId,
    }));
    await supabase.from("TradeConfluence").insert(confInserts);
  }

  // Insert Rule checks
  if (data.ruleChecks && data.ruleChecks.length > 0) {
    const checksToInsert = data.ruleChecks.map((rc) => ({
      id: crypto.randomUUID(),
      tradeId,
      ruleId: rc.ruleId,
      followed: rc.followed,
    }));

    const { error: checksErr } = await supabase
      .from("TradeRuleCheck")
      .insert(checksToInsert);

    if (checksErr) {
      console.error("Failed to insert rule checks:", checksErr);
    }
  }

  const { data: fullTrade } = await supabase
    .from("Trade")
    .select(`
      *,
      ruleChecks:TradeRuleCheck(*, rule:Rule(*)),
      images:TradeImage(*),
      strategy:Strategy(id, name),
      tradeConfluences:TradeConfluence(confluence:Confluence(*))
    `)
    .eq("id", tradeId)
    .single();

  return fullTrade || createdTrade;
}

export async function updateTrade(id: string, data: UpdateTradeInput) {
  const supabase = await createClient();

  const { data: current, error: getErr } = await supabase
    .from("Trade")
    .select("*")
    .eq("id", id)
    .single();

  if (getErr || !current) {
    throw new Error(`Trade with id ${id} not found`);
  }

  const outcomeType = data.outcomeType !== undefined ? data.outcomeType : (current.outcomeType || "trade");
  const symbol = data.symbol !== undefined ? data.symbol.trim().toUpperCase() : current.symbol;
  const direction = data.direction !== undefined ? data.direction : current.direction;
  const entryPrice = data.entryPrice !== undefined ? data.entryPrice : current.entryPrice;
  const exitPrice = data.exitPrice !== undefined ? data.exitPrice : current.exitPrice;
  const stopLoss = data.stopLoss !== undefined ? data.stopLoss : current.stopLoss;
  const riskAmount = data.riskAmount !== undefined ? data.riskAmount : current.riskAmount;
  const rrAchieved = data.rrAchieved !== undefined ? data.rrAchieved : current.rrAchieved;
  const potentialRR = data.potentialRR !== undefined ? data.potentialRR : current.potentialRR;
  const lossR = data.lossR !== undefined ? data.lossR : (current.lossR ?? -1);

  let result = data.result !== undefined ? data.result : current.result;
  let rMultiple = current.rMultiple;
  let grossPnl = Number(current.grossPnl || 0);

  if (outcomeType === "missed_entry" || outcomeType === "no_trade") {
    rMultiple = null;
    grossPnl = 0;
    result = null;
  } else {
    if (result) {
      rMultiple = calculateTradeOutcomeR(result, rrAchieved, lossR);
    }
    if (rMultiple === null && entryPrice !== null && exitPrice !== null && direction) {
      rMultiple = calculateRMultiple(entryPrice, exitPrice, stopLoss, direction);
    }
    if (riskAmount !== null && rMultiple !== null) {
      grossPnl = calculateTradePnL(riskAmount, rMultiple);
    } else if (data.grossPnl !== undefined) {
      grossPnl = Number(data.grossPnl);
    }
  }

  let finalRulesFollowed =
    data.rulesFollowed !== undefined ? data.rulesFollowed : current.rulesFollowed;

  if (data.ruleChecks !== undefined && data.ruleChecks.length > 0) {
    finalRulesFollowed = data.ruleChecks.every((rc) => rc.followed);
  }

  const updatePayload: Record<string, any> = {
    symbol,
    direction: direction || null,
    entryPrice: entryPrice ?? null,
    exitPrice: exitPrice ?? null,
    stopLoss: stopLoss ?? null,
    rMultiple,
    grossPnl,
    result: result || null,
    outcomeType,
    rulesFollowed: finalRulesFollowed,
  };

  if (data.entryAt !== undefined) updatePayload.entryAt = data.entryAt.toISOString();
  if (data.exitAt !== undefined) updatePayload.exitAt = data.exitAt.toISOString();
  if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;
  if (data.htfBias !== undefined) updatePayload.htfBias = data.htfBias?.trim() || null;
  if (data.newsToday !== undefined) updatePayload.newsToday = data.newsToday?.trim() || null;
  if (data.riskAmount !== undefined) updatePayload.riskAmount = data.riskAmount !== null ? Number(data.riskAmount) : null;
  if (data.riskPercent !== undefined) updatePayload.riskPercent = data.riskPercent !== null ? Number(data.riskPercent) : null;
  if (data.rrAchieved !== undefined) updatePayload.rrAchieved = data.rrAchieved !== null ? Number(data.rrAchieved) : null;
  if (data.potentialRR !== undefined) updatePayload.potentialRR = data.potentialRR !== null ? Number(data.potentialRR) : null;
  if (data.lossR !== undefined) updatePayload.lossR = data.lossR !== null ? Number(data.lossR) : -1;
  if (data.beforeTradeNotes !== undefined) updatePayload.beforeTradeNotes = data.beforeTradeNotes?.trim() || null;
  if (data.reasonNotes !== undefined) updatePayload.reasonNotes = data.reasonNotes?.trim() || null;
  if (data.strategyId !== undefined) updatePayload.strategyId = data.strategyId || null;
  if (data.drawDirection !== undefined) updatePayload.drawDirection = data.drawDirection?.trim() || null;
  if (data.setupModel !== undefined) updatePayload.setupModel = data.setupModel?.trim() || null;
  if (data.emotionalState !== undefined) updatePayload.emotionalState = data.emotionalState?.trim() || null;
  if (data.rr !== undefined) updatePayload.rr = data.rr?.trim() || null;

  const { data: updatedTrade, error: updateErr } = await supabase
    .from("Trade")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (updateErr || !updatedTrade) {
    throw new Error(updateErr?.message || "Failed to update trade");
  }

  // Sync Confluences
  if (data.confluenceIds !== undefined) {
    await supabase.from("TradeConfluence").delete().eq("tradeId", id);
    const uniqueIds = Array.from(new Set(data.confluenceIds)).filter(Boolean);
    if (uniqueIds.length > 0) {
      const inserts = uniqueIds.map((confluenceId) => ({
        id: crypto.randomUUID(),
        tradeId: id,
        confluenceId,
      }));
      await supabase.from("TradeConfluence").insert(inserts);
    }
  }

  // Sync Rules
  if (data.ruleChecks !== undefined) {
    await supabase.from("TradeRuleCheck").delete().eq("tradeId", id);

    if (data.ruleChecks.length > 0) {
      const checksToInsert = data.ruleChecks.map((rc) => ({
        id: crypto.randomUUID(),
        tradeId: id,
        ruleId: rc.ruleId,
        followed: rc.followed,
      }));
      await supabase.from("TradeRuleCheck").insert(checksToInsert);
    }
  }

  const { data: fullTrade } = await supabase
    .from("Trade")
    .select(`
      *,
      ruleChecks:TradeRuleCheck(*, rule:Rule(*)),
      images:TradeImage(*),
      strategy:Strategy(id, name),
      tradeConfluences:TradeConfluence(confluence:Confluence(*))
    `)
    .eq("id", id)
    .single();

  return fullTrade || updatedTrade;
}

export async function deleteTrade(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("Trade").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "Failed to delete trade");
  }
  return { id };
}
