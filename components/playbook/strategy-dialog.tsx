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
import { Badge } from "@/components/ui/badge";
import {
  StrategyDetailEntity,
  StrategyEntity,
} from "@/lib/data/strategies";
import { ConfluenceEntity } from "@/lib/data/confluences";
import {
  createStrategyAction,
  updateStrategyAction,
} from "@/lib/actions/strategy-actions";
import { createConfluenceAction } from "@/lib/actions/confluence-actions";
import {
  Plus,
  Trash2,
  ListChecks,
  ShieldAlert,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

interface StrategyDialogProps {
  strategy?: StrategyDetailEntity | StrategyEntity | null;
  confluences: ConfluenceEntity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function StrategyDialog({
  strategy,
  confluences,
  open,
  onOpenChange,
  onSaved,
}: StrategyDialogProps) {
  const isEditing = Boolean(strategy);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [checklistItems, setChecklistItems] = React.useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = React.useState("");
  const [rules, setRules] = React.useState<string[]>([]);
  const [newRuleText, setNewRuleText] = React.useState("");
  const [selectedConfluenceIds, setSelectedConfluenceIds] = React.useState<string[]>([]);

  // Inline confluence creation
  const [newConfluenceName, setNewConfluenceName] = React.useState("");
  const [isCreatingConfluence, setIsCreatingConfluence] = React.useState(false);

  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Initialize form when opened or strategy changed
  React.useEffect(() => {
    if (open) {
      if (strategy) {
        setName(strategy.name);
        setDescription(strategy.description || "");
        setSelectedConfluenceIds(strategy.confluences.map((c) => c.id));

        // If full details exist
        if ("checklist" in strategy && Array.isArray(strategy.checklist)) {
          setChecklistItems(strategy.checklist.map((item) => item.text));
        } else {
          setChecklistItems([]);
        }

        if ("rules" in strategy && Array.isArray(strategy.rules)) {
          setRules(strategy.rules.map((r) => r.text));
        } else {
          setRules([]);
        }
      } else {
        setName("");
        setDescription("");
        setChecklistItems([]);
        setRules([]);
        setSelectedConfluenceIds([]);
      }
      setNewChecklistText("");
      setNewRuleText("");
      setNewConfluenceName("");
      setErrorMessage(null);
    }
  }, [open, strategy]);

  // Add checklist item
  const handleAddChecklist = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = newChecklistText.trim();
    if (!clean) return;
    setChecklistItems((prev) => [...prev, clean]);
    setNewChecklistText("");
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add rule item
  const handleAddRule = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = newRuleText.trim();
    if (!clean) return;
    setRules((prev) => [...prev, clean]);
    setNewRuleText("");
  };

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Toggle confluence selection
  const handleToggleConfluence = (id: string) => {
    setSelectedConfluenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Create confluence on the fly
  const handleCreateInlineConfluence = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newConfluenceName.trim();
    if (!clean) return;

    setIsCreatingConfluence(true);
    setErrorMessage(null);

    const res = await createConfluenceAction(clean);
    setIsCreatingConfluence(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.confluence) {
      setSelectedConfluenceIds((prev) => [...prev, res.confluence.id]);
      setNewConfluenceName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Strategy name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (isEditing && strategy) {
        const res = await updateStrategyAction(strategy.id, {
          name: name.trim(),
          description: description.trim() || null,
          checklistItems,
          rules,
          confluenceIds: selectedConfluenceIds,
        });

        if (res.error) {
          setErrorMessage(res.error);
          setIsSaving(false);
          return;
        }
      } else {
        const res = await createStrategyAction({
          name: name.trim(),
          description: description.trim() || null,
          checklistItems,
          rules,
          confluenceIds: selectedConfluenceIds,
        });

        if (res.error) {
          setErrorMessage(res.error);
          setIsSaving(false);
          return;
        }
      }

      setIsSaving(false);
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.message || "An unexpected error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-secondary border border-border text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEditing ? "Edit Strategy" : "Create New Strategy"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Define entry criteria, checklist steps, non-negotiable rules, and technical confluences.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Strategy Name & Description */}
          <div className="space-y-3 p-3 rounded-md bg-card border border-border">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Strategy Name <span className="text-rose-400">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. London Silver Bullet, ICT 2022 Model, NY AM Breakout"
                className="h-8 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Description / Context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of setup model, session timing, and execution conditions..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Setup Checklist */}
          <div className="p-3 rounded-md bg-card border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
                <span>Setup Checklist</span>
                <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] ml-1">
                  {checklistItems.length}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">Order of execution</span>
            </div>

            {/* Existing Checklist items */}
            {checklistItems.length > 0 && (
              <div className="space-y-1.5">
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-4 text-center">
                        {idx + 1}.
                      </span>
                      <span className="text-foreground">{item}</span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add checklist input */}
            <div className="flex gap-1.5">
              <Input
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add checklist step (e.g. Wait for 03:00 AM NY open)..."
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleAddChecklist()}
                disabled={!newChecklistText.trim()}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Strategy Rules ("Rules not to break") */}
          <div className="p-3 rounded-md bg-card border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span>Strategy Rules</span>
                <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] ml-1">
                  {rules.length}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">Rules not to break</span>
            </div>

            {/* Existing Rules */}
            {rules.length > 0 && (
              <div className="space-y-1.5">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-4 text-center">
                        {idx + 1}.
                      </span>
                      <span className="text-foreground">{rule}</span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRule(idx)}
                      className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add rule input */}
            <div className="flex gap-1.5">
              <Input
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="Add rule (e.g. Do not enter against HTF 4H trend)..."
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleAddRule()}
                disabled={!newRuleText.trim()}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Confluence Tags Multi-Select */}
          <div className="p-3 rounded-md bg-card border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Ideal Confluences</span>
                <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] ml-1">
                  {selectedConfluenceIds.length}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">Select required tags</span>
            </div>

            {/* Confluence Pill Selector */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-md bg-secondary/30 border border-border">
              {confluences.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">
                  No confluences available yet. Add one below to get started.
                </div>
              ) : (
                confluences.map((conf) => {
                  const isSelected = selectedConfluenceIds.includes(conf.id);
                  return (
                    <button
                      key={conf.id}
                      type="button"
                      onClick={() => handleToggleConfluence(conf.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 shadow-sm"
                          : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-zinc-700"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                      <span>{conf.name}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Inline Confluence Creator */}
            <div className="flex gap-1.5 pt-1">
              <Input
                value={newConfluenceName}
                onChange={(e) => setNewConfluenceName(e.target.value)}
                placeholder="Create & attach new confluence tag..."
                className="h-7 text-xs"
                disabled={isCreatingConfluence}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateInlineConfluence(e);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCreateInlineConfluence}
                disabled={isCreatingConfluence || !newConfluenceName.trim()}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
              >
                {isCreatingConfluence ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                <span>Create Tag</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || !name.trim()}
            className="text-xs h-8 gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>{isEditing ? "Save Changes" : "Create Strategy"}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
