import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";
import { ConfluenceEntity } from "./confluences";
import {
  TradeEntity,
  calculateSessionConfluenceStats,
} from "./trade-analytics";

export interface StrategyChecklistItemEntity {
  id: string;
  strategyId: string;
  text: string;
  order: number;
  createdAt: Date;
}

export interface StrategyRuleEntity {
  id: string;
  strategyId: string;
  text: string;
  order: number;
  createdAt: Date;
}

export interface StrategyEntity {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  checklistCount: number;
  rulesCount: number;
  confluences: ConfluenceEntity[];
}

export interface StrategyDetailEntity extends StrategyEntity {
  checklist: StrategyChecklistItemEntity[];
  rules: StrategyRuleEntity[];
}

export interface CreateStrategyInput {
  name: string;
  description?: string | null;
  checklistItems?: string[];
  rules?: string[];
  confluenceIds?: string[];
}

export interface UpdateStrategyInput {
  name?: string;
  description?: string | null;
  checklistItems?: string[];
  rules?: string[];
  confluenceIds?: string[];
}

export async function getStrategies(): Promise<StrategyEntity[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Strategy")
    .select(`
      *,
      checklistItems:StrategyChecklistItem(id),
      rules:StrategyRule(id),
      strategyConfluences:StrategyConfluence(
        confluence:Confluence(*)
      )
    `)
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  if (error || !data) {
    console.error("Error fetching strategies:", error);
    return [];
  }

  return data.map((s: any) => {
    const rawConfluences = Array.isArray(s.strategyConfluences)
      ? s.strategyConfluences.map((sc: any) => sc.confluence).filter(Boolean)
      : [];

    const confluences: ConfluenceEntity[] = rawConfluences.map((c: any) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      createdAt: new Date(c.createdAt),
    }));

    return {
      id: s.id,
      userId: s.userId,
      name: s.name,
      description: s.description || null,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      checklistCount: Array.isArray(s.checklistItems) ? s.checklistItems.length : 0,
      rulesCount: Array.isArray(s.rules) ? s.rules.length : 0,
      confluences,
    };
  });
}

export async function getStrategyById(id: string): Promise<StrategyDetailEntity | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: s, error } = await supabase
    .from("Strategy")
    .select(`
      *,
      checklist:StrategyChecklistItem(*),
      rules:StrategyRule(*),
      strategyConfluences:StrategyConfluence(
        confluence:Confluence(*)
      )
    `)
    .eq("id", id)
    .eq("userId", user.id)
    .maybeSingle();

  if (error || !s) {
    return null;
  }

  const rawChecklist = Array.isArray(s.checklist) ? s.checklist : [];
  const checklist: StrategyChecklistItemEntity[] = rawChecklist
    .sort((a: any, b: any) => a.order - b.order)
    .map((item: any) => ({
      id: item.id,
      strategyId: item.strategyId,
      text: item.text,
      order: item.order,
      createdAt: new Date(item.createdAt),
    }));

  const rawRules = Array.isArray(s.rules) ? s.rules : [];
  const rules: StrategyRuleEntity[] = rawRules
    .sort((a: any, b: any) => a.order - b.order)
    .map((rule: any) => ({
      id: rule.id,
      strategyId: rule.strategyId,
      text: rule.text,
      order: rule.order,
      createdAt: new Date(rule.createdAt),
    }));

  const rawConfluences = Array.isArray(s.strategyConfluences)
    ? s.strategyConfluences.map((sc: any) => sc.confluence).filter(Boolean)
    : [];

  const confluences: ConfluenceEntity[] = rawConfluences.map((c: any) => ({
    id: c.id,
    userId: c.userId,
    name: c.name,
    createdAt: new Date(c.createdAt),
  }));

  return {
    id: s.id,
    userId: s.userId,
    name: s.name,
    description: s.description || null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    checklistCount: checklist.length,
    rulesCount: rules.length,
    confluences,
    checklist,
    rules,
  };
}

