import json
import os
import sys
from pathlib import Path

# Add backend to path to import supabase_client
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase_client import get_supabase_client

def debug_insert():
    supabase = get_supabase_client()
    
    # Take the VERY first record
    jsonl_path = Path(__file__).parent.parent.parent / "food_metadata.jsonl"
    with open(jsonl_path, "r", encoding="utf-8") as f:
        first_line = f.readline()
        data = json.loads(first_line)
    
    record = {
        "name": data.get("food"),
        "category": data.get("category"),
        "sub_category": data.get("sub_category"),
        "cook_method": data.get("cook_method"),
        "main_ingredient": data.get("main_ingredient"),
        "season": data.get("season"),
        "pref_gender": data.get("pref_gender"),
        "pref_age": data.get("pref_age"),
        "pref_weather": data.get("pref_weather"),
        "consumption_region": data.get("consumption_region"),
        "temperature": data.get("temperature"),
        "texture": data.get("texture"),
        "taste": data.get("taste"),
        "kcal_100g": data.get("kcal_100g"),
        "macros_per_100g": data.get("macros_per_100g")
    }
    
    print(f"Payload: {json.dumps(record, indent=2, ensure_ascii=False)}")
    
    try:
        response = supabase.table("foods").upsert(record, on_conflict="name").execute()
        print("Success!")
    except Exception as e:
        print("\n--- ERROR CAUGHT ---")
        print(f"Exception: {e}")
        # PostgREST errors often have these attributes
        for attr in ['message', 'details', 'hint', 'code']:
            if hasattr(e, attr):
                print(f"{attr.capitalize()}: {getattr(e, attr)}")
        
        # If it's a postgrest.exceptions.APIError, it might have a .json() or similar
        try:
            import inspect
            print(f"Methods: {dir(e)}")
        except: pass

if __name__ == "__main__":
    debug_insert()
