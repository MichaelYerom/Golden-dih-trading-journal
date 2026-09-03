"use client";

import * as React from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Loader2,
  ShieldCheck,
  Check,
  X,
  Pencil,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createTradeAction, updateTradeAction } from "@/lib/actions/trade-actions";
import { deleteTradeImageAction } from "@/lib/actions/trade-image-actions";
import { RuleEntity, TradeEntity, TradeImageEntity, calculateTradeOutcomeR, calculateTradePnL, calculateRiskPercent } from "@/lib/data/trade-analytics";
import { StrategyEntity } from "@/lib/data/strategies";
import { ConfluenceEntity } from "@/lib/data/confluences";
import { formatCurrency, formatCurrencyNeutral } from "@/lib/utils";

interface AddTradeDrawerProps {
  sessionId: string;
  defaultSymbol?: string;
  defaultDate?: string;
  sessionPeriodStart?: Date | string;
  sessionPeriodEnd?: Date | string;
  sessionRules?: RuleEntity[];
  strategies?: StrategyEntity[];
  confluences?: ConfluenceEntity[];
  sessionStartingBalance?: number;
  sessionCurrentBalance?: number;
  tradeToEdit?: TradeEntity | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  label: string;
  role: "before_trade" | "outcome";
}

export function AddTradeDrawer({
  sessionId,
  defaultSymbol = "",
  defaultDate,
  sessionPeriodStart,
  sessionPeriodEnd,
  sessionRules = [],
  strategies = [],
  confluences = [],
  sessionStartingBalance = 10000,
  sessionCurrentBalance = 10000,
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

  // 1. BEFORE TRADE STATE
  const [entryAt, setEntryAt] = React.useState(getInitialIso(0));
  const [exitAt, setExitAt] = React.useState(getInitialIso(15));
  const [symbol, setSymbol] = React.useState(defaultSymbol);
  const [htfBias, setHtfBias] = React.useState<string>("Bullish");
  const [beforeTradeNotes, setBeforeTradeNotes] = React.useState<string>("");

  // 2. AFTER TRADE STATE
  const [outcomeType, setOutcomeType] = React.useState<"trade" | "missed_entry" | "no_trade">("trade");
  const [selectedStrategyId, setSelectedStrategyId] = React.useState<string>("");
  const [selectedConfluenceIds, setSelectedConfluenceIds] = React.useState<string[]>([]);
  const [riskAmount, setRiskAmount] = React.useState<string>("250");
  const [result, setResult] = React.useState<"win" | "loss" | "breakeven">("win");
  const [rrAchieved, setRrAchieved] = React.useState<string>("2.0");
  const [lossR, setLossR] = React.useState<string>("-1.0");
  const [potentialRR, setPotentialRR] = React.useState<string>("");
  const [reasonNotes, setReasonNotes] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [emotionalState, setEmotionalState] = React.useState<string>("");

  // Optional manual price inputs
  const [showManualPrices, setShowManualPrices] = React.useState(false);
  const [direction, setDirection] = React.useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = React.useState<string>("");
  const [stopLoss, setStopLoss] = React.useState<string>("");
  const [exitPrice, setExitPrice] = React.useState<string>("");

  // Rule checks
  const [ruleChecksState, setRuleChecksState] = React.useState<Record<string, boolean>>({});

  // Image attachments
  const [pendingImages, setPendingImages] = React.useState<PendingImage[]>([]);
  const [existingImages, setExistingImages] = React.useState<TradeImageEntity[]>([]);
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null);

  // Drag & drop state
  const [isDraggingBefore, setIsDraggingBefore] = React.useState(false);
  const [isDraggingOutcome, setIsDraggingOutcome] = React.useState(false);
  const beforeFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const outcomeFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // When strategy changes, automatically suggest associated confluences
  const handleStrategyChange = (strategyId: string) => {
    setSelectedStrategyId(strategyId);
    if (!strategyId) return;
    const strategy = strategies.find((s) => s.id === strategyId);
    if (strategy && strategy.confluences && strategy.confluences.length > 0) {
      const confIds = strategy.confluences.map((c) => c.id);
      setSelectedConfluenceIds((prev) => Array.from(new Set([...prev, ...confIds])));
    }
  };

  const toggleConfluence = (confId: string) => {
    setSelectedConfluenceIds((prev) =>
      prev.includes(confId) ? prev.filter((id) => id !== confId) : [...prev, confId]
    );
  };

  // Reset/populate form
  React.useEffect(() => {
    if (open) {
      if (tradeToEdit) {
        setOutcomeType((tradeToEdit.outcomeType as any) || "trade");
        setSymbol(tradeToEdit.symbol);
        setEntryAt(getInitialIso(0, tradeToEdit.entryAt));
        setExitAt(getInitialIso(0, tradeToEdit.exitAt));
        setHtfBias(tradeToEdit.htfBias || "Bullish");
        setBeforeTradeNotes(tradeToEdit.beforeTradeNotes || "");
        setSelectedStrategyId(tradeToEdit.strategyId || "");
        setSelectedConfluenceIds(tradeToEdit.confluences?.map((c) => c.id) || []);
        setRiskAmount(tradeToEdit.riskAmount ? tradeToEdit.riskAmount.toString() : "250");
        setResult((tradeToEdit.result as any) || "win");
        setRrAchieved(tradeToEdit.rrAchieved !== null && tradeToEdit.rrAchieved !== undefined ? tradeToEdit.rrAchieved.toString() : "2.0");
        setLossR(tradeToEdit.lossR !== null && tradeToEdit.lossR !== undefined ? tradeToEdit.lossR.toString() : "-1.0");
        setPotentialRR(tradeToEdit.potentialRR !== null && tradeToEdit.potentialRR !== undefined ? tradeToEdit.potentialRR.toString() : "");
        setReasonNotes(tradeToEdit.reasonNotes || "");
        setNotes(tradeToEdit.notes || "");
        setEmotionalState(tradeToEdit.emotionalState || "");
        setDirection((tradeToEdit.direction as any) || "long");
        setEntryPrice(tradeToEdit.entryPrice !== null ? tradeToEdit.entryPrice.toString() : "");
        setStopLoss(tradeToEdit.stopLoss !== null ? tradeToEdit.stopLoss.toString() : "");
        setExitPrice(tradeToEdit.exitPrice !== null ? tradeToEdit.exitPrice.toString() : "");
        setExistingImages(tradeToEdit.images || []);
        setPendingImages([]);

        const initialChecks: Record<string, boolean> = {};
        sessionRules.forEach((r) => {
          const found = tradeToEdit.ruleChecks?.find((rc) => rc.ruleId === r.id);
          initialChecks[r.id] = found ? found.followed : true;
        });
        setRuleChecksState(initialChecks);
        setError(null);
      } else {
        setOutcomeType("trade");
        setSymbol(defaultSymbol || "NQ");
        setEntryAt(getInitialIso(0));
        setExitAt(getInitialIso(15));
        setHtfBias("Bullish");
        setBeforeTradeNotes("");
        setSelectedStrategyId(strategies.length > 0 ? strategies[0].id : "");
        setSelectedConfluenceIds([]);
        setRiskAmount("250");
        setResult("win");
        setRrAchieved("2.0");
        setLossR("-1.0");
        setPotentialRR("");
        setReasonNotes("");
        setNotes("");
        setEmotionalState("");
        setDirection("long");
        setEntryPrice("");
        setStopLoss("");
        setExitPrice("");
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
  }, [open, tradeToEdit, defaultSymbol, sessionRules, strategies, getInitialIso]);

  // Derived live P&L and Risk % calculations
  const parsedRisk = parseFloat(riskAmount) || 0;
  const parsedRrAchieved = parseFloat(rrAchieved) || 0;
  const parsedLossR = parseFloat(lossR) || -1.0;

  const derivedR = React.useMemo(() => {
    if (outcomeType !== "trade") return null;
    return calculateTradeOutcomeR(result, parsedRrAchieved, parsedLossR);
  }, [outcomeType, result, parsedRrAchieved, parsedLossR]);

  const livePnL = React.useMemo(() => {
    if (outcomeType !== "trade" || derivedR === null) return 0;
    return calculateTradePnL(parsedRisk, derivedR);
  }, [outcomeType, parsedRisk, derivedR]);

  const liveRiskPercent = React.useMemo(() => {
    const baseBalance = sessionCurrentBalance > 0 ? sessionCurrentBalance : sessionStartingBalance;
    return calculateRiskPercent(parsedRisk, baseBalance);
  }, [parsedRisk, sessionCurrentBalance, sessionStartingBalance]);

  // Image handling
  const handleAddFiles = (files: FileList | File[], role: "before_trade" | "outcome") => {
    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const newItems: PendingImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 5MB limit.`);
        continue;
      }
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedMime.includes(file.type) && !allowedExts.includes(ext)) {
        setError(`"${file.name}" is not a supported format.`);
        continue;
      }

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        label: role === "before_trade" ? "Before Setup" : "Outcome / Exit",
        role,
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

  const beforeExistingImages = existingImages.filter((img) => img.role === "before_trade");
  const outcomeExistingImages = existingImages.filter((img) => img.role !== "before_trade");
  const beforePendingImages = pendingImages.filter((img) => img.role === "before_trade");
  const outcomePendingImages = pendingImages.filter((img) => img.role === "outcome");

  // Date validation
  const dateRangeError = React.useMemo(() => {
    if (!sessionStartBoundary || !sessionEndBoundary) return null;
    const eTime = new Date(entryAt).getTime();
    const startStr = sessionStartBoundary.toISOString().slice(0, 10);
    const endStr = sessionEndBoundary.toISOString().slice(0, 10);

    if (!isNaN(eTime) && (eTime < sessionStartBoundary.getTime() || eTime > sessionEndBoundary.getTime())) {
      return `Trade date must fall within session range (${startStr} to ${endStr}).`;
    }
    return null;
  }, [entryAt, sessionStartBoundary, sessionEndBoundary]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dateRangeError) {
      setError(dateRangeError);
      return;
    }

    if (!symbol.trim()) {
      setError("Please specify a symbol (e.g. NQ, ES, EURUSD).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("sessionId", sessionId);
      formData.set("symbol", symbol.trim().toUpperCase());
      formData.set("outcomeType", outcomeType);
      formData.set("entryAt", new Date(entryAt).toISOString());
      formData.set("exitAt", new Date(exitAt || entryAt).toISOString());
      formData.set("htfBias", htfBias);
      formData.set("beforeTradeNotes", beforeTradeNotes);
      formData.set("reasonNotes", reasonNotes);
      formData.set("notes", notes);
      formData.set("emotionalState", emotionalState);

      if (selectedStrategyId) {
        formData.set("strategyId", selectedStrategyId);
      }
      formData.set("confluenceIdsJson", JSON.stringify(selectedConfluenceIds));

      if (outcomeType === "trade") {
        formData.set("riskAmount", riskAmount);
        formData.set("riskPercent", liveRiskPercent.toString());
        formData.set("result", result);
        formData.set("rrAchieved", rrAchieved);
        formData.set("lossR", lossR);
        if (potentialRR) formData.set("potentialRR", potentialRR);
        formData.set("grossPnl", livePnL.toString());
        if (derivedR !== null) {
          formData.set("rr", `${derivedR > 0 ? "+" : ""}${derivedR}R`);
        }

        if (showManualPrices) {
          formData.set("direction", direction);
          if (entryPrice) formData.set("entryPrice", entryPrice);
          if (stopLoss) formData.set("stopLoss", stopLoss);
          if (exitPrice) formData.set("exitPrice", exitPrice);
        }

        // Rule checks
        const ruleChecksArray = Object.entries(ruleChecksState).map(([ruleId, followed]) => ({
          ruleId,
          followed,
        }));
        formData.set("ruleChecksJson", JSON.stringify(ruleChecksArray));
        const allFollowed = ruleChecksArray.length > 0 ? ruleChecksArray.every((rc) => rc.followed) : true;
        formData.set("rulesFollowed", allFollowed.toString());
      } else {
        formData.set("grossPnl", "0");
      }

      // Append images with role distinction
      const beforeFiles = beforePendingImages.map((pi) => pi.file);
      const beforeLabels = beforePendingImages.map((pi) => pi.label);
      beforeFiles.forEach((f) => formData.append("pendingBeforeImages", f));
      formData.set("pendingBeforeImagesLabels", JSON.stringify(beforeLabels));

      const outcomeFiles = outcomePendingImages.map((pi) => pi.file);
      const outcomeLabels = outcomePendingImages.map((pi) => pi.label);
      outcomeFiles.forEach((f) => formData.append("pendingOutcomeImages", f));
      formData.set("pendingOutcomeImagesLabels", JSON.stringify(outcomeLabels));

      let res;
      if (isEditMode && tradeToEdit) {
        formData.set("tradeId", tradeToEdit.id);
        res = await updateTradeAction(formData);
      } else {
        res = await createTradeAction(formData);
      }

      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else {
        setOpen(false);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Trade submit error:", err);
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Trade
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex flex-col h-full bg-card text-card-foreground">
          <SheetHeader className="p-5 pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  {isEditMode ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                  {isEditMode ? "Edit Journal Entry" : "Log Trade & Setup"}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  Pre-execution thesis, Playbook strategy confluences, and R-multiple outcome.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {error && (
                <div className="p-3 bg-[#DB5461]/10 border border-[#DB5461]/30 rounded-lg text-xs text-[#DB5461] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 1. BEFORE TRADE SECTION */}
              {/* ========================================================================= */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      1
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Before Trade (Pre-Execution Thesis)
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Context & Levels</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Date & Time */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Trade Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={entryAt}
                      onChange={(e) => {
                        setEntryAt(e.target.value);
                        setExitAt(e.target.value);
                      }}
                      required
                      className="text-xs h-8 bg-background font-mono-numbers"
                    />
                  </div>

                  {/* Symbol */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Symbol / Asset</label>
                    <Input
                      type="text"
                      placeholder="e.g. NQ, ES, EURUSD, BTC"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      required
                      className="text-xs h-8 bg-background font-semibold tracking-wide uppercase"
                    />
                  </div>
                </div>

                {/* Higher Timeframe Bias */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">Higher Timeframe (HTF) Bias</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Bullish", "Bearish", "Neutral / Range"] as const).map((bias) => (
                      <button
                        key={bias}
                        type="button"
                        onClick={() => setHtfBias(bias)}
                        className={`h-8 rounded-lg border text-xs font-medium transition-all ${
                          htfBias === bias
                            ? bias === "Bullish"
                              ? "border-[#22A06B] bg-[#22A06B]/15 text-[#22A06B] font-semibold"
                              : bias === "Bearish"
                              ? "border-[#DB5461] bg-[#DB5461]/15 text-[#DB5461] font-semibold"
                              : "border-primary bg-primary/15 text-primary font-semibold"
                            : "border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background"
                        }`}
                      >
                        {bias}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Before Trade Thesis / Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Pre-Market Thesis, Key Levels & Draw on Liquidity
                  </label>
                  <Textarea
                    placeholder="Describe what you are anticipating before entering: session narrative, key HTF liquidity draw, news timing..."
                    value={beforeTradeNotes}
                    onChange={(e) => setBeforeTradeNotes(e.target.value)}
                    rows={2}
                    className="text-xs bg-background resize-none leading-relaxed"
                  />
                </div>

                {/* Before Trade Screenshot */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                    <span>Pre-Execution Chart Screenshot</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingBefore(true);
                    }}
                    onDragLeave={() => setIsDraggingBefore(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingBefore(false);
                      if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files, "before_trade");
                    }}
                    onClick={() => beforeFileInputRef.current?.click()}
                    className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      isDraggingBefore
                        ? "border-primary bg-primary/5"
                        : "border-border/80 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={beforeFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleAddFiles(e.target.files, "before_trade");
                      }}
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <UploadCloud className="h-4 w-4 text-primary" />
                      <span>Upload pre-trade chart (Click or drag & drop)</span>
                    </div>
                  </div>

                  {/* Thumbnail Previews */}
                  {(beforeExistingImages.length > 0 || beforePendingImages.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      {beforeExistingImages.map((img) => (
                        <div key={img.id} className="relative group rounded-md overflow-hidden border border-border bg-black/40 aspect-video flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="Before trade" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExistingImage(img.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {beforePendingImages.map((pi) => (
                        <div key={pi.id} className="relative group rounded-md overflow-hidden border border-border bg-black/40 aspect-video flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pi.previewUrl} alt="Pending before" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingImages((prev) => prev.filter((p) => p.id !== pi.id));
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 2. AFTER TRADE SECTION */}
              {/* ========================================================================= */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      2
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      After Trade (Outcome & Review)
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Execution & R</span>
                </div>

                {/* 3-Way Outcome Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">Session Outcome Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "trade", label: "Took a Trade", icon: TrendingUp },
                      { id: "missed_entry", label: "Missed Entry", icon: AlertCircle },
                      { id: "no_trade", label: "No Trade Day", icon: MinusCircle },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = outcomeType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setOutcomeType(opt.id as any)}
                          className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? opt.id === "trade"
                                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                                : "border-amber-500 bg-amber-500/15 text-amber-400 font-semibold"
                              : "border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NON-TRADE OUTCOME (MISSED ENTRY / NO TRADE DAY) */}
                {outcomeType !== "trade" ? (
                  <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>
                        {outcomeType === "missed_entry"
                          ? "Missed entry logged with $0.00 P&L. It will not penalize your win rate or drawdown."
                          : "No trade day logged with $0.00 P&L. Tracks discipline without skewing expectancy."}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-foreground">
                        {outcomeType === "missed_entry" ? "Reason Entry was Missed" : "Reason for No Trade"}
                      </label>
                      <Textarea
                        placeholder={
                          outcomeType === "missed_entry"
                            ? "e.g. Hesitated on trigger, limit order missed by 1 tick, away from chart during news spike..."
                            : "e.g. Price stayed in range, no clear setup formed from Playbook, market chop..."
                        }
                        value={reasonNotes}
                        onChange={(e) => setReasonNotes(e.target.value)}
                        rows={3}
                        className="text-xs bg-background resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  /* TOOK A TRADE OUTCOME DETAILS */
                  <div className="space-y-4">
                    {/* Strategy Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" />
                          Playbook Strategy
                        </span>
                        <span className="text-[10px] text-muted-foreground">From Playbook</span>
                      </label>
                      <Select
                        value={selectedStrategyId}
                        onChange={(e) => handleStrategyChange(e.target.value)}
                        className="text-xs h-8 bg-background"
                      >
                        <option value="">-- Select Playbook Strategy --</option>
                        {strategies.map((strat) => (
                          <option key={strat.id} value={strat.id}>
                            {strat.name} {strat.confluences?.length ? `(${strat.confluences.length} confluences)` : ""}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Confluence Multi-select */}
                    {(confluences.length > 0 || (strategies.length > 0 && selectedStrategyId)) && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                          <span>Setup Confluences</span>
                          <span className="text-[10px] text-muted-foreground">
                            {selectedConfluenceIds.length} selected
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg border border-border bg-background/50">
                          {confluences.map((conf) => {
                            const isChecked = selectedConfluenceIds.includes(conf.id);
                            return (
                              <button
                                key={conf.id}
                                type="button"
                                onClick={() => toggleConfluence(conf.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                  isChecked
                                    ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
                                    : "bg-muted/40 text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                {isChecked && <Check className="h-3 w-3" />}
                                <span>{conf.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Risk & Live Stats preview bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border/80 bg-muted/20">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Risk Amount ($)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="250"
                            value={riskAmount}
                            onChange={(e) => setRiskAmount(e.target.value)}
                            required
                            className="pl-6 text-xs h-8 bg-background font-mono-numbers font-semibold"
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono-numbers pt-0.5">
                          Risk: <span className="font-semibold text-foreground">{liveRiskPercent.toFixed(2)}%</span> of session balance
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Net P&L Preview</label>
                        <div
                          className={`flex items-center justify-between h-8 px-3 rounded-md border font-mono-numbers text-xs font-semibold ${
                            livePnL > 0
                              ? "bg-[#22A06B]/15 border-[#22A06B]/30 text-[#22A06B]"
                              : livePnL < 0
                              ? "bg-[#DB5461]/15 border-[#DB5461]/30 text-[#DB5461]"
                              : "bg-background border-border text-foreground"
                          }`}
                        >
                          <span>{formatCurrency(livePnL)}</span>
                          <span className="text-[11px] opacity-80">
                            {derivedR !== null ? `${derivedR > 0 ? "+" : ""}${derivedR.toFixed(2)}R` : "0.00R"}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono-numbers pt-0.5">
                          Formula: Risk × R-Multiple
                        </div>
                      </div>
                    </div>

                    {/* Result Toggle: WIN / LOSS / BREAKEVEN */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-muted-foreground">Trade Result</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "win", label: "WIN", icon: TrendingUp, color: "text-[#22A06B]" },
                          { id: "loss", label: "LOSS", icon: TrendingDown, color: "text-[#DB5461]" },
                          { id: "breakeven", label: "BREAKEVEN", icon: MinusCircle, color: "text-muted-foreground" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = result === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setResult(opt.id as any)}
                              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-semibold transition-all ${
                                isSelected
                                  ? opt.id === "win"
                                    ? "border-[#22A06B] bg-[#22A06B] text-white shadow-sm"
                                    : opt.id === "loss"
                                    ? "border-[#DB5461] bg-[#DB5461] text-white shadow-sm"
                                    : "border-slate-500 bg-slate-600 text-white shadow-sm"
                                  : "border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Outcome Inputs based on Result */}
                      {result === "win" && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                              <span>R Achieved</span>
                              <span className="text-[#22A06B] font-semibold">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                placeholder="2.0"
                                value={rrAchieved}
                                onChange={(e) => setRrAchieved(e.target.value)}
                                required
                                className="text-xs h-8 bg-background font-mono-numbers font-semibold"
                              />
                              <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground font-semibold">R</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                              <span>Potential R</span>
                              <span className="text-[10px] text-muted-foreground">Optional</span>
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="e.g. 4.0"
                                value={potentialRR}
                                onChange={(e) => setPotentialRR(e.target.value)}
                                className="text-xs h-8 bg-background font-mono-numbers"
                              />
                              <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground">R</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {result === "loss" && (
                        <div className="pt-1">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-foreground flex items-center justify-between">
                              <span>Loss R</span>
                              <span className="text-[10px] text-muted-foreground">Default: -1.0R</span>
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                max="0"
                                placeholder="-1.0"
                                value={lossR}
                                onChange={(e) => setLossR(e.target.value)}
                                required
                                className="text-xs h-8 bg-background font-mono-numbers font-semibold text-[#DB5461]"
                              />
                              <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground font-semibold">R</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rules Checklist */}
                    {sessionRules.length > 0 && (
                      <div className="space-y-2 p-3 rounded-lg border border-border bg-background/50">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          <span>Trading Rules & Execution Checklist</span>
                        </label>
                        <div className="space-y-1.5">
                          {sessionRules.map((rule) => {
                            const isChecked = ruleChecksState[rule.id] ?? true;
                            return (
                              <label
                                key={rule.id}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    setRuleChecksState((prev) => ({
                                      ...prev,
                                      [rule.id]: Boolean(checked),
                                    }))
                                  }
                                />
                                <span>{rule.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Post-Trade Review & Emotional State */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Post-Trade Review & Execution Notes
                      </label>
                      <Textarea
                        placeholder="Management notes: did you hold to target, trail stop early, feel anxiety, or execute perfectly?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="text-xs bg-background resize-none leading-relaxed"
                      />
                    </div>

                    {/* Advanced / Optional Price Inputs Accordion */}
                    <div className="border border-border/70 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowManualPrices(!showManualPrices)}
                        className="w-full flex items-center justify-between p-2.5 bg-muted/20 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>Optional: Entry/Exit Tick Prices</span>
                        {showManualPrices ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {showManualPrices && (
                        <div className="p-3 bg-background space-y-3 border-t border-border/70">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground">Direction</label>
                              <Select
                                value={direction}
                                onChange={(e) => setDirection(e.target.value as any)}
                                className="text-xs h-7 bg-background"
                              >
                                <option value="long">Long</option>
                                <option value="short">Short</option>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground">Stop Loss</label>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Stop Loss"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(e.target.value)}
                                className="text-xs h-7 bg-background font-mono-numbers"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground">Entry Price</label>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Entry Price"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                className="text-xs h-7 bg-background font-mono-numbers"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-muted-foreground">Exit Price</label>
                              <Input
                                type="number"
                                step="any"
                                placeholder="Exit Price"
                                value={exitPrice}
                                onChange={(e) => setExitPrice(e.target.value)}
                                className="text-xs h-7 bg-background font-mono-numbers"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Outcome Chart Screenshot */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                    <span>Outcome / Exit Chart Screenshot</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOutcome(true);
                    }}
                    onDragLeave={() => setIsDraggingOutcome(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOutcome(false);
                      if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files, "outcome");
                    }}
                    onClick={() => outcomeFileInputRef.current?.click()}
                    className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      isDraggingOutcome
                        ? "border-primary bg-primary/5"
                        : "border-border/80 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={outcomeFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleAddFiles(e.target.files, "outcome");
                      }}
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <UploadCloud className="h-4 w-4 text-primary" />
                      <span>Upload post-trade outcome chart (Click or drag & drop)</span>
                    </div>
                  </div>

                  {/* Thumbnail Previews */}
                  {(outcomeExistingImages.length > 0 || outcomePendingImages.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      {outcomeExistingImages.map((img) => (
                        <div key={img.id} className="relative group rounded-md overflow-hidden border border-border bg-black/40 aspect-video flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="Outcome chart" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExistingImage(img.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {outcomePendingImages.map((pi) => (
                        <div key={pi.id} className="relative group rounded-md overflow-hidden border border-border bg-black/40 aspect-video flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pi.previewUrl} alt="Pending outcome" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingImages((prev) => prev.filter((p) => p.id !== pi.id));
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || Boolean(dateRangeError)}
                className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditMode ? "Save Changes" : "Record Journal Entry"}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </Sheet>
    </>
  );
}
