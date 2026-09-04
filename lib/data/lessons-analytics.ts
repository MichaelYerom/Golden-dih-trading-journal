export interface LessonItem {
  id: string; // trade id
  tradeId: string;
  sessionId: string;
  sessionName: string;
  sessionInstrument: string;
  symbol: string;
  entryAt: Date;
  outcomeType: "trade" | "missed_entry" | "no_trade";
  result: "win" | "loss" | "breakeven" | null;
  direction: "long" | "short" | null;
  rMultiple: number | null;
  grossPnl: number;
  riskAmount: number | null;
  riskPercent: number | null;
  strategyId: string | null;
  strategyName: string | null;
  note: string; // The extracted reflection note
  noteType: "post_trade_review" | "missed_reason" | "no_trade_reason";
  rulesFollowed: boolean | null;
  htfBias: string | null;
  emotionalState: string | null;
  images: Array<{
    id: string;
    tradeId: string;
    url: string;
    label: string | null;
    role: "before_trade" | "outcome";
    createdAt: Date;
  }>;
}

export interface LessonFilterCriteria {
  searchText?: string;
  sessionId?: string[];
  outcomeType?: ("trade" | "missed_entry" | "no_trade")[];
  result?: ("win" | "loss" | "breakeven")[];
  strategyId?: string[];
  symbol?: string[];
  dateRange?: {
    start?: string | Date;
    end?: string | Date;
  };
}

export interface LessonsStats {
  totalLessons: number;
  lessonsThisMonth: number;
  lessonsThisWeek: number;
  winLessons: number;
  lossLessons: number;
  missedOrNoTradeLessons: number;
  evaluatedPnl: number;
}

/**
 * Pure filter function for Lessons Learned items
 */
export function filterLessons(
  lessons: LessonItem[],
  filters?: LessonFilterCriteria
): LessonItem[] {
  if (!filters) return lessons;

  return lessons.filter((lesson) => {
    // 1. Text Search (searches note, symbol, strategy name, session name, htf bias)
    if (filters.searchText && filters.searchText.trim()) {
      const q = filters.searchText.trim().toLowerCase();
      const noteMatch = lesson.note.toLowerCase().includes(q);
      const symbolMatch = lesson.symbol.toLowerCase().includes(q);
      const strategyMatch = lesson.strategyName
        ? lesson.strategyName.toLowerCase().includes(q)
        : false;
      const sessionMatch = lesson.sessionName.toLowerCase().includes(q);
      const htfMatch = lesson.htfBias
        ? lesson.htfBias.toLowerCase().includes(q)
        : false;

      if (!noteMatch && !symbolMatch && !strategyMatch && !sessionMatch && !htfMatch) {
        return false;
      }
    }

    // 2. Session ID filter
    if (filters.sessionId && filters.sessionId.length > 0) {
      if (!filters.sessionId.includes(lesson.sessionId)) {
        return false;
      }
    }

    // 3. Outcome Type filter
    if (filters.outcomeType && filters.outcomeType.length > 0) {
      if (!filters.outcomeType.includes(lesson.outcomeType)) {
        return false;
      }
    }

    // 4. Result filter (win, loss, breakeven)
    if (filters.result && filters.result.length > 0) {
      if (!lesson.result || !filters.result.includes(lesson.result)) {
        return false;
      }
    }

    // 5. Strategy ID filter
    if (filters.strategyId && filters.strategyId.length > 0) {
      if (!lesson.strategyId || !filters.strategyId.includes(lesson.strategyId)) {
        return false;
      }
    }

    // 6. Symbol filter
    if (filters.symbol && filters.symbol.length > 0) {
      if (!filters.symbol.includes(lesson.symbol.toUpperCase())) {
        return false;
      }
    }

    // 7. Date Range filter
    if (filters.dateRange) {
      const lessonTime = new Date(lesson.entryAt).getTime();

      if (filters.dateRange.start) {
        const start =
          typeof filters.dateRange.start === "string"
            ? new Date(filters.dateRange.start)
            : filters.dateRange.start;
        start.setHours(0, 0, 0, 0);
        if (lessonTime < start.getTime()) return false;
      }

      if (filters.dateRange.end) {
        const end =
          typeof filters.dateRange.end === "string"
            ? new Date(filters.dateRange.end)
            : filters.dateRange.end;
        end.setHours(23, 59, 59, 999);
        if (lessonTime > end.getTime()) return false;
      }
    }

    return true;
  });
}

/**
 * Search lessons with simple query string
 */
export function searchLessonsLearned(
  query: string,
  lessons: LessonItem[]
): LessonItem[] {
  return filterLessons(lessons, { searchText: query });
}

/**
 * Calculates summary metrics across lessons
 */
export function calculateLessonsStats(lessons: LessonItem[]): LessonsStats {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  let lessonsThisMonth = 0;
  let lessonsThisWeek = 0;
  let winLessons = 0;
  let lossLessons = 0;
  let missedOrNoTradeLessons = 0;
  let evaluatedPnl = 0;

  for (const lesson of lessons) {
    const lDate = new Date(lesson.entryAt);

    if (lDate.getFullYear() === currentYear && lDate.getMonth() === currentMonth) {
      lessonsThisMonth++;
    }

    if (lDate.getTime() >= startOfWeek.getTime()) {
      lessonsThisWeek++;
    }

    if (lesson.outcomeType === "trade") {
      evaluatedPnl += lesson.grossPnl;
      if (lesson.result === "win") {
        winLessons++;
      } else if (lesson.result === "loss") {
        lossLessons++;
      }
    } else {
      missedOrNoTradeLessons++;
    }
  }

  return {
    totalLessons: lessons.length,
    lessonsThisMonth,
    lessonsThisWeek,
    winLessons,
    lossLessons,
    missedOrNoTradeLessons,
    evaluatedPnl: Math.round(evaluatedPnl * 100) / 100,
  };
}
