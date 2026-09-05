"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";

export interface SessionExportSnapshot {
  schemaVersion: number;
  exportedAt: string;
  session: {
    name?: string | null;
    instrument: string;
    startingBalance: number;
    periodStart: string;
    periodEnd: string;
    status: string;
  };
  rules: {
    id: string;
    text: string;
  }[];
  trades: {
    id: string;
    symbol: string;
    direction?: string | null;
    entryAt: string;
    exitAt: string;
    entryPrice?: number | null;
    exitPrice?: number | null;
    stopLoss?: number | null;
    rMultiple?: number | null;
    grossPnl?: number;
    result?: string | null;
    notes?: string | null;
    htfBias?: string | null;
    newsToday?: string | null;
    riskAmount?: number | null;
    riskPercent?: number | null;
    rrAchieved?: number | null;
    potentialRR?: number | null;
    lossR?: number | null;
    beforeTradeNotes?: string | null;
    reasonNotes?: string | null;
    outcomeType?: "trade" | "missed_entry" | "no_trade" | null;
    strategyId?: string | null;
    drawDirection?: string | null;
    setupModel?: string | null;
    emotionalState?: string | null;
    rulesFollowed?: boolean | null;
    rr?: string | null;
    ruleChecks: {
      ruleId: string;
      followed: boolean;
    }[];
    images: {
      label: string | null;
      role?: "before_trade" | "outcome";
      filename: string;
      mimeType: string;
      base64Data: string;
    }[];
  }[];
}

