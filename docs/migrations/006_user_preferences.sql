-- Migration 006: User Preferences
-- Adds show_recommendations toggle to profile

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_recommendations boolean DEFAULT true;
