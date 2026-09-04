import { createClient } from "@/lib/supabase/server";
import {
  LessonItem,
  LessonFilterCriteria,
  filterLessons,
} from "./lessons-analytics";

export * from "./lessons-analytics";

/**
 * Fetches all trades across all user sessions that contain reflective notes,
 * and transforms them into a chronological LessonItem list.
 */
export async function getLessonsLearned(
  filters?: LessonFilterCriteria
): Promise<LessonItem[]> {
  const supabase = await createClient();

  const { data: rawTrades, error } = await supabase
    .from("Trade")
    .select(`
      *,
      session:Session(id, name, instrument),
      strategy:Strategy(id, name),
      images:TradeImage(*)
    `)
    .order("entryAt", { ascending: false })
    .order("createdAt", { ascending: false });

  if (error || !rawTrades) {
    console.error("Error fetching lessons learned trades:", error);
    return [];
  }

  const lessons: LessonItem[] = [];

  for (const t of rawTrades) {
    const outcomeType = (t.outcomeType as "trade" | "missed_entry" | "no_trade") || "trade";

    // Determine the post-trade reflection text:
    // 1. If missed_entry or no_trade: priority is reasonNotes, fallback to notes
    // 2. If trade: priority is notes, fallback to reasonNotes
    let reflectionText = "";
    let noteType: "post_trade_review" | "missed_reason" | "no_trade_reason" = "post_trade_review";

    if (outcomeType === "missed_entry") {
      reflectionText = (t.reasonNotes || t.notes || "").trim();
      noteType = "missed_reason";
    } else if (outcomeType === "no_trade") {
      reflectionText = (t.reasonNotes || t.notes || "").trim();
      noteType = "no_trade_reason";
    } else {
      reflectionText = (t.notes || t.reasonNotes || "").trim();
      noteType = "post_trade_review";
    }

    // Exclude if empty or whitespace-only (strictly required)
    if (!reflectionText) {
      continue;
    }

    const sessionObj = Array.isArray(t.session) ? t.session[0] : t.session;
    const strategyObj = Array.isArray(t.strategy) ? t.strategy[0] : t.strategy;

    const sessionName = sessionObj?.name || "Unnamed Session";
    const sessionInstrument = sessionObj?.instrument || t.symbol || "UNKNOWN";
    const strategyName = strategyObj?.name || t.setupModel || null;

    const rMultiple =
      t.rMultiple !== null && t.rMultiple !== undefined
        ? Number(t.rMultiple)
        : null;
    const grossPnl = Number(t.grossPnl || 0);
    const riskAmount =
      t.riskAmount !== null && t.riskAmount !== undefined
        ? Number(t.riskAmount)
        : null;
    const riskPercent =
      t.riskPercent !== null && t.riskPercent !== undefined
        ? Number(t.riskPercent)
        : null;

    const sortedImages = (Array.isArray(t.images) ? t.images : []).sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    lessons.push({
      id: t.id,
      tradeId: t.id,
      sessionId: t.sessionId,
      sessionName,
      sessionInstrument,
      symbol: (t.symbol || sessionInstrument).toUpperCase().trim(),
      entryAt: new Date(t.entryAt),
      outcomeType,
      result: (t.result as "win" | "loss" | "breakeven") || null,
      direction: (t.direction as "long" | "short") || null,
      rMultiple,
      grossPnl,
      riskAmount,
      riskPercent,
      strategyId: t.strategyId || null,
      strategyName,
      note: reflectionText,
      noteType,
      rulesFollowed: t.rulesFollowed ?? null,
      htfBias: t.htfBias || null,
      emotionalState: t.emotionalState || null,
      images: sortedImages.map((img: any) => ({
        id: img.id,
        tradeId: img.tradeId,
        url: img.url,
        label: img.label ?? null,
        role: (img.role as "before_trade" | "outcome") || "outcome",
        createdAt: new Date(img.createdAt),
      })),
    });
  }

  // Apply filters if provided
  return filterLessons(lessons, filters);
}
