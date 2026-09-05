import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/get-user";
import { MainAppSidebar } from "@/components/main-app-sidebar";
import { SessionNavProvider } from "@/components/session-nav-context";

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
      <body className="font-sans min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased">
        <SessionNavProvider>
          {/* Unified single contextual sidebar (hidden on mobile, replaced by mobile header) */}
          <MainAppSidebar user={user} />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            {children}
          </main>
        </SessionNavProvider>
      </body>
    </html>
  );
}
