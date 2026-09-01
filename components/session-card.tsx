import Link from "next/link";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SessionWithQuickStats } from "@/lib/data/sessions";
import { ArrowUpRight, Calendar, Layers } from "lucide-react";

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
    <Link href={`/sessions/${session.id}`} className="block">
      <Card className="h-full border border-border hover:border-white/20 bg-card transition-colors duration-150 flex flex-col justify-between">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="font-mono-numbers font-medium text-[11px]">
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
                  className="text-[11px]"
                >
                  {session.status}
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium text-foreground truncate pt-0.5">
                {session.name}
              </CardTitle>
            </div>
            <div className="text-muted-foreground p-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 py-1 flex-1">
          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{formattedPeriod}</span>
          </div>

          {/* Flat quick stats grid */}
          <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary border border-border p-2.5">
            <div>
              <div className="text-[10px] text-muted-foreground font-medium">Net P&L</div>
              <div
                className={`text-xs font-semibold font-mono-numbers mt-0.5 ${
                  isProfit
                    ? "text-[#22A06B]"
                    : isLoss
                    ? "text-[#DB5461]"
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
              <div className="text-[10px] text-muted-foreground font-medium">Win Rate</div>
              <div className="text-xs font-semibold font-mono-numbers text-foreground mt-0.5">
                {session.tradeCount > 0 ? formatPercent(session.winRate) : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono-numbers">
                {session.winCount}W / {session.lossCount}L
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground font-medium">Trades</div>
              <div className="text-xs font-semibold font-mono-numbers text-foreground mt-0.5 flex items-center gap-1">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span>{session.tradeCount}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono-numbers">
                {session.breakevenCount > 0 ? `${session.breakevenCount} BE` : "logged"}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 text-[11px] text-muted-foreground border-t border-border flex justify-between">
          <span>Starting: ${session.startingBalance.toLocaleString()}</span>
          <span>View journal &rarr;</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
