import { prisma } from "@/lib/prisma";

export interface TradeEntity {
  id: string;
  sessionId: string;
  symbol: string;
  direction: string;
  entryAt: Date;
  exitAt: Date;
  entryPrice: number;
  exitPrice: number;
  grossPnl: number;
  result: string;
  notes: string | null;
  createdAt: Date;
  htfBias: string | null;
  newsToday: string | null;
  riskPercent: number | null;
  drawDirection: string | null;
  setupModel: string | null;
  emotionalState: string | null;
  rulesFollowed: boolean | null;
  rr: string | null;
}

export interface EquityPoint {
  index: number;
  date: string;
  rawDate: Date;
  balance: number;
  pnl: number;
  tradePnl: number;
  symbol?: string;
  direction?: string;
  result?: string;
  label: string;
}

export interface SessionStats {
  netPnl: number;
  netPnlPercent: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  totalGains: number;
  totalLosses: number;
  currentBalance: number;
}

export interface SessionTradesAndStats {
  trades: TradeEntity[];
  stats: SessionStats;
  equityCurve: EquityPoint[];
}

export interface CreateTradeInput {
  sessionId: string;
  symbol: string;
  direction: "long" | "short";
  entryAt: Date;
  exitAt: Date;
  entryPrice: number;
  exitPrice: number;
  grossPnl: number;
  result: "win" | "loss" | "breakeven";
  notes?: string | null;
  htfBias?: string | null;
  newsToday?: string | null;
  riskPercent?: number | null;
  drawDirection?: string | null;
  setupModel?: string | null;
  emotionalState?: string | null;
  rulesFollowed?: boolean | null;
  rr?: string | null;
}

export async function getSessionTradesAndStats(
  sessionId: string,
  startingBalance: number,
  sessionStartDate?: Date
): Promise<SessionTradesAndStats> {
  const trades = await prisma.trade.findMany({
    where: { sessionId },
    orderBy: [
      { entryAt: "asc" },
      { createdAt: "asc" },
    ],
  });

  let netPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let totalGains = 0;
  let totalLosses = 0;

  const totalTrades = trades.length;

  for (const trade of trades) {
    netPnl += trade.grossPnl;
    if (trade.result === "win") {
      winCount++;
      totalGains += Math.max(0, trade.grossPnl);
    } else if (trade.result === "loss") {
      lossCount++;
      totalLosses += Math.abs(Math.min(0, trade.grossPnl));
    } else if (trade.result === "breakeven") {
      breakevenCount++;
    }
  }

  const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
  const profitFactor =
    totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? totalGains : 0;
  const avgWin = winCount > 0 ? totalGains / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
  const netPnlPercent =
    startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const currentBalance = startingBalance + netPnl;

  const stats: SessionStats = {
    netPnl,
    netPnlPercent,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    totalTrades,
    winCount,
    lossCount,
    breakevenCount,
    totalGains,
    totalLosses,
    currentBalance,
  };

  // Build Equity Curve
  const equityCurve: EquityPoint[] = [];

  // Point 0: Starting balance
  const initialDate = sessionStartDate || (trades.length > 0 ? trades[0].entryAt : new Date());
  equityCurve.push({
    index: 0,
    date: "Start",
    rawDate: initialDate,
    balance: startingBalance,
    pnl: 0,
    tradePnl: 0,
    label: "Starting Balance",
  });

  let runningBalance = startingBalance;
  trades.forEach((trade, idx) => {
    runningBalance += trade.grossPnl;
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(trade.entryAt));

    equityCurve.push({
      index: idx + 1,
      date: formattedDate,
      rawDate: trade.entryAt,
      balance: Math.round(runningBalance * 100) / 100,
      pnl: Math.round((runningBalance - startingBalance) * 100) / 100,
      tradePnl: trade.grossPnl,
      symbol: trade.symbol,
      direction: trade.direction,
      result: trade.result,
      label: `Trade #${idx + 1} (${trade.symbol})`,
    });
  });

  return {
    trades,
    stats,
    equityCurve,
  };
}

export async function createTrade(data: CreateTradeInput) {
  return prisma.trade.create({
    data: {
      sessionId: data.sessionId,
      symbol: data.symbol.trim().toUpperCase(),
      direction: data.direction,
      entryAt: data.entryAt,
      exitAt: data.exitAt,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice,
      grossPnl: data.grossPnl,
      result: data.result,
      notes: data.notes?.trim() || null,
      htfBias: data.htfBias?.trim() || null,
      newsToday: data.newsToday?.trim() || null,
      riskPercent: data.riskPercent !== undefined && data.riskPercent !== null ? Number(data.riskPercent) : null,
      drawDirection: data.drawDirection?.trim() || null,
      setupModel: data.setupModel?.trim() || null,
      emotionalState: data.emotionalState?.trim() || null,
      rulesFollowed: typeof data.rulesFollowed === "boolean" ? data.rulesFollowed : null,
      rr: data.rr?.trim() || null,
    },
  });
}

export async function deleteTrade(id: string) {
  return prisma.trade.delete({
    where: { id },
  });
}
