"use server";

import { revalidatePath } from "next/cache";
import { createSession, updateSession, deleteSession } from "@/lib/data/sessions";

export async function createSessionAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const instrument = formData.get("instrument") as string;
    const periodStartStr = formData.get("periodStart") as string;
    const periodEndStr = formData.get("periodEnd") as string;
    const startingBalanceStr = formData.get("startingBalance") as string;
    const status = (formData.get("status") as string) || "active";

    if (!name || !instrument || !periodStartStr || !periodEndStr || !startingBalanceStr) {
      return { error: "Please fill in all required fields." };
    }

    const startingBalance = parseFloat(startingBalanceStr);
    if (isNaN(startingBalance) || startingBalance < 0) {
      return { error: "Starting balance must be a valid positive number." };
    }

    const periodStart = new Date(periodStartStr);
    const periodEnd = new Date(periodEndStr);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return { error: "Please provide valid dates for the period." };
    }

    if (periodStart > periodEnd) {
      return { error: "Period start date must be before or equal to period end date." };
    }

    const session = await createSession({
      name: name.trim(),
      instrument: instrument.trim().toUpperCase(),
      periodStart,
      periodEnd,
      startingBalance,
      status,
    });

    revalidatePath("/");
    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error("Error creating session:", error);
    return { error: "Failed to create session. Please try again." };
  }
}

export async function updateSessionAction(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const name = formData.get("name") as string;
    const instrument = formData.get("instrument") as string;
    const periodStartStr = formData.get("periodStart") as string;
    const periodEndStr = formData.get("periodEnd") as string;
    const startingBalanceStr = formData.get("startingBalance") as string;
    const status = (formData.get("status") as string) || "active";

    if (!sessionId || !name || !instrument || !periodStartStr || !periodEndStr || !startingBalanceStr) {
      return { error: "Please fill in all required fields." };
    }

    const startingBalance = parseFloat(startingBalanceStr);
    if (isNaN(startingBalance) || startingBalance < 0) {
      return { error: "Starting balance must be a valid positive number." };
    }

    const periodStart = new Date(periodStartStr);
    const periodEnd = new Date(periodEndStr);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return { error: "Please provide valid dates for the session period." };
    }

    if (periodStart > periodEnd) {
      return { error: "Period start date must be before or equal to period end date." };
    }

    await updateSession(sessionId, {
      name: name.trim(),
      instrument: instrument.trim().toUpperCase(),
      periodStart,
      periodEnd,
      startingBalance,
      status,
    });

    revalidatePath("/");
    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating session:", error);
    return { error: "Failed to update session. Please try again." };
  }
}

export async function deleteSessionAction(sessionId: string) {
  try {
    if (!sessionId) return { error: "Session ID is required" };
    await deleteSession(sessionId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { error: "Failed to delete session." };
  }
}
