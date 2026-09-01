"use client";

import * as React from "react";
import { format } from "date-fns";
import { TradeEntity } from "@/lib/data/trades";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPrice } from "@/lib/utils";
import { deleteTradeAction } from "@/lib/actions/trade-actions";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface TradeTableProps {
  trades: TradeEntity[];
  sessionId: string;
}

export function TradeTable({ trades, sessionId }: TradeTableProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const handleDelete = async (tradeId: string) => {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    setDeletingId(tradeId);
    await deleteTradeAction(tradeId, sessionId);
    setDeletingId(null);
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border/70 bg-card/20">
        <div className="p-3 rounded-full bg-muted/40 text-muted-foreground mb-3">
          <Info className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No trades recorded</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Click the &ldquo;Add Trade&rdquo; button above to record your first backtest execution.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card/80 overflow-hidden shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3 text-right">Entry</th>
              <th className="px-4 py-3 text-right">Exit</th>
              <th className="px-4 py-3 text-right">Gross P&L</th>
              <th className="px-4 py-3 text-center">Result</th>
              <th className="px-4 py-3">Setup / Model</th>
              <th className="px-4 py-3 text-center">Rules</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {trades.map((trade, idx) => {
              const isProfit = trade.grossPnl > 0;
              const isLoss = trade.grossPnl < 0;
              const isExpanded = expandedId === trade.id;
              const hasExtraDetails =
                trade.htfBias ||
                trade.newsToday ||
                trade.riskPercent ||
                trade.drawDirection ||
                trade.emotionalState ||
                trade.rr ||
                trade.notes;

              return (
                <React.Fragment key={trade.id}>
                  <tr
                    className={`hover:bg-accent/30 transition-colors ${
                      isExpanded ? "bg-accent/20" : ""
                    }`}
                  >
                    {/* Index */}
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono-numbers">
                      {idx + 1}
                    </td>

                    {/* Date / Time */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono-numbers text-foreground">
                      <div>{format(new Date(trade.entryAt), "MMM d, yyyy")}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(trade.entryAt), "HH:mm")} &rarr;{" "}
                        {format(new Date(trade.exitAt), "HH:mm")}
                      </div>
                    </td>

                    {/* Symbol */}
                    <td className="px-4 py-3 font-semibold text-foreground font-mono-numbers uppercase">
                      {trade.symbol}
                    </td>

                    {/* Direction */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {trade.direction === "long" ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1 font-semibold"
                        >
                          <TrendingUp className="h-3 w-3" />
                          LONG
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-400 border-rose-500/30 gap-1 font-semibold"
                        >
                          <TrendingDown className="h-3 w-3" />
                          SHORT
                        </Badge>
                      )}
                    </td>

                    {/* Entry Price */}
                    <td className="px-4 py-3 text-right font-mono-numbers text-xs text-foreground">
                      {formatPrice(trade.entryPrice)}
                    </td>

                    {/* Exit Price */}
                    <td className="px-4 py-3 text-right font-mono-numbers text-xs text-foreground">
                      {formatPrice(trade.exitPrice)}
                    </td>

                    {/* Gross P&L */}
                    <td
                      className={`px-4 py-3 text-right font-mono-numbers font-semibold ${
                        isProfit
                          ? "text-emerald-400"
                          : isLoss
                          ? "text-rose-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(trade.grossPnl)}
                    </td>

                    {/* Result */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          trade.result === "win"
                            ? "win"
                            : trade.result === "loss"
                            ? "loss"
                            : "neutral"
                        }
                        className="capitalize font-semibold"
                      >
                        {trade.result}
                      </Badge>
                    </td>

                    {/* Setup / Model (Extra Column 1) */}
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {trade.setupModel ? (
                        <span
                          className="text-foreground/90 font-medium"
                          title={trade.setupModel}
                        >
                          {trade.setupModel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Rules Followed (Extra Column 2) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {trade.rulesFollowed === true ? (
                        <div
                          className="inline-flex items-center justify-center text-emerald-400"
                          title="Rules followed"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : trade.rulesFollowed === false ? (
                        <div
                          className="inline-flex items-center justify-center text-rose-400"
                          title="Rules broken"
                        >
                          <XCircle className="h-4 w-4" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {hasExtraDetails && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : trade.id)
                            }
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Toggle extra details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(trade.id)}
                          disabled={deletingId === trade.id}
                          className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                          title="Delete trade"
                        >
                          {deletingId === trade.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable details row for other backtest fields */}
                  {isExpanded && (
                    <tr className="bg-accent/15 border-b border-border/40">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          {trade.htfBias && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                                HTF Bias
                              </span>
                              <span className="font-medium text-foreground">
                                {trade.htfBias}
                              </span>
                            </div>
                          )}

                          {trade.rr && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                                Planned R:R
                              </span>
                              <span className="font-mono-numbers font-medium text-foreground">
                                {trade.rr}
                              </span>
                            </div>
                          )}

                          {trade.riskPercent !== null &&
                            trade.riskPercent !== undefined && (
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                                  Risk %
                                </span>
                                <span className="font-mono-numbers font-medium text-foreground">
                                  {trade.riskPercent}%
                                </span>
                              </div>
                            )}

                          {trade.drawDirection && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                                Draw on Liquidity
                              </span>
                              <span className="font-medium text-foreground">
                                {trade.drawDirection}
                              </span>
                            </div>
                          )}

                          {trade.newsToday && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                                News
                              </span>
                              <span className="font-medium text-foreground">
                                {trade.newsToday}
                              </span>
                            </div>
                          )}

                          {trade.emotionalState && (
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">
                                Emotional State
                              </span>
                              <span className="font-medium text-foreground">
                                {trade.emotionalState}
                              </span>
                            </div>
                          )}

                          {trade.notes && (
                            <div className="col-span-2 sm:col-span-4 mt-1 pt-2 border-t border-border/40">
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold mb-1">
                                Notes
                              </span>
                              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {trade.notes}
                              </p>
                            </div>
                          )}
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
  );
}
