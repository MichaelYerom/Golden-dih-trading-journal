"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  TrendingUp,
  BookOpen,
  Lightbulb,
  BarChart3,
  Database,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  Clock,
  Trophy,
  CalendarDays,
  Settings,
  Pencil,
  Download,
  FileJson,
  FileText,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn, formatCurrencyNeutral } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { logoutAction } from "@/app/auth/actions";
import { useSessionNav, SessionTab } from "@/components/session-nav-context";
import { EditSessionDialog } from "@/components/edit-session-dialog";
import { ImportSessionDialog } from "@/components/import-session-dialog";
import { PdfReportDialog } from "@/components/pdf-report-dialog";
import { exportSessionSnapshotAction } from "@/lib/actions/session-export-actions";
import { deleteSessionAction } from "@/lib/actions/session-actions";

interface UserProp {
  id?: string;
  email?: string;
  name?: string;
}

interface MainAppSidebarProps {
  user: UserProp | null;
}

const STORAGE_KEY = "golden_dih_sidebar_collapsed";

const MAIN_NAV_ITEMS = [
  {
    name: "Backtests",
    href: "/",
    icon: TrendingUp,
    isActive: (pathname: string) => pathname === "/" || pathname === "",
  },
  {
    name: "Playbook",
    href: "/playbook",
    icon: BookOpen,
    isActive: (pathname: string) => pathname.startsWith("/playbook"),
  },
  {
    name: "Lessons",
    href: "/lessons",
    icon: Lightbulb,
    isActive: (pathname: string) => pathname.startsWith("/lessons"),
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    isActive: (pathname: string) => pathname.startsWith("/analytics"),
  },
];

