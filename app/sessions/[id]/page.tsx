import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getSessionById } from "@/lib/data/sessions";
import { getSessionTradesAndStats } from "@/lib/data/trades";
import { Badge } from "@/components/ui/badge";
import { AddTradeDrawer } from "@/components/add-trade-drawer";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { EditSessionDialog } from "@/components/edit-session-dialog";
import { SessionRulesDialog } from "@/components/session-rules-dialog";
import { SessionDashboardView } from "@/components/session-dashboard-view";
import { formatCurrencyNeutral } from "@/lib/utils";
import { ChevronLeft, Calendar, Layers, Wallet } from "lucide-react";

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

  // Fetch all trades, rules, compliance scoring, time analytics, setup analytics, calendar analytics, and compute all session stats + equity curve in a single query
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
  } = await getSessionTradesAndStats(
    session.id,
    session.startingBalance,
    session.periodStart,
    session.periodEnd
  );

  const formattedPeriod = `${format(
    new Date(session.periodStart),
    "MMM d, yyyy"
  )} – ${format(new Date(session.periodEnd), "MMM d, yyyy")}`;

  return (
    <div className="space-y-5">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-0.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Sessions</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {session.name}
            </h1>
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

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedPeriod}
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Starting: {formatCurrencyNeutral(session.startingBalance)}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {stats.totalTrades} {stats.totalTrades === 1 ? "trade" : "trades"} logged
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <EditSessionDialog session={session} trades={trades} />
          <SessionRulesDialog sessionId={session.id} rules={rules} />
          <DeleteSessionButton sessionId={session.id} />
          <AddTradeDrawer
            sessionId={session.id}
            defaultSymbol={session.instrument}
            defaultDate={session.periodStart.toISOString()}
            sessionPeriodStart={session.periodStart}
            sessionPeriodEnd={session.periodEnd}
            sessionRules={rules}
          />
        </div>
      </div>

      {/* DASHBOARD TABS: OVERVIEW & TRADES / TIME ANALYSIS / SETUP LEADERBOARD / CALENDAR */}
      <SessionDashboardView
        session={{
          id: session.id,
          instrument: session.instrument,
          startingBalance: session.startingBalance,
          periodStart: session.periodStart,
          periodEnd: session.periodEnd,
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
      />
    </div>
  );
}
