"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTrade, updateTrade, deleteTrade } from "@/lib/data/trades";
import { getSessionById } from "@/lib/data/sessions";

async function saveTradeImagesFromFormData(tradeId: string, formData: FormData) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "trades", tradeId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const supabase = await createClient();

  // Helper to process specific file list with role
  const processFiles = async (
    fieldPrefix: string,
    defaultRole: "before_trade" | "outcome"
  ) => {
    const files = formData.getAll(fieldPrefix) as File[];
    const labelsJson = formData.get(`${fieldPrefix}Labels`) as string;
    let labels: string[] = [];
    try {
      if (labelsJson) labels = JSON.parse(labelsJson);
    } catch {}

    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file instanceof File && file.size > 0 && file.size <= 5 * 1024 * 1024) {
        const ext = path.extname(file.name).toLowerCase() || ".png";
        const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);
        const bytes = await file.arrayBuffer();
        await fs.promises.writeFile(filePath, Buffer.from(bytes));
        const publicUrl = `/uploads/trades/${tradeId}/${uniqueName}`;
        const label = labels[i]?.trim() || null;
        await supabase.from("TradeImage").insert({
          id: crypto.randomUUID(),
          tradeId,
          url: publicUrl,
          label,
          role: defaultRole,
        });
      }
    }
  };

  await processFiles("pendingBeforeImages", "before_trade");
  await processFiles("pendingOutcomeImages", "outcome");
  await processFiles("pendingImages", "outcome");
}

