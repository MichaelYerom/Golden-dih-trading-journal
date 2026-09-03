import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { TrendingUp, Database } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { UserNav } from "@/components/user-nav";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "Golden DIH — Backtesting Trade Journal",
  description: "Minimal, ultra-fast, reliable backtesting trade journal and performance tracker.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen bg-background text-foreground flex flex-col antialiased">
        {/* Flat hairline header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between py-3">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm tracking-tight text-foreground">
                    Golden DIH
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Journal
                  </span>
                </div>
              </Link>

              {user && <MainNav />}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-muted-foreground">
                <Database className="h-3 w-3 text-emerald-400" />
                <span>Supabase</span>
              </div>
              <UserNav user={user} />
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
