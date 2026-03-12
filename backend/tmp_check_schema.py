from db.supabase_client import get_supabase_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = get_supabase_client()

def check_profiles_schema():
    print("Checking profiles table schema...")
    try:
        # Fetch one record to see columns
        response = supabase.table("profiles").select("*").limit(1).execute()
        if response.data:
            print("Columns in profiles table:", response.data[0].keys())
        else:
            print("Profiles table is empty. Attempting to get table description if possible...")
            # Some postgrest setups allow fetching metadata, but let's try a safer way
            # by looking at an empty result and seeing if it honors the query
            test_response = supabase.table("profiles").select("location,location_consent").limit(1).execute()
            print("Successfully queried location and location_consent columns.")
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_profiles_schema()
