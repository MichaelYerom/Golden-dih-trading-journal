-- Supabase PostgreSQL Schema Reference for Golden DIH Trading Journal
-- Generated to document the complete relational model, constraints, and Row-Level Security (RLS) policies.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Table (Mirroring Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public."User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Trader',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Session Table
CREATE TABLE IF NOT EXISTS public."Session" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    instrument TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "startingBalance" DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON public."Session"("userId");

-- 4. Tag Table
CREATE TABLE IF NOT EXISTS public."Tag" (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_category_name_key" UNIQUE (category, name)
);

CREATE INDEX IF NOT EXISTS "Tag_category_idx" ON public."Tag"(category);

-- 5. Trade Table
CREATE TABLE IF NOT EXISTS public."Trade" (
    id TEXT PRIMARY KEY,
    "sessionId" TEXT NOT NULL REFERENCES public."Session"(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    direction TEXT,
    "entryAt" TIMESTAMP(3) NOT NULL,
    "exitAt" TIMESTAMP(3) NOT NULL,
    "entryPrice" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "rMultiple" DOUBLE PRECISION,
    "grossPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    result TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "htfBias" TEXT,
    "newsToday" TEXT,
    "riskAmount" DOUBLE PRECISION,
    "riskPercent" DOUBLE PRECISION,
    "rrAchieved" DOUBLE PRECISION,
    "potentialRR" DOUBLE PRECISION,
    "lossR" DOUBLE PRECISION DEFAULT -1,
    "beforeTradeNotes" TEXT,
    "reasonNotes" TEXT,
    "outcomeType" TEXT NOT NULL DEFAULT 'trade',
    "strategyId" TEXT REFERENCES public."Strategy"(id) ON DELETE SET NULL,
    "drawDirection" TEXT,
    "setupModel" TEXT,
    "emotionalState" TEXT,
    "rulesFollowed" BOOLEAN,
    rr TEXT,
    "htfBiasTagId" TEXT REFERENCES public."Tag"(id) ON DELETE SET NULL,
    "emotionalStateTagId" TEXT REFERENCES public."Tag"(id) ON DELETE SET NULL,
    "drawDirectionTagId" TEXT REFERENCES public."Tag"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Trade_sessionId_idx" ON public."Trade"("sessionId");
CREATE INDEX IF NOT EXISTS "Trade_strategyId_idx" ON public."Trade"("strategyId");
CREATE INDEX IF NOT EXISTS "Trade_outcomeType_idx" ON public."Trade"("outcomeType");
CREATE INDEX IF NOT EXISTS "Trade_htfBiasTagId_idx" ON public."Trade"("htfBiasTagId");
CREATE INDEX IF NOT EXISTS "Trade_emotionalStateTagId_idx" ON public."Trade"("emotionalStateTagId");
CREATE INDEX IF NOT EXISTS "Trade_drawDirectionTagId_idx" ON public."Trade"("drawDirectionTagId");

-- 6. Tag-Trade Many-to-Many Join Table
CREATE TABLE IF NOT EXISTS public."_TradeSetupTags" (
    "A" TEXT NOT NULL REFERENCES public."Tag"(id) ON DELETE CASCADE,
    "B" TEXT NOT NULL REFERENCES public."Trade"(id) ON DELETE CASCADE,
    CONSTRAINT "_TradeSetupTags_AB_unique" UNIQUE ("A", "B")
);

CREATE INDEX IF NOT EXISTS "_TradeSetupTags_B_index" ON public."_TradeSetupTags"("B");

-- 7. Rule Table
CREATE TABLE IF NOT EXISTS public."Rule" (
    id TEXT PRIMARY KEY,
    "sessionId" TEXT NOT NULL REFERENCES public."Session"(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Rule_sessionId_idx" ON public."Rule"("sessionId");

-- 8. TradeRuleCheck Table
CREATE TABLE IF NOT EXISTS public."TradeRuleCheck" (
    id TEXT PRIMARY KEY,
    "tradeId" TEXT NOT NULL REFERENCES public."Trade"(id) ON DELETE CASCADE,
    "ruleId" TEXT NOT NULL REFERENCES public."Rule"(id) ON DELETE CASCADE,
    followed BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeRuleCheck_tradeId_ruleId_key" UNIQUE ("tradeId", "ruleId")
);

CREATE INDEX IF NOT EXISTS "TradeRuleCheck_tradeId_idx" ON public."TradeRuleCheck"("tradeId");
CREATE INDEX IF NOT EXISTS "TradeRuleCheck_ruleId_idx" ON public."TradeRuleCheck"("ruleId");

-- 9. TradeImage Table
CREATE TABLE IF NOT EXISTS public."TradeImage" (
    id TEXT PRIMARY KEY,
    "tradeId" TEXT NOT NULL REFERENCES public."Trade"(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    label TEXT,
    role TEXT NOT NULL DEFAULT 'outcome',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TradeImage_tradeId_idx" ON public."TradeImage"("tradeId");

-- 9.1. TradeConfluence Join Table
CREATE TABLE IF NOT EXISTS public."TradeConfluence" (
    id TEXT PRIMARY KEY,
    "tradeId" TEXT NOT NULL REFERENCES public."Trade"(id) ON DELETE CASCADE,
    "confluenceId" TEXT NOT NULL REFERENCES public."Confluence"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeConfluence_tradeId_confluenceId_key" UNIQUE ("tradeId", "confluenceId")
);

CREATE INDEX IF NOT EXISTS "TradeConfluence_tradeId_idx" ON public."TradeConfluence"("tradeId");
CREATE INDEX IF NOT EXISTS "TradeConfluence_confluenceId_idx" ON public."TradeConfluence"("confluenceId");

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Trade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_TradeSetupTags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Rule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TradeRuleCheck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TradeImage" ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "Users can view and edit their own profile"
ON public."User"
FOR ALL
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Session Policies
CREATE POLICY "Users can view and manage their own sessions"
ON public."Session"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- Trade Policies
CREATE POLICY "Users can view and manage trades in their own sessions"
ON public."Trade"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Session" s
        WHERE s.id = "Trade"."sessionId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Session" s
        WHERE s.id = "Trade"."sessionId" AND s."userId" = auth.uid()::text
    )
);

-- Rule Policies
CREATE POLICY "Users can view and manage rules in their own sessions"
ON public."Rule"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Session" s
        WHERE s.id = "Rule"."sessionId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Session" s
        WHERE s.id = "Rule"."sessionId" AND s."userId" = auth.uid()::text
    )
);

-- TradeRuleCheck Policies
CREATE POLICY "Users can view and manage rule checks in their own trades"
ON public."TradeRuleCheck"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "TradeRuleCheck"."tradeId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "TradeRuleCheck"."tradeId" AND s."userId" = auth.uid()::text
    )
);

-- TradeImage Policies
CREATE POLICY "Users can view and manage images in their own trades"
ON public."TradeImage"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "TradeImage"."tradeId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "TradeImage"."tradeId" AND s."userId" = auth.uid()::text
    )
);

