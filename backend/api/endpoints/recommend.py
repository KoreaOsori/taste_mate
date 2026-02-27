from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx

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
    baeminLink: Optional[str] = None
    yogiyoLink: Optional[str] = None
    imageUrl: str
    reason: str
    protein: float
    carbs: float
    fat: float
    address: str

# Curated fallback recommendations (used when no user profile or API unavailable)
DEFAULT_RECOMMENDATIONS: List[dict] = [
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
        "naverLink": "https://map.naver.com/v5/search/제육볶음",
        "baeminLink": "https://www.baemin.com",
        "imageUrl": "https://images.unsplash.com/photo-1664478147610-090687799047?q=80&w=800&auto=format&fit=crop",
        "reason": "단백질 함량이 높고 매콤한 맛이 스트레스 해소에 도움이 될 거예요!",
        "protein": 35,
        "carbs": 45,
        "fat": 15,
        "address": "서울특별시 강남구 테헤란로 123",
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
        "naverLink": "https://map.naver.com/v5/search/샐러드",
        "baeminLink": "https://www.baemin.com",
        "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
        "reason": "오늘 가볍게 드시고 싶다면 신선한 채소와 단백질 조화가 최고입니다.",
        "protein": 28,
        "carbs": 20,
        "fat": 12,
        "address": "서울특별시 강남구 테헤란로 456",
    },
    {
        "id": "3",
        "name": "포케하우스",
        "category": "하와이안",
        "distance": 0.7,
        "rating": 4.9,
        "reviewCount": 2103,
        "signature": "연어 포케볼",
        "signatureCalories": 510,
        "price": "15,500원",
        "deliveryTime": "30-40분",
        "naverLink": "https://map.naver.com/v5/search/포케",
        "baeminLink": "https://www.baemin.com",
        "yogiyoLink": "https://www.yogiyo.co.kr",
        "imageUrl": "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?q=80&w=800&auto=format&fit=crop",
        "reason": "오메가-3가 풍부한 연어로 영양 균형을 맞춰보세요!",
        "protein": 42,
        "carbs": 52,
        "fat": 18,
        "address": "서울특별시 강남구 테헤란로 789",
    },
]

async def search_naver_local(query: str) -> List[dict]:
    """Search Naver Local API for restaurants. Returns empty list on error."""
    client_id = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://openapi.naver.com/v1/search/local.json",
                params={"query": query, "display": 5, "sort": "comment"},
                headers={
                    "X-Naver-Client-Id": client_id,
                    "X-Naver-Client-Secret": client_secret,
                },
            )
            if response.status_code == 200:
                return response.json().get("items", [])
    except Exception as e:
        print(f"Naver API error: {e}")
    return []

def get_user_profile_from_supabase(user_id: str) -> Optional[dict]:
    """Fetch user profile from Supabase. Returns None on any error."""
    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        response = supabase.table("profiles").select("*").eq("user_id", str(user_id)).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        print(f"Profile fetch error (non-fatal): {e}")
    return None


