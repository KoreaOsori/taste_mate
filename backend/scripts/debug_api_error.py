import json
import os
import sys
from pathlib import Path

# Add backend to path to import supabase_client
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase_client import get_supabase_client
from postgrest.exceptions import APIError

def debug_import():
    supabase = get_supabase_client()
    
    # Single record to test
    record = {
        "name": "떡볶이",
        "category": "BUNSIK",
        "sub_category": "떡볶이",
        "cook_method": "boil/stew",
        "main_ingredient": ["떡", "고추장/소스"],
        "season": ["ALL"],
        "pref_gender": "여자",
        "pref_age": ["10대", "20대", "30대"],
        "pref_weather": ["COLD", "RAINY"],
        "consumption_region": ["대학가", "번화가", "전국"],
        "temperature": "HOT",
        "texture": ["CHEWY", "SAUCY"],
        "taste": {"spicy": 4, "sweet": 3, "salty": 3, "sour": 1, "bitter": 0, "umami": 2},
        "kcal_100g": None,
        "macros_per_100g": None
    }
    
    try:
        supabase.table("foods").upsert(record, on_conflict="name").execute()
        print("SUCCESS: Single record imported.")
    except APIError as e:
        print("\n--- Supabase API Error Found ---")
        print(f"Message: {e.message}")
        print(f"Details: {e.details}")
        print(f"Hint: {e.hint}")
        print(f"Code: {e.code}")
    except Exception as e:
        print(f"Unexpected Error: {e}")

if __name__ == "__main__":
    debug_import()
