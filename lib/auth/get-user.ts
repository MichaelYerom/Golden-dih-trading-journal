import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const defaultName =
    user.user_metadata?.name || user.email.split("@")[0] || "Trader";

  // Ensure Supabase User row exists for this Supabase user ID
  try {
    const { data: dbUser, error } = await supabase
      .from("User")
      .upsert({
        id: user.id,
        email: user.email,
        name: defaultName,
      })
      .select()
      .single();

    if (dbUser && !error) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      };
    }
  } catch (err) {
    console.error("Error syncing user with database:", err);
  }

  return {
    id: user.id,
    email: user.email,
    name: defaultName,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