-- Tag Policies
CREATE POLICY "Authenticated users can read tags"
ON public."Tag"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create tags"
ON public."Tag"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- _TradeSetupTags Policies
CREATE POLICY "Users can manage setup tag associations for their own trades"
ON public."_TradeSetupTags"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "_TradeSetupTags"."B" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "_TradeSetupTags"."B" AND s."userId" = auth.uid()::text
    )
);

-- TradeConfluence Policies
CREATE POLICY "Users can view and manage confluence associations for their own trades"
ON public."TradeConfluence"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "TradeConfluence"."tradeId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Trade" t
        JOIN public."Session" s ON s.id = t."sessionId"
        WHERE t.id = "TradeConfluence"."tradeId" AND s."userId" = auth.uid()::text
    )
);

-- =========================================================================
-- PLAYBOOK SYSTEM (STRATEGIES, CHECKLISTS, RULES, CONFLUENCES)
-- =========================================================================

-- 10. Strategy Table
CREATE TABLE IF NOT EXISTS public."Strategy" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Strategy_userId_idx" ON public."Strategy"("userId");

-- 11. StrategyChecklistItem Table (Setup Checklist)
CREATE TABLE IF NOT EXISTS public."StrategyChecklistItem" (
    id TEXT PRIMARY KEY,
    "strategyId" TEXT NOT NULL REFERENCES public."Strategy"(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StrategyChecklistItem_strategyId_idx" ON public."StrategyChecklistItem"("strategyId");

-- 12. StrategyRule Table (Rules not to break)
CREATE TABLE IF NOT EXISTS public."StrategyRule" (
    id TEXT PRIMARY KEY,
    "strategyId" TEXT NOT NULL REFERENCES public."Strategy"(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StrategyRule_strategyId_idx" ON public."StrategyRule"("strategyId");

-- 13. Confluence Table (User-scoped reusable confluence tags)
CREATE TABLE IF NOT EXISTS public."Confluence" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Confluence_userId_name_key" UNIQUE ("userId", name)
);

CREATE INDEX IF NOT EXISTS "Confluence_userId_idx" ON public."Confluence"("userId");

-- 14. StrategyConfluence Table (Join table between Strategy and Confluence)
CREATE TABLE IF NOT EXISTS public."StrategyConfluence" (
    id TEXT PRIMARY KEY,
    "strategyId" TEXT NOT NULL REFERENCES public."Strategy"(id) ON DELETE CASCADE,
    "confluenceId" TEXT NOT NULL REFERENCES public."Confluence"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrategyConfluence_strategyId_confluenceId_key" UNIQUE ("strategyId", "confluenceId")
);

CREATE INDEX IF NOT EXISTS "StrategyConfluence_strategyId_idx" ON public."StrategyConfluence"("strategyId");
CREATE INDEX IF NOT EXISTS "StrategyConfluence_confluenceId_idx" ON public."StrategyConfluence"("confluenceId");

-- Strategy Policies
CREATE POLICY "Users can view and manage their own strategies"
ON public."Strategy"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- StrategyChecklistItem Policies
CREATE POLICY "Users can view and manage checklist items for their own strategies"
ON public."StrategyChecklistItem"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Strategy" s
        WHERE s.id = "StrategyChecklistItem"."strategyId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Strategy" s
        WHERE s.id = "StrategyChecklistItem"."strategyId" AND s."userId" = auth.uid()::text
    )
);

-- StrategyRule Policies
CREATE POLICY "Users can view and manage rules for their own strategies"
ON public."StrategyRule"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Strategy" s
        WHERE s.id = "StrategyRule"."strategyId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Strategy" s
        WHERE s.id = "StrategyRule"."strategyId" AND s."userId" = auth.uid()::text
    )
);

-- Confluence Policies
CREATE POLICY "Users can view and manage their own confluences"
ON public."Confluence"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- StrategyConfluence Policies
CREATE POLICY "Users can view and manage confluence associations for their own strategies"
ON public."StrategyConfluence"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Strategy" s
        WHERE s.id = "StrategyConfluence"."strategyId" AND s."userId" = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Strategy" s
        WHERE s.id = "StrategyConfluence"."strategyId" AND s."userId" = auth.uid()::text
    )
);

