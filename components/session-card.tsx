import Link from "next/link";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SessionWithQuickStats } from "@/lib/data/sessions";
import { ArrowUpRight, TrendingUp, TrendingDown, Calendar, Layers } from "lucide-react";

interface SessionCardProps {
  session: SessionWithQuickStats;
}

export function SessionCard({ session }: SessionCardProps) {
  const isProfit = session.netPnl > 0;
  const isLoss = session.netPnl < 0;

  const formattedPeriod = `${format(new Date(session.periodStart), "MMM d, yyyy")} – ${format(
    new Date(session.periodEnd),
    "MMM d, yyyy"
  )}`;

  const returnPct =
    session.startingBalance > 0
      ? (session.netPnl / session.startingBalance) * 100
      : 0;

  return (
    <Link href={`/sessions/${session.id}`} className="group block">
      <Card className="h-full border-border/80 bg-card/80 hover:border-primary/50 hover:bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-200 flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono-numbers font-semibold bg-muted/30">
                  {session.instrument}
                </Badge>
                <Badge
                  variant={
                    session.status === "active"
                      ? "active"
                      : session.status === "completed"
                      ? "completed"
                      : "archived"
                  }
                >
                  {session.status}
                </Badge>
              </div>
              <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {session.name}
              </CardTitle>
            </div>
            <div className="rounded-lg p-1.5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 py-2 flex-1">
          {/* Date range */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formattedPeriod}</span>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/50 border border-border/40 p-3">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Net P&L</div>
              <div
                className={`text-sm font-semibold font-mono-numbers mt-0.5 ${
                  isProfit
                    ? "text-emerald-400"
                    : isLoss
                    ? "text-rose-400"
                    : "text-muted-foreground"
                }`}
              >
                {formatCurrency(session.netPnl)}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono-numbers">
                {returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Win Rate</div>
              <div className="text-sm font-semibold font-mono-numbers text-foreground mt-0.5">
                {session.tradeCount > 0 ? formatPercent(session.winRate) : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono-numbers">
                {session.winCount}W / {session.lossCount}L
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Trades</div>
              <div className="text-sm font-semibold font-mono-numbers text-foreground mt-0.5 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{session.tradeCount}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono-numbers">
                {session.breakevenCount > 0 ? `${session.breakevenCount} BE` : "logged"}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 text-[11px] text-muted-foreground border-t border-border/40 flex justify-between">
          <span>Starting: ${session.startingBalance.toLocaleString()}</span>
          <span className="flex items-center gap-1">
            {isProfit ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : isLoss ? (
              <TrendingDown className="h-3 w-3 text-rose-400" />
            ) : null}
            View journal
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
