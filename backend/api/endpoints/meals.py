from fastapi import APIRouter, HTTPException, Depends
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

    response = supabase.table("meals").insert(meal_dict).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to log meal record")
        
    return response.data[0]
