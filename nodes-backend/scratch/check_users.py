import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg

# Load environment variables from the .env file in the backend root directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set or empty in .env")

def main():
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Get count of auth.users
                cur.execute("SELECT count(*) FROM auth.users;")
                auth_users_count = cur.fetchone()[0]
                
                # Get count of public.profiles
                cur.execute("SELECT count(*) FROM public.profiles;")
                profiles_count = cur.fetchone()[0]
                
                print(f"Total users in auth.users: {auth_users_count}")
                print(f"Total profiles in public.profiles: {profiles_count}")
                
                # Check last 3 users
                cur.execute("SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 3;")
                last_users = cur.fetchall()
                print("\nLast 3 registered users in auth.users:")
                for u in last_users:
                    print(f"ID: {u[0]} | Email: {u[1]} | Created At: {u[2]}")
                
                # Check last 3 profiles
                cur.execute("SELECT id, email, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 3;")
                last_profiles = cur.fetchall()
                print("\nLast 3 profiles in public.profiles:")
                for p in last_profiles:
                    print(f"ID: {p[0]} | Email: {p[1]} | Created At: {p[2]}")
                    
    except Exception as e:
        print("Error connecting or executing query:", e)

if __name__ == "__main__":
    main()
