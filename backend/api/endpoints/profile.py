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
    """
    try:
        profile_dict = profile.dict(exclude_none=True)
        profile_dict["user_id"] = str(user_id)

        print(f"[DEBUG] Updating profile for {user_id}: {profile_dict}")

        # Use upsert to handle both create and update
        response = supabase.table("profiles").upsert(profile_dict).execute()

        if not response.data:
            print(f"[ERROR] No data returned from Supabase: {response}")
            raise HTTPException(status_code=400, detail="Failed to update profile - no data returned")

        return response.data[0]
    except Exception as e:
        print(f"[EXCEPTION] Error during profile update: {str(e)}")
        error_msg = str(e)
        if "column" in error_msg.lower() and "does not exist" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Database schema mismatch: {error_msg}. Please run columns update SQL."
            )
        if "connection" in error_msg.lower() or "network" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable. Check backend connection to Supabase.",
            )
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {error_msg}")
