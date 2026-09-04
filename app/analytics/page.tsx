import { Metadata } from "next";
import { getAdvancedAnalyticsData } from "@/lib/data/analytics";
import { AdvancedAnalyticsView } from "@/components/analytics/advanced-analytics-view";

export const metadata: Metadata = {
  title: "Advanced Analytics & Intelligence — Golden DIH",
  description:
    "Cross-feature trading insights: Playbook adherence, confluence discipline vs outcome, hesitation patterns, and coach notes.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { trades, strategies } = await getAdvancedAnalyticsData();

  return (
    <AdvancedAnalyticsView
      initialTrades={trades}
      strategies={strategies}
    />
  );
}
