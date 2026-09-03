"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadTradeImageAction(formData: FormData): Promise<{
  success?: boolean;
  image?: {
    id: string;
    tradeId: string;
    url: string;
    label: string | null;
    createdAt: string;
  };
  error?: string;
}> {
  try {
    const user = await requireUser();
    const tradeId = formData.get("tradeId") as string;
    const sessionId = formData.get("sessionId") as string;
    const label = (formData.get("label") as string) || null;
    const file = formData.get("file") as File | null;

    if (!tradeId) {
      return { error: "Trade ID is required." };
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: "No image file provided." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { error: `Image file exceeds maximum allowed size of 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).` };
    }

    const fileExt = path.extname(file.name).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(fileExt)) {
      return {
        error: "Invalid file type. Only JPG, PNG, WebP, and GIF images are supported.",
      };
    }

    const supabase = await createClient();

    // Verify trade exists and belongs to current user's session
    const { data: trade, error: tradeErr } = await supabase
      .from("Trade")
      .select("id, sessionId")
      .eq("id", tradeId)
      .maybeSingle();

    if (tradeErr || !trade) {
      return { error: "Trade not found or unauthorized." };
    }

    const ext = fileExt || ".png";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "trades", tradeId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/trades/${tradeId}/${uniqueName}`;
    const imageId = crypto.randomUUID();

    const { data: created, error: imgErr } = await supabase
      .from("TradeImage")
      .insert({
        id: imageId,
        tradeId,
        url: publicUrl,
        label: label?.trim() || null,
      })
      .select()
      .single();

    if (imgErr || !created) {
      return { error: imgErr?.message || "Failed to save image record." };
    }

    const targetSessionId = sessionId || trade.sessionId;
    if (targetSessionId) {
      try {
        revalidatePath(`/sessions/${targetSessionId}`);
      } catch {}
    }

    return {
      success: true,
      image: {
        id: created.id,
        tradeId: created.tradeId,
        url: created.url,
        label: created.label,
        createdAt: new Date(created.createdAt).toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to upload trade image:", error);
    return { error: "Failed to upload image due to a server error." };
  }
}

export async function deleteTradeImageAction(
  imageId: string,
  sessionId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await requireUser();
    if (!imageId) {
      return { error: "Image ID is required." };
    }

    const supabase = await createClient();

    const { data: image, error: getErr } = await supabase
      .from("TradeImage")
      .select("id, url, tradeId, trade:Trade(sessionId)")
      .eq("id", imageId)
      .maybeSingle();

    if (getErr || !image) {
      return { error: "Image not found or unauthorized." };
    }

    // Delete DB record
    const { error: delErr } = await supabase
      .from("TradeImage")
      .delete()
      .eq("id", imageId);

    if (delErr) {
      return { error: delErr.message };
    }

    // Remove file from disk
    try {
      const filePath = path.join(process.cwd(), "public", image.url);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (fsErr) {
      console.error("Failed to remove image file from disk:", fsErr);
    }

    const targetSessionId = sessionId || (image.trade as any)?.sessionId;
    if (targetSessionId) {
      try {
        revalidatePath(`/sessions/${targetSessionId}`);
      } catch {}
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete trade image:", error);
    return { error: "Failed to delete image attachment." };
  }
}
