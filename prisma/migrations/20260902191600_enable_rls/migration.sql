-- Enable Row Level Security (RLS) on all public tables
-- This locks out Supabase Public REST/GraphQL API access while leaving direct PostgreSQL connections unaffected.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Trade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TradeImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Rule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TradeRuleCheck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_TradeSetupTags" ENABLE ROW LEVEL SECURITY;
