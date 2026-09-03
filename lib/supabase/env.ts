/**
 * Centralized Supabase Environment Variable Validator & Resolver.
 * Resolves standard Next.js / Vercel Supabase environment variable names
 * and fails loudly with explicit error messages if any are missing or malformed.
 */

export function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || typeof url !== "string" || !url.trim().startsWith("http")) {
    throw new Error(
      "❌ CRITICAL CONFIGURATION ERROR: 'NEXT_PUBLIC_SUPABASE_URL' is missing or invalid. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL (e.g. https://your-project.supabase.co) in your environment variables."
    );
  }

  if (!anonKey || typeof anonKey !== "string" || anonKey.trim() === "") {
    throw new Error(
      "❌ CRITICAL CONFIGURATION ERROR: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' is missing. " +
      "Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables."
    );
  }

  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
  };
}