export async function exportSessionSnapshotAction(sessionId: string): Promise<{
  success?: boolean;
  snapshot?: SessionExportSnapshot;
  error?: string;
}> {
  try {
    const user = await requireUser();
    if (!sessionId) {
      return { error: "Session ID is required for export." };
    }

    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from("Session")
      .select(`
        *,
        rules:Rule(*),
        trades:Trade(
          *,
          ruleChecks:TradeRuleCheck(*),
          images:TradeImage(*)
        )
      `)
      .eq("id", sessionId)
      .eq("userId", user.id)
      .maybeSingle();

    if (error || !session) {
      return { error: "Session not found or unauthorized." };
    }

    const sessionRules = (Array.isArray(session.rules) ? session.rules : []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const sessionTrades = (Array.isArray(session.trades) ? session.trades : []).sort(
      (a: any, b: any) => {
        const entryDiff = new Date(a.entryAt).getTime() - new Date(b.entryAt).getTime();
        if (entryDiff !== 0) return entryDiff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    );

    const exportedTrades = await Promise.all(
      sessionTrades.map(async (trade: any) => {
        const tradeImages = (Array.isArray(trade.images) ? trade.images : []).sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const exportedImages = await Promise.all(
          tradeImages.map(async (img: any) => {
            let base64Data = "";
            let mimeType = "image/png";
            let filename = `screenshot-${img.id}.png`;

            try {
              const fullDiskPath = path.join(process.cwd(), "public", img.url);
              if (fs.existsSync(fullDiskPath)) {
                const fileBuffer = await fs.promises.readFile(fullDiskPath);
                base64Data = fileBuffer.toString("base64");
                const ext = path.extname(fullDiskPath).toLowerCase();
                if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
                else if (ext === ".webp") mimeType = "image/webp";
                else if (ext === ".gif") mimeType = "image/gif";
                filename = path.basename(fullDiskPath);
              }
            } catch (err) {
              console.error("Failed to read image from disk for export:", err);
            }

            return {
              label: img.label,
              filename,
              mimeType,
              base64Data,
            };
          })
        );

        const tradeChecks = Array.isArray(trade.ruleChecks) ? trade.ruleChecks : [];

        return {
          id: trade.id,
          symbol: trade.symbol,
          direction: trade.direction ?? null,
          entryAt: new Date(trade.entryAt).toISOString(),
          exitAt: new Date(trade.exitAt).toISOString(),
          entryPrice: trade.entryPrice !== null && trade.entryPrice !== undefined ? Number(trade.entryPrice) : null,
          exitPrice: trade.exitPrice !== null && trade.exitPrice !== undefined ? Number(trade.exitPrice) : null,
          stopLoss: trade.stopLoss !== null && trade.stopLoss !== undefined ? Number(trade.stopLoss) : null,
          rMultiple: trade.rMultiple !== null && trade.rMultiple !== undefined ? Number(trade.rMultiple) : null,
          grossPnl: Number(trade.grossPnl || 0),
          result: trade.result ?? null,
          notes: trade.notes ?? null,
          htfBias: trade.htfBias ?? null,
          newsToday: trade.newsToday ?? null,
          riskAmount: trade.riskAmount !== null && trade.riskAmount !== undefined ? Number(trade.riskAmount) : null,
          riskPercent: trade.riskPercent !== null && trade.riskPercent !== undefined ? Number(trade.riskPercent) : null,
          rrAchieved: trade.rrAchieved !== null && trade.rrAchieved !== undefined ? Number(trade.rrAchieved) : null,
          potentialRR: trade.potentialRR !== null && trade.potentialRR !== undefined ? Number(trade.potentialRR) : null,
          lossR: trade.lossR !== null && trade.lossR !== undefined ? Number(trade.lossR) : null,
          beforeTradeNotes: trade.beforeTradeNotes ?? null,
          reasonNotes: trade.reasonNotes ?? null,
          outcomeType: trade.outcomeType || "trade",
          strategyId: trade.strategyId ?? null,
          drawDirection: trade.drawDirection ?? null,
          setupModel: trade.setupModel ?? null,
          emotionalState: trade.emotionalState ?? null,
          rulesFollowed: trade.rulesFollowed ?? null,
          rr: trade.rr ?? null,
          ruleChecks: tradeChecks.map((rc: any) => ({
            ruleId: rc.ruleId,
            followed: Boolean(rc.followed),
          })),
          images: exportedImages.filter((img) => Boolean(img.base64Data)),
        };
      })
    );

    const snapshot: SessionExportSnapshot = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      session: {
        name: session.name,
        instrument: session.instrument,
        startingBalance: Number(session.startingBalance),
        periodStart: new Date(session.periodStart).toISOString(),
        periodEnd: new Date(session.periodEnd).toISOString(),
        status: session.status,
      },
      rules: sessionRules.map((r: any) => ({
        id: r.id,
        text: r.text,
      })),
      trades: exportedTrades,
    };

    return { success: true, snapshot };
  } catch (error) {
    console.error("Failed to export session snapshot:", error);
    return { error: "Failed to generate session export snapshot." };
  }
}

export async function importSessionSnapshotAction(snapshotJson: string): Promise<{
  success?: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    if (!snapshotJson || typeof snapshotJson !== "string") {
      return { error: "Invalid snapshot data provided." };
    }

    let data: SessionExportSnapshot;
    try {
      data = JSON.parse(snapshotJson);
    } catch {
      return { error: "Malformed JSON file. Please provide a valid JSON snapshot." };
    }

    if (!data.schemaVersion || data.schemaVersion > 1) {
      return { error: `Unsupported snapshot schema version (${data.schemaVersion || "unknown"}).` };
    }

    if (
      !data.session ||
      !data.session.instrument ||
      typeof data.session.startingBalance !== "number" ||
      !data.session.periodStart ||
      !data.session.periodEnd
    ) {
      return { error: "Incomplete session metadata in snapshot file." };
    }

    const pStart = new Date(data.session.periodStart);
    const pEnd = new Date(data.session.periodEnd);
    if (isNaN(pStart.getTime()) || isNaN(pEnd.getTime())) {
      return { error: "Invalid date format in session snapshot." };
    }

    const user = await requireUser();
    const supabase = await createClient();

    const newSessionId = crypto.randomUUID();
    const { data: newSession, error: sErr } = await supabase
      .from("Session")
      .insert({
        id: newSessionId,
        userId: user.id,
        name: data.session.name ? `${data.session.name} (Imported)` : `${data.session.instrument} (Imported)`,
        instrument: data.session.instrument.toUpperCase().trim(),
        startingBalance: data.session.startingBalance,
        periodStart: pStart.toISOString(),
        periodEnd: pEnd.toISOString(),
        status: data.session.status || "active",
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (sErr || !newSession) {
      throw new Error(sErr?.message || "Failed to create session in database.");
    }

    // Map old rule IDs to newly created rules
    const ruleIdMap = new Map<string, string>();
    if (Array.isArray(data.rules) && data.rules.length > 0) {
      for (const rule of data.rules) {
        if (rule.text?.trim()) {
          const newRuleId = crypto.randomUUID();
          const { data: createdRule, error: rErr } = await supabase
            .from("Rule")
            .insert({
              id: newRuleId,
              sessionId: newSession.id,
              text: rule.text.trim(),
            })
            .select()
            .single();

          if (!rErr && createdRule && rule.id) {
            ruleIdMap.set(rule.id, createdRule.id);
          }
        }
      }
    }

    // Create all trades, rule checks, and images
    if (Array.isArray(data.trades) && data.trades.length > 0) {
      for (const t of data.trades) {
        const eAt = new Date(t.entryAt);
        const xAt = new Date(t.exitAt);
        const newTradeId = crypto.randomUUID();
        const outcomeType = (t.outcomeType as "trade" | "missed_entry" | "no_trade") || "trade";
        const result = t.result ? t.result.toLowerCase() : outcomeType === "trade" ? "win" : null;

        const { data: createdTrade, error: tErr } = await supabase
          .from("Trade")
          .insert({
            id: newTradeId,
            sessionId: newSession.id,
            symbol: (t.symbol || data.session.instrument).toUpperCase().trim(),
            direction: t.direction ? (t.direction.toLowerCase() === "short" ? "short" : "long") : null,
            entryAt: !isNaN(eAt.getTime()) ? eAt.toISOString() : pStart.toISOString(),
            exitAt: !isNaN(xAt.getTime()) ? xAt.toISOString() : pStart.toISOString(),
            entryPrice: typeof t.entryPrice === "number" ? t.entryPrice : null,
            exitPrice: typeof t.exitPrice === "number" ? t.exitPrice : null,
            stopLoss: typeof t.stopLoss === "number" ? t.stopLoss : null,
            rMultiple: typeof t.rMultiple === "number" ? t.rMultiple : null,
            grossPnl: typeof t.grossPnl === "number" ? t.grossPnl : 0,
            result,
            notes: t.notes || null,
            htfBias: t.htfBias || null,
            newsToday: t.newsToday || null,
            riskAmount: typeof t.riskAmount === "number" ? t.riskAmount : null,
            riskPercent: typeof t.riskPercent === "number" ? t.riskPercent : null,
            rrAchieved: typeof t.rrAchieved === "number" ? t.rrAchieved : null,
            potentialRR: typeof t.potentialRR === "number" ? t.potentialRR : null,
            lossR: typeof t.lossR === "number" ? t.lossR : null,
            beforeTradeNotes: t.beforeTradeNotes || null,
            reasonNotes: t.reasonNotes || null,
            outcomeType,
            strategyId: t.strategyId || null,
            drawDirection: t.drawDirection || null,
            setupModel: t.setupModel || null,
            emotionalState: t.emotionalState || null,
            rulesFollowed: typeof t.rulesFollowed === "boolean" ? t.rulesFollowed : null,
            rr: t.rr || null,
          })
          .select()
          .single();

        if (tErr || !createdTrade) {
          console.error("Failed to insert trade during import:", tErr);
          continue;
        }

        // Recreate TradeRuleChecks
        if (Array.isArray(t.ruleChecks) && t.ruleChecks.length > 0) {
          const checksToInsert = [];
          for (const rc of t.ruleChecks) {
            const mappedRuleId = ruleIdMap.get(rc.ruleId);
            if (mappedRuleId) {
              checksToInsert.push({
                id: crypto.randomUUID(),
                tradeId: createdTrade.id,
                ruleId: mappedRuleId,
                followed: Boolean(rc.followed),
              });
            }
          }
          if (checksToInsert.length > 0) {
            await supabase.from("TradeRuleCheck").insert(checksToInsert);
          }
        }

        // Recreate images and write files to disk
        if (Array.isArray(t.images) && t.images.length > 0) {
          const uploadDir = path.join(process.cwd(), "public", "uploads", "trades", createdTrade.id);
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          for (const img of t.images) {
            if (img.base64Data) {
              try {
                const ext = path.extname(img.filename || "").toLowerCase() || ".png";
                const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
                const filePath = path.join(uploadDir, uniqueName);
                const buffer = Buffer.from(img.base64Data, "base64");
                await fs.promises.writeFile(filePath, buffer);

                const publicUrl = `/uploads/trades/${createdTrade.id}/${uniqueName}`;
                await supabase.from("TradeImage").insert({
                  id: crypto.randomUUID(),
                  tradeId: createdTrade.id,
                  url: publicUrl,
                  label: img.label?.trim() || null,
                  role: img.role || "outcome",
                });
              } catch (imgErr) {
                console.error("Failed to restore image on import:", imgErr);
              }
            }
          }
        }
      }
    }

    try {
      revalidatePath("/");
      revalidatePath(`/sessions/${newSession.id}`);
    } catch {}

    return { success: true, sessionId: newSession.id };
  } catch (error) {
    console.error("Failed to import session snapshot:", error);
    return { error: "Failed to import session from JSON snapshot." };
  }
}