export async function createStrategy(data: CreateStrategyInput): Promise<StrategyDetailEntity> {
  const user = await requireUser();
  const supabase = await createClient();
  const cleanName = data.name.trim();

  if (!cleanName) {
    throw new Error("Strategy name is required.");
  }

  const strategyId = crypto.randomUUID();

  // 1. Insert Strategy row
  const { data: created, error: createErr } = await supabase
    .from("Strategy")
    .insert({
      id: strategyId,
      userId: user.id,
      name: cleanName,
      description: data.description?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (createErr || !created) {
    throw new Error(createErr?.message || "Failed to create strategy.");
  }

  // 2. Insert Checklist Items
  const checklistItems = (data.checklistItems || [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (checklistItems.length > 0) {
    const checklistInserts = checklistItems.map((text, idx) => ({
      id: crypto.randomUUID(),
      strategyId,
      text,
      order: idx + 1,
    }));
    const { error: chkErr } = await supabase
      .from("StrategyChecklistItem")
      .insert(checklistInserts);
    if (chkErr) console.error("Error inserting strategy checklist items:", chkErr);
  }

  // 3. Insert Rules
  const rules = (data.rules || [])
    .map((r) => r.trim())
    .filter(Boolean);

  if (rules.length > 0) {
    const ruleInserts = rules.map((text, idx) => ({
      id: crypto.randomUUID(),
      strategyId,
      text,
      order: idx + 1,
    }));
    const { error: ruleErr } = await supabase
      .from("StrategyRule")
      .insert(ruleInserts);
    if (ruleErr) console.error("Error inserting strategy rules:", ruleErr);
  }

  // 4. Insert Confluences
  const confluenceIds = Array.from(new Set(data.confluenceIds || [])).filter(Boolean);
  if (confluenceIds.length > 0) {
    const confInserts = confluenceIds.map((confluenceId) => ({
      id: crypto.randomUUID(),
      strategyId,
      confluenceId,
    }));
    const { error: confErr } = await supabase
      .from("StrategyConfluence")
      .insert(confInserts);
    if (confErr) console.error("Error linking strategy confluences:", confErr);
  }

  const fullStrategy = await getStrategyById(strategyId);
  if (!fullStrategy) {
    throw new Error("Strategy created but could not retrieve full details.");
  }

  return fullStrategy;
}

export async function updateStrategy(
  id: string,
  data: UpdateStrategyInput
): Promise<StrategyDetailEntity> {
  const user = await requireUser();
  const supabase = await createClient();

  const updatePayload: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) {
    const cleanName = data.name.trim();
    if (!cleanName) throw new Error("Strategy name cannot be empty.");
    updatePayload.name = cleanName;
  }

  if (data.description !== undefined) {
    updatePayload.description = data.description?.trim() || null;
  }

  // 1. Update Strategy row
  const { data: updated, error: updateErr } = await supabase
    .from("Strategy")
    .update(updatePayload)
    .eq("id", id)
    .eq("userId", user.id)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(updateErr?.message || "Failed to update strategy or unauthorized.");
  }

  // 2. Sync Checklist Items if provided
  if (data.checklistItems !== undefined) {
    await supabase.from("StrategyChecklistItem").delete().eq("strategyId", id);
    const cleanItems = data.checklistItems.map((item) => item.trim()).filter(Boolean);
    if (cleanItems.length > 0) {
      const inserts = cleanItems.map((text, idx) => ({
        id: crypto.randomUUID(),
        strategyId: id,
        text,
        order: idx + 1,
      }));
      await supabase.from("StrategyChecklistItem").insert(inserts);
    }
  }

  // 3. Sync Rules if provided
  if (data.rules !== undefined) {
    await supabase.from("StrategyRule").delete().eq("strategyId", id);
    const cleanRules = data.rules.map((r) => r.trim()).filter(Boolean);
    if (cleanRules.length > 0) {
      const inserts = cleanRules.map((text, idx) => ({
        id: crypto.randomUUID(),
        strategyId: id,
        text,
        order: idx + 1,
      }));
      await supabase.from("StrategyRule").insert(inserts);
    }
  }

  // 4. Sync Confluences if provided
  if (data.confluenceIds !== undefined) {
    await supabase.from("StrategyConfluence").delete().eq("strategyId", id);
    const uniqueIds = Array.from(new Set(data.confluenceIds)).filter(Boolean);
    if (uniqueIds.length > 0) {
      const inserts = uniqueIds.map((confluenceId) => ({
        id: crypto.randomUUID(),
        strategyId: id,
        confluenceId,
      }));
      await supabase.from("StrategyConfluence").insert(inserts);
    }
  }

  const fullStrategy = await getStrategyById(id);
  if (!fullStrategy) {
    throw new Error("Strategy updated but could not retrieve full details.");
  }

  return fullStrategy;
}

export async function deleteStrategy(id: string): Promise<{ id: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("Strategy")
    .delete()
    .eq("id", id)
    .eq("userId", user.id);

  if (error) {
    throw new Error(error.message || "Failed to delete strategy.");
  }

  return { id };
}

export interface StrategyUsageStat {
  totalTrades: number;
  gradeableTradesCount: number;
  avgMatchPercent: number | null;
  perfectMatchCount: number;
  partialMatchCount: number;
  winRate: number | null;
  expectancy: number | null;
}

/**
 * Returns cross-session aggregate stats (total trades, average match %, win rate) for all strategies owned by the user.
 */
export async function getStrategyUsageStats(): Promise<
  Record<string, StrategyUsageStat>
> {
  const supabase = await createClient();

  const strategies = await getStrategies();

  const { data: rawTrades, error } = await supabase
    .from("Trade")
    .select(`
      id,
      sessionId,
      strategyId,
      result,
      grossPnl,
      rMultiple,
      outcomeType,
      tradeConfluences:TradeConfluence(
        confluence:Confluence(id, name)
      )
    `)
    .not("strategyId", "is", null);

  const result: Record<string, StrategyUsageStat> = {};
  strategies.forEach((s) => {
    result[s.id] = {
      totalTrades: 0,
      gradeableTradesCount: 0,
      avgMatchPercent: null,
      perfectMatchCount: 0,
      partialMatchCount: 0,
      winRate: null,
      expectancy: null,
    };
  });

  if (error || !rawTrades) {
    return result;
  }

  const trades: TradeEntity[] = rawTrades.map((t: any) => {
    const rawConfluences = Array.isArray(t.tradeConfluences)
      ? t.tradeConfluences.map((tc: any) => tc.confluence).filter(Boolean)
      : [];

    return {
      id: t.id,
      sessionId: t.sessionId,
      symbol: "",
      direction: null,
      entryAt: new Date(),
      exitAt: new Date(),
      entryPrice: null,
      exitPrice: null,
      stopLoss: null,
      rMultiple:
        t.rMultiple !== null && t.rMultiple !== undefined
          ? Number(t.rMultiple)
          : null,
      grossPnl: Number(t.grossPnl || 0),
      result: t.result ?? null,
      notes: null,
      createdAt: new Date(),
      htfBias: null,
      newsToday: null,
      riskAmount: null,
      riskPercent: null,
      rrAchieved: null,
      potentialRR: null,
      lossR: null,
      beforeTradeNotes: null,
      reasonNotes: null,
      outcomeType: (t.outcomeType as any) || "trade",
      strategyId: t.strategyId,
      confluences: rawConfluences.map((c: any) => ({
        id: c.id,
        name: c.name,
      })),
      drawDirection: null,
      setupModel: null,
      emotionalState: null,
      rulesFollowed: null,
      rr: null,
    };
  });

  const sessionStats = calculateSessionConfluenceStats(trades, strategies);
  sessionStats.perStrategyStats.forEach((stat) => {
    result[stat.strategyId] = {
      totalTrades: stat.totalTrades,
      gradeableTradesCount: stat.gradeableTradesCount,
      avgMatchPercent: stat.avgMatchPercent,
      perfectMatchCount: stat.perfectMatchCount,
      partialMatchCount: stat.partialMatchCount,
      winRate: stat.winRate,
      expectancy: stat.expectancy,
    };
  });

  return result;
}

