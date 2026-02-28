import os
import sys
from pathlib import Path

# Add backend to path to import supabase_client
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase_client import get_supabase_client

def check_history():
    supabase = get_supabase_client()
    try:
        # Get the latest recommendations
        response = supabase.table("recommendation_history").select("*").order("timestamp", desc=True).limit(5).execute()
        if response.data:
            import json
            print(json.dumps(response.data, indent=2, ensure_ascii=False))
        else:
            print("No history found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_history()
