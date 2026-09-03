"use server";

import { revalidatePath } from "next/cache";
import {
  createConfluence,
  updateConfluence,
  deleteConfluence,
} from "@/lib/data/confluences";

export async function createConfluenceAction(name: string) {
  try {
    if (!name || !name.trim()) {
      return { error: "Confluence name cannot be empty." };
    }

    const confluence = await createConfluence(name);
    revalidatePath("/playbook");
    return { success: true, confluence };
  } catch (error: any) {
    console.error("Error creating confluence tag:", error);
    return { error: error?.message || "Failed to create confluence tag." };
  }
}

export async function updateConfluenceAction(id: string, name: string) {
  try {
    if (!id) return { error: "Confluence ID is required." };
    if (!name || !name.trim()) {
      return { error: "Confluence name cannot be empty." };
    }

    const confluence = await updateConfluence(id, name);
    revalidatePath("/playbook");
    return { success: true, confluence };
  } catch (error: any) {
    console.error("Error updating confluence tag:", error);
    return { error: error?.message || "Failed to update confluence tag." };
  }
}

export async function deleteConfluenceAction(id: string) {
  try {
    if (!id) return { error: "Confluence ID is required." };

    await deleteConfluence(id);
    revalidatePath("/playbook");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting confluence tag:", error);
    return { error: error?.message || "Failed to delete confluence tag." };
  }
}