export async function createTradeAction(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const symbol = formData.get("symbol") as string;
    const outcomeType = ((formData.get("outcomeType") as string) || "trade") as
      | "trade"
      | "missed_entry"
      | "no_trade";

    const entryAtStr = formData.get("entryAt") as string;
    const exitAtStr = (formData.get("exitAt") as string) || entryAtStr;

    if (!sessionId || !symbol || !entryAtStr) {
      return { error: "Please provide session ID, symbol, and trade date/time." };
    }

    const entryAt = new Date(entryAtStr);
    const exitAt = new Date(exitAtStr);

    if (isNaN(entryAt.getTime()) || isNaN(exitAt.getTime())) {
      return { error: "Please provide a valid entry date/time." };
    }

    // Validate trade date against session date range
    const session = await getSessionById(sessionId);
    if (!session) {
      return { error: "Session not found." };
    }

    const startBoundary = new Date(session.periodStart);
    startBoundary.setHours(0, 0, 0, 0);

    const endBoundary = new Date(session.periodEnd);
    endBoundary.setHours(23, 59, 59, 999);

    if (entryAt.getTime() < startBoundary.getTime() || entryAt.getTime() > endBoundary.getTime()) {
      const formattedRange = `${session.periodStart.toISOString().slice(0, 10)} to ${session.periodEnd.toISOString().slice(0, 10)}`;
      return {
        error: `Trade date (${entryAt.toISOString().slice(0, 10)}) must fall within the session date range (${formattedRange}).`,
      };
    }

    // Strategy & Confluences
    const strategyId = (formData.get("strategyId") as string) || null;
    const confluenceIdsJson = formData.get("confluenceIdsJson") as string;
    let confluenceIds: string[] = [];
    if (confluenceIdsJson) {
      try {
        confluenceIds = JSON.parse(confluenceIdsJson);
      } catch (e) {
        console.error("Failed to parse confluenceIdsJson:", e);
      }
    }

    // Two-part notes
    const beforeTradeNotes = formData.get("beforeTradeNotes") as string;
    const reasonNotes = formData.get("reasonNotes") as string;
    const notes = formData.get("notes") as string;
    const htfBias = formData.get("htfBias") as string;
    const newsToday = formData.get("newsToday") as string;
    const drawDirection = formData.get("drawDirection") as string;
    const setupModel = formData.get("setupModel") as string;
    const emotionalState = formData.get("emotionalState") as string;
    const rr = formData.get("rr") as string;

    // R & Risk Outcome fields
    const riskAmountStr = formData.get("riskAmount") as string;
    const riskPercentStr = formData.get("riskPercent") as string;
    const rrAchievedStr = formData.get("rrAchieved") as string;
    const potentialRRStr = formData.get("potentialRR") as string;
    const lossRStr = formData.get("lossR") as string;
    const resultStr = (formData.get("result") as string)?.toLowerCase();

    // Legacy price fields (optional)
    const direction = (formData.get("direction") as string)?.toLowerCase() as "long" | "short" | undefined;
    const entryPriceStr = formData.get("entryPrice") as string;
    const exitPriceStr = formData.get("exitPrice") as string;
    const stopLossStr = formData.get("stopLoss") as string;
    const grossPnlStr = formData.get("grossPnl") as string;

    const riskAmount = riskAmountStr && !isNaN(parseFloat(riskAmountStr)) ? parseFloat(riskAmountStr) : null;
    const riskPercent = riskPercentStr && !isNaN(parseFloat(riskPercentStr)) ? parseFloat(riskPercentStr) : null;
    const rrAchieved = rrAchievedStr && !isNaN(parseFloat(rrAchievedStr)) ? parseFloat(rrAchievedStr) : null;
    const potentialRR = potentialRRStr && !isNaN(parseFloat(potentialRRStr)) ? parseFloat(potentialRRStr) : null;
    const lossR = lossRStr && !isNaN(parseFloat(lossRStr)) ? parseFloat(lossRStr) : -1;
    const entryPrice = entryPriceStr && !isNaN(parseFloat(entryPriceStr)) ? parseFloat(entryPriceStr) : null;
    const exitPrice = exitPriceStr && !isNaN(parseFloat(exitPriceStr)) ? parseFloat(exitPriceStr) : null;
    const stopLoss = stopLossStr && !isNaN(parseFloat(stopLossStr)) ? parseFloat(stopLossStr) : null;
    const grossPnl = grossPnlStr && !isNaN(parseFloat(grossPnlStr)) ? parseFloat(grossPnlStr) : undefined;

    let result: "win" | "loss" | "breakeven" | null = null;
    if (outcomeType === "trade") {
      if (resultStr === "win" || resultStr === "loss" || resultStr === "breakeven") {
        result = resultStr;
      } else {
        result = "win";
      }
    }

    const rulesFollowedValue = formData.get("rulesFollowed");
    const rulesFollowed = rulesFollowedValue === "on" || rulesFollowedValue === "true" ? true : rulesFollowedValue === "false" ? false : null;

    const ruleChecksJson = formData.get("ruleChecksJson") as string;
    let ruleChecks: Array<{ ruleId: string; followed: boolean }> | undefined = undefined;
    if (ruleChecksJson) {
      try {
        ruleChecks = JSON.parse(ruleChecksJson);
      } catch (e) {
        console.error("Failed to parse ruleChecksJson:", e);
      }
    }

    const trade = await createTrade({
      sessionId,
      symbol: symbol.toUpperCase().trim(),
      direction: direction || null,
      entryAt,
      exitAt,
      entryPrice,
      exitPrice,
      stopLoss,
      grossPnl,
      result,
      outcomeType,
      riskAmount,
      riskPercent,
      rrAchieved,
      potentialRR,
      lossR,
      beforeTradeNotes: beforeTradeNotes || null,
      reasonNotes: reasonNotes || null,
      strategyId: strategyId || null,
      confluenceIds,
      notes: notes || null,
      htfBias: htfBias || null,
      newsToday: newsToday || null,
      drawDirection: drawDirection || null,
      setupModel: setupModel || null,
      emotionalState: emotionalState || null,
      rulesFollowed,
      rr: rr || null,
      ruleChecks,
    });

    await saveTradeImagesFromFormData(trade.id, formData);

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/");
    return { success: true, tradeId: trade.id };
  } catch (error) {
    console.error("Error creating trade:", error);
    return { error: "Failed to log trade. Please check your inputs." };
  }
}

