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
import { ConfluenceEntity } from "@/lib/data/confluences";
import {
  createConfluenceAction,
  updateConfluenceAction,
  deleteConfluenceAction,
} from "@/lib/actions/confluence-actions";
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ManageConfluencesDialogProps {
  confluences: ConfluenceEntity[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ManageConfluencesDialog({
  confluences,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: ManageConfluencesDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const [newTagName, setNewTagName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createConfluenceAction(newTagName);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setNewTagName("");
    }
  };

  const handleStartEdit = (conf: ConfluenceEntity) => {
    setEditingId(conf.id);
    setEditingName(conf.name);
    setErrorMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await updateConfluenceAction(id, editingName);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await deleteConfluenceAction(id);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-flex">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-8 px-3 text-xs gap-1.5"
        >
          <Tags className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Manage Confluences</span>
          {confluences.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] ml-1">
              {confluences.length}
            </Badge>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-secondary border border-border text-foreground">
                <Tags className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Manage Confluence Tags
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create and organize reusable technical confluence tags for your playbook strategies.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Create new tag form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. FVG, Liquidity Sweep, Asian Range..."
              className="h-9 text-xs"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newTagName.trim()}
              className="h-9 px-3 text-xs gap-1 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Add Tag</span>
            </Button>
          </form>

          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tags list */}
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {confluences.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                No confluence tags created yet. Add your first confluence above.
              </div>
            ) : (
              confluences.map((conf) => (
                <div
                  key={conf.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-card border border-border hover:border-zinc-700 transition-colors"
                >
                  {editingId === conf.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-7 text-xs flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit(conf.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(conf.id)}
                        disabled={isSubmitting || !editingName.trim()}
                        className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs font-medium text-foreground">
                          {conf.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(conf)}
                          disabled={isSubmitting}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(conf.id)}
                          disabled={isSubmitting}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs h-8"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  );
}
