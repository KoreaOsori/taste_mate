from fastapi import APIRouter
from pydantic import BaseModel, UUID4
from typing import List

router = APIRouter()

class RestaurantRecommendation(BaseModel):
    id: str
    name: str
    category: str
    distance: float
    rating: float
    reviewCount: int
    signature: str
    signatureCalories: int
    price: str
    deliveryTime: str
    naverLink: str
    imageUrl: str
    reason: str
    protein: float
    carbs: float
    fat: float
    address: str

@router.get("/{user_id}", response_model=List[RestaurantRecommendation])
async def get_recommendations(user_id: UUID4):
    """
    Simulated AI recommendation logic. 
    In Part 3, this will query Supabase and use RAG/ML ranking.
    """
    return [
        {
            "id": "1",
            "name": "밥도둑 제육볶음",
            "category": "한식",
            "distance": 0.3,
            "rating": 4.8,
            "reviewCount": 1247,
            "signature": "매콤한 제육볶음",
            "signatureCalories": 680,
            "price": "9,500원",
            "deliveryTime": "25-35분",
            "naverLink": "https://map.naver.com",
            "imageUrl": "https://images.unsplash.com/photo-1664478147610-090687799047?q=80&w=800&auto=format&fit=crop",
            "reason": "단백질 함량이 높고 매콤한 맛이 스트레스 해소에 도움이 될 거예요!",
            "protein": 35,
            "carbs": 45,
            "fat": 15,
            "address": "서울특별시 강남구 테헤란로 123"
        },
        {
            "id": "2",
            "name": "프레시 샐러드 팩토리",
            "category": "샐러드",
            "distance": 0.5,
            "rating": 4.9,
            "reviewCount": 856,
            "signature": "닭가슴살 아보카도 샐러드",
            "signatureCalories": 420,
            "price": "12,000원",
            "deliveryTime": "20-30분",
            "naverLink": "https://map.naver.com",
            "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
            "reason": "오늘 가볍게 드시고 싶다면 신선한 채소와 단백질 조화가 최고입니다.",
            "protein": 28,
            "carbs": 20,
            "fat": 12,
            "address": "서울특별시 강남구 테헤란로 456"
        }
    ]
