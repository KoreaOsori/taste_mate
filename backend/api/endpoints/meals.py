from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, UUID4

router = APIRouter()

class MealRecord(BaseModel):
    id: Optional[UUID4] = None
    user_id: UUID4
    type: str # breakfast, lunch, dinner, snack
    food_name: str
    calories: float
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    restaurant_link: Optional[str] = None
    timestamp: datetime = datetime.now()

from db.supabase_client import get_supabase_client
import uuid

supabase = get_supabase_client()

# 프론트 게스트와 동일. meals.user_id → profiles.user_id FK 만족을 위해 프로필 한 번 생성
GUEST_USER_UUID = "00000000-0000-4000-8000-000000000001"


def _ensure_guest_profile():
    """게스트용 user_id가 profiles에 없으면 최소 행 삽입 (FK 만족)."""
    try:
        supabase.table("profiles").upsert({
            "user_id": GUEST_USER_UUID,
            "name": "게스트",
            "target_calories": 2000,
            "current_calories": 0,
        }, on_conflict="user_id").execute()
    except Exception as e:
        print(f"[meals] ensure_guest_profile: {e}")

@router.get("/", response_model=List[MealRecord])
async def get_meals(
    user_id: UUID4,
    date: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    """
    Fetch meals for a user.
    - date (YYYY-MM-DD): single day.
    - year + month: entire month (UTC). Ignores date if both provided.
    """
    query = supabase.table("meals").select("*").eq("user_id", str(user_id))

    if year is not None and month is not None:
        from calendar import monthrange
        _, last = monthrange(year, month)
        start = f"{year}-{month:02d}-01T00:00:00Z"
        end = f"{year}-{month:02d}-{last}T23:59:59Z"
        query = query.gte("timestamp", start).lte("timestamp", end)
    elif date:
        query = query.gte("timestamp", f"{date}T00:00:00Z").lte("timestamp", f"{date}T23:59:59Z")

    response = query.execute()
    return response.data

@router.post("/", response_model=MealRecord)
async def create_meal(meal: MealRecord):
    """
    Log a new meal record to Supabase.
    """
    meal_dict = meal.dict(exclude_none=True)
    # Ensure ID and timestamps are handled
    if not meal_dict.get("id"):
        meal_dict["id"] = str(uuid.uuid4())
    
    meal_dict["user_id"] = str(meal_dict["user_id"])
    if meal_dict.get("timestamp"):
        meal_dict["timestamp"] = meal_dict["timestamp"].isoformat()

    if meal_dict["user_id"] == GUEST_USER_UUID:
        _ensure_guest_profile()

    response = supabase.table("meals").insert(meal_dict).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to log meal record")
        
    return response.data[0]


@router.delete("/{meal_id}")
async def delete_meal(meal_id: str, user_id: UUID4 = Query(...)):
    """
    Delete a meal by id. user_id is required to ensure the meal belongs to the user.
    """
    user_id_str = str(user_id)
    if user_id_str == "guest":
        user_id_str = GUEST_USER_UUID
    response = (
        supabase.table("meals")
        .delete()
        .eq("id", meal_id)
        .eq("user_id", user_id_str)
        .execute()
    )
    return {"success": True}
