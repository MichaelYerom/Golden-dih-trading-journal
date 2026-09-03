"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StrategyEntity } from "@/lib/data/strategies";
import { ConfluenceEntity } from "@/lib/data/confluences";
import { StrategyDialog } from "./strategy-dialog";
import { DeleteStrategyDialog } from "./delete-strategy-dialog";
import {
  ListChecks,
  ShieldAlert,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface StrategyCardProps {
  strategy: StrategyEntity;
  confluences: ConfluenceEntity[];
}

export function StrategyCard({ strategy, confluences }: StrategyCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 hover:border-zinc-700 hover:shadow-md transition-all group">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>{strategy.name}</span>
              </h3>
              {strategy.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {strategy.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Edit Strategy"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                title="Delete Strategy"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Metrics / Badge counts */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/60 border border-border text-[11px] text-zinc-300">
              <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
              <span>{strategy.checklistCount} checklist steps</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/60 border border-border text-[11px] text-zinc-300">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>{strategy.rulesCount} rules</span>
            </div>
          </div>

          {/* Confluences list */}
          {strategy.confluences.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Ideal Confluences ({strategy.confluences.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {strategy.confluences.map((c) => (
                  <Badge
                    key={c.id}
                    variant="outline"
                    className="px-2 py-0.5 text-[10px] font-normal border-border bg-secondary/30 text-zinc-300"
                  >
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Quick Edit trigger */}
        <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Updated {new Date(strategy.updatedAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <span>Configure</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Edit Strategy Dialog */}
      <StrategyDialog
        strategy={strategy}
        confluences={confluences}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Strategy Dialog */}
      <DeleteStrategyDialog
        strategyId={strategy.id}
        strategyName={strategy.name}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
