"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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

    // Verify trade exists and belongs to current user's session
    const trade = await prisma.trade.findFirst({
      where: {
        id: tradeId,
        session: { userId: user.id },
      },
      select: { id: true, sessionId: true },
    });

    if (!trade) {
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

    const created = await prisma.tradeImage.create({
      data: {
        tradeId,
        url: publicUrl,
        label: label?.trim() || null,
      },
    });

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
        createdAt: created.createdAt.toISOString(),
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

    const image = await prisma.tradeImage.findFirst({
      where: {
        id: imageId,
        trade: { session: { userId: user.id } },
      },
      include: {
        trade: {
          select: { sessionId: true },
        },
      },
    });

    if (!image) {
      return { error: "Image not found or unauthorized." };
    }

    // Delete DB record
    await prisma.tradeImage.delete({
      where: { id: imageId },
    });

    // Remove file from disk
    try {
      const filePath = path.join(process.cwd(), "public", image.url);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (fsErr) {
      console.error("Failed to remove image file from disk:", fsErr);
    }

    const targetSessionId = sessionId || image.trade?.sessionId;
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
