import { Metadata } from "next";
import { getLessonsLearned } from "@/lib/data/lessons";
import { getAllSessions } from "@/lib/data/sessions";
import { getStrategies } from "@/lib/data/strategies";
import { LessonsView } from "@/components/lessons/lessons-view";

export const metadata: Metadata = {
  title: "Lessons Learned & Reflections — Golden DIH",
  description:
    "Review all post-trade reflections, execution management notes, and missed entry realizations across backtest sessions.",
};

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const [lessons, sessions, strategies] = await Promise.all([
    getLessonsLearned(),
    getAllSessions(),
    getStrategies(),
  ]);

  const sessionOptions = sessions.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const strategyOptions = strategies.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <LessonsView
      initialLessons={lessons}
      sessions={sessionOptions}
      strategies={strategyOptions}
    />
  );
}
