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

from db.supabase_client import get_supabase_client
supabase = get_supabase_client()

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(user_id: UUID4):
    """
    Fetch user profile from Supabase.
    """
    response = supabase.table("profiles").select("*").eq("user_id", str(user_id)).execute()
    
    if not response.data:
        # Return a default empty profile instead of 404 for demo purposes, 
        # but in production we might want to handle this differently.
        return UserProfile(user_id=user_id, name="User", target_calories=2000)
    
    return response.data[0]

@router.put("/{user_id}", response_model=UserProfile)
async def update_profile(user_id: UUID4, profile: UserProfile):
    """
    Update or insert user profile in Supabase.
    """
    profile_dict = profile.dict(exclude_none=True)
    profile_dict["user_id"] = str(user_id)
    
    # Use upsert to handle both create and update
    response = supabase.table("profiles").upsert(profile_dict).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update profile")
        
    return response.data[0]
