"use server";

import { revalidatePath } from "next/cache";
import {
  createStrategy,
  updateStrategy,
  deleteStrategy,
  CreateStrategyInput,
  UpdateStrategyInput,
} from "@/lib/data/strategies";

export async function createStrategyAction(data: CreateStrategyInput) {
  try {
    if (!data.name || !data.name.trim()) {
      return { error: "Strategy name is required." };
    }

    const strategy = await createStrategy(data);
    revalidatePath("/playbook");
    return { success: true, strategyId: strategy.id };
  } catch (error: any) {
    console.error("Error creating strategy:", error);
    return { error: error?.message || "Failed to create strategy." };
  }
}

export async function updateStrategyAction(
  id: string,
  data: UpdateStrategyInput
) {
  try {
    if (!id) {
      return { error: "Strategy ID is required." };
    }

    if (data.name !== undefined && !data.name.trim()) {
      return { error: "Strategy name cannot be empty." };
    }

    await updateStrategy(id, data);
    revalidatePath("/playbook");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating strategy:", error);
    return { error: error?.message || "Failed to update strategy." };
  }
}

export async function deleteStrategyAction(id: string) {
  try {
    if (!id) {
      return { error: "Strategy ID is required." };
    }

    await deleteStrategy(id);
    revalidatePath("/playbook");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting strategy:", error);
    return { error: error?.message || "Failed to delete strategy." };
  }
}
