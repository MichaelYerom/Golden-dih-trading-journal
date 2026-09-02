"use server";

import { revalidatePath } from "next/cache";
import { createRule, deleteRule } from "@/lib/data/trades";

export async function createRuleAction(sessionId: string, text: string) {
  try {
    if (!sessionId || !text || !text.trim()) {
      return { error: "Rule description cannot be empty." };
    }

    const rule = await createRule(sessionId, text);
    revalidatePath(`/sessions/${sessionId}`);
    return { success: true, rule };
  } catch (error) {
    console.error("Error creating rule:", error);
    return { error: "Failed to create rule. Please try again." };
  }
}

export async function deleteRuleAction(ruleId: string, sessionId: string) {
  try {
    if (!ruleId) return { error: "Rule ID is required." };
    await deleteRule(ruleId);
    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting rule:", error);
    return { error: "Failed to delete rule." };
  }
}
