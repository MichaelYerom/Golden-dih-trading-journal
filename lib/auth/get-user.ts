import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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

  // Ensure Prisma User row exists for this Supabase user ID
  try {
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split("@")[0] || "Trader",
      },
      update: {
        email: user.email,
        name: user.user_metadata?.name || user.email.split("@")[0] || "Trader",
      },
    });

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    };
  } catch (err) {
    console.error("Error syncing user with database:", err);
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email.split("@")[0] || "Trader",
    };
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
