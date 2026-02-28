import json
import os
import sys
from pathlib import Path

# Add backend to path to import supabase_client
sys.path.append(str(Path(__file__).parent.parent))

from db.supabase_client import get_supabase_client

def import_food_metadata():
    jsonl_path = Path(__file__).parent.parent.parent / "food_metadata.jsonl"
    if not jsonl_path.exists():
        print(f"Error: {jsonl_path} not found.")
        return

    supabase = get_supabase_client()
    
    records = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                
                # Explicit mapping to match updated 'foods' table
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
                records.append(record)

    if not records:
        print("No records found in JSONL file.")
        return

    print(f"Found {len(records)} records. Importing to Supabase 'foods' table...")

    # DEBUG: Single record test with full error capture
    try:
        test_rec = records[0]
        print(f"DEBUG: Testing with record: {test_rec['name']}")
        res = supabase.table("foods").upsert(test_rec, on_conflict="name").execute()
        print("DEBUG: Single record upsert successful!")
    except Exception as e:
        print("\n!!! DEBUG ERROR !!!")
        print(f"Exception Type: {type(e)}")
        print(f"Exception Args: {e.args}")
        # Try to extract Postgrest specific error info if available
        if hasattr(e, 'json'):
            try: print(f"JSON Output: {e.json()}")
            except: pass
        
        # Print the record we tried to send
        print(f"Payload sent: {json.dumps(test_rec, indent=2, ensure_ascii=False)}")
        return

    # If debug passed, proceed in chunks
    chunk_size = 50
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            supabase.table("foods").upsert(chunk, on_conflict="name").execute()
            print(f"Imported chunk {i//chunk_size + 1}")
        except Exception as e:
            print(f"Failed at chunk {i//chunk_size + 1}: {e}")
            return

    print("Import completed successfully!")

if __name__ == "__main__":
    import_food_metadata()
