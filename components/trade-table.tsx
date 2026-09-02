"use client";

import * as React from "react";
import { format } from "date-fns";
import { TradeEntity, RuleEntity } from "@/lib/data/trades";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPrice } from "@/lib/utils";
import { deleteTradeAction } from "@/lib/actions/trade-actions";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import {
  Check,
  X,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

interface TradeTableProps {
  trades: TradeEntity[];
  sessionId: string;
  sessionRules?: RuleEntity[];
}

export function TradeTable({ trades, sessionId, sessionRules = [] }: TradeTableProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editingTrade, setEditingTrade] = React.useState<TradeEntity | null>(null);

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
        sessionRules={sessionRules}
        tradeToEdit={editingTrade}
        open={Boolean(editingTrade)}
        onOpenChange={(open) => {
          if (!open) setEditingTrade(null);
        }}
      />

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
              {trades.map((trade, idx) => {
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
                  (trade.ruleChecks && trade.ruleChecks.length > 0);

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
                        <div>{format(new Date(trade.entryAt), "MMM d, yyyy")}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(trade.entryAt), "HH:mm")} &rarr;{" "}
                          {format(new Date(trade.exitAt), "HH:mm")}
                        </div>
                      </td>

                      {/* Symbol */}
                      <td className="px-3.5 py-2.5 font-medium text-foreground font-mono-numbers uppercase">
                        {trade.symbol}
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
    </>
  );
}
