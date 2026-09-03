"use client";

import * as React from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, ShieldCheck, Check, X, Pencil, UploadCloud, Image as ImageIcon, Trash2 } from "lucide-react";
import { createTradeAction, updateTradeAction } from "@/lib/actions/trade-actions";
import { deleteTradeImageAction } from "@/lib/actions/trade-image-actions";
import { RuleEntity, TradeEntity, TradeImageEntity } from "@/lib/data/trade-analytics";

interface AddTradeDrawerProps {
  sessionId: string;
  defaultSymbol?: string;
  defaultDate?: string;
  sessionPeriodStart?: Date | string;
  sessionPeriodEnd?: Date | string;
  sessionRules?: RuleEntity[];
  tradeToEdit?: TradeEntity | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddTradeDrawer({
  sessionId,
  defaultSymbol = "",
  defaultDate,
  sessionPeriodStart,
  sessionPeriodEnd,
  sessionRules = [],
  tradeToEdit = null,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: AddTradeDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const isEditMode = Boolean(tradeToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sessionStartBoundary = React.useMemo(() => {
    if (!sessionPeriodStart) return null;
    const d = new Date(sessionPeriodStart);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }, [sessionPeriodStart]);

  const sessionEndBoundary = React.useMemo(() => {
    if (!sessionPeriodEnd) return null;
    const d = new Date(sessionPeriodEnd);
    if (isNaN(d.getTime())) return null;
    d.setHours(23, 59, 59, 999);
    return d;
  }, [sessionPeriodEnd]);

  const getInitialIso = React.useCallback(
    (offsetMinutes = 0, baseDate?: string | Date) => {
      let targetDate: Date;
      if (baseDate) {
        targetDate = new Date(baseDate);
      } else if (defaultDate) {
        targetDate = new Date(defaultDate);
      } else if (sessionPeriodStart) {
        targetDate = new Date(sessionPeriodStart);
        targetDate.setHours(9, 30, 0, 0);
      } else {
        targetDate = new Date();
      }

      if (isNaN(targetDate.getTime())) return new Date().toISOString().slice(0, 16);
      if (offsetMinutes) {
        targetDate.setMinutes(targetDate.getMinutes() + offsetMinutes);
      }
      const offset = targetDate.getTimezoneOffset() * 60000;
      return new Date(targetDate.getTime() - offset).toISOString().slice(0, 16);
    },
    [defaultDate, sessionPeriodStart]
  );

  // Form states for core fields
  const [symbol, setSymbol] = React.useState(defaultSymbol);
  const [direction, setDirection] = React.useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = React.useState<string>("");
  const [stopLoss, setStopLoss] = React.useState<string>("");
  const [exitPrice, setExitPrice] = React.useState<string>("");
  const [grossPnl, setGrossPnl] = React.useState<string>("");
  const [result, setResult] = React.useState<"win" | "loss" | "breakeven">("win");
  const [entryAt, setEntryAt] = React.useState(getInitialIso(0));
  const [exitAt, setExitAt] = React.useState(getInitialIso(15));

  // Optional backtest fields
  const [htfBias, setHtfBias] = React.useState<string>("");
  const [rr, setRr] = React.useState<string>("");
  const [riskPercent, setRiskPercent] = React.useState<string>("");
  const [drawDirection, setDrawDirection] = React.useState<string>("");
  const [setupModel, setSetupModel] = React.useState<string>("");
  const [newsToday, setNewsToday] = React.useState<string>("");
  const [emotionalState, setEmotionalState] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [singleRuleFollowed, setSingleRuleFollowed] = React.useState<boolean>(true);

  // Rule checks state: mapping of ruleId -> boolean
  const [ruleChecksState, setRuleChecksState] = React.useState<Record<string, boolean>>({});

  // Screenshot / image attachments state
  interface PendingImage {
    id: string;
    file: File;
    previewUrl: string;
    label: string;
  }
  const [pendingImages, setPendingImages] = React.useState<PendingImage[]>([]);
  const [existingImages, setExistingImages] = React.useState<TradeImageEntity[]>([]);
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Populate/reset values whenever tradeToEdit or open state changes
  React.useEffect(() => {
    if (open) {
      if (tradeToEdit) {
        setSymbol(tradeToEdit.symbol);
        setDirection(tradeToEdit.direction as "long" | "short");
        setEntryPrice(tradeToEdit.entryPrice.toString());
        setStopLoss(tradeToEdit.stopLoss !== null ? tradeToEdit.stopLoss.toString() : "");
        setExitPrice(tradeToEdit.exitPrice.toString());
        setGrossPnl(tradeToEdit.grossPnl.toString());
        setResult(tradeToEdit.result as "win" | "loss" | "breakeven");
        setEntryAt(getInitialIso(0, tradeToEdit.entryAt));
        setExitAt(getInitialIso(0, tradeToEdit.exitAt));
        setHtfBias(tradeToEdit.htfBias || "");
        setRr(tradeToEdit.rr || "");
        setRiskPercent(
          tradeToEdit.riskPercent !== null && tradeToEdit.riskPercent !== undefined
            ? tradeToEdit.riskPercent.toString()
            : ""
        );
        setDrawDirection(tradeToEdit.drawDirection || "");
        setSetupModel(tradeToEdit.setupModel || "");
        setNewsToday(tradeToEdit.newsToday || "");
        setEmotionalState(tradeToEdit.emotionalState || "");
        setNotes(tradeToEdit.notes || "");
        setSingleRuleFollowed(tradeToEdit.rulesFollowed ?? true);
        setExistingImages(tradeToEdit.images || []);
        setPendingImages([]);

        const initialChecks: Record<string, boolean> = {};
        sessionRules.forEach((r) => {
          const found = tradeToEdit.ruleChecks?.find((rc) => rc.ruleId === r.id);
          if (found !== undefined) {
            initialChecks[r.id] = found.followed;
          } else if (tradeToEdit.rulesFollowed !== null && tradeToEdit.rulesFollowed !== undefined) {
            initialChecks[r.id] = tradeToEdit.rulesFollowed;
          } else {
            initialChecks[r.id] = true;
          }
        });
        setRuleChecksState(initialChecks);
        setError(null);
      } else {
        // Reset for new trade
        setSymbol(defaultSymbol);
        setDirection("long");
        setEntryPrice("");
        setStopLoss("");
        setExitPrice("");
        setGrossPnl("");
        setResult("win");
        setEntryAt(getInitialIso(0));
        setExitAt(getInitialIso(15));
        setHtfBias("");
        setRr("");
        setRiskPercent("");
        setDrawDirection("");
        setSetupModel("");
        setNewsToday("");
        setEmotionalState("");
        setNotes("");
        setSingleRuleFollowed(true);
        setExistingImages([]);
        setPendingImages([]);

        const initialChecks: Record<string, boolean> = {};
        sessionRules.forEach((r) => {
          initialChecks[r.id] = true;
        });
        setRuleChecksState(initialChecks);
        setError(null);
      }
    }
  }, [open, tradeToEdit, defaultSymbol, sessionRules, getInitialIso]);

  const handleAddFiles = (files: FileList | File[]) => {
    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const newItems: PendingImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 5MB maximum file size.`);
        continue;
      }
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedMime.includes(file.type) && !allowedExts.includes(ext)) {
        setError(`"${file.name}" is not a supported image format (JPG, PNG, WebP, GIF only).`);
        continue;
      }

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        label: "Entry",
      });
    }

    if (newItems.length > 0) {
      setPendingImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    const res = await deleteTradeImageAction(imageId, sessionId);
    setDeletingImageId(null);
    if (res?.error) {
      setError(res.error);
    } else {
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  };

  const dateRangeError = React.useMemo(() => {
    if (!sessionStartBoundary || !sessionEndBoundary) return null;
    const eTime = new Date(entryAt).getTime();
    const xTime = new Date(exitAt).getTime();
    const startStr = sessionStartBoundary.toISOString().slice(0, 10);
    const endStr = sessionEndBoundary.toISOString().slice(0, 10);

    if (!isNaN(eTime) && (eTime < sessionStartBoundary.getTime() || eTime > sessionEndBoundary.getTime())) {
      return `Entry date must fall within the session period (${startStr} – ${endStr}).`;
    }
    if (!isNaN(xTime) && (xTime < sessionStartBoundary.getTime() || xTime > sessionEndBoundary.getTime())) {
      return `Exit date must fall within the session period (${startStr} – ${endStr}).`;
    }
    return null;
  }, [entryAt, exitAt, sessionStartBoundary, sessionEndBoundary]);

  const previewR = React.useMemo(() => {
    const ep = parseFloat(entryPrice);
    const xp = parseFloat(exitPrice);
    const sl = parseFloat(stopLoss);
    if (isNaN(ep) || isNaN(xp) || isNaN(sl) || ep <= 0 || xp <= 0 || sl <= 0) {
      return null;
    }
    const isLong = direction === "long";
    const risk = isLong ? ep - sl : sl - ep;
    if (risk <= 0) return null;
    const diff = isLong ? xp - ep : ep - xp;
    return Math.round((diff / risk) * 100) / 100;
  }, [entryPrice, exitPrice, stopLoss, direction]);

  const handlePriceChange = (newEntry: string, newExit: string, curDirection: "long" | "short") => {
    const ep = parseFloat(newEntry);
    const xp = parseFloat(newExit);
    if (!isNaN(ep) && !isNaN(xp) && ep > 0 && xp > 0) {
      const diff = curDirection === "long" ? xp - ep : ep - xp;
      if (diff > 0.0001) {
        setResult("win");
      } else if (diff < -0.0001) {
        setResult("loss");
      } else {
        setResult("breakeven");
      }
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dateRangeError) {
      setError(dateRangeError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("sessionId", sessionId);
    formData.set("symbol", symbol);
    formData.set("direction", direction);
    formData.set("result", result);
    formData.set("entryAt", entryAt);
    formData.set("exitAt", exitAt);
    formData.set("entryPrice", entryPrice);
    formData.set("stopLoss", stopLoss);
    formData.set("exitPrice", exitPrice);
    formData.set("grossPnl", grossPnl);
    formData.set("htfBias", htfBias);
    formData.set("rr", rr);
    formData.set("riskPercent", riskPercent);
    formData.set("drawDirection", drawDirection);
    formData.set("setupModel", setupModel);
    formData.set("newsToday", newsToday);
    formData.set("emotionalState", emotionalState);
    formData.set("notes", notes);

    // If session has rules, serialize per-rule check results
    if (sessionRules.length > 0) {
      const checks = sessionRules.map((r) => ({
        ruleId: r.id,
        followed: ruleChecksState[r.id] ?? true,
      }));
      formData.set("ruleChecksJson", JSON.stringify(checks));
      const allFollowed = checks.every((c) => c.followed);
      formData.set("rulesFollowed", allFollowed ? "true" : "false");
    } else {
      formData.set("rulesFollowed", singleRuleFollowed ? "true" : "false");
    }

    // Attach pending screenshot image files and their labels
    for (const p of pendingImages) {
      formData.append("pendingImages", p.file);
    }
    formData.set(
      "pendingImageLabels",
      JSON.stringify(pendingImages.map((p) => p.label))
    );

    let res;
    if (isEditMode && tradeToEdit) {
      formData.set("tradeId", tradeToEdit.id);
      res = await updateTradeAction(formData);
    } else {
      res = await createTradeAction(formData);
    }

    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setOpen(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="inline-block">
          {trigger}
        </span>
      ) : !isControlled ? (
        <Button onClick={handleOpen} className="gap-1.5 font-medium">
          <Plus className="h-4 w-4" />
          <span>Add Trade</span>
        </Button>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Trade" : "Log Trade"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Modify execution data and backtest observations."
              : "Record execution data and backtest observations."}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="mb-4 p-2.5 rounded-md bg-[#DB5461]/10 border border-[#DB5461]/25 text-[#DB5461] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SECTION 1: CORE FIELDS (REQUIRED) */}
          <div className="space-y-3 rounded-lg border border-border bg-card p-3.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Core Execution (Required)
              </span>
              <span className="text-[10px] text-muted-foreground">Required</span>
            </div>

            {/* Symbol & Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Symbol <span className="text-[#DB5461]">*</span>
                </label>
                <Input
                  name="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. NQ, EURUSD"
                  className="font-mono-numbers uppercase"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Direction <span className="text-[#DB5461]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection("long");
                      handlePriceChange(entryPrice, exitPrice, "long");
                    }}
                    className={`h-9 rounded-md border text-xs font-semibold transition-colors duration-150 ${
                      direction === "long"
                        ? "bg-[#22A06B]/15 text-[#22A06B] border-[#22A06B]/30"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDirection("short");
                      handlePriceChange(entryPrice, exitPrice, "short");
                    }}
                    className={`h-9 rounded-md border text-xs font-semibold transition-colors duration-150 ${
                      direction === "short"
                        ? "bg-[#DB5461]/15 text-[#DB5461] border-[#DB5461]/30"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>
            </div>

            {/* Entry & Exit Timestamps */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Entry Date & Time <span className="text-[#DB5461]">*</span>
                  </label>
                  <Input
                    name="entryAt"
                    type="datetime-local"
                    value={entryAt}
                    onChange={(e) => setEntryAt(e.target.value)}
                    className="font-mono-numbers text-xs"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Exit Date & Time <span className="text-[#DB5461]">*</span>
                  </label>
                  <Input
                    name="exitAt"
                    type="datetime-local"
                    value={exitAt}
                    onChange={(e) => setExitAt(e.target.value)}
                    className="font-mono-numbers text-xs"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {dateRangeError && (
                <p className="text-[11px] text-[#DB5461] font-medium pt-0.5">
                  {dateRangeError}
                </p>
              )}
            </div>

            {/* Entry, Stop Loss & Exit Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Entry Price <span className="text-[#DB5461]">*</span>
                </label>
                <Input
                  name="entryPrice"
                  type="number"
                  step="any"
                  placeholder="15420.50"
                  value={entryPrice}
                  onChange={(e) => {
                    setEntryPrice(e.target.value);
                    handlePriceChange(e.target.value, exitPrice, direction);
                  }}
                  className="font-mono-numbers"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground block">
                    Stop Loss
                  </label>
                  <span className="text-[10px] text-muted-foreground">For R-Mult</span>
                </div>
                <Input
                  name="stopLoss"
                  type="number"
                  step="any"
                  placeholder={direction === "long" ? "15400.00" : "15440.00"}
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="font-mono-numbers"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Exit Price <span className="text-[#DB5461]">*</span>
                </label>
                <Input
                  name="exitPrice"
                  type="number"
                  step="any"
                  placeholder="15465.00"
                  value={exitPrice}
                  onChange={(e) => {
                    setExitPrice(e.target.value);
                    handlePriceChange(entryPrice, e.target.value, direction);
                  }}
                  className="font-mono-numbers"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Live R-Multiple Preview (if stop loss is provided) */}
            {previewR !== null && (
              <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-secondary/70 border border-border">
                <span className="text-muted-foreground font-medium">Calculated R-Multiple:</span>
                <span
                  className={`font-mono-numbers font-semibold ${
                    previewR > 0
                      ? "text-[#22A06B]"
                      : previewR < 0
                      ? "text-[#DB5461]"
                      : "text-muted-foreground"
                  }`}
                >
                  {previewR > 0 ? `+${previewR.toFixed(2)}R` : `${previewR.toFixed(2)}R`}
                </span>
              </div>
            )}

            {/* Gross P&L & Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Gross P&L ($) <span className="text-[#DB5461]">*</span>
                </label>
                <Input
                  name="grossPnl"
                  type="number"
                  step="any"
                  placeholder="e.g. 650 or -300"
                  value={grossPnl}
                  onChange={(e) => {
                    setGrossPnl(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      if (val > 0) setResult("win");
                      else if (val < 0) setResult("loss");
                      else setResult("breakeven");
                    }
                  }}
                  className="font-mono-numbers font-medium"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Result <span className="text-[#DB5461]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setResult("win")}
                    className={`h-9 rounded-md border text-xs font-medium transition-colors duration-150 ${
                      result === "win"
                        ? "bg-[#22A06B]/15 text-[#22A06B] border-[#22A06B]/30"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Win
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("loss")}
                    className={`h-9 rounded-md border text-xs font-medium transition-colors duration-150 ${
                      result === "loss"
                        ? "bg-[#DB5461]/15 text-[#DB5461] border-[#DB5461]/30"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("breakeven")}
                    className={`h-9 rounded-md border text-xs font-medium transition-colors duration-150 ${
                      result === "breakeven"
                        ? "bg-secondary text-foreground border-white/20"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    BE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BACKTEST LOG FIELDS (OPTIONAL) */}
          <div className="space-y-3 rounded-lg border border-border bg-card p-3.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Backtest-Log Details (Optional)
              </span>
              <span className="text-[10px] text-muted-foreground">Optional</span>
            </div>

            {/* HTF Bias & Planned R:R */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  HTF Bias
                </label>
                <Select
                  name="htfBias"
                  value={htfBias}
                  onChange={(e) => setHtfBias(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select bias...</option>
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Planned R:R
                </label>
                <Input
                  name="rr"
                  value={rr}
                  onChange={(e) => setRr(e.target.value)}
                  placeholder="e.g. 1:2.5 or 1:3"
                  className="font-mono-numbers"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Risk % & Draw Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Risk %
                </label>
                <Input
                  name="riskPercent"
                  type="number"
                  step="any"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  placeholder="e.g. 1.0"
                  className="font-mono-numbers"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Draw on Liquidity
                </label>
                <Input
                  name="drawDirection"
                  value={drawDirection}
                  onChange={(e) => setDrawDirection(e.target.value)}
                  placeholder="e.g. IRL -> ERL"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Setup / Model */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Setup / Model (comma-separated)
              </label>
              <Input
                name="setupModel"
                value={setupModel}
                onChange={(e) => setSetupModel(e.target.value)}
                placeholder="e.g. 15m FVG, 5m MSS"
                disabled={isSubmitting}
              />
            </div>

            {/* News Today & Emotional State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  News Today
                </label>
                <Input
                  name="newsToday"
                  value={newsToday}
                  onChange={(e) => setNewsToday(e.target.value)}
                  placeholder="e.g. CPI, NFP"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Emotional State (comma-separated)
                </label>
                <Input
                  name="emotionalState"
                  value={emotionalState}
                  onChange={(e) => setEmotionalState(e.target.value)}
                  placeholder="e.g. Calm, Focused"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* SECTION 2.5: RULE COMPLIANCE CHECKLIST */}
            {sessionRules.length > 0 ? (
              <div className="space-y-2 pt-1 border-t border-border mt-2">
                <div className="flex items-center justify-between pb-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Session Rules Checklist ({sessionRules.length})</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Click to toggle</span>
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {sessionRules.map((rule) => {
                    const isFollowed = ruleChecksState[rule.id] ?? true;
                    return (
                      <div
                        key={rule.id}
                        onClick={() => {
                          if (!isSubmitting) {
                            setRuleChecksState((prev) => ({
                              ...prev,
                              [rule.id]: !isFollowed,
                            }));
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer select-none transition-colors ${
                          isFollowed
                            ? "bg-[#22A06B]/10 border-[#22A06B]/30 text-foreground"
                            : "bg-[#DB5461]/10 border-[#DB5461]/30 text-foreground"
                        }`}
                      >
                        <span className="font-medium text-xs pr-2">{rule.text}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isFollowed ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#22A06B] bg-[#22A06B]/20 px-2 py-0.5 rounded">
                              <Check className="h-3 w-3" />
                              Followed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#DB5461] bg-[#DB5461]/20 px-2 py-0.5 rounded">
                              <X className="h-3 w-3" />
                              Broken
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Fallback: single legacy boolean checkbox */
              <div className="flex items-center gap-2.5 pt-1">
                <Checkbox
                  name="rulesFollowed"
                  id="rulesFollowed"
                  checked={singleRuleFollowed}
                  onCheckedChange={(c) => setSingleRuleFollowed(Boolean(c))}
                />
                <label
                  htmlFor="rulesFollowed"
                  onClick={() => setSingleRuleFollowed(!singleRuleFollowed)}
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Execution followed all trade rules & plan
                </label>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Trade Notes
              </label>
              <Textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context, execution observations, post-trade analysis..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* SECTION 4: CHART SCREENSHOTS & ATTACHMENTS */}
          <div className="space-y-3 rounded-lg border border-border bg-card p-3.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Chart Screenshots & Analysis
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Optional &bull; Max 5MB each</span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-1.5 ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                }}
              />
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
              <div className="text-xs font-medium text-foreground">
                Click to upload or drag &amp; drop screenshots
              </div>
              <div className="text-[10px] text-muted-foreground">
                PNG, JPG, WebP, GIF (up to 5MB)
              </div>
            </div>

            {/* Preview of Existing & Pending Images */}
            {(existingImages.length > 0 || pendingImages.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Existing Saved Images */}
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative rounded-md border border-border bg-secondary/30 p-2 flex items-center gap-2.5 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.label || "Screenshot"}
                      className="w-14 h-14 object-cover rounded border border-border shrink-0 bg-background"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate">
                        {img.label || "Screenshot"}
                      </span>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5">Saved</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExistingImage(img.id);
                      }}
                      disabled={deletingImageId === img.id || isSubmitting}
                      className="p-1 rounded text-muted-foreground hover:text-[#DB5461] hover:bg-[#DB5461]/10 transition-colors shrink-0"
                      title="Remove screenshot"
                    >
                      {deletingImageId === img.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}

                {/* Pending Newly Added Images */}
                {pendingImages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="relative rounded-md border border-primary/30 bg-primary/5 p-2 flex items-center gap-2.5 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.previewUrl}
                      alt="New screenshot preview"
                      className="w-14 h-14 object-cover rounded border border-border shrink-0 bg-background"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Select
                        value={p.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPendingImages((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, label: val } : item))
                          );
                        }}
                        className="h-6 text-[11px] bg-card py-0 px-1.5"
                      >
                        <option value="Entry">Entry</option>
                        <option value="HTF Context">HTF Context</option>
                        <option value="Exit">Exit</option>
                        <option value="Other">Other</option>
                      </Select>
                      <div className="text-[9px] text-muted-foreground truncate font-mono-numbers">
                        {p.file.name} ({(p.file.size / 1024).toFixed(0)} KB)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(p.previewUrl);
                        setPendingImages((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-[#DB5461] hover:bg-[#DB5461]/10 transition-colors shrink-0"
                      title="Remove from upload"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Boolean(dateRangeError)}
              className="min-w-[110px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : isEditMode ? (
                "Update Trade"
              ) : (
                "Save Trade"
              )}
            </Button>
          </SheetFooter>
        </form>
      </Sheet>
    </>
  );
}
