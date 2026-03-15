from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class UserProfile(BaseModel):
    user_id: UUID4
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    target_weight: Optional[float] = None
    target_calories: Optional[int] = None
    current_calories: int = 0
    breakfast_time: Optional[str] = None
    lunch_time: Optional[str] = None
    dinner_time: Optional[str] = None
    breakfast_active: bool = True
    lunch_active: bool = True
    dinner_active: bool = True
    breakfast_notify: bool = True
    lunch_notify: bool = True
    dinner_notify: bool = True
    activity_level: Optional[str] = None
    goal: Optional[str] = None
    preferred_categories: List[str] = []
    disliked_foods: List[str] = []
    restricted_foods: List[str] = []
    location: Optional[str] = None
    location_consent: bool = False

from db.supabase_client import get_supabase_client
supabase = get_supabase_client()

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(user_id: UUID4):
    """
    Fetch user profile from Supabase.
    """
    user_id_str = str(user_id)
    print(f"[DEBUG] Fetching profile for user_id: {user_id_str}")
    try:
        response = supabase.table("profiles").select("*").eq("user_id", user_id_str).execute()
    except Exception as e:
        print(f"[DEBUG] Supabase/network error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Check backend connection to Supabase.",
        )
    if not response.data or len(response.data) == 0:
        print(f"[DEBUG] Profile not found for user_id: {user_id_str}")
        raise HTTPException(status_code=404, detail="Profile not found")
    print(f"[DEBUG] Profile found: {response.data[0]['name']}")
    return response.data[0]

@router.put("/{user_id}", response_model=UserProfile)
async def update_profile(user_id: UUID4, profile: UserProfile):
    """
    Update or insert user profile in Supabase.
    Includes a fallback mechanism for missing columns (Schema Mismatch).
    """
    user_id_str = str(user_id)
    try:
        profile_dict = profile.dict(exclude_none=True)
        profile_dict["user_id"] = user_id_str

        print(f"[DEBUG] Updating profile for {user_id_str}: {profile_dict.keys()}")

        # 1. First attempt: Update with all fields
        try:
            response = supabase.table("profiles").upsert(profile_dict).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            error_msg = str(e)
            # PGRST204: Column not found in schema cache
            if "PGRST204" in error_msg or "column" in error_msg.lower():
                print(f"[WARNING] Schema mismatch detected. Retrying with 'safe' columns. Error: {error_msg}")
                
                # 2. Fallback attempt: Remove problematic new columns if DB isn't updated
                safe_columns = [
                    'user_id', 'name', 'age', 'gender', 'height', 'weight', 
                    'target_weight', 'target_calories', 'current_calories',
                    'breakfast_time', 'lunch_time', 'dinner_time',
                    'activity_level', 'goal', 'preferred_categories', 
                    'disliked_foods', 'restricted_foods', 'location', 'location_consent'
                ]
                # Keep only columns that exist in the original basic schema
                safe_dict = {k: v for k, v in profile_dict.items() if k in safe_columns}
                
                print(f"[DEBUG] Retrying upsert with safe columns: {safe_dict.keys()}")
                response = supabase.table("profiles").upsert(safe_dict).execute()
                if response.data:
                    # Return the saved data merged with the incoming full profile (UI reflects intent)
                    return {**profile_dict, **response.data[0]}
            
            # If it wasn't a column error or fallback also failed, re-raise
            raise e

        raise HTTPException(status_code=400, detail="Failed to update profile - no data returned")

    except Exception as e:
        print(f"[EXCEPTION] Error during profile update: {str(e)}")
        error_msg = str(e)
        if "connection" in error_msg.lower() or "network" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable. Check backend connection to Supabase.",
            )
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {error_msg}")
