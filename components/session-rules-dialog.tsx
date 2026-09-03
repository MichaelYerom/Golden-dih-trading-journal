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
import { Input } from "@/components/ui/input";
import { RuleEntity } from "@/lib/data/trade-analytics";
import { createRuleAction, deleteRuleAction } from "@/lib/actions/rule-actions";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SessionRulesDialogProps {
  sessionId: string;
  rules: RuleEntity[];
}

export function SessionRulesDialog({
  sessionId,
  rules,
}: SessionRulesDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [ruleText, setRuleText] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleText.trim()) return;

    setIsAdding(true);
    setError(null);

    const res = await createRuleAction(sessionId, ruleText.trim());
    setIsAdding(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setRuleText("");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingId(ruleId);
    setError(null);

    const res = await deleteRuleAction(ruleId, sessionId);
    setDeletingId(null);

    if (res?.error) {
      setError(res.error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs font-medium border-border hover:bg-secondary"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>Manage Rules</span>
        {rules.length > 0 && (
          <span className="ml-0.5 rounded-full bg-primary/15 text-primary text-[10px] px-1.5 py-0.2 font-mono-numbers">
            {rules.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Session Rule Checklist</DialogTitle>
              <DialogDescription className="text-xs">
                Define strict execution rules to track your discipline and compliance scoring.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#DB5461]/10 border border-[#DB5461]/25 text-[#DB5461] text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Rule Input Form */}
        <form onSubmit={handleAddRule} className="space-y-2 pt-2">
          <label className="text-xs font-medium text-foreground block">
            Add New Rule
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              placeholder="e.g. HTF bias confirmed, Risk ≤ 1%, No revenge trade..."
              className="text-xs"
              disabled={isAdding}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isAdding || !ruleText.trim()}
              className="gap-1 px-3 flex-shrink-0"
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Rules List */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
              Active Rules ({rules.length})
            </span>
            <span className="text-[10px] text-muted-foreground">
              Checked on each trade entry
            </span>
          </div>

          {rules.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-5 text-center bg-card/50">
              <ShieldCheck className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-50" />
              <p className="text-xs font-medium text-foreground">No rules defined yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto">
                Add checklist items above to grade trade compliance individually.
              </p>
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-card/80 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[11px] font-mono-numbers text-muted-foreground mt-0.5">
                      {idx + 1}.
                    </span>
                    <span className="text-xs text-foreground font-medium break-words">
                      {rule.text}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deletingId === rule.id}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-[#DB5461] hover:bg-[#DB5461]/10 flex-shrink-0"
                    title="Delete rule"
                  >
                    {deletingId === rule.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
