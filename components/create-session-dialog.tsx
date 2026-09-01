"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
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
        <Button onClick={() => setOpen(true)} className="gap-1.5 font-medium">
          <Plus className="h-4 w-4" />
          <span>New Session</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Create Backtest Session</DialogTitle>
          <DialogDescription>
            Configure session details and starting balance.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-2.5 rounded-md bg-[#DB5461]/10 border border-[#DB5461]/25 text-[#DB5461] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Instrument / Symbol
              </label>
              <Input
                name="instrument"
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
                placeholder="25000"
                defaultValue="25000"
                className="font-mono-numbers"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Period Start
              </label>
              <Input
                name="periodStart"
                type="date"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Period End
              </label>
              <Input
                name="periodEnd"
                type="date"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
