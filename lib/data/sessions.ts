import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireUser } from "@/lib/auth/get-user";

export interface SessionWithQuickStats {
  id: string;
  userId: string;
  name: string;
  instrument: string;
  periodStart: Date;
  periodEnd: Date;
  startingBalance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  netPnl: number;
  winRate: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
}

export interface CreateSessionInput {
  name: string;
  instrument: string;
  periodStart: Date;
  periodEnd: Date;
  startingBalance: number;
  status?: string;
}

export async function getAllSessions(): Promise<SessionWithQuickStats[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("Session")
    .select("*, trades:Trade(grossPnl, result, outcomeType)")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  if (error || !sessions) {
    console.error("Error fetching sessions:", error);
    return [];
  }

  return sessions.map((session: any) => {
    let netPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakevenCount = 0;
    const tradesList = Array.isArray(session.trades) ? session.trades : [];
    const activeTrades = tradesList.filter(
      (t: any) => t.outcomeType === "trade" || (!t.outcomeType && (t.result || t.grossPnl !== undefined))
    );
    const tradeCount = activeTrades.length;

    for (const trade of activeTrades) {
      netPnl += Number(trade.grossPnl || 0);
      if (trade.result === "win") winCount++;
      else if (trade.result === "loss") lossCount++;
      else if (trade.result === "breakeven") breakevenCount++;
    }

    const winRate = tradeCount > 0 ? winCount / tradeCount : 0;

    return {
      id: session.id,
      userId: session.userId,
      name: session.name,
      instrument: session.instrument,
      periodStart: new Date(session.periodStart),
      periodEnd: new Date(session.periodEnd),
      startingBalance: Number(session.startingBalance),
      status: session.status,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      netPnl,
      winRate,
      tradeCount,
      winCount,
      lossCount,
      breakevenCount,
    };
  });
}

export async function getSessionById(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Session")
    .select("*")
    .eq("id", id)
    .eq("userId", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    periodStart: new Date(data.periodStart),
    periodEnd: new Date(data.periodEnd),
    startingBalance: Number(data.startingBalance),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

export async function createSession(data: CreateSessionInput) {
  const user = await requireUser();
  const supabase = await createClient();
  const sessionId = crypto.randomUUID();

  const { data: created, error } = await supabase
    .from("Session")
    .insert({
      id: sessionId,
      userId: user.id,
      name: data.name,
      instrument: data.instrument,
      periodStart: data.periodStart.toISOString(),
      periodEnd: data.periodEnd.toISOString(),
      startingBalance: data.startingBalance,
      status: data.status || "active",
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(error?.message || "Failed to create session");
  }

  return {
    ...created,
    periodStart: new Date(created.periodStart),
    periodEnd: new Date(created.periodEnd),
    startingBalance: Number(created.startingBalance),
    createdAt: new Date(created.createdAt),
    updatedAt: new Date(created.updatedAt),
  };
}

export interface UpdateSessionInput {
  name?: string;
  instrument?: string;
  periodStart?: Date;
  periodEnd?: Date;
  startingBalance?: number;
  status?: string;
}

export async function updateSession(id: string, data: UpdateSessionInput) {
  const user = await requireUser();
  const supabase = await createClient();

  const updatePayload: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.instrument !== undefined) updatePayload.instrument = data.instrument;
  if (data.periodStart !== undefined) updatePayload.periodStart = data.periodStart.toISOString();
  if (data.periodEnd !== undefined) updatePayload.periodEnd = data.periodEnd.toISOString();
  if (data.startingBalance !== undefined) updatePayload.startingBalance = data.startingBalance;
  if (data.status !== undefined) updatePayload.status = data.status;

  const { data: updated, error } = await supabase
    .from("Session")
    .update(updatePayload)
    .eq("id", id)
    .eq("userId", user.id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update session or unauthorized");
  }

  return {
    ...updated,
    periodStart: new Date(updated.periodStart),
    periodEnd: new Date(updated.periodEnd),
    startingBalance: Number(updated.startingBalance),
    createdAt: new Date(updated.createdAt),
    updatedAt: new Date(updated.updatedAt),
  };
}

export async function deleteSession(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("Session")
    .delete()
    .eq("id", id)
    .eq("userId", user.id);

  if (error) {
    throw new Error(error.message || "Failed to delete session");
  }

  return { id };
}
