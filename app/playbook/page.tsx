import { Metadata } from "next";
import { getStrategies } from "@/lib/data/strategies";
import { getConfluences } from "@/lib/data/confluences";
import { PlaybookView } from "@/components/playbook/playbook-view";

export const metadata: Metadata = {
  title: "Trading Playbook — Golden DIH",
  description: "Manage reusable trading strategies, setup checklists, execution rules, and confluences.",
};

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const [strategies, confluences] = await Promise.all([
    getStrategies(),
    getConfluences(),
  ]);

  return <PlaybookView strategies={strategies} confluences={confluences} />;
}
