import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/get-user";

export interface ConfluenceEntity {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export async function getConfluences(): Promise<ConfluenceEntity[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Confluence")
    .select("*")
    .eq("userId", user.id)
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("Error fetching confluences:", error);
    return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    userId: c.userId,
    name: c.name,
    createdAt: new Date(c.createdAt),
  }));
}

export async function createConfluence(name: string): Promise<ConfluenceEntity> {
  const user = await requireUser();
  const supabase = await createClient();
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("Confluence tag name cannot be empty.");
  }

  // Check if existing confluence with same name already exists for this user
  const { data: existing } = await supabase
    .from("Confluence")
    .select("*")
    .eq("userId", user.id)
    .ilike("name", cleanName)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      name: existing.name,
      createdAt: new Date(existing.createdAt),
    };
  }

  const confluenceId = crypto.randomUUID();
  const { data: created, error } = await supabase
    .from("Confluence")
    .insert({
      id: confluenceId,
      userId: user.id,
      name: cleanName,
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(error?.message || "Failed to create confluence tag.");
  }

  return {
    id: created.id,
    userId: created.userId,
    name: created.name,
    createdAt: new Date(created.createdAt),
  };
}

export async function updateConfluence(
  id: string,
  name: string
): Promise<ConfluenceEntity> {
  const user = await requireUser();
  const supabase = await createClient();
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("Confluence tag name cannot be empty.");
  }

  const { data: updated, error } = await supabase
    .from("Confluence")
    .update({ name: cleanName })
    .eq("id", id)
    .eq("userId", user.id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update confluence tag.");
  }

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    createdAt: new Date(updated.createdAt),
  };
}

export async function deleteConfluence(id: string): Promise<{ id: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("Confluence")
    .delete()
    .eq("id", id)
    .eq("userId", user.id);

  if (error) {
    throw new Error(error.message || "Failed to delete confluence tag.");
  }

  return { id };
}
