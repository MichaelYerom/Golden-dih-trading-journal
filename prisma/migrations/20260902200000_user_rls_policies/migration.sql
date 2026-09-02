-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR MULTI-USER SUPABASE AUTH
-- ==============================================================================

-- 1. USER TABLE: Users can view and manage their own profile
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON public."User";
CREATE POLICY "Users can view and edit their own profile"
ON public."User"
FOR ALL
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- 2. SESSION TABLE: Users can view and manage their own sessions
DROP POLICY IF EXISTS "Users can view and manage their own sessions" ON public."Session";
CREATE POLICY "Users can view and manage their own sessions"
ON public."Session"
FOR ALL
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- 3. TRADE TABLE: Users can view and manage trades in their own sessions
DROP POLICY IF EXISTS "Users can view and manage trades in their own sessions" ON public."Trade";
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

-- 4. RULE TABLE: Users can view and manage rules in their own sessions
DROP POLICY IF EXISTS "Users can view and manage rules in their own sessions" ON public."Rule";
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

-- 5. TRADE IMAGE TABLE: Users can view and manage images in their own trades
DROP POLICY IF EXISTS "Users can view and manage images in their own trades" ON public."TradeImage";
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

-- 6. TRADE RULE CHECK TABLE: Users can view and manage rule checks in their own trades
DROP POLICY IF EXISTS "Users can view and manage rule checks in their own trades" ON public."TradeRuleCheck";
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

-- 7. TAG TABLE: Global/shared tags accessible to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can read tags" ON public."Tag";
CREATE POLICY "Authenticated users can read tags"
ON public."Tag"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tags" ON public."Tag";
CREATE POLICY "Authenticated users can create tags"
ON public."Tag"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. _TradeSetupTags JOIN TABLE
DROP POLICY IF EXISTS "Users can manage setup tag associations for their own trades" ON public."_TradeSetupTags";
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
