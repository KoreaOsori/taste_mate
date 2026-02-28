from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from datetime import datetime
import json
import asyncio

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

async def get_address_from_coords(lat: float, lng: float) -> str:
    """Convert coordinates to a human-readable address using Kakao Local API."""
    # Try REST_API_KEY first, fallback to NATIVE_APP_KEY if user only provided that
    kakao_key = os.environ.get("KAKAO_REST_API_KEY") or os.environ.get("KAKAO_NATIVE_APP_KEY", "")
    if not kakao_key:
        print("Warning: Kakao API Key missing in environment.")
        return DEFAULT_LOCATION_NAME
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
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

@router.get("/address", response_model=dict)
async def get_current_address(lat: float, lng: float):
    """Returns a string address for the given coordinates."""
    address = await get_address_from_coords(lat, lng)
    return {"address": address}

async def get_recommendations_from_metadata(weather: str, hour: int, profile: Optional[dict]) -> List[dict]:
    """Fetch relevant food items from Supabase 'foods' table based on context."""
    from db.supabase_client import get_supabase_client
    supabase = get_supabase_client()
    import random
    
    # Simple heuristic-based filtering from metadata
    query = supabase.table("foods").select("*")
    
    # Filter by weather if applicable
    if weather == "비":
        query = query.contains("pref_weather", ["RAINY"])
    elif weather in ["추움", "흐림"]:
        query = query.contains("pref_weather", ["COLD"])
    
    # Fetch a larger pool and shuffle for variety
    response = query.limit(100).execute()
    foods = response.data if response.data else []
    if foods:
        random.shuffle(foods)
    return foods

