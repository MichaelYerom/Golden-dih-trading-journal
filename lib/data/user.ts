import { getCurrentUser, requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

export async function getDefaultUser() {
  const user = await getCurrentUser();
  const userId = user ? user.id : (await requireUser()).id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("User")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "User not found");
  }

  return data;
}
