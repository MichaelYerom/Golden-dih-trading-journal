"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDefaultUser } from "@/lib/data/user";

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
    direction: string;
    entryAt: string;
    exitAt: string;
    entryPrice: number;
    exitPrice: number;
    stopLoss: number | null;
    rMultiple: number | null;
    grossPnl: number;
    result: string;
    notes: string | null;
    htfBias: string | null;
    newsToday: string | null;
    riskPercent: number | null;
    drawDirection: string | null;
    setupModel: string | null;
    emotionalState: string | null;
    rulesFollowed: boolean | null;
    rr: string | null;
    ruleChecks: {
      ruleId: string;
      followed: boolean;
    }[];
    images: {
      label: string | null;
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
    if (!sessionId) {
      return { error: "Session ID is required for export." };
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        rules: {
          orderBy: { createdAt: "asc" },
        },
        trades: {
          include: {
            ruleChecks: true,
            images: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: [{ entryAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!session) {
      return { error: "Session not found." };
    }

    const exportedTrades = await Promise.all(
      session.trades.map(async (trade) => {
        const exportedImages = await Promise.all(
          trade.images.map(async (img) => {
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

        return {
          id: trade.id,
          symbol: trade.symbol,
          direction: trade.direction,
          entryAt: trade.entryAt.toISOString(),
          exitAt: trade.exitAt.toISOString(),
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopLoss: trade.stopLoss,
          rMultiple: trade.rMultiple,
          grossPnl: trade.grossPnl,
          result: trade.result,
          notes: trade.notes,
          htfBias: trade.htfBias,
          newsToday: trade.newsToday,
          riskPercent: trade.riskPercent,
          drawDirection: trade.drawDirection,
          setupModel: trade.setupModel,
          emotionalState: trade.emotionalState,
          rulesFollowed: trade.rulesFollowed,
          rr: trade.rr,
          ruleChecks: trade.ruleChecks.map((rc) => ({
            ruleId: rc.ruleId,
            followed: rc.followed,
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
        startingBalance: session.startingBalance,
        periodStart: session.periodStart.toISOString(),
        periodEnd: session.periodEnd.toISOString(),
        status: session.status,
      },
      rules: session.rules.map((r) => ({
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

    // Create new session in Prisma
    const user = await getDefaultUser();
    const newSession = await prisma.session.create({
      data: {
        userId: user.id,
        name: data.session.name ? `${data.session.name} (Imported)` : `${data.session.instrument} (Imported)`,
        instrument: data.session.instrument.toUpperCase().trim(),
        startingBalance: data.session.startingBalance,
        periodStart: pStart,
        periodEnd: pEnd,
        status: data.session.status || "active",
      },
    });

    // Map old rule IDs to newly created rules
    const ruleIdMap = new Map<string, string>();
    if (Array.isArray(data.rules) && data.rules.length > 0) {
      for (const rule of data.rules) {
        if (rule.text?.trim()) {
          const createdRule = await prisma.rule.create({
            data: {
              sessionId: newSession.id,
              text: rule.text.trim(),
            },
          });
          if (rule.id) {
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

        const createdTrade = await prisma.trade.create({
          data: {
            sessionId: newSession.id,
            symbol: (t.symbol || data.session.instrument).toUpperCase().trim(),
            direction: t.direction?.toLowerCase() === "short" ? "short" : "long",
            entryAt: !isNaN(eAt.getTime()) ? eAt : pStart,
            exitAt: !isNaN(xAt.getTime()) ? xAt : pStart,
            entryPrice: typeof t.entryPrice === "number" ? t.entryPrice : 0,
            exitPrice: typeof t.exitPrice === "number" ? t.exitPrice : 0,
            stopLoss: typeof t.stopLoss === "number" ? t.stopLoss : null,
            rMultiple: typeof t.rMultiple === "number" ? t.rMultiple : null,
            grossPnl: typeof t.grossPnl === "number" ? t.grossPnl : 0,
            result: t.result?.toLowerCase() || "win",
            notes: t.notes || null,
            htfBias: t.htfBias || null,
            newsToday: t.newsToday || null,
            riskPercent: typeof t.riskPercent === "number" ? t.riskPercent : null,
            drawDirection: t.drawDirection || null,
            setupModel: t.setupModel || null,
            emotionalState: t.emotionalState || null,
            rulesFollowed: typeof t.rulesFollowed === "boolean" ? t.rulesFollowed : null,
            rr: t.rr || null,
          },
        });

        // Recreate TradeRuleChecks
        if (Array.isArray(t.ruleChecks) && t.ruleChecks.length > 0) {
          for (const rc of t.ruleChecks) {
            const mappedRuleId = ruleIdMap.get(rc.ruleId);
            if (mappedRuleId) {
              await prisma.tradeRuleCheck.create({
                data: {
                  tradeId: createdTrade.id,
                  ruleId: mappedRuleId,
                  followed: Boolean(rc.followed),
                },
              });
            }
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
                await prisma.tradeImage.create({
                  data: {
                    tradeId: createdTrade.id,
                    url: publicUrl,
                    label: img.label?.trim() || null,
                  },
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
