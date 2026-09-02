"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTrade, updateTrade, deleteTrade } from "@/lib/data/trades";
import { getSessionById } from "@/lib/data/sessions";

async function saveTradeImagesFromFormData(tradeId: string, formData: FormData) {
  const files = formData.getAll("pendingImages") as File[];
  const labelsJson = formData.get("pendingImageLabels") as string;
  let labels: string[] = [];
  try {
    if (labelsJson) labels = JSON.parse(labelsJson);
  } catch {}

  if (!files || files.length === 0) return;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "trades", tradeId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

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
      await prisma.tradeImage.create({
        data: {
          tradeId,
          url: publicUrl,
          label,
        },
      });
    }
  }
}

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
        error: `Trade entry date (${entryAt.toISOString().slice(0, 10)}) must fall within the session date range (${formattedRange}).`,
      };
    }

    if (exitAt.getTime() < startBoundary.getTime() || exitAt.getTime() > endBoundary.getTime()) {
      const formattedRange = `${session.periodStart.toISOString().slice(0, 10)} to ${session.periodEnd.toISOString().slice(0, 10)}`;
      return {
        error: `Trade exit date (${exitAt.toISOString().slice(0, 10)}) must fall within the session date range (${formattedRange}).`,
      };
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
        error: `Trade entry date (${entryAt.toISOString().slice(0, 10)}) must fall within the session date range (${formattedRange}).`,
      };
    }

    if (exitAt.getTime() < startBoundary.getTime() || exitAt.getTime() > endBoundary.getTime()) {
      const formattedRange = `${session.periodStart.toISOString().slice(0, 10)} to ${session.periodEnd.toISOString().slice(0, 10)}`;
      return {
        error: `Trade exit date (${exitAt.toISOString().slice(0, 10)}) must fall within the session date range (${formattedRange}).`,
      };
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