export async function updateTradeAction(formData: FormData) {
  try {
    const tradeId = formData.get("tradeId") as string;
    const sessionId = formData.get("sessionId") as string;

    if (!tradeId) {
      return { error: "Trade ID is required for editing." };
    }

    const symbol = formData.get("symbol") as string;
    const outcomeType = ((formData.get("outcomeType") as string) || "trade") as
      | "trade"
      | "missed_entry"
      | "no_trade";

    const entryAtStr = formData.get("entryAt") as string;
    const exitAtStr = (formData.get("exitAt") as string) || entryAtStr;

    if (!sessionId || !symbol || !entryAtStr) {
      return { error: "Please provide session ID, symbol, and trade date/time." };
    }

    const entryAt = new Date(entryAtStr);
    const exitAt = new Date(exitAtStr);

    if (isNaN(entryAt.getTime()) || isNaN(exitAt.getTime())) {
      return { error: "Please provide a valid date/time." };
    }

    // Validate trade date against session date range
    const session = await getSessionById(sessionId);
    if (!session) {
      return { error: "Session not found." };
    }

    const startBoundary = new Date(session.periodStart);
    startBoundary.setHours(0, 0, 0, 0);

    const endBoundary = new Date(session.periodEnd);
    endBoundary.setHours(23, 59, 59, 999);

    if (entryAt.getTime() < startBoundary.getTime() || entryAt.getTime() > endBoundary.getTime()) {
      const formattedRange = `${session.periodStart.toISOString().slice(0, 10)} to ${session.periodEnd.toISOString().slice(0, 10)}`;
      return {
        error: `Trade date (${entryAt.toISOString().slice(0, 10)}) must fall within the session date range (${formattedRange}).`,
      };
    }

    // Strategy & Confluences
    const strategyId = (formData.get("strategyId") as string) || null;
    const confluenceIdsJson = formData.get("confluenceIdsJson") as string;
    let confluenceIds: string[] | undefined = undefined;
    if (confluenceIdsJson !== null && confluenceIdsJson !== undefined) {
      try {
        confluenceIds = JSON.parse(confluenceIdsJson);
      } catch (e) {
        console.error("Failed to parse confluenceIdsJson:", e);
      }
    }

    // Notes
    const beforeTradeNotes = formData.get("beforeTradeNotes") as string;
    const reasonNotes = formData.get("reasonNotes") as string;
    const notes = formData.get("notes") as string;
    const htfBias = formData.get("htfBias") as string;
    const newsToday = formData.get("newsToday") as string;
    const drawDirection = formData.get("drawDirection") as string;
    const setupModel = formData.get("setupModel") as string;
    const emotionalState = formData.get("emotionalState") as string;
    const rr = formData.get("rr") as string;

    // R & Risk Outcome fields
    const riskAmountStr = formData.get("riskAmount") as string;
    const riskPercentStr = formData.get("riskPercent") as string;
    const rrAchievedStr = formData.get("rrAchieved") as string;
    const potentialRRStr = formData.get("potentialRR") as string;
    const lossRStr = formData.get("lossR") as string;
    const resultStr = (formData.get("result") as string)?.toLowerCase();

    // Legacy price fields
    const direction = (formData.get("direction") as string)?.toLowerCase() as "long" | "short" | undefined;
    const entryPriceStr = formData.get("entryPrice") as string;
    const exitPriceStr = formData.get("exitPrice") as string;
    const stopLossStr = formData.get("stopLoss") as string;
    const grossPnlStr = formData.get("grossPnl") as string;

    const riskAmount = riskAmountStr !== undefined ? (riskAmountStr && !isNaN(parseFloat(riskAmountStr)) ? parseFloat(riskAmountStr) : null) : undefined;
    const riskPercent = riskPercentStr !== undefined ? (riskPercentStr && !isNaN(parseFloat(riskPercentStr)) ? parseFloat(riskPercentStr) : null) : undefined;
    const rrAchieved = rrAchievedStr !== undefined ? (rrAchievedStr && !isNaN(parseFloat(rrAchievedStr)) ? parseFloat(rrAchievedStr) : null) : undefined;
    const potentialRR = potentialRRStr !== undefined ? (potentialRRStr && !isNaN(parseFloat(potentialRRStr)) ? parseFloat(potentialRRStr) : null) : undefined;
    const lossR = lossRStr !== undefined ? (lossRStr && !isNaN(parseFloat(lossRStr)) ? parseFloat(lossRStr) : -1) : undefined;
    const entryPrice = entryPriceStr !== undefined ? (entryPriceStr && !isNaN(parseFloat(entryPriceStr)) ? parseFloat(entryPriceStr) : null) : undefined;
    const exitPrice = exitPriceStr !== undefined ? (exitPriceStr && !isNaN(parseFloat(exitPriceStr)) ? parseFloat(exitPriceStr) : null) : undefined;
    const stopLoss = stopLossStr !== undefined ? (stopLossStr && !isNaN(parseFloat(stopLossStr)) ? parseFloat(stopLossStr) : null) : undefined;
    const grossPnl = grossPnlStr !== undefined && grossPnlStr !== "" && !isNaN(parseFloat(grossPnlStr)) ? parseFloat(grossPnlStr) : undefined;

    let result: "win" | "loss" | "breakeven" | null = null;
    if (outcomeType === "trade") {
      if (resultStr === "win" || resultStr === "loss" || resultStr === "breakeven") {
        result = resultStr;
      }
    }

    const rulesFollowedValue = formData.get("rulesFollowed");
    const rulesFollowed = rulesFollowedValue === "on" || rulesFollowedValue === "true" ? true : rulesFollowedValue === "false" ? false : null;

    const ruleChecksJson = formData.get("ruleChecksJson") as string;
    let ruleChecks: Array<{ ruleId: string; followed: boolean }> | undefined = undefined;
    if (ruleChecksJson) {
      try {
        ruleChecks = JSON.parse(ruleChecksJson);
      } catch (e) {
        console.error("Failed to parse ruleChecksJson:", e);
      }
    }

    await updateTrade(tradeId, {
      symbol: symbol.toUpperCase().trim(),
      direction: direction || null,
      entryAt,
      exitAt,
      entryPrice,
      exitPrice,
      stopLoss,
      grossPnl,
      result,
      outcomeType,
      riskAmount,
      riskPercent,
      rrAchieved,
      potentialRR,
      lossR,
      beforeTradeNotes: beforeTradeNotes || null,
      reasonNotes: reasonNotes || null,
      strategyId: strategyId || null,
      confluenceIds,
      notes: notes || null,
      htfBias: htfBias || null,
      newsToday: newsToday || null,
      drawDirection: drawDirection || null,
      setupModel: setupModel || null,
      emotionalState: emotionalState || null,
      rulesFollowed,
      rr: rr || null,
      ruleChecks,
    });

    await saveTradeImagesFromFormData(tradeId, formData);

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating trade:", error);
    return { error: "Failed to update trade. Please check your inputs." };
  }
}

export async function deleteTradeAction(tradeId: string, sessionId: string) {
  try {
    if (!tradeId) return { error: "Trade ID is required." };
    if (!sessionId) return { error: "Session ID is required." };

    const session = await getSessionById(sessionId);
    if (!session) {
      return { error: "Session not found or unauthorized." };
    }

    await deleteTrade(tradeId);

    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "trades", tradeId);
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.error("Failed to clean up trade images directory on disk:", fsErr);
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting trade:", error);
    return { error: "Failed to delete trade." };
  }
}