@router.get("/{user_id}", response_model=List[RestaurantRecommendation])
async def get_recommendations(
    user_id: str, 
    lat: Optional[float] = None, 
    lng: Optional[float] = None,
    weather: Optional[str] = "맑음",
    hour: Optional[int] = None
):
    print(f"DEBUG: Recommendation request for {user_id} (Weather: {weather})")
    profile = get_user_profile_from_supabase(user_id)
    current_hour = hour if hour is not None else datetime.now().hour
    
    # 1. Fetch relevant food types from our metadata (shuffled pool)
    candidate_foods = await get_recommendations_from_metadata(weather, current_hour, profile)
    food_names = [f["name"] for f in candidate_foods][:30] # Provide more variety to LLM
    
    # 2. Get recent meals AND recent recommendations
    from api.endpoints.meals import get_meals
    from db.supabase_client import get_supabase_client
    supabase = get_supabase_client()
    
    recent_history_names = []
    try:
        # Fetch last 15 recommendations to avoid duplicates
        history_resp = supabase.table("recommendation_history") \
            .select("signature_menu") \
            .eq("user_id", str(user_id)) \
            .order("created_at", desc=True) \
            .limit(15) \
            .execute()
        if history_resp.data:
            recent_history_names = [h["signature_menu"] for h in history_resp.data]
            
        today = datetime.now().strftime("%Y-%m-%d")
        recent_meals = await get_meals(user_id=user_id, date=today)
        meals_data = [m.dict() if hasattr(m, 'dict') else m for m in recent_meals]
    except Exception as e:
        print(f"DEBUG: Context fetch error: {e}")
        meals_data = []

    # 3. Use LLM to pick 5 distinct food categories and queries
    openai_key = os.environ.get("OPENAI_API_KEY")
    llm_recommendations = []
    
    if openai_key and food_names:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            prompt = (
                f"사용자 프로필: {profile}\n"
                f"현재 날씨: {weather}, 시간: {current_hour}시\n"
                f"최근 실제로 먹은 음식: {[m.get('food_name') for m in meals_data]}\n"
                f"방금 추천받았던 음식들(절대 중복 금지): {recent_history_names}\n"
                f"추천 후보 리스트: {food_names}\n\n"
                "### 미션: '떡순튀/김밥/분식' 중독에서 벗어나기 ###\n"
                "위 후보 중 현재 상황에 적합하면서 **서로 다른 카테고리(한식, 중식, 일식, 양식, 샐러드 등)의 음식 5개**를 골라줘.\n"
                "**주의사항**:\n"
                f"1. '방금 추천받았던 음식들' 리스트에 있는 메뉴는 다시는 추천하지 마.\n"
                "2. 5개의 메뉴는 카테고리가 최대한 겹치지 않아야 해. (예: 분식은 1개까지만 허용)\n"
                "3. 사용자가 질리지 않게 새로운 느낌의 조언과 검색어를 생성해.\n"
                "4. 반드시 유효한 **json** 형식으로 응답해.\n"
                "형식: {\"recommendations\": [{\"selected_food\": \"...\", \"query\": \"...\", \"advice\": \"...\"}, ...]}"
            )
            completion = client.chat.completions.create(
                model="o3-mini",
                reasoning_effort="low",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            import json
            llm_result = json.loads(completion.choices[0].message.content)
            llm_recommendations = llm_result.get("recommendations", [])[:5]
            print(f"DEBUG: LLM chose {len(llm_recommendations)} foods: {[r.get('selected_food') for r in llm_recommendations]}")
        except Exception as e:
            print(f"LLM Error: {e}")

    # 4. Search Naver for each or use fallbacks
    actual_lat = lat if lat is not None else DEFAULT_LAT
    actual_lng = lng if lng is not None else DEFAULT_LNG
    addr = await get_address_from_coords(actual_lat, actual_lng)
    
    results = []
    history_to_save = []

    # If LLM failed or provided too few, fill with candidates
    while len(llm_recommendations) < 5 and food_names:
        idx = len(llm_recommendations)
        food_to_add = food_names[idx % len(food_names)]
        if any(r["selected_food"] == food_to_add for r in llm_recommendations):
            # Try to find a new one
            for f in food_names:
                if not any(r["selected_food"] == f for r in llm_recommendations):
                    food_to_add = f
                    break
        llm_recommendations.append({
            "selected_food": food_to_add,
            "query": food_to_add,
            "advice": "오늘의 추천 메뉴입니다!"
        })

    print(f"DEBUG: Processing {len(llm_recommendations)} recommendations in parallel...")
    
    async def get_single_recommendation(rec_data, index):
        try:
            selected_food_name = rec_data.get("selected_food")
            query_text = rec_data.get("query", selected_food_name or "맛집")
            personal_advice = rec_data.get("advice", "맛있게 드세요!")
            
            # Search Naver for this specific item
            try:
                naver_items = await search_naver_local(f"{addr} {query_text}")
            except Exception as e:
                print(f"DEBUG: Naver search error for {query_text}: {e}")
                naver_items = []
                
            item = naver_items[0] if naver_items else None
            
            # Fallback to default mock data if no search result
            base = DEFAULT_RECOMMENDATIONS[index % len(DEFAULT_RECOMMENDATIONS)]
            
            # Get metadata for the selected food
            selected_food_meta = next((f for f in candidate_foods if f["name"] == selected_food_name), None)
            
            is_naver = item is not None
            name = item["title"].replace("<b>", "").replace("</b>", "") if is_naver else (base["name"] if "제육" in base["name"] else "우리동네 공인 맛집")
            address = (item.get("roadAddress") or item.get("address")) if is_naver else base["address"]
            
            # Defensive category check
            if is_naver:
                raw_cat = item.get("category", "")
                cat = raw_cat.split(">")[-1].strip() if raw_cat else "식당"
            else:
                cat = selected_food_meta.get("category") if selected_food_meta else base["category"]

            macros = selected_food_meta.get("macros_per_100g") if selected_food_meta and isinstance(selected_food_meta.get("macros_per_100g"), dict) else {}
            
            def safe_num(val, default, type_func=float):
                try:
                    if val is None or val == "": return type_func(default)
                    return type_func(val)
                except:
                    return type_func(default)

            cal = safe_num(selected_food_meta.get("kcal_100g") if selected_food_meta else None, base["signatureCalories"], int)

            rec = RestaurantRecommendation(
                id=str(index + 1),
                name=name,
                category=cat,
                distance=safe_num(item.get("distance") if is_naver else None, base["distance"]),
                rating=safe_num(item.get("rating") if is_naver else None, 4.5) / 10 if is_naver and item.get("rating") else 4.5,
                reviewCount=safe_num(item.get("reviewCount") if is_naver else None, base["reviewCount"], int),
                signature=selected_food_name or base["signature"],
                signatureCalories=cal,
                price=item.get("price") if is_naver and item.get("price") else base["price"],
                deliveryTime=item.get("deliveryTime") if is_naver and item.get("deliveryTime") else base["deliveryTime"],
                naverLink=item.get("link") if is_naver and item.get("link") else "https://map.naver.com",
                imageUrl=base["imageUrl"],
                reason=personal_advice,
                protein=safe_num(selected_food_meta.get("protein") if selected_food_meta else macros.get("protein"), base["protein"]),
                carbs=safe_num(selected_food_meta.get("carbs") if selected_food_meta else macros.get("carbs"), base["carbs"]),
                fat=safe_num(selected_food_meta.get("fat") if selected_food_meta else macros.get("fat"), base["fat"]),
                address=address,
            )
            return rec, selected_food_meta
        except Exception as e:
            print(f"DEBUG: Error in get_single_recommendation task {index}: {e}")
            import traceback
            traceback.print_exc()
            # Return a completely safe fallback
            base = DEFAULT_RECOMMENDATIONS[index % len(DEFAULT_RECOMMENDATIONS)]
            fallback_rec = RestaurantRecommendation(**base)
            fallback_rec.id = str(index + 1)
            return fallback_rec, None

    # Execute searches in parallel
    tasks = [get_single_recommendation(rec, i) for i, rec in enumerate(llm_recommendations)]
    recs_with_meta = await asyncio.gather(*tasks)
    
    for rec, meta in recs_with_meta:
        if rec:
            results.append(rec)
            history_to_save.append({
                "user_id": user_id,
                "food_id": meta.get("id") if meta else None,
                "restaurant_name": rec.name,
                "category": rec.category,
                "signature_menu": rec.signature,
                "calories": float(rec.signatureCalories),
                "reason": rec.reason
            })

    # Save to history
    if history_to_save:
        try:
            from db.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            supabase.table("recommendation_history").insert(history_to_save).execute()
        except Exception as e:
            print(f"DEBUG: History save error: {e}")

    print(f"DEBUG: Returning {len(results)} recommendations")
    return results
