import os
import sys
import json

# Add the current directory to path so we can import from db
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import get_supabase_client

def main():
    try:
        supabase = get_supabase_client()
        response = supabase.table("foods_v2").select("*").limit(1).execute()
        if response.data:
            with open("foods_v2_schema.json", "w", encoding="utf-8") as f:
                json.dump(response.data[0], f, ensure_ascii=False, indent=2)
            print("Saved to foods_v2_schema.json")
        else:
            print("Table foods_v2 exists but is empty, or doesn't exist.")
    except Exception as e:
        print(f"Error fetching foods_v2: {e}")

if __name__ == "__main__":
    main()
