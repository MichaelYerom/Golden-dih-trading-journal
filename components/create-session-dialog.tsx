"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Loader2, Calendar, DollarSign, Target, Activity } from "lucide-react";
import { createSessionAction } from "@/lib/actions/session-actions";

interface CreateSessionDialogProps {
  trigger?: React.ReactNode;
}

export function CreateSessionDialog({ trigger }: CreateSessionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createSessionAction(formData);

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
    } else if (result?.sessionId) {
      setOpen(false);
      router.push(`/sessions/${result.sessionId}`);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2 font-medium">
          <Plus className="h-4 w-4" />
          <span>New Session</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create Backtest Session</DialogTitle>
              <DialogDescription>
                Set up a new contained backtesting run with instrument and starting balance.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Session Name
            </label>
            <Input
              name="name"
              placeholder="e.g. NQ NY AM Silver Bullet (Oct 2023)"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Instrument / Symbol
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="instrument"
                  placeholder="e.g. NQ, ES, EURUSD"
                  className="pl-9 font-mono-numbers uppercase"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Starting Balance ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="startingBalance"
                  type="number"
                  step="any"
                  placeholder="25000"
                  defaultValue="25000"
                  className="pl-9 font-mono-numbers"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Period Start
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="periodStart"
                  type="date"
                  className="pl-9"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Period End
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="periodEnd"
                  type="date"
                  className="pl-9"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Status
            </label>
            <Select name="status" defaultValue="active" disabled={isSubmitting}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <DialogFooter>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
