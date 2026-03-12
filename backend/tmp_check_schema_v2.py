from db.supabase_client import get_supabase_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = get_supabase_client()

def check_profiles_schema():
    try:
        response = supabase.table("profiles").select("*").limit(1).execute()
        if response.data:
            cols = list(response.data[0].keys())
            print(f"COLUMNS_FOUND: {','.join(cols)}")
        else:
            print("COLUMNS_FOUND: EMPTY_TABLE")
    except Exception as e:
        print(f"SCHEMA_ERROR: {e}")

if __name__ == "__main__":
    check_profiles_schema()
