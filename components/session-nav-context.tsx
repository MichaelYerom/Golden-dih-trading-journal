"use client";

import * as React from "react";
import {
  TradeEntity,
  SessionStats,
  EquityPoint,
  RBucket,
  DrawdownResult,
  RuleEntity,
  RuleComplianceResult,
  TimeAnalyticsResult,
  SetupAnalyticsResult,
} from "@/lib/data/trade-analytics";

export type SessionTab = "overview" | "time" | "setups" | "calendar";

export interface SessionContextData {
  session: {
    id: string;
    name?: string | null;
    instrument: string;
    startingBalance: number;
    periodStart: Date;
    periodEnd: Date;
    status?: string;
  };
  trades: TradeEntity[];
  stats: SessionStats;
  equityCurve: EquityPoint[];
  rDistribution: RBucket[];
  drawdownDetails: DrawdownResult;
  rules: RuleEntity[];
  compliance: RuleComplianceResult;
  timeAnalytics: TimeAnalyticsResult;
  setupAnalytics: SetupAnalyticsResult;
  timeCount?: number;
  setupsCount?: number;
  calendarDays?: number;
}

interface SessionNavContextType {
  activeTab: SessionTab;
  setActiveTab: (tab: SessionTab) => void;
  sessionData: SessionContextData | null;
  setSessionData: (data: SessionContextData | null) => void;
  onOpenEditSession?: () => void;
  setOnOpenEditSession: (fn: (() => void) | undefined) => void;
}

const SessionNavContext = React.createContext<SessionNavContextType>({
  activeTab: "overview",
  setActiveTab: () => {},
  sessionData: null,
  setSessionData: () => {},
  setOnOpenEditSession: () => {},
});

export function SessionNavProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = React.useState<SessionTab>("overview");
  const [sessionData, setSessionData] = React.useState<SessionContextData | null>(null);
  const [onOpenEditSession, setOnOpenEditSession] = React.useState<(() => void) | undefined>(undefined);

  const value = React.useMemo(
    () => ({
      activeTab,
      setActiveTab,
      sessionData,
      setSessionData,
      onOpenEditSession,
      setOnOpenEditSession,
    }),
    [activeTab, sessionData, onOpenEditSession]
  );

  return (
    <SessionNavContext.Provider value={value}>
      {children}
    </SessionNavContext.Provider>
  );
}

export function useSessionNav() {
  return React.useContext(SessionNavContext);
}
