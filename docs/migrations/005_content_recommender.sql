-- Migration 005: Content Recommender
-- Adds recommendations table for personalized content suggestions

-- ------------------------------------------------------------
-- RECOMMENDATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendations (
  id             uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL,
  connector_id   uuid,  -- Опциональная связь с тегом/интересом
  content_type   text NOT NULL, -- 'video', 'book', 'course', 'article'
  title          text NOT NULL,
  description    text,
  url            text NOT NULL,
  thumbnail_url  text,
  source         text NOT NULL, -- 'YouTube', 'Google Books', etc.
  score          numeric DEFAULT 0, -- Релевантность [0..100]
  affiliate_url  text,
  is_viewed      boolean DEFAULT false,
  is_saved       boolean DEFAULT false,
  is_discarded   boolean DEFAULT false,
  created_at     timestamp with time zone DEFAULT now(),
  CONSTRAINT recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT recommendations_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own recommendations"
  ON public.recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_connector_id ON public.recommendations(connector_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_content_type ON public.recommendations(content_type);
