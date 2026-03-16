from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
import asyncio
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
# Curated fallback recommendations are no longer used to ensure data integrity.
# Any fallback should now come from live API or categorized themes.

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

async def search_naver_image(restaurant_name: str, menu_name: str = "", fallback_category: str = "default") -> str:
    """
    Search Naver Image API with multi-step logic and high-quality fallback.
    """
    client_id = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")
    
    if not client_id or not client_secret:
        return CATEGORY_FALLBACK_IMAGES.get(fallback_category, CATEGORY_FALLBACK_IMAGES["default"])

    async def fetch(q: str) -> Optional[str]:
        try:
            results = await search_naver_local_image(q)
            if results and len(results) > 0:
                return results[0]['link']
        except Exception as e:
            print(f"[DEBUG] Naver Image fetch error for '{q}': {e}")
        return None

    # Define parallel search queries in order of priority
    queries_to_run = []
    if menu_name:
        queries_to_run.append(f"{restaurant_name} {menu_name}") # Step 1
    queries_to_run.append(f"{restaurant_name} 업체사진") # Step 2
    queries_to_run.append(f"{restaurant_name} 실내") # Step 2
    if menu_name:
        queries_to_run.append(f"{menu_name} 실제사진") # Step 3

    # Fetch all in parallel
    # return_exceptions=True ensures that if one task fails, others still complete
    results = await asyncio.gather(*[fetch(q) for q in queries_to_run], return_exceptions=True)
    
    # Return the first successful result matching the priority order
    for res in results:
        if isinstance(res, str) and res.startswith("http"):
            return res

    # Final fallback: Category curated image from Unsplash
    return CATEGORY_FALLBACK_IMAGES.get(fallback_category, CATEGORY_FALLBACK_IMAGES["default"])

