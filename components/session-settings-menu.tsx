"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { EditSessionDialog } from "@/components/edit-session-dialog";
import { ImportSessionDialog } from "@/components/import-session-dialog";
import { PdfReportDialog } from "@/components/pdf-report-dialog";
import { exportSessionSnapshotAction } from "@/lib/actions/session-export-actions";
import { deleteSessionAction } from "@/lib/actions/session-actions";
import {
  TradeEntity,
  SessionStats,
  EquityPoint,
  RBucket,
  DrawdownResult,
  RuleEntity,
  RuleComplianceResult,
  TimeAnalyticsResult,
  SetupAnalyticsResult,
} from "@/lib/data/trades";
import {
  Settings,
  Pencil,
  Download,
  FileJson,
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface SessionSettingsMenuProps {
  session: {
    id: string;
    name?: string | null;
    instrument: string;
    startingBalance: number;
    periodStart: Date;
    periodEnd: Date;
    status?: string;
  };
  trades: TradeEntity[];
  stats: SessionStats;
  equityCurve: EquityPoint[];
  rDistribution: RBucket[];
  drawdownDetails: DrawdownResult;
  rules: RuleEntity[];
  compliance: RuleComplianceResult;
  timeAnalytics: TimeAnalyticsResult;
  setupAnalytics: SetupAnalyticsResult;
}

export function SessionSettingsMenu({
  session,
  trades,
  stats,
  equityCurve,
  rDistribution,
  drawdownDetails,
  rules,
  compliance,
  timeAnalytics,
  setupAnalytics,
}: SessionSettingsMenuProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Sub-dialog states
  const [editOpen, setEditOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Dismiss dropdown on outside click or Escape
  React.useEffect(() => {
    if (!dropdownOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Handle JSON Snapshot Export
  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const res = await exportSessionSnapshotAction(session.id);
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
        const cleanName = (session.name || session.instrument).toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
      setDropdownOpen(false);
    }
  };

  // Handle Session Deletion with confirmation
  const handleDeleteSession = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete session "${session.name || session.instrument}"? All ${
        trades.length
      } trades, checklist rules, and screenshot images will be permanently removed.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteSessionAction(session.id);
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

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Settings Gear Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="gap-1.5 font-medium text-xs bg-card hover:bg-secondary border-border"
        aria-label="Session settings"
      >
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Settings</span>
      </Button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border bg-card shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-border/60">
          <div className="py-1">
            {/* 1. Edit Session */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setEditOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70 rounded-md transition-colors text-left"
            >
              <Pencil className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Edit Session</span>
            </button>

            {/* 2. Export Session (JSON) */}
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

            {/* 3. Import Session (JSON) */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setImportOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/70 rounded-md transition-colors text-left"
            >
              <FileJson className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Import Session (JSON)</span>
            </button>

            {/* 4. Export PDF Report */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
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

      {/* Controlled Sub-dialogs */}
      <EditSessionDialog
        session={{
          ...session,
          status: session.status || "active",
        }}
        trades={trades}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ImportSessionDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <PdfReportDialog
        session={session}
        trades={trades}
        stats={stats}
        equityCurve={equityCurve}
        rDistribution={rDistribution}
        drawdownDetails={drawdownDetails}
        rules={rules}
        compliance={compliance}
        timeAnalytics={timeAnalytics}
        setupAnalytics={setupAnalytics}
        open={pdfOpen}
        onOpenChange={setPdfOpen}
      />
    </div>
  );
}
