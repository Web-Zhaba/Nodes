-- SQL Function to fetch active sessions for the current user
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_active_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  ip inet,
  user_agent text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to access auth schema
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, 
    s.created_at, 
    s.updated_at, 
    s.ip, 
    s.user_agent
  FROM auth.sessions s
  WHERE s.user_id = auth.uid();
END;
$$;

-- Give access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_active_sessions() TO authenticated;
