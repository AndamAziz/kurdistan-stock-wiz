-- Enable RLS on telegram_subscribers (accessed only via service role in edge functions)
ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;

-- No policies needed - this table is accessed only by edge functions with service role key
-- Service role bypasses RLS automatically