"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteStrategyAction } from "@/lib/actions/strategy-actions";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteStrategyDialogProps {
  strategyId: string;
  strategyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteStrategyDialog({
  strategyId,
  strategyName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteStrategyDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const res = await deleteStrategyAction(strategyId);
    setIsDeleting(false);

    if (res.error) {
      setError(res.error);
    } else {
      onOpenChange(false);
      onDeleted?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-rose-950/40 border border-rose-800 text-rose-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-rose-200">
                Delete Strategy
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3 rounded-md bg-card border border-border text-xs space-y-2">
          <p className="text-foreground">
            Are you sure you want to delete <strong className="text-rose-300">&ldquo;{strategyName}&rdquo;</strong>?
          </p>
          <div className="flex items-start gap-2 p-2 rounded bg-secondary/50 border border-border text-[11px] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              All associated checklist items, strategy rules, and confluence pairings will be permanently deleted.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-md bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs h-8 gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete Strategy</span>
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
