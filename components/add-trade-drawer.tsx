"use client";

import * as React from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, TrendingUp, TrendingDown, Clock, ShieldCheck, FileText } from "lucide-react";
import { createTradeAction } from "@/lib/actions/trade-actions";

interface AddTradeDrawerProps {
  sessionId: string;
  defaultSymbol?: string;
  defaultDate?: string;
}

export function AddTradeDrawer({ sessionId, defaultSymbol = "", defaultDate }: AddTradeDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form states for core fields
  const [symbol, setSymbol] = React.useState(defaultSymbol);
  const [direction, setDirection] = React.useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = React.useState<string>("");
  const [exitPrice, setExitPrice] = React.useState<string>("");
  const [grossPnl, setGrossPnl] = React.useState<string>("");
  const [result, setResult] = React.useState<"win" | "loss" | "breakeven">("win");

  // Helper to generate current local datetime string in YYYY-MM-DDTHH:mm format
  const getNowLocalIso = (offsetMinutes = 0) => {
    const now = defaultDate ? new Date(defaultDate) : new Date();
    if (offsetMinutes) {
      now.setMinutes(now.getMinutes() + offsetMinutes);
    }
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [entryAt, setEntryAt] = React.useState(getNowLocalIso(0));
  const [exitAt, setExitAt] = React.useState(getNowLocalIso(15));

  // Auto-calculate PnL and result hint when prices change
  const handlePriceChange = (newEntry: string, newExit: string, curDirection: "long" | "short") => {
    const ep = parseFloat(newEntry);
    const xp = parseFloat(newExit);
    if (!isNaN(ep) && !isNaN(xp) && ep > 0 && xp > 0) {
      const diff = curDirection === "long" ? xp - ep : ep - xp;
      // Auto-suggest result
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
    setEntryAt(getNowLocalIso(0));
    setExitAt(getNowLocalIso(15));
    setSymbol(defaultSymbol);
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("sessionId", sessionId);
    formData.set("direction", direction);
    formData.set("result", result);

    const res = await createTradeAction(formData);

    setIsSubmitting(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setOpen(false);
      // Reset form
      setEntryPrice("");
      setExitPrice("");
      setGrossPnl("");
      setResult("win");
    }
  };

  return (
    <>
      <Button onClick={handleOpen} className="gap-2 font-medium">
        <Plus className="h-4 w-4" />
        <span>Add Trade</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>Log Backtest Trade</SheetTitle>
              <SheetDescription>
                Record your trade execution and backtest observations.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: CORE FIELDS (REQUIRED) */}
          <div className="space-y-4 rounded-xl border border-border/80 bg-background/50 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Core Execution (Required)
              </span>
              <span className="text-[10px] text-muted-foreground">All 8 fields required</span>
            </div>

            {/* Symbol & Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Symbol <span className="text-rose-400">*</span>
                </label>
                <Input
                  name="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. NQ, EURUSD, AAPL"
                  className="font-mono-numbers font-medium uppercase"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Direction <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection("long");
                      handlePriceChange(entryPrice, exitPrice, "long");
                    }}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-semibold transition-all ${
                      direction === "long"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                        : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDirection("short");
                      handlePriceChange(entryPrice, exitPrice, "short");
                    }}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-semibold transition-all ${
                      direction === "short"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/20"
                        : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Short
                  </button>
                </div>
              </div>
            </div>

            {/* Entry & Exit Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Entry Date & Time <span className="text-rose-400">*</span>
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
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Exit Date & Time <span className="text-rose-400">*</span>
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

            {/* Entry & Exit Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Entry Price <span className="text-rose-400">*</span>
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
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Exit Price <span className="text-rose-400">*</span>
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

            {/* Gross P&L & Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Gross P&L ($) <span className="text-rose-400">*</span>
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
                  className="font-mono-numbers font-semibold"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Result <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setResult("win")}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                      result === "win"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Win
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("loss")}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                      result === "loss"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("breakeven")}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                      result === "breakeven"
                        ? "bg-slate-500/20 text-slate-300 border-slate-500/40"
                        : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    BE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BACKTEST LOG FIELDS (OPTIONAL) */}
          <div className="space-y-4 rounded-xl border border-border/80 bg-background/50 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Backtest-Log Details (Optional)
              </span>
              <span className="text-[10px] text-muted-foreground">Scalar fields</span>
            </div>

            {/* HTF Bias & Planned R:R */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  HTF Bias
                </label>
                <Select name="htfBias" defaultValue="" disabled={isSubmitting}>
                  <option value="">Select bias...</option>
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Planned R:R
                </label>
                <Input
                  name="rr"
                  placeholder="e.g. 1:2.5 or 1:3"
                  className="font-mono-numbers"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Risk % & Draw Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Risk %
                </label>
                <Input
                  name="riskPercent"
                  type="number"
                  step="any"
                  placeholder="e.g. 1.0 or 0.5"
                  className="font-mono-numbers"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Draw on Liquidity
                </label>
                <Input
                  name="drawDirection"
                  placeholder="e.g. IRL -> ERL, Previous Day High"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Setup / Model (comma-separated) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Setup / Model (comma-separated)
              </label>
              <Input
                name="setupModel"
                placeholder="e.g. 15m FVG, 5m MSS, Silver Bullet"
                disabled={isSubmitting}
              />
            </div>

            {/* News Today & Emotional State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  News Today
                </label>
                <Input
                  name="newsToday"
                  placeholder="e.g. NFP, CPI, High Impact 10am"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Emotional State (comma-separated)
                </label>
                <Input
                  name="emotionalState"
                  placeholder="e.g. Calm, Patient, Focused"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Rules Followed Checkbox */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox name="rulesFollowed" id="rulesFollowed" defaultChecked={true} />
              <label htmlFor="rulesFollowed" className="text-xs font-medium text-foreground cursor-pointer">
                Execution followed all trade rules & plan
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Trade Notes
              </label>
              <Textarea
                name="notes"
                placeholder="Context, execution observations, post-trade analysis..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Trade...
                </>
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
