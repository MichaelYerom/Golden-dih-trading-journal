import { getAllSessions } from "@/lib/data/sessions";
import { SessionCard } from "@/components/session-card";
import { CreateSessionDialog } from "@/components/create-session-dialog";
import { Card } from "@/components/ui/card";
import { Plus, BarChart3, Clock, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch sessions via service layer
  const [sessions] = await Promise.all([getAllSessions()]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Backtest Sessions</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/50">
              {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Log and review contained backtesting runs with quick performance metrics.
          </p>
        </div>

        <div>
          <CreateSessionDialog />
        </div>
      </div>

      {/* Grid of Sessions + Add Session Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 'Add Session' interactive card */}
        <CreateSessionDialog
          trigger={
            <Card className="h-full min-h-[220px] border-dashed border-2 border-border/80 hover:border-primary/60 bg-card/30 hover:bg-card/60 transition-all duration-200 flex flex-col items-center justify-center p-6 text-center group cursor-pointer shadow-none">
              <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all mb-3">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                New Backtest Session
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Create a session to test your strategy on historical market data.
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
        <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-card/20 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Ready to start your backtesting journal?
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create your first backtest run to log trades, review setups, track execution discipline, and visualize your equity curve.
            </p>
          </div>
          <div className="pt-2">
            <CreateSessionDialog />
          </div>
        </div>
      )}
    </div>
  );
}
