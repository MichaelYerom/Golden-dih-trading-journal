"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  error?: string;
  success?: string;
}

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Ensure User row exists in DB
    try {
      await supabase.from("User").upsert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email!.split("@")[0] || "Trader",
      });
    } catch (dbErr) {
      console.error("Error syncing db user on login:", dbErr);
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signupAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const name = (formData.get("name") as string) || "Trader";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Provision User row in DB
    try {
      await supabase.from("User").upsert({
        id: data.user.id,
        email: data.user.email!,
        name: name.trim(),
      });
    } catch (dbErr) {
      console.error("Error syncing db user on signup:", dbErr);
    }
  }

  // If email confirmation is disabled in Supabase, user is immediately logged in
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return {
    success:
      "Account created successfully! If confirmation is required, please check your email, or log in now.",
  };
}

export async function forgotPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Please enter your email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Password reset email sent. Please check your inbox for instructions.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