export function MainAppSidebar({ user }: MainAppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Session context
  const { activeTab, setActiveTab, sessionData } = useSessionNav();

  // Settings dropdown & dialog states
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const settingsRef = React.useRef<HTMLDivElement | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Context detection: Are we currently inside a session dashboard?
  const isInsideSession = pathname.startsWith("/sessions/");

  // Restore collapsed state from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }
    } catch {}
    setMounted(true);
  }, []);

  // Close mobile drawer on path change
  React.useEffect(() => {
    setMobileOpen(false);
    setSettingsOpen(false);
  }, [pathname]);

  // Handle outside click for settings dropdown
  React.useEffect(() => {
    if (!settingsOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  // Session export JSON
  const handleExportJson = async () => {
    if (!sessionData?.session?.id) return;
    setIsExporting(true);
    try {
      const res = await exportSessionSnapshotAction(sessionData.session.id);
      if (res.error) {
        alert("Export failed: " + res.error);
        return;
      }
      if (res.snapshot) {
        const jsonStr = JSON.stringify(res.snapshot, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = format(new Date(), "yyyy-MM-dd");
        const cleanName = (sessionData.session.name || sessionData.session.instrument || "session")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        link.href = url;
        link.download = `${cleanName}-session-${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export session JSON.");
    } finally {
      setIsExporting(false);
      setSettingsOpen(false);
    }
  };

  // Session deletion
  const handleDeleteSession = async () => {
    if (!sessionData?.session?.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete session "${
        sessionData.session.name || sessionData.session.instrument
      }"? All trades, checklist rules, and screenshot images will be permanently removed.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteSessionAction(sessionData.session.id);
      if (res?.error) {
        alert("Delete failed: " + res.error);
        setIsDeleting(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete session.");
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  // Session view tabs definition
  const sessionTabs: Array<{
    id: SessionTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number | null;
  }> = [
    {
      id: "overview",
      label: "Overview & Trades",
      icon: LayoutDashboard,
    },
    {
      id: "time",
      label: "Time Analysis",
      icon: Clock,
      badge:
        sessionData?.timeCount && sessionData.timeCount > 0
          ? sessionData.timeCount
          : sessionData?.timeAnalytics?.totalTradesEvaluated &&
            sessionData.timeAnalytics.totalTradesEvaluated > 0
          ? sessionData.timeAnalytics.totalTradesEvaluated
          : null,
    },
    {
      id: "setups",
      label: "Setup Leaderboard",
      icon: Trophy,
      badge:
        sessionData?.setupsCount && sessionData.setupsCount > 0
          ? sessionData.setupsCount
          : sessionData?.setupAnalytics?.totalSetupsCount &&
            sessionData.setupAnalytics.totalSetupsCount > 0
          ? sessionData.setupAnalytics.totalSetupsCount
          : null,
    },
    {
      id: "calendar",
      label: "Calendar Heatmap",
      icon: CalendarDays,
      badge:
        sessionData?.calendarDays && sessionData.calendarDays > 0
          ? `${sessionData.calendarDays}d`
          : sessionData?.stats?.totalTrades && sessionData.stats.totalTrades > 0
          ? `${sessionData.stats.totalTrades}tr`
          : null,
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR (screens < md) */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 h-13 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between">
        {isInsideSession ? (
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Sessions</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-foreground">
              Golden DIH
            </span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-[10px] text-muted-foreground">
            <Database className="h-2.5 w-2.5 text-emerald-400" />
            <span>DB</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-secondary transition-colors"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative ml-auto w-72 max-w-[85vw] h-full bg-card border-l border-border p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-semibold text-sm text-foreground">
                  {isInsideSession ? "Session Navigation" : "Navigation"}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Navigation List */}
              {isInsideSession ? (
                <div className="space-y-3">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Sessions</span>
                  </Link>

                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Views
                    </div>
                    {sessionTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all text-left",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.2 text-[10px] font-mono-numbers",
                                isActive
                                  ? "bg-black/30 text-primary-foreground"
                                  : "bg-secondary text-muted-foreground border border-border"
                              )}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions in Mobile */}
                  {sessionData && (
                    <div className="pt-2 border-t border-border space-y-1">
                      <div className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Session Actions
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          setEditOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-primary shrink-0" />
                        <span>Edit Session</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-primary shrink-0" />
                        <span>Session Settings & Export</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <nav className="space-y-1">
                  {MAIN_NAV_ITEMS.map((item) => {
                    const active = item.isActive(pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border/40 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium text-foreground truncate" title={user.email}>
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SINGLE PERSISTENT SIDEBAR (screens >= md) */}
      {/* ========================================================================= */}
      <aside
        className={cn(
          "hidden md:flex flex-col justify-between shrink-0 sticky top-0 h-screen z-30 border-r border-border bg-card/60 backdrop-blur transition-all duration-200 ease-in-out",
          mounted && isCollapsed ? "w-[68px]" : "w-56"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Header / Brand or Back Button */}
          {isInsideSession ? (
            <div className="h-14 flex items-center px-3 border-b border-border/70 shrink-0">
              {mounted && isCollapsed ? (
                <div className="w-full flex justify-center">
                  <Tooltip content="Back to Sessions" side="right">
                    <Link
                      href="/"
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                      aria-label="Back to Sessions"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Tooltip>
                </div>
              ) : (
                <Link
                  href="/"
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors truncate"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">Back to Sessions</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="h-14 flex items-center px-3.5 border-b border-border/70 shrink-0">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-2.5 overflow-hidden transition-all duration-200",
                  mounted && isCollapsed ? "justify-center w-full" : ""
                )}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                {(!mounted || !isCollapsed) && (
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="font-semibold text-xs text-foreground tracking-tight truncate">
                      Golden DIH
                    </span>
                    <span className="text-[10px] text-muted-foreground">Journal</span>
                  </div>
                )}
              </Link>
            </div>
          )}

          {/* Navigation Items (Swaps based on isInsideSession) */}
          <div className="p-2 space-y-1 flex-1">
            {isInsideSession ? (
              <>
                {/* Session Views Section */}
                {(!mounted || !isCollapsed) ? (
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Views
                  </div>
                ) : (
                  <div className="h-2" />
                )}

                <nav className="space-y-1">
                  {sessionTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    const buttonNode = (
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "relative flex items-center rounded-lg text-xs font-medium transition-all text-left",
                          mounted && isCollapsed
                            ? "h-9 w-9 mx-auto justify-center px-0"
                            : "px-2.5 py-2 w-full justify-between gap-2",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="h-4 w-4 shrink-0" />
                          {(!mounted || !isCollapsed) && (
                            <span className="truncate">{tab.label}</span>
                          )}
                        </div>

                        {tab.badge && (
                          <>
                            {(!mounted || !isCollapsed) ? (
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono-numbers shrink-0",
                                  isActive
                                    ? "bg-black/30 text-primary-foreground font-semibold"
                                    : "bg-secondary border border-border text-muted-foreground"
                                )}
                              >
                                {tab.badge}
                              </span>
                            ) : (
                              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </>
                        )}
                      </button>
                    );

                    return mounted && isCollapsed ? (
                      <div key={tab.id} className="flex justify-center">
                        <Tooltip
                          content={
                            <span>
                              {tab.label} {tab.badge ? `(${tab.badge})` : ""}
                            </span>
                          }
                          side="right"
                        >
                          {buttonNode}
                        </Tooltip>
                      </div>
                    ) : (
                      <div key={tab.id}>{buttonNode}</div>
                    );
                  })}
                </nav>

                {/* Session Actions Section Divider */}
                <div className="my-2 border-t border-border/60" />

                {(!mounted || !isCollapsed) ? (
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </div>
                ) : (
                  <div className="h-1" />
                )}

                {/* Action 1: Edit Session */}
                {mounted && isCollapsed ? (
                  <div className="flex justify-center">
                    <Tooltip content="Edit Session" side="right">
                      <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                        aria-label="Edit Session"
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </button>
                    </Tooltip>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors text-left"
                  >
                    <Pencil className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">Edit Session</span>
                  </button>
                )}

                {/* Action 2: Settings Dropdown */}
                <div className="relative" ref={settingsRef}>
                  {mounted && isCollapsed ? (
                    <div className="flex justify-center">
                      <Tooltip content="Session Settings" side="right">
                        <button
                          type="button"
                          onClick={() => setSettingsOpen(!settingsOpen)}
                          className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                            settingsOpen
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          )}
                          aria-label="Session Settings"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </Tooltip>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left",
                        settingsOpen
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">Settings</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                          settingsOpen && "rotate-90"
                        )}
                      />
                    </button>
                  )}

                  {/* Settings Dropdown Menu */}
                  {settingsOpen && (
                    <div
                      className={cn(
                        "absolute z-50 rounded-lg border border-border bg-card shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100 divide-y divide-border/60",
                        mounted && isCollapsed
                          ? "left-full top-0 ml-2 w-56"
                          : "left-0 right-0 top-full mt-1 w-52"
                      )}
                    >
                      <div className="py-1">
                        {/* Edit Session Item */}
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsOpen(false);
                            setEditOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70 rounded-md transition-colors text-left"
                        >
                          <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Edit Session</span>
                        </button>

                        {/* Export JSON */}
                        <button
                          type="button"
                          onClick={handleExportJson}
                          disabled={isExporting}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70 rounded-md transition-colors text-left disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <Download className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>Export Session (JSON)</span>
                          </div>
                          {isExporting && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                        </button>

                        {/* Import JSON */}
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsOpen(false);
                            setImportOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70 rounded-md transition-colors text-left"
                        >
                          <FileJson className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Import Session (JSON)</span>
                        </button>

                        {/* Export PDF Report */}
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsOpen(false);
                            setPdfOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70 rounded-md transition-colors text-left"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Export PDF Report</span>
                        </button>
                      </div>

                      {/* Destructive Actions */}
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={handleDeleteSession}
                          disabled={isDeleting}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-[#DB5461] hover:bg-[#DB5461]/10 rounded-md transition-colors text-left font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <Trash2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Delete Session</span>
                          </div>
                          {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Main App Nav Items */
              <nav className="space-y-1">
                {MAIN_NAV_ITEMS.map((item) => {
                  const active = item.isActive(pathname);
                  const Icon = item.icon;

                  const linkNode = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all",
                        mounted && isCollapsed
                          ? "h-9 w-9 mx-auto justify-center px-0"
                          : "px-3 py-2 w-full",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {(!mounted || !isCollapsed) && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );

                  return mounted && isCollapsed ? (
                    <div key={item.href} className="flex justify-center">
                      <Tooltip content={item.name} side="right">
                        {linkNode}
                      </Tooltip>
                    </div>
                  ) : (
                    <div key={item.href}>{linkNode}</div>
                  );
                })}
              </nav>
            )}
          </div>
        </div>

        {/* Footer Actions & Profile (Consistent across both states) */}
        <div className="p-2 border-t border-border/70 space-y-2 shrink-0">
          {/* Database Status Indicator */}
          {(!mounted || !isCollapsed) ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-secondary/40 border border-border/40 text-[11px] text-muted-foreground font-mono-numbers">
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>Supabase</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          ) : (
            <div className="flex justify-center">
              <Tooltip content="Supabase: Connected" side="right">
                <div className="h-8 w-8 rounded-md bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground">
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </Tooltip>
            </div>
          )}

          {/* User Badge & Logout Button */}
          {(!mounted || !isCollapsed) ? (
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-secondary/30 border border-border/40">
              <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                <div className="h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <span
                  className="text-[11px] font-medium text-foreground truncate"
                  title={user.email}
                >
                  {user.name || user.email}
                </span>
              </div>

              <Tooltip content="Sign Out" side="top">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  aria-label="Sign Out"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Tooltip content={`User: ${user.name || user.email}`} side="right">
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 shrink-0 cursor-default">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              </Tooltip>

              <Tooltip content="Sign Out" side="right">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  aria-label="Sign Out"
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          )}

          {/* Sidebar Collapse Toggle Button */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors",
                mounted && isCollapsed ? "justify-center w-8 h-8 p-0" : "w-full justify-center"
              )}
            >
              {mounted && isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Controlled Sub-dialogs for Session Actions */}
      {sessionData?.session && (
        <>
          <EditSessionDialog
            session={{
              ...sessionData.session,
              status: sessionData.session.status || "active",
            }}
            trades={sessionData.trades || []}
            open={editOpen}
            onOpenChange={setEditOpen}
          />

          <ImportSessionDialog
            open={importOpen}
            onOpenChange={setImportOpen}
          />

          {sessionData.stats && sessionData.drawdownDetails && sessionData.compliance && sessionData.timeAnalytics && sessionData.setupAnalytics && (
            <PdfReportDialog
              session={sessionData.session}
              trades={sessionData.trades || []}
              stats={sessionData.stats}
              equityCurve={sessionData.equityCurve || []}
              rDistribution={sessionData.rDistribution || []}
              drawdownDetails={sessionData.drawdownDetails}
              rules={sessionData.rules || []}
              compliance={sessionData.compliance}
              timeAnalytics={sessionData.timeAnalytics}
              setupAnalytics={sessionData.setupAnalytics}
              open={pdfOpen}
              onOpenChange={setPdfOpen}
            />
          )}
        </>
      )}
    </>
  );
}
