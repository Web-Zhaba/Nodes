import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg

# Add nodes-backend directory to path just in case
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from the .env file in the backend root directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set or empty in .env")

sql = """
-- Create api_keys table if not exists
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default Key',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;

-- Create RLS Policy
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Drop policy for service role if exists
DROP POLICY IF EXISTS "Service role can do everything on API keys" ON public.api_keys;

-- Create service role policy
CREATE POLICY "Service role can do everything on API keys" ON public.api_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
"""

def main():
    print("Connecting to Supabase PostgreSQL on VPS...")
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                print("Executing SQL to create api_keys table and configure RLS...")
                cur.execute(sql)
                conn.commit()
                print("SUCCESS: api_keys table created and policies applied successfully!")
    except Exception as e:
        print("ERROR: Failed to run SQL script:", e)
        sys.exit(1)

if __name__ == "__main__":
    main()
