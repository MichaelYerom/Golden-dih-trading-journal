"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { importSessionSnapshotAction, SessionExportSnapshot } from "@/lib/actions/session-export-actions";
import { formatCurrencyNeutral } from "@/lib/utils";
import {
  UploadCloud,
  FileJson,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Wallet,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";

interface ImportSessionDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ImportSessionDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ImportSessionDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
    if (!val) {
      // Reset state when closing
      setRawJson("");
      setParsedData(null);
      setError(null);
    }
  };

  const [rawJson, setRawJson] = React.useState<string>("");
  const [parsedData, setParsedData] = React.useState<SessionExportSnapshot | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    if (!file.name.endsWith(".json")) {
      setError("Please select a valid .json snapshot file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setRawJson(text);
        const data = JSON.parse(text) as SessionExportSnapshot;

        if (!data.schemaVersion || data.schemaVersion > 1) {
          setError(`Unsupported snapshot version (${data.schemaVersion || "unknown"}).`);
          setParsedData(null);
          return;
        }

        if (!data.session || !data.session.instrument) {
          setError("Invalid session data in JSON snapshot.");
          setParsedData(null);
          return;
        }

        setParsedData(data);
      } catch {
        setError("Failed to parse JSON file. Ensure the file contains valid JSON.");
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!rawJson) return;
    setIsSubmitting(true);
    setError(null);

    const res = await importSessionSnapshotAction(rawJson);
    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.sessionId) {
      setOpen(false);
      router.push(`/sessions/${res.sessionId}`);
      router.refresh();
    }
  };

  const tradeStats = React.useMemo(() => {
    if (!parsedData?.trades) return { total: 0, wins: 0, losses: 0, be: 0, images: 0 };
    let wins = 0;
    let losses = 0;
    let be = 0;
    let images = 0;

    for (const t of parsedData.trades) {
      if (t.result === "win") wins++;
      else if (t.result === "loss") losses++;
      else be++;
      if (t.images) images += t.images.length;
    }

    return { total: parsedData.trades.length, wins, losses, be, images };
  }, [parsedData]);

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : !isControlled ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 text-xs font-medium"
        >
          <FileJson className="h-3.5 w-3.5" />
          <span>Import Session</span>
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            <span>Import Session Snapshot</span>
          </DialogTitle>
          <DialogDescription>
            Restore an exact session snapshot from a JSON export file, including trades, rules, and screenshot attachments.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-[#DB5461]/10 border border-[#DB5461]/25 text-[#DB5461] text-xs font-medium flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!parsedData ? (
          /* Upload dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-2.5 ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-secondary/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
            <div className="p-3 rounded-full bg-secondary text-primary border border-border">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                Click to upload or drag &amp; drop session JSON
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Supports .json files generated via &ldquo;Export Session&rdquo;
              </div>
            </div>
          </div>
        ) : (
          /* Snapshot Summary Preview */
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#22A06B]" />
                  <span className="text-xs font-semibold text-foreground">
                    Valid Session Snapshot Ready
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParsedData(null);
                    setRawJson("");
                  }}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Choose different file
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Instrument
                  </span>
                  <span className="font-semibold text-foreground font-mono-numbers uppercase">
                    {parsedData.session.instrument}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Starting Balance
                  </span>
                  <span className="font-semibold text-foreground font-mono-numbers">
                    {formatCurrencyNeutral(parsedData.session.startingBalance)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Period
                  </span>
                  <span className="text-foreground font-mono-numbers truncate block">
                    {new Date(parsedData.session.periodStart).toISOString().slice(0, 10)} &rarr;{" "}
                    {new Date(parsedData.session.periodEnd).toISOString().slice(0, 10)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Trades Included
                  </span>
                  <span className="font-semibold text-foreground font-mono-numbers">
                    {tradeStats.total} ({tradeStats.wins}W / {tradeStats.losses}L / {tradeStats.be}BE)
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Custom Rules
                  </span>
                  <span className="font-semibold text-foreground font-mono-numbers">
                    {parsedData.rules?.length || 0} checklist rules
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Screenshots
                  </span>
                  <span className="font-semibold text-foreground font-mono-numbers">
                    {tradeStats.images} attached images
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This will create a new independent session with all trade records, rules, compliance checks, and screenshot attachments restored.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {parsedData && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={isSubmitting}
              className="gap-1.5 min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <FileJson className="h-3.5 w-3.5" />
                  <span>Confirm &amp; Import</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </>
  );
}
