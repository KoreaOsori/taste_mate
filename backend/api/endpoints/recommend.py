from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from datetime import datetime

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

# Default Location: Seoul, Gangnam (latitude, longitude)
DEFAULT_LAT = 37.4979
DEFAULT_LNG = 127.0276
DEFAULT_LOCATION_NAME = "서울시 강남구"
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

# Category fallback images for high-quality visuals when specific images fail
CATEGORY_FALLBACK_IMAGES = {
    "한식": "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=800",
    "중식": "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=800",
    "일식": "https://images.unsplash.com/photo-1583182332473-b31ba08929c8?q=80&w=800",
    "양식": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=800",
    "샐러드": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800",
    "패스트푸드": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800",
    "카페": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800",
    "디저트": "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800",
    "건강식": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800",
    "default": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800"
}

async def search_naver_image(query: str, fallback_category: str = "default") -> str:
    """
    Search Naver Image API with multi-step logic and high-quality fallback.
    """
    client_id = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")
    
    if not client_id or not client_secret:
        return CATEGORY_FALLBACK_IMAGES.get(fallback_category, CATEGORY_FALLBACK_IMAGES["default"])

    async def fetch(q):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    "https://openapi.naver.com/v1/search/image.json",
                    params={"query": q, "display": 1, "sort": "sim", "filter": "medium"},
                    headers={"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret},
                )
                if response.status_code == 200:
                    items = response.json().get("items", [])
                    if items:
                        return items[0].get("link")
        except Exception as e:
            print(f"[DEBUG] Naver Image fetch error for '{q}': {e}")
        return None

    # Step 1: Specific search (Restaurant + Menu)
    img = await fetch(query)
    if img: return img
    
    # Step 2: Slightly broader search (Restaurant + "대표메뉴")
    restaurant_name = query.split(' ')[0]
    img = await fetch(f"{restaurant_name} 대표메뉴")
    if img: return img

    # Step 3: Best fallback from curated list
    return CATEGORY_FALLBACK_IMAGES.get(fallback_category, CATEGORY_FALLBACK_IMAGES["default"])

async def search_naver_local(query: str) -> List[dict]:
    """Search Naver Local API for restaurants. Returns empty list on error."""
    client_id = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://openapi.naver.com/v1/search/local.json",
                params={"query": query, "display": 15, "sort": "comment"},
                headers={
                    "X-Naver-Client-Id": client_id,
                    "X-Naver-Client-Secret": client_secret,
                },
            )
            if response.status_code == 200:
                return response.json().get("items", [])
    except Exception as e:
        print(f"Naver Local API error: {e}")
    return []

async def get_address_from_coords(lat: float, lng: float) -> str:
    """Convert coordinates to a human-readable address using Kakao Local API."""
    # Try REST_API_KEY first, fallback to NATIVE_APP_KEY if user only provided that
    kakao_key = os.environ.get("KAKAO_REST_API_KEY") or os.environ.get("KAKAO_NATIVE_APP_KEY", "")
    if not kakao_key:
        print("Warning: Kakao API Key missing in environment.")
        return DEFAULT_LOCATION_NAME
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://dapi.kakao.com/v2/local/geo/coord2address.json",
                params={"x": lng, "y": lat},
                headers={"Authorization": f"KakaoAK {kakao_key}"}
            )
            if response.status_code == 200:
                data = response.json()
                documents = data.get("documents", [])
                if documents:
                    # Prefer road address if available
                    addr_info = documents[0]
                    if addr_info.get("road_address"):
                        # Extract region 2 (Gu) and region 3 (Dong)
                        region = addr_info["road_address"]
                        return f"{region.get('region_1depth_name', '')} {region.get('region_2depth_name', '')} {region.get('region_3depth_name', '')}".strip()
                    elif addr_info.get("address"):
                        region = addr_info["address"]
                        return f"{region.get('region_1depth_name', '')} {region.get('region_2depth_name', '')} {region.get('region_3depth_name', '')}".strip()
            else:
                print(f"Kakao API Error: Status {response.status_code}, Response: {response.text}")
    except Exception as e:
        print(f"Kakao Reverse Geocoding error: {e}")
    
    return DEFAULT_LOCATION_NAME

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

