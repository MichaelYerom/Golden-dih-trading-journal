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
  calculateExpectancy,
  calculateRDistribution,
  calculateDrawdown,
  calculateStreaks,
  calculateRuleCompliance,
  calculateTimeAnalytics,
  calculateSetupPerformance,
  calculateCalendarAnalytics,
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
      .select("*, ruleChecks:TradeRuleCheck(*, rule:Rule(id, text)), images:TradeImage(*)")
      .eq("sessionId", sessionId)
      .order("entryAt", { ascending: true })
      .order("createdAt", { ascending: true }),
    getSessionRules(sessionId),
  ]);

  if (tradesRes.error) {
    console.error("Error fetching trades:", tradesRes.error);
  }

  const rawTrades = tradesRes.data || [];

  // Ensure rMultiple is derived if not stored, preserving backwards compatibility
  const trades: TradeEntity[] = rawTrades.map((t: any) => {
    const entryPrice = Number(t.entryPrice);
    const exitPrice = Number(t.exitPrice);
    const stopLoss = t.stopLoss !== null && t.stopLoss !== undefined ? Number(t.stopLoss) : null;
    const grossPnl = Number(t.grossPnl);
    const riskPercent = t.riskPercent !== null && t.riskPercent !== undefined ? Number(t.riskPercent) : null;

    const derivedR =
      t.rMultiple !== null && t.rMultiple !== undefined
        ? Number(t.rMultiple)
        : calculateRMultiple(entryPrice, exitPrice, stopLoss, t.direction);

    const sortedImages = (Array.isArray(t.images) ? t.images : []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      id: t.id,
      sessionId: t.sessionId,
      symbol: t.symbol,
      direction: t.direction,
      entryAt: new Date(t.entryAt),
      exitAt: new Date(t.exitAt),
      entryPrice,
      exitPrice,
      stopLoss,
      rMultiple: derivedR,
      grossPnl,
      result: t.result,
      notes: t.notes ?? null,
      createdAt: new Date(t.createdAt),
      htfBias: t.htfBias ?? null,
      newsToday: t.newsToday ?? null,
      riskPercent,
      drawDirection: t.drawDirection ?? null,
      setupModel: t.setupModel ?? null,
      emotionalState: t.emotionalState ?? null,
      rulesFollowed: t.rulesFollowed ?? null,
      rr: t.rr ?? null,
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
        createdAt: new Date(img.createdAt),
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
  const supabase = await createClient();
  const tradeId = crypto.randomUUID();

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

  const { data: createdTrade, error: tradeErr } = await supabase
    .from("Trade")
    .insert({
      id: tradeId,
      sessionId: data.sessionId,
      symbol: data.symbol.trim().toUpperCase(),
      direction: data.direction,
      entryAt: data.entryAt.toISOString(),
      exitAt: data.exitAt.toISOString(),
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
    })
    .select()
    .single();

  if (tradeErr || !createdTrade) {
    throw new Error(tradeErr?.message || "Failed to create trade");
  }

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
    .select("*, ruleChecks:TradeRuleCheck(*, rule:Rule(*)), images:TradeImage(*)")
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

  const symbol = data.symbol !== undefined ? data.symbol.trim().toUpperCase() : current.symbol;
  const direction = data.direction !== undefined ? data.direction : (current.direction as "long" | "short");
  const entryPrice = data.entryPrice !== undefined ? data.entryPrice : Number(current.entryPrice);
  const exitPrice = data.exitPrice !== undefined ? data.exitPrice : Number(current.exitPrice);
  const stopLoss =
    data.stopLoss !== undefined
      ? (data.stopLoss !== null && !isNaN(data.stopLoss) ? Number(data.stopLoss) : null)
      : (current.stopLoss !== null && current.stopLoss !== undefined ? Number(current.stopLoss) : null);

  const rMultiple = calculateRMultiple(entryPrice, exitPrice, stopLoss, direction);

  let finalRulesFollowed =
    data.rulesFollowed !== undefined ? data.rulesFollowed : current.rulesFollowed;

  if (data.ruleChecks !== undefined && data.ruleChecks.length > 0) {
    finalRulesFollowed = data.ruleChecks.every((rc) => rc.followed);
  }

  const updatePayload: Record<string, any> = {
    symbol,
    direction,
    entryPrice,
    exitPrice,
    stopLoss,
    rMultiple,
    rulesFollowed: finalRulesFollowed,
  };

  if (data.entryAt !== undefined) updatePayload.entryAt = data.entryAt.toISOString();
  if (data.exitAt !== undefined) updatePayload.exitAt = data.exitAt.toISOString();
  if (data.grossPnl !== undefined) updatePayload.grossPnl = data.grossPnl;
  if (data.result !== undefined) updatePayload.result = data.result;
  if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;
  if (data.htfBias !== undefined) updatePayload.htfBias = data.htfBias?.trim() || null;
  if (data.newsToday !== undefined) updatePayload.newsToday = data.newsToday?.trim() || null;
  if (data.riskPercent !== undefined) {
    updatePayload.riskPercent =
      data.riskPercent !== null && !isNaN(data.riskPercent) ? Number(data.riskPercent) : null;
  }
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
    .select("*, ruleChecks:TradeRuleCheck(*, rule:Rule(*)), images:TradeImage(*)")
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