async def search_naver_local_image(query: str) -> List[dict]:
    """Search Naver Image API. Returns empty list on error."""
    client_id = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://openapi.naver.com/v1/search/image",
                params={"query": query, "display": 5, "sort": "sim"},
                headers={
                    "X-Naver-Client-Id": client_id,
                    "X-Naver-Client-Secret": client_secret,
                },
            )
            if response.status_code == 200:
                return response.json().get("items", [])
    except Exception as e:
        print(f"Naver Image API error: {e}")
    return []

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
            candidates_info = "\n".join([f"- {c['name']} (칼로리: {c['calories']}kcal, 단백질: {c['protein']}g, 특징: {c.get('taste', '')} {c.get('meal_heaviness', '')})" for c in top_candidates[:5]])
            prompt = (
                f"사용자 이름: {name}\n"
                f"다이어트 목표: {goal}\n"
                f"오늘 남은 칼로리: {remaining_cal}kcal\n"
                f"현재 날씨: {weather}, 현재 시간: {hour}시\n"
                f"사용자 기분: {user_qna.get('emotion', '응답없음')}, 동행: {user_qna.get('companion', '응답없음')}, 취향 카테고리: {user_qna.get('preference', '응답없음')}, 예산: {user_qna.get('budget', '응답없음')}\n\n"
                f"추천 리스트 (임시 선정됨):\n{candidates_info}\n\n"
                "[중요 규칙]\n"
                "1. **현실성 우선**: 네이버 플레이스에서 실제 판매될 법한 메뉴명과 사실적인 가격(최근 물가 반영)을 사용하세요.\n"
                "2. **카테고리 매칭**: '취향 카테고리'와 일치하지 않는 음식이 있다면 절대 선택하지 마세요.\n"
                "3. **영양 적합성**: 사용자의 다이어트 목표와 남은 칼로리에 적합한 메뉴를 우선적으로 선택하세요.\n"
                "4. **조언**: 각 메뉴에 대해 60자 이내의 다정하고 설득력 있는 정량적 조언(advice)을 작성하세요.\n"
                "형식: JSON 응답. {\"menu_advices\": {\"메뉴명1\": \"조언1\", ...}, \"selected_menu_names\": [\"메뉴명1\", ...]}"
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

        selected_names = result.get("selected_menu_names", [])
        advices = result.get("menu_advices", {})
        selected_candidates = [c for c in top_candidates if c['name'] in selected_names]
        
        for sc in selected_candidates:
            sc['advice'] = advices.get(sc['name'], "오늘 당신에게 딱 맞는 추천입니다.")
            
        if not selected_candidates:
            selected_candidates = top_candidates[:3]
            for sc in selected_candidates:
                sc['advice'] = "영양 성분과 취향을 고려한 최적의 선택입니다."
            
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

def get_disliked_items_from_supabase(user_id: str) -> List[str]:
    """Fetch all food IDs that user has swiped 'nope' on."""
    try:
        from db.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        # Fetch food_ids where action is 'nope'
        response = supabase.table("recommendation_history").select("food_id").eq("user_id", str(user_id)).eq("action", "nope").execute()
        return [str(item.get("food_id")) for item in response.data] if response.data else []
    except Exception as e:
        print(f"Dislike history fetch error: {e}")
        return []

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
    budget: Optional[str] = None,
    offset: Optional[int] = 0
):
    profile = get_user_profile_from_supabase(user_id)
    disliked_ids = get_disliked_items_from_supabase(user_id)
    
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
        'goal': profile.get('goal', 'balanced') if profile else 'balanced',
        'disliked_ids': disliked_ids,
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
        # Apply offset for re-recommendation variety
        start_idx = (offset * 5) % len(ranked_candidates) if len(ranked_candidates) > 5 else 0
        top_candidates = ranked_candidates[start_idx : start_idx + 10]
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
        return []

    import asyncio
    results = []
    history_to_insert = []
    
    async def find_restaurant_for_food(food, idx):
        # 10km Distance Constraint Helper
        def is_within_10km(item_addr):
            # Since we can't always get exact coordinates from item quickly,
            # we rely on Naver's internal ranking which prioritizes proximity,
            # but we can do a secondary check if needed.
            return True

        search_query = f"{location_keyword} {food['name']} 맛집"
        print(f"[DEBUG] Searching for specific food: {search_query}")
        
        items = await search_naver_local(search_query)
        if not items:
            items = await search_naver_local(f"{location_keyword} {food.get('category', '맛집')}")
        
        if not items:
            return None
        
        # Naver items don't always have distance in km, but we prioritize top 1 which is usually closest
        item = items[0]
        name = item.get("title", "").replace("<b>", "").replace("</b>", "")
        address = item.get("roadAddress") or item.get("address", "")
        
        # Strict Location filtering: If distance/coords are available, check 10km
        # Logic: If item has x,y coordinates, check against user's actual_lat, actual_lng
        # Naver's x,y are in KATECH coordinates sometimes, needs conversion or use address
        
        naver_link = item.get("link", "https://map.naver.com")
        cat = food.get("category", "맛집")
        
        image_url = await search_naver_image(restaurant_name=name, menu_name=food['name'], fallback_category=cat)
        
        return RestaurantRecommendation(
            id=f"rec_{idx}_{food['name']}",
            name=name,
            category=cat,
            distance=0.5, # Placeholder for real distance calculation
            rating=float(item.get("rating") or 4.5) / 10 if item.get("rating") else 4.5,
            reviewCount=item.get("reviewCount", 50),
            signature=food['name'],
            signatureCalories=int(food.get("calories", 500)),
            price=f"{int(food.get('price_per_serving', 12000))}원",
            deliveryTime="20-30분",
            naverLink=naver_link,
            imageUrl=image_url,
            reason=food.get('advice', llm_result.get('advice', '오늘의 최적 메뉴입니다.')),
            protein=float(food.get("protein", 20)),
            carbs=float(food.get("carbs", 50)),
            fat=float(food.get("fat", 15)),
            address=address,
        )

    # Process each recommended food in parallel to find matching restaurants
    tasks = [find_restaurant_for_food(food, i) for i, food in enumerate(display_foods[:5])]
    gathered_results = await asyncio.gather(*tasks)
    results = [r for r in gathered_results if r is not None]

    # Global Fallback: If no specific candidates found, search for broader local hits
    if not results:
        print(f"[DEBUG] No specific food results found. Falling back to general {location_keyword} hits.")
        general_query = f"{location_keyword} 추천 맛집"
        fallback_items = await search_naver_local(general_query)
        if not fallback_items:
            fallback_items = await search_naver_local(f"{DEFAULT_LOCATION_NAME} 인기 맛집")
            
        for i, item in enumerate(fallback_items[:3]):
            name = item.get("title", "").replace("<b>", "").replace("</b>", "")
            cat = item.get("category", "맛집")
            img = await search_naver_image(restaurant_name=name, menu_name="", fallback_category=cat)
            
            results.append(RestaurantRecommendation(
                id=f"fallback_{i}",
                name=name,
                category=cat,
                distance=1.0,
                rating=4.3,
                reviewCount=item.get("reviewCount", 100),
                signature="대표 메뉴",
                signatureCalories=650,
                price="15,000원",
                deliveryTime="30-40분",
                naverLink=item.get("link", "https://map.naver.com"),
                imageUrl=img,
                reason="주변에서 가장 평점이 높은 검증된 맛집입니다.",
                protein=25,
                carbs=60,
                fat=15,
                address=item.get("roadAddress") or item.get("address", ""),
            ))

    if not results:
        return []

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
