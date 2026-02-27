from fastapi import APIRouter
from api.endpoints import recommend, profile, meals, chat, auth

api_router = APIRouter()

api_router.include_router(recommend.router, prefix="/recommend", tags=["Recommendation"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(meals.router, prefix="/meals", tags=["Meals"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

@api_router.get("/")
async def root():
    return {"message": "Tastemate API v1"}
