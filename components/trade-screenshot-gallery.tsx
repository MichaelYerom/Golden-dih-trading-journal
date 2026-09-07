"use client";

import * as React from "react";
import { format } from "date-fns";
import { TradeEntity, TradeImageEntity } from "@/lib/data/trade-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPrice } from "@/lib/utils";
import { ImageLightboxModal, LightboxImageItem } from "@/components/image-lightbox-modal";
import {
  Camera,
  Image as ImageIcon,
  Pencil,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileText,
  Compass,
  Maximize2,
} from "lucide-react";

interface TradeScreenshotGalleryProps {
  trades: TradeEntity[];
  onEditTrade: (trade: TradeEntity) => void;
}

export function TradeScreenshotGallery({
  trades,
  onEditTrade,
}: TradeScreenshotGalleryProps) {
  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = React.useState<LightboxImageItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxTitle, setLightboxTitle] = React.useState<string>("");

  const handleOpenLightbox = (
    trade: TradeEntity,
    images: TradeImageEntity[],
    initialImgIndex: number
  ) => {
    if (!images || images.length === 0) return;

    setLightboxImages(
      images.map((img) => ({
        id: img.id,
        url: img.url,
        label:
          img.label ||
          (img.role === "before_trade"
            ? "Pre-Trade Setup"
            : img.role === "outcome"
            ? "Outcome / Exit"
            : "Chart Screenshot"),
      }))
    );
    setLightboxIndex(initialImgIndex);

    const outcomeText =
      trade.outcomeType === "trade"
        ? trade.result?.toUpperCase() || "TRADE"
        : trade.outcomeType.replace("_", " ").toUpperCase();
    const dateText = trade.entryAt ? format(new Date(trade.entryAt), "MMM d, yyyy") : "";

    setLightboxTitle(`${trade.symbol} (${outcomeText}) — ${dateText}`);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Reusable Image Lightbox Modal */}
      <ImageLightboxModal
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        tradeTitle={lightboxTitle}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {trades.map((trade, idx) => {
          const isTrade = trade.outcomeType === "trade" || !trade.outcomeType;
          const isMissed = trade.outcomeType === "missed_entry";
          const isNoTrade = trade.outcomeType === "no_trade";
          const isProfit = isTrade && trade.grossPnl > 0;
          const isLoss = isTrade && trade.grossPnl < 0;

          const images = trade.images || [];
          const beforeImage = images.find((img) => img.role === "before_trade") || images[0];
          const outcomeImage =
            images.find((img) => img.role === "outcome") ||
            (images.length > 1 && images[1] !== beforeImage ? images[1] : undefined);

          const hasAnyImages = images.length > 0;
          const notesText = trade.beforeTradeNotes || trade.reasonNotes || trade.notes;

          return (
            <div
              key={trade.id || idx}
              className="rounded-xl border border-border bg-card shadow-sm hover:border-border/80 transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* TOP HEADER SECTION */}
              <div className="p-3.5 pb-2.5 space-y-2 border-b border-border/50 bg-secondary/15">
                <div className="flex items-start justify-between gap-2">
                  {/* Left: Date, Time, Symbol, Outcome Badge */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono-numbers text-foreground uppercase tracking-tight">
                        {trade.symbol}
                      </span>

                      {/* Direction */}
                      {trade.direction && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                            trade.direction === "long"
                              ? "bg-[#22A06B]/15 text-[#22A06B]"
                              : "bg-[#DB5461]/15 text-[#DB5461]"
                          }`}
                        >
                          {trade.direction}
                        </span>
                      )}

                      {/* Result / Outcome Badge */}
                      {isMissed ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400">
                          MISSED
                        </span>
                      ) : isNoTrade ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-500/15 text-slate-400">
                          NO TRADE
                        </span>
                      ) : trade.result === "win" ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#22A06B]/15 text-[#22A06B]">
                          WIN
                        </span>
                      ) : trade.result === "loss" ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#DB5461]/15 text-[#DB5461]">
                          LOSS
                        </span>
                      ) : trade.result === "breakeven" ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          BE
                        </span>
                      ) : null}

                      {/* HTF Bias */}
                      {trade.htfBias && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                          <Compass className="h-2.5 w-2.5" />
                          <span className="capitalize">{trade.htfBias}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground font-mono-numbers">
                      {trade.entryAt ? format(new Date(trade.entryAt), "MMM d, yyyy · HH:mm") : "—"}
                    </div>
                  </div>

                  {/* Right: P&L, R-Multiple, Edit Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-xs sm:text-sm font-bold font-mono-numbers ${
                          isProfit
                            ? "text-[#22A06B]"
                            : isLoss
                            ? "text-[#DB5461]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isTrade
                          ? isProfit
                            ? `+${formatCurrency(trade.grossPnl)}`
                            : formatCurrency(trade.grossPnl)
                          : "—"}
                      </div>
                      {isTrade && trade.rMultiple !== null && (
                        <div
                          className={`text-[10px] font-semibold font-mono-numbers ${
                            trade.rMultiple > 0
                              ? "text-[#22A06B]"
                              : trade.rMultiple < 0
                              ? "text-[#DB5461]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {trade.rMultiple > 0 ? `+${trade.rMultiple.toFixed(2)}R` : `${trade.rMultiple.toFixed(2)}R`}
                        </div>
                      )}
                    </div>

                    {/* Edit Trade Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditTrade(trade)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
                      title="Edit Trade"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sub-tags: Strategy & Rules */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {(trade.strategy?.name || trade.setupModel) && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-normal px-2 py-0 bg-primary/10 text-primary border-primary/20 max-w-[180px] truncate"
                    >
                      <Layers className="h-2.5 w-2.5 mr-1 shrink-0" />
                      <span className="truncate">{trade.strategy?.name || trade.setupModel}</span>
                    </Badge>
                  )}

                  {trade.rulesFollowed !== undefined && trade.rulesFollowed !== null && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-normal px-1.5 py-0 flex items-center gap-1 ${
                        trade.rulesFollowed
                          ? "border-[#22A06B]/30 text-[#22A06B] bg-[#22A06B]/5"
                          : "border-[#DB5461]/30 text-[#DB5461] bg-[#DB5461]/5"
                      }`}
                    >
                      {trade.rulesFollowed ? (
                        <>
                          <ShieldCheck className="h-2.5 w-2.5" />
                          <span>Followed</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-2.5 w-2.5" />
                          <span>Violated</span>
                        </>
                      )}
                    </Badge>
                  )}

                  {trade.confluences && trade.confluences.length > 0 && (
                    <span className="text-[10px] text-muted-foreground font-mono-numbers">
                      {trade.confluences.length} conf
                    </span>
                  )}
                </div>
              </div>

              {/* SCREENSHOTS CONTAINER */}
              <div className="p-3.5 flex-1 flex flex-col justify-center">
                {hasAnyImages ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* 1. Pre-Trade Setup Slot */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-0.5">
                        <span className="truncate">Pre-Trade Setup</span>
                        {beforeImage && (
                          <span className="text-[9px] text-primary font-mono-numbers">#1</span>
                        )}
                      </div>

                      {beforeImage ? (
                        <div
                          onClick={() =>
                            handleOpenLightbox(
                              trade,
                              images,
                              images.indexOf(beforeImage) >= 0 ? images.indexOf(beforeImage) : 0
                            )
                          }
                          className="relative aspect-video rounded-lg overflow-hidden border border-border bg-black/40 cursor-pointer group/img hover:border-primary/50 transition-all shadow-sm"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={beforeImage.url}
                            alt="Pre-trade setup"
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                            <div className="p-1.5 rounded-full bg-black/70 text-white shadow backdrop-blur-sm">
                              <Maximize2 className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg border border-dashed border-border/60 bg-secondary/20 flex flex-col items-center justify-center text-center p-2 text-muted-foreground/60">
                          <Camera className="h-4 w-4 mb-0.5 opacity-40" />
                          <span className="text-[10px]">No setup shot</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Outcome / Exit Slot */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-0.5">
                        <span className="truncate">Outcome / Exit</span>
                        {outcomeImage && (
                          <span className="text-[9px] text-primary font-mono-numbers">#2</span>
                        )}
                      </div>

                      {outcomeImage ? (
                        <div
                          onClick={() =>
                            handleOpenLightbox(
                              trade,
                              images,
                              images.indexOf(outcomeImage) >= 0 ? images.indexOf(outcomeImage) : 1
                            )
                          }
                          className="relative aspect-video rounded-lg overflow-hidden border border-border bg-black/40 cursor-pointer group/img hover:border-primary/50 transition-all shadow-sm"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={outcomeImage.url}
                            alt="Outcome chart"
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                            <div className="p-1.5 rounded-full bg-black/70 text-white shadow backdrop-blur-sm">
                              <Maximize2 className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-lg border border-dashed border-border/60 bg-secondary/20 flex flex-col items-center justify-center text-center p-2 text-muted-foreground/60">
                          <Camera className="h-4 w-4 mb-0.5 opacity-40" />
                          <span className="text-[10px]">No exit shot</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* NO SCREENSHOTS ATTACHED PLACEHOLDER */
                  <div className="py-6 px-4 rounded-lg border border-dashed border-border/70 bg-secondary/15 flex flex-col items-center justify-center text-center space-y-1.5 my-auto">
                    <div className="h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground/50">
                      <Camera className="h-4 w-4" />
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      No screenshots attached
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTrade(trade)}
                      className="h-6 text-[11px] text-primary hover:bg-primary/10 gap-1 px-2 mt-0.5"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Attach charts</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* OPTIONAL NOTES FOOTER */}
              {notesText && (
                <div className="px-3.5 py-2 border-t border-border/40 bg-secondary/10 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                  <p className="line-clamp-2 italic leading-relaxed" title={notesText}>
                    &ldquo;{notesText}&rdquo;
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
