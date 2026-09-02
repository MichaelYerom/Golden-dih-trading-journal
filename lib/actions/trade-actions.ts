"use server";

import { revalidatePath } from "next/cache";
import { createTrade, updateTrade, deleteTrade } from "@/lib/data/trades";

export async function createTradeAction(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const symbol = formData.get("symbol") as string;
    const direction = (formData.get("direction") as string)?.toLowerCase();
    const entryAtStr = formData.get("entryAt") as string;
    const exitAtStr = formData.get("exitAt") as string;
    const entryPriceStr = formData.get("entryPrice") as string;
    const exitPriceStr = formData.get("exitPrice") as string;
    const stopLossStr = formData.get("stopLoss") as string;
    const grossPnlStr = formData.get("grossPnl") as string;
    const result = (formData.get("result") as string)?.toLowerCase();

    // Backtest fields
    const notes = formData.get("notes") as string;
    const htfBias = formData.get("htfBias") as string;
    const newsToday = formData.get("newsToday") as string;
    const riskPercentStr = formData.get("riskPercent") as string;
    const drawDirection = formData.get("drawDirection") as string;
    const setupModel = formData.get("setupModel") as string;
    const emotionalState = formData.get("emotionalState") as string;
    const rulesFollowedValue = formData.get("rulesFollowed");
    const rr = formData.get("rr") as string;
    const ruleChecksJson = formData.get("ruleChecksJson") as string;

    let ruleChecks: Array<{ ruleId: string; followed: boolean }> | undefined = undefined;
    if (ruleChecksJson) {
      try {
        ruleChecks = JSON.parse(ruleChecksJson);
      } catch (e) {
        console.error("Failed to parse ruleChecksJson:", e);
      }
    }

    if (!sessionId || !symbol || !direction || !entryAtStr || !exitAtStr || !entryPriceStr || !exitPriceStr || !grossPnlStr || !result) {
      return { error: "Please fill in all required core trade fields." };
    }

    const entryPrice = parseFloat(entryPriceStr);
    const exitPrice = parseFloat(exitPriceStr);
    const grossPnl = parseFloat(grossPnlStr);

    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(grossPnl)) {
      return { error: "Please enter valid numeric values for prices and P&L." };
    }

    let stopLoss: number | null = null;
    if (stopLossStr && stopLossStr.trim() !== "" && !isNaN(parseFloat(stopLossStr))) {
      stopLoss = parseFloat(stopLossStr);
    }

    const entryAt = new Date(entryAtStr);
    const exitAt = new Date(exitAtStr);

    if (isNaN(entryAt.getTime()) || isNaN(exitAt.getTime())) {
      return { error: "Please provide valid entry and exit date/time." };
    }

    if (direction !== "long" && direction !== "short") {
      return { error: "Direction must be either 'long' or 'short'." };
    }

    if (result !== "win" && result !== "loss" && result !== "breakeven") {
      return { error: "Result must be 'win', 'loss', or 'breakeven'." };
    }

    let riskPercent: number | null = null;
    if (riskPercentStr && !isNaN(parseFloat(riskPercentStr))) {
      riskPercent = parseFloat(riskPercentStr);
    }

    const rulesFollowed = rulesFollowedValue === "on" || rulesFollowedValue === "true" ? true : rulesFollowedValue === "false" ? false : null;

    const trade = await createTrade({
      sessionId,
      symbol: symbol.toUpperCase().trim(),
      direction: direction as "long" | "short",
      entryAt,
      exitAt,
      entryPrice,
      exitPrice,
      stopLoss,
      grossPnl,
      result: result as "win" | "loss" | "breakeven",
      notes: notes || null,
      htfBias: htfBias || null,
      newsToday: newsToday || null,
      riskPercent,
      drawDirection: drawDirection || null,
      setupModel: setupModel || null,
      emotionalState: emotionalState || null,
      rulesFollowed,
      rr: rr || null,
      ruleChecks,
    });

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
    const symbol = formData.get("symbol") as string;
    const direction = (formData.get("direction") as string)?.toLowerCase();
    const entryAtStr = formData.get("entryAt") as string;
    const exitAtStr = formData.get("exitAt") as string;
    const entryPriceStr = formData.get("entryPrice") as string;
    const exitPriceStr = formData.get("exitPrice") as string;
    const stopLossStr = formData.get("stopLoss") as string;
    const grossPnlStr = formData.get("grossPnl") as string;
    const result = (formData.get("result") as string)?.toLowerCase();

    // Backtest fields
    const notes = formData.get("notes") as string;
    const htfBias = formData.get("htfBias") as string;
    const newsToday = formData.get("newsToday") as string;
    const riskPercentStr = formData.get("riskPercent") as string;
    const drawDirection = formData.get("drawDirection") as string;
    const setupModel = formData.get("setupModel") as string;
    const emotionalState = formData.get("emotionalState") as string;
    const rulesFollowedValue = formData.get("rulesFollowed");
    const rr = formData.get("rr") as string;
    const ruleChecksJson = formData.get("ruleChecksJson") as string;

    if (!tradeId) {
      return { error: "Trade ID is required for editing." };
    }

    if (!sessionId || !symbol || !direction || !entryAtStr || !exitAtStr || !entryPriceStr || !exitPriceStr || !grossPnlStr || !result) {
      return { error: "Please fill in all required core trade fields." };
    }

    const entryPrice = parseFloat(entryPriceStr);
    const exitPrice = parseFloat(exitPriceStr);
    const grossPnl = parseFloat(grossPnlStr);

    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(grossPnl)) {
      return { error: "Please enter valid numeric values for prices and P&L." };
    }

    let stopLoss: number | null = null;
    if (stopLossStr && stopLossStr.trim() !== "" && !isNaN(parseFloat(stopLossStr))) {
      stopLoss = parseFloat(stopLossStr);
    }

    const entryAt = new Date(entryAtStr);
    const exitAt = new Date(exitAtStr);

    if (isNaN(entryAt.getTime()) || isNaN(exitAt.getTime())) {
      return { error: "Please provide valid entry and exit date/time." };
    }

    if (direction !== "long" && direction !== "short") {
      return { error: "Direction must be either 'long' or 'short'." };
    }

    if (result !== "win" && result !== "loss" && result !== "breakeven") {
      return { error: "Result must be 'win', 'loss', or 'breakeven'." };
    }

    let riskPercent: number | null = null;
    if (riskPercentStr && !isNaN(parseFloat(riskPercentStr))) {
      riskPercent = parseFloat(riskPercentStr);
    }

    let ruleChecks: Array<{ ruleId: string; followed: boolean }> | undefined = undefined;
    if (ruleChecksJson) {
      try {
        ruleChecks = JSON.parse(ruleChecksJson);
      } catch (e) {
        console.error("Failed to parse ruleChecksJson:", e);
      }
    }

    const rulesFollowed = rulesFollowedValue === "on" || rulesFollowedValue === "true" ? true : rulesFollowedValue === "false" ? false : null;

    await updateTrade(tradeId, {
      symbol: symbol.toUpperCase().trim(),
      direction: direction as "long" | "short",
      entryAt,
      exitAt,
      entryPrice,
      exitPrice,
      stopLoss,
      grossPnl,
      result: result as "win" | "loss" | "breakeven",
      notes: notes || null,
      htfBias: htfBias || null,
      newsToday: newsToday || null,
      riskPercent,
      drawDirection: drawDirection || null,
      setupModel: setupModel || null,
      emotionalState: emotionalState || null,
      rulesFollowed,
      rr: rr || null,
      ruleChecks,
    });

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
    await deleteTrade(tradeId);
    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting trade:", error);
    return { error: "Failed to delete trade." };
  }
}
