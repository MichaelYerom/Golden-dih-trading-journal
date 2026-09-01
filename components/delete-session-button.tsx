"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSessionAction } from "@/lib/actions/session-actions";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this session and all its trades? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    await deleteSessionAction(sessionId);
    router.push("/");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 gap-1.5 h-9"
      title="Delete Session"
    >
      {isDeleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Delete</span>
    </Button>
  );
}
