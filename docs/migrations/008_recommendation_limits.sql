-- Migration 008: Recommendation Limits
-- Adds a table to track generation requests for daily limits

-- ------------------------------------------------------------
-- GENERATION_LOGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generation_logs (
    id          uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL,
    action_type text NOT NULL DEFAULT 'recommendation_generation',
    created_at  timestamp with time zone DEFAULT now(),
    CONSTRAINT generation_logs_pkey PRIMARY KEY (id),
    CONSTRAINT generation_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Index for fast daily counts
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_date ON public.generation_logs(user_id, created_at);

-- Enable RLS
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own logs" 
    ON public.generation_logs FOR SELECT 
    USING (auth.uid() = user_id);

-- Add to profiles if needed (optional, but good for tracking)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_generations integer DEFAULT 0;
