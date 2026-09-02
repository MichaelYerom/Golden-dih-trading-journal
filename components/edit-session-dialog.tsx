"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Settings, Loader2, AlertTriangle } from "lucide-react";
import { updateSessionAction } from "@/lib/actions/session-actions";
import { TradeEntity } from "@/lib/data/trades";

interface EditSessionDialogProps {
  session: {
    id: string;
    name: string;
    instrument: string;
    startingBalance: number;
    periodStart: Date | string;
    periodEnd: Date | string;
    status: string;
  };
  trades?: TradeEntity[];
  trigger?: React.ReactNode;
}

export function EditSessionDialog({
  session,
  trades = [],
  trigger,
}: EditSessionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialStartStr = React.useMemo(() => {
    return new Date(session.periodStart).toISOString().slice(0, 10);
  }, [session.periodStart]);

  const initialEndStr = React.useMemo(() => {
    return new Date(session.periodEnd).toISOString().slice(0, 10);
  }, [session.periodEnd]);

  const [periodStart, setPeriodStart] = React.useState(initialStartStr);
  const [periodEnd, setPeriodEnd] = React.useState(initialEndStr);

  React.useEffect(() => {
    if (open) {
      setPeriodStart(initialStartStr);
      setPeriodEnd(initialEndStr);
      setError(null);
    }
  }, [open, initialStartStr, initialEndStr]);

  // Calculate out-of-range trades if range is edited
  const outOfRangeCount = React.useMemo(() => {
    if (!trades || trades.length === 0 || !periodStart || !periodEnd) return 0;
    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    return trades.filter((t) => {
      const tTime = new Date(t.entryAt).getTime();
      return tTime < start.getTime() || tTime > end.getTime();
    }).length;
  }, [trades, periodStart, periodEnd]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("sessionId", session.id);

    const result = await updateSessionAction(formData);

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 text-xs font-medium"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Edit Session</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Edit Backtest Session</DialogTitle>
          <DialogDescription>
            Update session settings, instrument, starting capital, or date boundaries.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-2.5 rounded-md bg-[#DB5461]/10 border border-[#DB5461]/25 text-[#DB5461] text-xs font-medium">
            {error}
          </div>
        )}

        {outOfRangeCount > 0 && (
          <div className="mb-4 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Date Range Warning:</strong> {outOfRangeCount} existing {outOfRangeCount === 1 ? "trade falls" : "trades fall"} outside this new date range. They will remain saved and editable in your Trade View, but will be flagged as &ldquo;Out of range&rdquo;.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Session Name
            </label>
            <Input
              name="name"
              defaultValue={session.name}
              placeholder="e.g. NQ NY AM Silver Bullet"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Instrument / Symbol
              </label>
              <Input
                name="instrument"
                defaultValue={session.instrument}
                placeholder="e.g. NQ, ES, EURUSD"
                className="font-mono-numbers uppercase"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Starting Balance ($)
              </label>
              <Input
                name="startingBalance"
                type="number"
                step="any"
                defaultValue={session.startingBalance}
                className="font-mono-numbers"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Period Start (Start Date)
              </label>
              <Input
                name="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Period End (End Date)
              </label>
              <Input
                name="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Status
            </label>
            <Select
              name="status"
              defaultValue={session.status}
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
