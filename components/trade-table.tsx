"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import {
  TradeEntity,
  RuleEntity,
  TradeFilterCriteria,
  filterTrades,
} from "@/lib/data/trades";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPrice } from "@/lib/utils";
import { deleteTradeAction } from "@/lib/actions/trade-actions";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import { TradeFilters } from "@/components/trade-filters";
import { ImageLightboxModal, LightboxImageItem } from "@/components/image-lightbox-modal";
import {
  Check,
  X,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  FilterX,
  Camera,
  Image as ImageIcon,
  Plus,
} from "lucide-react";

interface TradeTableProps {
  trades: TradeEntity[];
  sessionId: string;
  sessionPeriodStart?: Date | string;
  sessionPeriodEnd?: Date | string;
  sessionRules?: RuleEntity[];
  initialSetupFilter?: string | null;
}

export function TradeTable({
  trades,
  sessionId,
  sessionPeriodStart,
  sessionPeriodEnd,
  sessionRules = [],
  initialSetupFilter = null,
}: TradeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editingTrade, setEditingTrade] = React.useState<TradeEntity | null>(null);

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = React.useState<LightboxImageItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxTitle, setLightboxTitle] = React.useState<string>("");

  const handleOpenLightbox = (trade: TradeEntity, index: number) => {
    if (!trade.images || trade.images.length === 0) return;
    setLightboxImages(
      trade.images.map((img) => ({
        id: img.id,
        url: img.url,
        label: img.label,
      }))
    );
    setLightboxIndex(index);
    setLightboxTitle(`${trade.symbol} (${trade.direction.toUpperCase()})`);
    setLightboxOpen(true);
  };

  // Initialize filters from URL query parameters (or initialSetupFilter)
  const [filters, setFilters] = React.useState<TradeFilterCriteria>(() => {
    const q = searchParams.get("q") || undefined;
    const resultParam = searchParams.get("result");
    const setupParam = searchParams.get("setup");
    const symbolParam = searchParams.get("symbol");
    const rulesParam = searchParams.get("rules");
    const emotionParam = searchParams.get("emotion");
    const minRParam = searchParams.get("minR");
    const maxRParam = searchParams.get("maxR");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const setupList = setupParam
      ? setupParam.split(",").map((s) => s.trim()).filter(Boolean)
      : initialSetupFilter
      ? [initialSetupFilter]
      : undefined;

    return {
      searchText: q,
      result: resultParam
        ? (resultParam.split(",") as ("win" | "loss" | "breakeven")[])
        : undefined,
      setup: setupList,
      symbol: symbolParam ? symbolParam.split(",") : undefined,
      rulesFollowed:
        rulesParam === "true" ? true : rulesParam === "false" ? false : null,
      emotionalState: emotionParam ? emotionParam.split(",") : undefined,
      minR: minRParam && !isNaN(parseFloat(minRParam)) ? parseFloat(minRParam) : undefined,
      maxR: maxRParam && !isNaN(parseFloat(maxRParam)) ? parseFloat(maxRParam) : undefined,
      dateRange:
        startParam || endParam
          ? {
              start: startParam || undefined,
              end: endParam || undefined,
            }
          : undefined,
    };
  });

  // If initialSetupFilter changes from parent
  React.useEffect(() => {
    if (initialSetupFilter) {
      setFilters((prev) => ({
        ...prev,
        setup: [initialSetupFilter],
      }));
    }
  }, [initialSetupFilter]);

  // Sync filters to URL query params
  const updateUrlParams = React.useCallback(
    (newFilters: TradeFilterCriteria) => {
      const params = new URLSearchParams();

      if (newFilters.searchText?.trim()) params.set("q", newFilters.searchText.trim());
      if (newFilters.result && newFilters.result.length > 0)
        params.set("result", newFilters.result.join(","));
      if (newFilters.setup && newFilters.setup.length > 0)
        params.set("setup", newFilters.setup.join(","));
      if (newFilters.symbol && newFilters.symbol.length > 0)
        params.set("symbol", newFilters.symbol.join(","));
      if (newFilters.rulesFollowed !== undefined && newFilters.rulesFollowed !== null)
        params.set("rules", newFilters.rulesFollowed ? "true" : "false");
      if (newFilters.emotionalState && newFilters.emotionalState.length > 0)
        params.set("emotion", newFilters.emotionalState.join(","));
      if (newFilters.minR !== undefined && newFilters.minR !== null)
        params.set("minR", newFilters.minR.toString());
      if (newFilters.maxR !== undefined && newFilters.maxR !== null)
        params.set("maxR", newFilters.maxR.toString());
      if (newFilters.dateRange?.start) {
        const dStr =
          typeof newFilters.dateRange.start === "string"
            ? newFilters.dateRange.start.slice(0, 10)
            : newFilters.dateRange.start.toISOString().slice(0, 10);
        params.set("start", dStr);
      }
      if (newFilters.dateRange?.end) {
        const dStr =
          typeof newFilters.dateRange.end === "string"
            ? newFilters.dateRange.end.slice(0, 10)
            : newFilters.dateRange.end.toISOString().slice(0, 10);
        params.set("end", dStr);
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router]
  );

  const handleFilterChange = (newFilters: TradeFilterCriteria) => {
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handleResetFilters = () => {
    const emptyFilters: TradeFilterCriteria = {};
    setFilters(emptyFilters);
    updateUrlParams(emptyFilters);
  };

  // Derive distinct filter values dynamically from trades
  const distinctSetups = React.useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      if (t.setupModel && t.setupModel.trim()) {
        t.setupModel.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [trades]);

  const distinctSymbols = React.useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      if (t.symbol && t.symbol.trim()) {
        set.add(t.symbol.toUpperCase().trim());
      }
    });
    return Array.from(set).sort();
  }, [trades]);

  const distinctEmotionalStates = React.useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      if (t.emotionalState && t.emotionalState.trim()) {
        t.emotionalState.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [trades]);

  // Apply filters
  const filteredTrades = React.useMemo(() => {
    return filterTrades(trades, filters);
  }, [trades, filters]);

  const handleDelete = async (tradeId: string) => {
    if (!confirm("Delete this trade entry?")) return;
    setDeletingId(tradeId);
    await deleteTradeAction(tradeId, sessionId);
    setDeletingId(null);
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-border bg-card">
        <FileText className="h-5 w-5 text-muted-foreground mb-2" />
        <h3 className="text-xs font-medium text-foreground">No trades recorded yet</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
          Click &ldquo;Add Trade&rdquo; to log your first backtest execution.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Controlled Edit Drawer */}
      <AddTradeDrawer
        sessionId={sessionId}
        sessionPeriodStart={sessionPeriodStart}
        sessionPeriodEnd={sessionPeriodEnd}
        sessionRules={sessionRules}
        tradeToEdit={editingTrade}
        open={Boolean(editingTrade)}
        onOpenChange={(open) => {
          if (!open) setEditingTrade(null);
        }}
      />

      {/* Lightbox Modal */}
      <ImageLightboxModal
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        tradeTitle={lightboxTitle}
      />

      <div className="space-y-3">
        {/* ADVANCED FILTER & SEARCH BAR */}
        <TradeFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          distinctSetups={distinctSetups}
          distinctSymbols={distinctSymbols}
          distinctEmotionalStates={distinctEmotionalStates}
          totalTradesCount={trades.length}
          filteredTradesCount={filteredTrades.length}
        />

        {/* TRADE TABLE OR EMPTY STATE */}
        {filteredTrades.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center space-y-2">
            <FilterX className="h-6 w-6 text-muted-foreground mx-auto opacity-60" />
            <h3 className="text-xs font-semibold text-foreground">
              No trades match these filters
            </h3>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Try adjusting your search criteria, clearing specific filters, or resetting all filters.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs mt-1"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-3.5 py-2.5">#</th>
                    <th className="px-3.5 py-2.5">Date / Time</th>
                    <th className="px-3.5 py-2.5">Symbol</th>
                    <th className="px-3.5 py-2.5">Direction</th>
                    <th className="px-3.5 py-2.5 text-right">Entry</th>
                    <th className="px-3.5 py-2.5 text-right">Exit</th>
                    <th className="px-3.5 py-2.5 text-right">Gross P&L</th>
                    <th className="px-3.5 py-2.5 text-right">R-Mult</th>
                    <th className="px-3.5 py-2.5 text-center">Result</th>
                    <th className="px-3.5 py-2.5">Setup / Model</th>
                    <th className="px-3.5 py-2.5 text-center">Rules</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTrades.map((trade, idx) => {
                    const isProfit = trade.grossPnl > 0;
                    const isLoss = trade.grossPnl < 0;
                    const isExpanded = expandedId === trade.id;
                    const hasExtraDetails =
                      trade.stopLoss !== null ||
                      trade.rMultiple !== null ||
                      trade.htfBias ||
                      trade.newsToday ||
                      trade.riskPercent !== null ||
                      trade.drawDirection ||
                      trade.emotionalState ||
                      trade.rr ||
                      trade.notes ||
                      (trade.ruleChecks && trade.ruleChecks.length > 0) ||
                      (trade.images && trade.images.length > 0);

                    return (
                      <React.Fragment key={trade.id}>
                        <tr
                          className={`hover:bg-secondary/40 transition-colors duration-150 ${
                            isExpanded ? "bg-secondary/30" : ""
                          }`}
                        >
                          {/* Index */}
                          <td className="px-3.5 py-2.5 text-muted-foreground font-mono-numbers">
                            {idx + 1}
                          </td>

                          {/* Date / Time */}
                          <td className="px-3.5 py-2.5 whitespace-nowrap font-mono-numbers text-foreground">
                            {(() => {
                              let isOutOfRange = false;
                              if (sessionPeriodStart && sessionPeriodEnd) {
                                const start = new Date(sessionPeriodStart);
                                start.setHours(0, 0, 0, 0);
                                const end = new Date(sessionPeriodEnd);
                                end.setHours(23, 59, 59, 999);
                                const tTime = new Date(trade.entryAt).getTime();
                                isOutOfRange = tTime < start.getTime() || tTime > end.getTime();
                              }

                              return (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span>{format(new Date(trade.entryAt), "MMM d, yyyy")}</span>
                                    {isOutOfRange && (
                                      <span
                                        className="px-1 py-0.2 rounded text-[9px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                        title="Trade date falls outside the active session date range"
                                      >
                                        Out of range
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {format(new Date(trade.entryAt), "HH:mm")} &rarr;{" "}
                                    {format(new Date(trade.exitAt), "HH:mm")}
                                  </div>
                                </>
                              );
                            })()}
                          </td>

                          {/* Symbol */}
                          <td className="px-3.5 py-2.5 font-medium text-foreground font-mono-numbers uppercase">
                            <div className="flex items-center gap-1.5">
                              <span>{trade.symbol}</span>
                              {trade.images && trade.images.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenLightbox(trade, 0)}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-mono-numbers text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded hover:bg-primary/20 transition-colors"
                                  title={`${trade.images.length} screenshot${
                                    trade.images.length > 1 ? "s" : ""
                                  } attached (click to preview)`}
                                >
                                  <Camera className="h-2.5 w-2.5" />
                                  <span>{trade.images.length}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Direction */}
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {trade.direction === "long" ? (
                              <span className="font-semibold text-[#22A06B] text-[11px]">
                                LONG
                              </span>
                            ) : (
                              <span className="font-semibold text-[#DB5461] text-[11px]">
                                SHORT
                              </span>
                            )}
                          </td>

                          {/* Entry Price */}
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers text-foreground">
                            {formatPrice(trade.entryPrice)}
                          </td>

                          {/* Exit Price */}
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers text-foreground">
                            {formatPrice(trade.exitPrice)}
                          </td>

                          {/* Gross P&L */}
                          <td
                            className={`px-3.5 py-2.5 text-right font-mono-numbers font-semibold ${
                              isProfit
                                ? "text-[#22A06B]"
                                : isLoss
                                ? "text-[#DB5461]"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatCurrency(trade.grossPnl)}
                          </td>

                          {/* R-Multiple */}
                          <td
                            className={`px-3.5 py-2.5 text-right font-mono-numbers font-semibold ${
                              trade.rMultiple !== null && trade.rMultiple > 0
                                ? "text-[#22A06B]"
                                : trade.rMultiple !== null && trade.rMultiple < 0
                                ? "text-[#DB5461]"
                                : "text-muted-foreground"
                            }`}
                          >
                            {trade.rMultiple !== null
                              ? trade.rMultiple > 0
                                ? `+${trade.rMultiple.toFixed(2)}R`
                                : `${trade.rMultiple.toFixed(2)}R`
                              : "—"}
                          </td>

                          {/* Result */}
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                            <Badge
                              variant={
                                trade.result === "win"
                                  ? "win"
                                  : trade.result === "loss"
                                  ? "loss"
                                  : "neutral"
                              }
                              className="capitalize font-medium text-[11px]"
                            >
                              {trade.result}
                            </Badge>
                          </td>

                          {/* Setup / Model (Extra Column 1) */}
                          <td className="px-3.5 py-2.5 text-muted-foreground max-w-[180px] truncate">
                            {trade.setupModel ? (
                              <span
                                className="text-foreground/90 font-medium"
                                title={trade.setupModel}
                              >
                                {trade.setupModel}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>

                          {/* Rules Followed (Extra Column 2) */}
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                            {trade.ruleChecks && trade.ruleChecks.length > 0 ? (
                              (() => {
                                const followedCount = trade.ruleChecks.filter((c) => c.followed).length;
                                const total = trade.ruleChecks.length;
                                const all = followedCount === total;
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 font-mono-numbers text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                                      all
                                        ? "text-[#22A06B] bg-[#22A06B]/10 border-[#22A06B]/30"
                                        : "text-[#DB5461] bg-[#DB5461]/10 border-[#DB5461]/30"
                                    }`}
                                    title={`${followedCount} of ${total} rules followed`}
                                  >
                                    {all ? (
                                      <Check className="h-3 w-3 stroke-[2.5]" />
                                    ) : (
                                      <X className="h-3 w-3 stroke-[2.5]" />
                                    )}
                                    <span>
                                      {followedCount}/{total}
                                    </span>
                                  </span>
                                );
                              })()
                            ) : trade.rulesFollowed === true ? (
                              <span
                                className="inline-flex items-center text-[#22A06B]"
                                title="Rules followed"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              </span>
                            ) : trade.rulesFollowed === false ? (
                              <span
                                className="inline-flex items-center text-[#DB5461]"
                                title="Rules broken"
                              >
                                <X className="h-3.5 w-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {hasExtraDetails && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedId(isExpanded ? null : trade.id)
                                  }
                                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                  title="Details"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingTrade(trade)}
                                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Edit trade"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(trade.id)}
                                disabled={deletingId === trade.id}
                                className="p-1 rounded text-muted-foreground hover:text-[#DB5461] hover:bg-[#DB5461]/10 transition-colors disabled:opacity-50"
                                title="Delete trade"
                              >
                                {deletingId === trade.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable details row */}
                        {isExpanded && (
                          <tr className="bg-secondary/20">
                            <td colSpan={12} className="px-5 py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                {trade.stopLoss !== null && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      Stop Loss
                                    </span>
                                    <span className="font-mono-numbers text-foreground">
                                      {formatPrice(trade.stopLoss)}
                                    </span>
                                  </div>
                                )}

                                {trade.rMultiple !== null && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      Realized R
                                    </span>
                                    <span
                                      className={`font-mono-numbers font-semibold ${
                                        trade.rMultiple > 0
                                          ? "text-[#22A06B]"
                                          : trade.rMultiple < 0
                                          ? "text-[#DB5461]"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {trade.rMultiple > 0
                                        ? `+${trade.rMultiple.toFixed(2)}R`
                                        : `${trade.rMultiple.toFixed(2)}R`}
                                    </span>
                                  </div>
                                )}

                                {trade.htfBias && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      HTF Bias
                                    </span>
                                    <span className="text-foreground">
                                      {trade.htfBias}
                                    </span>
                                  </div>
                                )}

                                {trade.rr && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      Planned R:R
                                    </span>
                                    <span className="font-mono-numbers text-foreground">
                                      {trade.rr}
                                    </span>
                                  </div>
                                )}

                                {trade.riskPercent !== null &&
                                  trade.riskPercent !== undefined && (
                                    <div>
                                      <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                        Risk %
                                      </span>
                                      <span className="font-mono-numbers text-foreground">
                                        {trade.riskPercent}%
                                      </span>
                                    </div>
                                  )}

                                {trade.drawDirection && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      Draw on Liquidity
                                    </span>
                                    <span className="text-foreground">
                                      {trade.drawDirection}
                                    </span>
                                  </div>
                                )}

                                {trade.newsToday && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      News
                                    </span>
                                    <span className="text-foreground">
                                      {trade.newsToday}
                                    </span>
                                  </div>
                                )}

                                {trade.emotionalState && (
                                  <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                                      Emotional State
                                    </span>
                                    <span className="text-foreground">
                                      {trade.emotionalState}
                                    </span>
                                  </div>
                                )}

                                {trade.ruleChecks && trade.ruleChecks.length > 0 && (
                                  <div className="col-span-2 sm:col-span-4 pt-1.5 border-t border-border">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium mb-1.5">
                                      Rule Checklist ({trade.ruleChecks.filter((c) => c.followed).length}/{trade.ruleChecks.length} Followed)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {trade.ruleChecks.map((rc) => (
                                        <div
                                          key={rc.id}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                            rc.followed
                                              ? "bg-[#22A06B]/10 border-[#22A06B]/30 text-[#22A06B]"
                                              : "bg-[#DB5461]/10 border-[#DB5461]/30 text-[#DB5461]"
                                          }`}
                                        >
                                          {rc.followed ? (
                                            <Check className="h-3 w-3 stroke-[2.5]" />
                                          ) : (
                                            <X className="h-3 w-3 stroke-[2.5]" />
                                          )}
                                          <span>{rc.rule?.text || "Rule"}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {trade.notes && (
                                  <div className="col-span-2 sm:col-span-4 pt-1.5 border-t border-border">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium mb-0.5">
                                      Notes
                                    </span>
                                    <p className="text-xs text-foreground whitespace-pre-wrap">
                                      {trade.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Screenshots & Chart Analysis Gallery */}
                                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-border">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium flex items-center gap-1.5">
                                      <ImageIcon className="h-3 w-3 text-primary" />
                                      <span>
                                        Chart Screenshots ({trade.images?.length || 0})
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTrade(trade)}
                                      className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Add / Manage</span>
                                    </button>
                                  </div>

                                  {trade.images && trade.images.length > 0 ? (
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      {trade.images.map((img, imgIdx) => (
                                        <div
                                          key={img.id}
                                          onClick={() => handleOpenLightbox(trade, imgIdx)}
                                          className="group relative rounded-md border border-border bg-card overflow-hidden cursor-pointer hover:border-primary transition-all duration-150 shadow-sm"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={img.url}
                                            alt={img.label || `Screenshot ${imgIdx + 1}`}
                                            className="w-24 h-16 sm:w-28 sm:h-18 object-cover transition-transform duration-200 group-hover:scale-105"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="h-4 w-4 text-white drop-shadow" />
                                          </div>
                                          {img.label && (
                                            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[9px] font-medium text-white text-center truncate">
                                              {img.label}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-md border border-dashed border-border/80 bg-secondary/20 p-2.5 text-center flex items-center justify-between">
                                      <span className="text-[11px] text-muted-foreground">
                                        No screenshots attached to this trade.
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingTrade(trade)}
                                        className="h-6 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span>Attach Image</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
