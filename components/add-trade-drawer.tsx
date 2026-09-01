"use client";

import * as React from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
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
      setEntryPrice("");
      setExitPrice("");
      setGrossPnl("");
      setResult("win");
    }
  };

  return (
    <>
      <Button onClick={handleOpen} className="gap-1.5 font-medium">
        <Plus className="h-4 w-4" />
        <span>Add Trade</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetHeader>
          <SheetTitle>Log Trade</SheetTitle>
          <SheetDescription>
            Record execution data and backtest observations.
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

            {/* Entry & Exit Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Select name="htfBias" defaultValue="" disabled={isSubmitting}>
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
                  placeholder="e.g. Calm, Focused"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Rules Followed Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox name="rulesFollowed" id="rulesFollowed" defaultChecked={true} />
              <label htmlFor="rulesFollowed" className="text-xs font-medium text-foreground cursor-pointer">
                Execution followed all trade rules & plan
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
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
            <Button type="submit" disabled={isSubmitting} className="min-w-[110px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
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
