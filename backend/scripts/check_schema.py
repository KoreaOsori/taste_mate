import os
import sys
from pathlib import Path

# Add backend to path to import supabase_client
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase_client import get_supabase_client

def check_foods_schema():
    supabase = get_supabase_client()
    try:
        # Just select one row to see columns
        response = supabase.table("foods").select("*").limit(1).execute()
        if hasattr(response, 'data') and len(response.data) > 0:
            print("Columns found in 'foods' table:")
            print(response.data[0].keys())
        else:
            print("Table 'foods' is empty, but we can check columns via a dummy insert or other means.")
            # Let's try to see if we can get columns some other way or just try a minimal insert
            test_rec = {"name": "TEST_COLUMNS_CHECK"}
            try:
                supabase.table("foods").insert(test_rec).execute()
                print("Minimal insert success. Columns check via select...")
                res = supabase.table("foods").select("*").eq("name", "TEST_COLUMNS_CHECK").execute()
                print(res.data[0].keys())
                # Clean up
                supabase.table("foods").delete().eq("name", "TEST_COLUMNS_CHECK").execute()
            except Exception as outer_e:
                print(f"Minimal insert failed: {outer_e}")
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_foods_schema()