async def generate_personalized_query_and_reasons(
    user_id: str,
    profile: Optional[dict],
    meals: List[dict],
    weather: str,
    hour: int
) -> dict:
    """
    Uses LLM (o3-mini) to generate a search query and personalized advice.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        return {"query": "맛집", "advice": "오늘의 추천 맛집입니다."}

    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        
        # Build context
        name = profile.get("name", "사용자") if profile else "사용자"
        goal = profile.get("goal", "balanced") if profile else "balanced"
        recent_meals_sum = sum(m.get("calories", 0) for m in meals)
        target_cal = profile.get("target_calories", 2000) if profile else 2000
        remaining_cal = max(0, target_cal - recent_meals_sum)
        
        prompt = (
            f"사용자: {name}\n"
            f"목표: {goal}\n"
            f"오늘 남은 칼로리: {remaining_cal}kcal\n"
            f"현재 날씨: {weather}\n"
            f"현재 시간: {hour}시\n"
            f"최근 식사 내역: {[m.get('food_name') for m in meals]}\n\n"
            "위 정보를 바탕으로 네이버 로컬 API에 검색할 2-3단어의 최적 검색어(예: '고단백 샐러드', '따뜻한 국밥')와 "
            "사용자에게 줄 다정하고 짧은 식사 어드바이스(30자 이내)를 JSON 형식으로 생성해줘. "
            "형식: {\"query\": \"...\", \"advice\": \"...\"}"
        )

        completion = client.chat.completions.create(
            model="o3-mini",
            reasoning_effort="low", # Fast response for search
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        import json
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"LLM query generation error: {e}")
        return {"query": "맛집", "advice": "사용자 맞춤형 추천입니다."}

@router.get("/{user_id}", response_model=List[RestaurantRecommendation])
async def get_recommendations(
    user_id: str, 
    lat: Optional[float] = None, 
    lng: Optional[float] = None,
    weather: Optional[str] = "맑음",
    hour: Optional[int] = None
):
    """
    Returns restaurant recommendations based on user profile, location, weather, and time.
    Uses LLM to dynamically generate search terms.
    """
    profile = get_user_profile_from_supabase(user_id)
    
    # Fetch recent meals for today to give LLM context
    today = datetime.now().strftime("%Y-%m-%d")
    from api.endpoints.meals import get_meals
    try:
        recent_meals = await get_meals(user_id=user_id, date=today)
        meals_data = [m.dict() for m in recent_meals]
    except:
        meals_data = []

    current_hour = hour if hour is not None else datetime.now().hour
    
    # Get LLM-powered query and advice
    llm_result = await generate_personalized_query_and_reasons(
        user_id, profile, meals_data, weather, current_hour
    )
    
    query_text = llm_result.get("query", "맛집")
    personal_advice = llm_result.get("advice", "오늘의 건강한 선택을 도와드릴게요.")

    # Location Context
    location_prefix = "주변 " if lat and lng else "강남 "
    query = f"{location_prefix}{query_text}"
    
    naver_items = await search_naver_local(query)

    if naver_items:
        results = []
        history_to_insert = []
        
        for i, item in enumerate(naver_items):
            name = item.get("title", "").replace("<b>", "").replace("</b>", "")
            address = item.get("roadAddress") or item.get("address", "")
            naver_link = item.get("link", "https://map.naver.com")
            category = item.get("category", "음식점")
            base = DEFAULT_RECOMMENDATIONS[i % len(DEFAULT_RECOMMENDATIONS)]

            recommendation = RestaurantRecommendation(
                id=str(i + 1),
                name=name or base["name"],
                category=category or base["category"],
                distance=base["distance"],
                rating=float(item.get("rating", base["rating"] * 10) or base["rating"] * 10) / 10,
                reviewCount=base["reviewCount"],
                signature=base["signature"],
                signatureCalories=base["signatureCalories"],
                price=base["price"],
                deliveryTime=base["deliveryTime"],
                naverLink=naver_link,
                imageUrl=base["imageUrl"],
                reason=personal_advice, # Use LLM advice here
                protein=base["protein"],
                carbs=base["carbs"],
                fat=base["fat"],
                address=address or base["address"],
            )
            results.append(recommendation)
            
            # Prepare for DB insert
            history_to_insert.append({
                "user_id": user_id,
                "restaurant_name": recommendation.name,
                "category": recommendation.category,
                "signature_menu": recommendation.signature,
                "calories": float(recommendation.signatureCalories),
                "reason": recommendation.reason,
            })

        # Async-like save to Supabase (best effort)
        try:
            from db.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            supabase.table("recommendation_history").insert(history_to_insert).execute()
        except Exception as e:
            print(f"Failed to log recommendations: {e}")

        return results

    return [RestaurantRecommendation(**r) for r in DEFAULT_RECOMMENDATIONS]
