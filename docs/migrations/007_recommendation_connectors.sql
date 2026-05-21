-- Migration 007: Recommendation Connectors (Many-to-Many)
-- Adds a join table to support multiple tags per recommendation

-- ------------------------------------------------------------
-- RECOMMENDATION_CONNECTORS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendation_connectors (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL,
  connector_id    uuid NOT NULL,
  created_at      timestamp with time zone DEFAULT now(),
  CONSTRAINT recommendation_connectors_pkey PRIMARY KEY (id),
  CONSTRAINT rec_conn_recommendation_fkey FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id) ON DELETE CASCADE,
  CONSTRAINT rec_conn_connector_fkey FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON DELETE CASCADE,
  CONSTRAINT unique_rec_connector UNIQUE (recommendation_id, connector_id)
);

-- Enable RLS
ALTER TABLE public.recommendation_connectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own recommendation_connectors"
  ON public.recommendation_connectors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations
      WHERE recommendations.id = recommendation_id
      AND recommendations.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rec_conn_recommendation_id ON public.recommendation_connectors(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_conn_connector_id ON public.recommendation_connectors(connector_id);