def get_foods_v2_candidates() -> List[dict]:
    """Fetch all active food candidates from foods_v2."""
    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        response = supabase.table("foods_v2").select("*").eq("is_active", True).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching foods_v2: {e}")
        return []

@router.get("/food-search")
async def food_search(q: Optional[str] = None):
    """
    음식 이름으로 foods_v2 검색. 식사 추가 시 비슷한 음식 추천용.
    q가 비어 있거나 1자 미만이면 빈 배열 반환.
    """
    if not q or len(q.strip()) < 1:
        return []
    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        # ilike: Supabase는 * 를 와일드카드로 사용
        term = q.strip().replace("*", "")
        pattern = f"*{term}*"
        response = (
            supabase.table("foods_v2")
            .select("name, calories, protein, carbs, fat")
            .eq("is_active", True)
            .ilike("name", pattern)
            .limit(10)
            .execute()
        )
        return response.data or []
    except Exception as e:
        print(f"Error in food_search: {e}")
        return []

async def generate_personalized_query_and_reasons(
    user_id: str,
    profile: Optional[dict],
    meals: List[dict],
    weather: str,
    hour: int,
    top_candidates: List[dict],
    user_qna: dict
) -> dict:
    """
    Uses LLM (gpt-4o-mini) to generate a search query and personalized advice based on top ranked foods.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        return {"query": top_candidates[0]['name'] if top_candidates else "맛집", "advice": "오늘의 추천 맛집입니다.", "candidates": top_candidates}

    try:
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        
        name = profile.get("name", "사용자") if profile else "사용자"
        goal = profile.get("goal", "balanced") if profile else "balanced"
        recent_meals_sum = sum(m.get("calories", 0) for m in meals)
        target_cal = profile.get("target_calories", 2000) if profile else 2000
        remaining_cal = max(0, target_cal - recent_meals_sum)
        
        # Determine if it's a dessert flow
        is_dessert_flow = user_qna.get('preference') in ['커피, 음료, 차', '빵, 케이크, 과자']
        
        if is_dessert_flow:
            dessert_type = user_qna.get('preference')
            prompt = (
                f"사용자 이름: {name}\n"
                f"현재 날씨: {weather}, 현재 시간: {hour}시\n"
                f"선택한 디저트 유형: {dessert_type}\n\n"
                "목표: 사용자가 선택한 디저트 유형에 맞는 최적의 네이버 맛집 검색어(query)와 60자 이내의 다정한 조언(advice)을 작성해주세요.\n"
                "규칙:\n"
                "1. 날씨나 시간에 어울리는 멘트를 포함하세요 (예: 비 오는 날엔 따뜻한 차 한잔).\n"
                "2. '커피, 음료, 차'를 선택했다면 음료와 분위기가 좋은 카페 위주로 검색어를 구성하세요.\n"
                "3. '빵, 케이크, 과자'를 선택했다면 디저트와 베이커리가 유명한 카페 위주로 검색어를 구성하세요.\n"
                "형식: JSON 응답. {\"query\": \"검색어\", \"advice\": \"...\"}"
            )
        else:
            candidates_info = "\n".join([f"- {c['name']} (칼로리: {c['calories']}kcal, 단백질: {c['protein']}g, 특징: {c.get('taste', '')} {c.get('meal_heaviness', '')})" for c in top_candidates])
            prompt = (
                f"사용자 이름: {name}\n"
                f"다이어트 목표: {goal}\n"
                f"오늘 남은 칼로리: {remaining_cal}kcal\n"
                f"현재 날씨: {weather}, 현재 시간: {hour}시\n"
                f"사용자 기분: {user_qna.get('emotion', '응답없음')}, 동행: {user_qna.get('companion', '응답없음')}, 취향: {user_qna.get('preference', '응답없음')}, 예산: {user_qna.get('budget', '응답없음')}\n\n"
                f"추천 리스트:\n{candidates_info}\n\n"
                "목표: 사용자의 상황에 가장 잘 맞는 1~3개의 메뉴를 선정하고, 네이버 맛집 검색어(query)와 60자 이내의 설득력 있는 정량적 조언(advice)을 작성하세요.\n"
                "규칙:\n"
                "1. 현재 날씨와 기분을 조언에 녹여내세요.\n"
                "2. 남은 칼로리와 단백질 함량을 구체적으로 언급하며 추천 이유를 설명하세요.\n"
                "형식: JSON 응답. {\"query\": \"선택된메뉴이름 주변맛집\", \"advice\": \"...\", \"selected_food_names\": [\"메뉴1\", \"메뉴2\"]}"
            )

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(completion.choices[0].message.content)
        
        if is_dessert_flow:
            result['candidates'] = []
            return result

        selected_names = result.get("selected_food_names", [])
        selected_candidates = [c for c in top_candidates if c['name'] in selected_names]
        
        if not selected_candidates:
            selected_candidates = top_candidates[:3]
            
        result['candidates'] = selected_candidates
        return result
        
    except Exception as e:
        print(f"LLM generation error: {e}")
        return {"query": top_candidates[0]['name'] if top_candidates else "맛집", "advice": "사용자 맞춤형 추천입니다.", "candidates": top_candidates[:3]}

@router.get("/address", response_model=dict)
async def get_current_address(lat: float, lng: float):
    """Returns a string address for the given coordinates."""
    address = await get_address_from_coords(lat, lng)
    return {"address": address}

@router.get("/{user_id}", response_model=List[RestaurantRecommendation])
async def get_recommendations(
    user_id: str, 
    lat: Optional[float] = None, 
    lng: Optional[float] = None,
    weather: Optional[str] = "맑음",
    hour: Optional[int] = None,
    emotion: Optional[str] = None,
    companion: Optional[str] = None,
    preference: Optional[str] = None,
    budget: Optional[str] = None
):
    profile = get_user_profile_from_supabase(user_id)
    
    today = datetime.now().strftime("%Y-%m-%d")
    from api.endpoints.meals import get_meals
    try:
        recent_meals = await get_meals(user_id=user_id, date=today)
        meals_data = [m.dict() for m in recent_meals]
    except:
        meals_data = []

    current_hour = hour if hour is not None else datetime.now().hour
    
    # 0. Check if it's a dessert flow
    is_dessert_flow = preference in ['커피, 음료, 차', '빵, 케이크, 과자']
    
    # 1. Evaluate User Features for Ranker
    target_cal = profile.get("target_calories", 2000) if profile else 2000
    consumed_cal = sum(m.get("calories", 0) for m in meals_data)
    
    user_features = {
        'target_calories': target_cal,
        'consumed_calories': consumed_cal,
        'hour': current_hour,
        'weather': weather,
        'emotion': emotion,
        'companion': companion,
        'preference': preference,
        'budget': budget
    }
    
    # 2. Fetch all candidates & Rank
    all_candidates = get_foods_v2_candidates()
    if all_candidates:
        from models.ranker import RecommendationRanker
        ranker = RecommendationRanker()
        ranked_candidates = ranker.score_candidates(all_candidates, user_features)
        top_candidates = ranked_candidates[:10]
    else:
        top_candidates = []

    # 3. LLM Logic
    user_qna = {'emotion': emotion, 'companion': companion, 'preference': preference, 'budget': budget}
    llm_result = await generate_personalized_query_and_reasons(
        user_id, profile, meals_data, weather, current_hour, top_candidates, user_qna
    )
    
    query_text = llm_result.get("query", "맛집")
    personal_advice = llm_result.get("advice", "오늘의 건강한 선택을 도와드릴게요.")
    selected_foods = llm_result.get("candidates", [])

    # 4. Precise Location Search
    actual_lat = lat if lat is not None else DEFAULT_LAT
    actual_lng = lng if lng is not None else DEFAULT_LNG
    admin_address = await get_address_from_coords(actual_lat, actual_lng)
    location_keyword = admin_address.split(' ')[-1] if ' ' in admin_address else admin_address

    # Determine menus to search for
    # If dessert flow, search for the dessert category.
    # Otherwise, search for each of the selected foods from LLM.
    display_foods = selected_foods if selected_foods else (
        [{"name": query_text, "category": "디저트", "calories": 250, "protein": 3, "carbs": 35, "fat": 12}] 
        if is_dessert_flow else []
    )

    if not display_foods:
        # Fallback to default if everything fails
        return [RestaurantRecommendation(**r) for r in DEFAULT_RECOMMENDATIONS]

    import asyncio
    results = []
    history_to_insert = []
    
    async def find_restaurant_for_food(food, idx):
        # Search for "[Dong] [Food Name] 맛집"
        # Example: "역삼동 제육볶음 맛집"
        search_query = f"{location_keyword} {food['name']} 맛집"
        print(f"[DEBUG] Searching for specific food: {search_query}")
        
        items = await search_naver_local(search_query)
        if not items:
            # Fallback to a broader search if no specific results
            items = await search_naver_local(f"{location_keyword} {food.get('category', '맛집')}")
        
        if not items:
            return None
        
        # Pick the top result for this specific food
        item = items[0]
        name = item.get("title", "").replace("<b>", "").replace("</b>", "")
        address = item.get("roadAddress") or item.get("address", "")
        naver_link = item.get("link", "https://map.naver.com")
        cat = food.get("category", "맛집")
        
        # Image search: "[Restaurant Name] [Recommended Food]"
        img_query = f"{name} {food['name']}"
        image_url = await search_naver_image(img_query, fallback_category=cat)
        
        base = DEFAULT_RECOMMENDATIONS[idx % len(DEFAULT_RECOMMENDATIONS)]
        
        return RestaurantRecommendation(
            id=f"rec_{idx}_{food['name']}",
            name=name,
            category=cat,
            distance=base.get("distance", 0.5),
            rating=float(item.get("rating") or (base.get("rating", 4.5) * 10)) / 10 if item.get("rating") else base.get("rating", 4.5),
            reviewCount=base.get("reviewCount", 100),
            signature=food['name'],
            signatureCalories=int(food.get("calories", 500)),
            price=f"{int(food.get('price_per_serving', 12000))}원" if food.get('price_per_serving') else base.get("price", "12,000원"),
            deliveryTime=base.get("deliveryTime", "20-30분"),
            naverLink=naver_link,
            imageUrl=image_url,
            reason=personal_advice,
            protein=float(food.get("protein", 20)),
            carbs=float(food.get("carbs", 50)),
            fat=float(food.get("fat", 15)),
            address=address,
        )

    # Process each recommended food in parallel to find matching restaurants
    tasks = [find_restaurant_for_food(food, i) for i, food in enumerate(display_foods[:5])]
    gathered_results = await asyncio.gather(*tasks)
    results = [r for r in gathered_results if r is not None]

    if not results:
        return [RestaurantRecommendation(**r) for r in DEFAULT_RECOMMENDATIONS]

    for rec in results:
        history_to_insert.append({
            "user_id": user_id,
            "restaurant_name": rec.name,
            "category": rec.category,
            "signature_menu": rec.signature,
            "calories": float(rec.signatureCalories),
            "reason": rec.reason,
        })

    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        supabase.table("recommendation_history").insert(history_to_insert).execute()
    except Exception as e:
        print(f"Failed to log recommendations: {e}")

    return results

    return [RestaurantRecommendation(**r) for r in DEFAULT_RECOMMENDATIONS]

class InterestRequest(BaseModel):
    user_id: str
    restaurant_name: str
    action: str # 'like' or 'dislike'

@router.post("/interest")
async def record_interest(data: InterestRequest):
    """실시간 추천 결과에 대한 사용자 관심도(좋아요/싫어요) 기록"""
    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        # history 테이블에 기록 (가장 최근 해당 식당 기록 업데이트 시도)
        # 만약 기록이 없다면 새로 삽입
        is_selected = True if data.action == 'like' else False
        
        # 1. 기존 이력이 있는지 확인
        response = supabase.table("recommendation_history").select("id").eq("user_id", data.user_id).eq("restaurant_name", data.restaurant_name).order("timestamp", desc=True).limit(1).execute()
        
        if response.data:
            record_id = response.data[0]['id']
            supabase.table("recommendation_history").update({"selected": is_selected}).eq("id", record_id).execute()
        else:
            supabase.table("recommendation_history").insert({
                "user_id": data.user_id,
                "restaurant_name": data.restaurant_name,
                "selected": is_selected,
                "reason": f"User performed {data.action} via swipe."
            }).execute()
            
        return {"status": "success", "action": data.action}
    except Exception as e:
        print(f"Error recording interest: {e}")
        return {"status": "error", "message": str(e)}
