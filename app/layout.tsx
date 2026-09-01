import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Activity, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "ReplayJournal — Backtesting Trade Journal",
  description: "Minimal, ultra-fast, reliable backtesting trade journal and performance tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen bg-background text-foreground flex flex-col">
        {/* Simple top header */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary/25 transition-colors">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                  ReplayJournal
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40 border border-border/50">
                  MVP v1
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 border border-border/40">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Local SQLite DB</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
