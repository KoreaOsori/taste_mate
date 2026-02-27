from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from db.supabase_client import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

class CheckUserRequest(BaseModel):
    email: str  # Use str instead of EmailStr to avoid dependency issues

class CheckUserResponse(BaseModel):
    exists: bool

@router.post("/check-user", response_model=CheckUserResponse)
async def check_user_exists(request: CheckUserRequest):
    """
    Check if a user with the given email exists in Supabase Auth.
    Requires Service Role Key.
    """
    try:
        print(f"[DEBUG] Checking existence of user: {request.email}")
        
        # Admin API to list users
        response = supabase.auth.admin.list_users()
        
        # Handle both list and object responses
        users = response.users if hasattr(response, 'users') else response
        
        if not isinstance(users, list):
            print(f"[WARNING] Unexpected response format from list_users: {type(users)}")
            # Fallback: if we can't verify, we say True to avoid wrong "No User" message
            return {"exists": True}

        user_exists = any(getattr(user, 'email', None) == request.email for user in users)
        print(f"[DEBUG] User exists: {user_exists}")
        
        return {"exists": user_exists}
    except Exception as e:
        print(f"[ERROR] Error checking user existence: {e}")
        # Return True as fallback to prevent incorrect "User Not Found" error
        return {"exists": True}
