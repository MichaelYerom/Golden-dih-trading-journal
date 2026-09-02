import { prisma } from "@/lib/prisma";
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

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      trades: {
        select: {
          grossPnl: true,
          result: true,
        },
      },
    },
  });

  return sessions.map((session) => {
    let netPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakevenCount = 0;
    const tradeCount = session.trades.length;

    for (const trade of session.trades) {
      netPnl += trade.grossPnl;
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
      periodStart: session.periodStart,
      periodEnd: session.periodEnd,
      startingBalance: session.startingBalance,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
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

  return prisma.session.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function createSession(data: CreateSessionInput) {
  const user = await requireUser();

  return prisma.session.create({
    data: {
      userId: user.id,
      name: data.name,
      instrument: data.instrument,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      startingBalance: data.startingBalance,
      status: data.status || "active",
    },
  });
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

  const existing = await prisma.session.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    throw new Error("Session not found or unauthorized");
  }

  return prisma.session.update({
    where: {
      id,
    },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.instrument !== undefined && { instrument: data.instrument }),
      ...(data.periodStart !== undefined && { periodStart: data.periodStart }),
      ...(data.periodEnd !== undefined && { periodEnd: data.periodEnd }),
      ...(data.startingBalance !== undefined && { startingBalance: data.startingBalance }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
}

export async function deleteSession(id: string) {
  const user = await requireUser();

  return prisma.session.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });
}
