"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StrategyEntity, StrategyUsageStat } from "@/lib/data/strategies";
import { ConfluenceEntity } from "@/lib/data/confluences";
import { StrategyCard } from "./strategy-card";
import { StrategyDialog } from "./strategy-dialog";
import { ManageConfluencesDialog } from "./manage-confluences-dialog";
import {
  BookOpen,
  Plus,
  Tags,
  Search,
  Sparkles,
  ListChecks,
} from "lucide-react";

interface PlaybookViewProps {
  strategies: StrategyEntity[];
  confluences: ConfluenceEntity[];
  strategyStats?: Record<string, StrategyUsageStat>;
}

export function PlaybookView({
  strategies,
  confluences,
  strategyStats,
}: PlaybookViewProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredStrategies = strategies.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = s.name.toLowerCase().includes(query);
    const matchesDesc = s.description?.toLowerCase().includes(query);
    const matchesConf = s.confluences.some((c) =>
      c.name.toLowerCase().includes(query)
    );
    return matchesName || matchesDesc || matchesConf;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Trading Playbook</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define repeatable strategy setups, non-negotiable execution rules, and ideal technical confluences.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ManageConfluencesDialog confluences={confluences} />
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Strategy</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-card border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Total Strategies</div>
            <div className="text-base font-semibold text-foreground">
              {strategies.length}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ListChecks className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Active Steps & Rules</div>
            <div className="text-base font-semibold text-foreground">
              {strategies.reduce((acc, s) => acc + s.checklistCount + s.rulesCount, 0)}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Confluence Tags</div>
            <div className="text-base font-semibold text-foreground">
              {confluences.length}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {strategies.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategies or confluences..."
              className="pl-8 h-8 text-xs bg-card"
            />
          </div>
        </div>
      )}

      {/* Strategies Grid */}
      {strategies.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl bg-card/40 p-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-secondary/80 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              No Strategies in Your Playbook
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create your first trading model (e.g. ICT Silver Bullet, London Breakout, Opening Range Reversal) with setup checklists and rules.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Strategy</span>
          </Button>
        </div>
      ) : filteredStrategies.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground border border-border rounded-lg bg-card/40">
          No strategies match &ldquo;{searchQuery}&rdquo;. Try a different search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStrategies.map((strat) => (
            <StrategyCard
              key={strat.id}
              strategy={strat}
              confluences={confluences}
              stats={strategyStats ? strategyStats[strat.id] : undefined}
            />
          ))}
        </div>
      )}

      {/* Create Strategy Dialog */}
      <StrategyDialog
        confluences={confluences}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
