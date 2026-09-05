import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getSessionById } from "@/lib/data/sessions";
import { getSessionTradesAndStats } from "@/lib/data/trades";
import { getStrategies } from "@/lib/data/strategies";
import { getConfluences } from "@/lib/data/confluences";
import { Badge } from "@/components/ui/badge";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import { SessionRulesDialog } from "@/components/session-rules-dialog";
import { SessionDashboardView } from "@/components/session-dashboard-view";
import { formatCurrencyNeutral } from "@/lib/utils";
import { Calendar, Layers, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await getSessionById(params.id);

  if (!session) {
    notFound();
  }

  // Fetch all trades, rules, strategies, confluences, compliance scoring, time analytics, setup analytics, calendar analytics, and compute all session stats + equity curve
  const [
    tradesAndStats,
    strategies,
    confluences,
  ] = await Promise.all([
    getSessionTradesAndStats(
      session.id,
      session.startingBalance,
      session.periodStart,
      session.periodEnd
    ),
    getStrategies(),
    getConfluences(),
  ]);

  const {
    trades,
    stats,
    equityCurve,
    rDistribution,
    drawdownDetails,
    rules,
    compliance,
    timeAnalytics,
    setupAnalytics,
    calendarAnalytics,
  } = tradesAndStats;

  const formattedPeriod = `${format(
    new Date(session.periodStart),
    "MMM d, yyyy"
  )} – ${format(new Date(session.periodEnd), "MMM d, yyyy")}`;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {session.name}
            </h1>
            <Badge variant="outline" className="font-mono-numbers font-medium text-[11px] px-2 py-0.5">
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
              className="text-[11px] px-2 py-0.5"
            >
              {session.status}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>{formattedPeriod}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>Starting: {formatCurrencyNeutral(session.startingBalance)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>
                {stats.totalTrades} {stats.totalTrades === 1 ? "trade" : "trades"} logged
              </span>
            </span>
          </div>
        </div>

        {/* Action Buttons: Manage Rules & Add Trade */}
        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          <SessionRulesDialog sessionId={session.id} rules={rules} />
          <AddTradeDrawer
            sessionId={session.id}
            defaultSymbol={session.instrument}
            defaultDate={session.periodStart.toISOString()}
            sessionPeriodStart={session.periodStart}
            sessionPeriodEnd={session.periodEnd}
            sessionRules={rules}
            strategies={strategies}
            confluences={confluences}
            sessionStartingBalance={session.startingBalance}
            sessionCurrentBalance={stats.currentBalance}
          />
        </div>
      </div>

      {/* DASHBOARD TABS: OVERVIEW & TRADES / TIME ANALYSIS / SETUP LEADERBOARD / CALENDAR */}
      <SessionDashboardView
        session={{
          id: session.id,
          name: session.name,
          instrument: session.instrument,
          startingBalance: session.startingBalance,
          periodStart: session.periodStart,
          periodEnd: session.periodEnd,
          status: session.status,
        }}
        trades={trades}
        stats={stats}
        equityCurve={equityCurve}
        rDistribution={rDistribution}
        drawdownDetails={drawdownDetails}
        rules={rules}
        compliance={compliance}
        timeAnalytics={timeAnalytics}
        setupAnalytics={setupAnalytics}
        calendarAnalytics={calendarAnalytics}
        strategies={strategies}
        confluences={confluences}
      />
    </div>
  );
}
