"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";

export interface LightboxImageItem {
  id: string;
  url: string;
  label?: string | null;
}

interface ImageLightboxModalProps {
  images: LightboxImageItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeTitle?: string;
}

export function ImageLightboxModal({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  tradeTitle,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, initialIndex, images.length]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrev = React.useCallback(() => {
    if (hasPrev) {
      setCurrentIndex((i) => i - 1);
    }
  }, [hasPrev]);

  const handleNext = React.useCallback(() => {
    if (hasNext) {
      setCurrentIndex((i) => i + 1);
    }
  }, [hasNext]);

  // Handle keyboard shortcuts (Escape, ArrowLeft, ArrowRight)
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, handlePrev, handleNext]);

  if (!open || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container */}
      <div className="relative z-50 w-full max-w-5xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <ImageIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">
                {tradeTitle ? `${tradeTitle} — ` : ""}Chart Screenshot
              </span>
              {currentImage?.label && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20 shrink-0"
                >
                  {currentImage.label}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-numbers text-muted-foreground">
              {currentIndex + 1} of {images.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Modal Image Area */}
        <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 bg-black/60 min-h-[300px] overflow-hidden select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage?.url}
            alt={currentImage?.label || `Trade screenshot ${currentIndex + 1}`}
            className="max-h-[68vh] max-w-full object-contain rounded-md shadow-lg transition-transform duration-200"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                aria-label="Previous screenshot"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background text-foreground border border-border/50 shadow-md backdrop-blur-md transition-all duration-150 disabled:opacity-20 disabled:pointer-events-none hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                aria-label="Next screenshot"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background text-foreground border border-border/50 shadow-md backdrop-blur-md transition-all duration-150 disabled:opacity-20 disabled:pointer-events-none hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Modal Thumbnail Strip (if multiple images) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 p-2.5 px-4 overflow-x-auto border-t border-border bg-card/40 shrink-0">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative rounded-md overflow-hidden border transition-all duration-150 shrink-0 h-12 w-20 ${
                  idx === currentIndex
                    ? "border-primary ring-2 ring-primary/30 opacity-100"
                    : "border-border opacity-50 hover:opacity-80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.label || `Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.label && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] font-medium text-white px-1 py-0.5 truncate text-center leading-none">
                    {img.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
