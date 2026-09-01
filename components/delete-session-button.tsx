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
    if (!confirm("Delete this session and all its recorded trades?")) {
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
      className="text-muted-foreground hover:text-[#DB5461] hover:border-[#DB5461]/30 gap-1.5 h-9"
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
