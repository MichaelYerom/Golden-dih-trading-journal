import { getAllSessions } from "@/lib/data/sessions";
import { SessionCard } from "@/components/session-card";
import { CreateSessionDialog } from "@/components/create-session-dialog";
import { ImportSessionDialog } from "@/components/import-session-dialog";
import { Card } from "@/components/ui/card";
import { Plus, BarChart2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sessions] = await Promise.all([getAllSessions()]);

  return (
    <div className="space-y-5">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span>Backtest Sessions</span>
            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
              {sessions.length}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a session to view the trade journal, equity curve, and execution metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ImportSessionDialog />
          <CreateSessionDialog />
        </div>
      </div>

      {/* Grid of Sessions + Add Session Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 'Add Session' flat interactive card */}
        <CreateSessionDialog
          trigger={
            <Card className="h-full min-h-[190px] border border-border hover:border-white/20 bg-card transition-colors duration-150 flex flex-col items-center justify-center p-5 text-center cursor-pointer">
              <div className="p-2.5 rounded-md bg-secondary text-foreground border border-border mb-2.5">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-medium text-foreground">
                Create Session
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                Start a new backtest run with custom instrument & balance.
              </p>
            </Card>
          }
        />

        {/* Existing Session Cards */}
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {/* Empty State when no sessions exist */}
      {sessions.length === 0 && (
        <div className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-8 text-center max-w-lg mx-auto space-y-3">
          <div className="mx-auto w-9 h-9 rounded-md bg-secondary text-muted-foreground flex items-center justify-center border border-border">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              No backtest sessions recorded
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create a session to log historical trades and track strategy performance.
            </p>
          </div>
          <div className="pt-1">
            <CreateSessionDialog />
          </div>
        </div>
      )}
    </div>
  );
}
