from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Tuple
import os
import httpx
import math
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
    place_lat: Optional[float] = None  # 길찾기용 식당 위도
    place_lng: Optional[float] = None  # 길찾기용 식당 경도

# Default Location: Seoul, Gangnam (latitude, longitude)
# 주의: use_location=false 이면 이 좌표로 검색하지 않음. "비슷한 맛집"만 메뉴명으로 검색.
DEFAULT_LAT = 37.4979
DEFAULT_LNG = 127.0276
DEFAULT_LOCATION_NAME = "서울시 강남구"
ADDRESS_WHEN_NO_LOCATION = "위치를 허용하면 주변 맛집을 보여드려요"
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

async def search_naver_image(query: str, fallback_category: str = "default", menu_name: Optional[str] = None) -> str:
    """
    Search Naver Image API. menu_name이 있으면 메뉴와 이미지 매칭을 위해 메뉴명 위주로 먼저 검색.
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

    # Step 1: 메뉴명 위주 검색 — 추천 메뉴(쏨땀, 제육볶음 등)와 이미지가 맞도록
    if menu_name and menu_name.strip():
        img = await fetch(f"{menu_name.strip()} 음식")
        if img: return img
        img = await fetch(menu_name.strip())
        if img: return img
    # Step 2: 식당명 + 메뉴명
    img = await fetch(query)
    if img: return img
    # Step 3: 식당명 + 대표메뉴
    restaurant_name = query.split(' ')[0]
    img = await fetch(f"{restaurant_name} 대표메뉴")
    if img: return img
    # Step 4: 카테고리 폴백
    return CATEGORY_FALLBACK_IMAGES.get(fallback_category, CATEGORY_FALLBACK_IMAGES["default"])

async def get_google_place_photo(place_name: str, address: str) -> Optional[str]:
    """
    Google Places API(Find Place + Place Details + Photo)로 실제 식당 이미지 URL 반환.
    키 없거나 검색 실패 시 None. API 키는 HTTP referrer 제한 권장.
    """
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
    if not api_key or not place_name or not address:
        return None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # 1) Find Place from text → place_id
            query = f"{place_name} {address}".strip()
            find_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
            find_res = await client.get(
                find_url,
                params={
                    "input": query[:200],
                    "inputtype": "textquery",
                    "fields": "place_id",
                    "key": api_key,
                },
            )
            if find_res.status_code != 200:
                return None
            data = find_res.json()
            candidates = data.get("candidates") or []
            if not candidates:
                return None
            place_id = candidates[0].get("place_id")
            if not place_id:
                return None
            # 2) Place Details → photos[0].photo_reference
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            details_res = await client.get(
                details_url,
                params={"place_id": place_id, "fields": "photos", "key": api_key},
            )
            if details_res.status_code != 200:
                return None
            details = details_res.json()
            result = details.get("result") or {}
            photos = result.get("photos") or []
            if not photos:
                return None
            ref = photos[0].get("photo_reference")
            if not ref:
                return None
            # 3) Place Photo URL (302 리다이렉트로 실제 이미지)
            return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={ref}&key={api_key}"
    except Exception as e:
        print(f"[DEBUG] Google Place photo error: {e}")
    return None

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

async def get_coords_from_address(address: str) -> Optional[Tuple[float, float]]:
    """주소 → (위도, 경도) 변환. Kakao Local API 사용."""
    if not address or not address.strip():
        return None
    kakao_key = os.environ.get("KAKAO_REST_API_KEY") or os.environ.get("KAKAO_NATIVE_APP_KEY", "")
    if not kakao_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://dapi.kakao.com/v2/local/search/address.json",
                params={"query": address.strip()},
                headers={"Authorization": f"KakaoAK {kakao_key}"},
            )
            if response.status_code == 200:
                data = response.json()
                docs = data.get("documents", [])
                if docs:
                    x = docs[0].get("x")  # 경도
                    y = docs[0].get("y")  # 위도
                    if x and y:
                        return (float(y), float(x))
    except Exception as e:
        print(f"[DEBUG] get_coords_from_address error: {e}")
    return None

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 위경도 사이 거리(km)."""
    R = 6371  # Earth radius km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

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

# 커피·디저트 추천 시 사용할 side 음식 food_group (meal_role=side 인 항목)
SIDE_FOOD_GROUP_BEVERAGE = "음료 및 차류"   # 커피, 음료, 차
SIDE_FOOD_GROUP_BAKERY = "빵 및 과자류"     # 빵, 케이크, 과자

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

def _filter_side_candidates(candidates: List[dict], preference: Optional[str]) -> List[dict]:
    """커피·디저트 플로우: meal_role=side 이고, 선택에 맞는 food_group만."""
    side = [c for c in candidates if (c.get("meal_role") or "").strip() == "side"]
    if preference == "커피, 음료, 차":
        return [c for c in side if (c.get("food_group") or "").strip() == SIDE_FOOD_GROUP_BEVERAGE]
    if preference == "빵, 케이크, 과자":
        return [c for c in side if (c.get("food_group") or "").strip() == SIDE_FOOD_GROUP_BAKERY]
    # 둘 다 허용
    allowed = {SIDE_FOOD_GROUP_BEVERAGE, SIDE_FOOD_GROUP_BAKERY}
    return [c for c in side if (c.get("food_group") or "").strip() in allowed]

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
            allowed_cats = user_qna.get('categories') or []
            candidates_info = "\n".join([f"- {c['name']} (종류: {c.get('category', '')}, 칼로리: {c['calories']}kcal, 단백질: {c['protein']}g, 특징: {c.get('taste', '')} {c.get('meal_heaviness', '')})" for c in top_candidates])
            category_rule = ""
            if allowed_cats:
                cat_list = ", ".join(allowed_cats)
                category_rule = f"0. [필수] 사용자가 선택한 음식 종류는 '{cat_list}' 입니다. selected_food_names에는 반드시 이 종류(category)에 해당하는 메뉴만 포함하세요. 선택하지 않은 종류(예: 일식을 고르지 않았으면 일식 메뉴 제외)는 절대 포함하지 마세요.\n"
            prompt = (
                f"사용자 이름: {name}\n"
                f"다이어트 목표: {goal}\n"
                f"오늘 남은 칼로리: {remaining_cal}kcal\n"
                f"현재 날씨: {weather}, 현재 시간: {hour}시\n"
                f"사용자 기분: {user_qna.get('emotion', '응답없음')}, 동행: {user_qna.get('companion', '응답없음')}, 취향(맛): {user_qna.get('preference', '응답없음')}, 예산: {user_qna.get('budget', '응답없음')}\n\n"
                f"추천 후보 리스트 (이 중에서만 선정):\n{candidates_info}\n\n"
                "목표: 사용자의 상황(기분, 동행, 예산, 날씨)에 가장 잘 맞는 5개의 메뉴를 선정하고, \n"
                "네이버 맛집 검색어(query)와 전체를 아우르는 짧은 한줄 설명(advice),\n"
                "그리고 각 메뉴별로 25~40자 정도의 감성적인 한줄 추천 문구(reasons)를 작성하세요. 반드시 5개를 선정하세요.\n"
                "규칙:\n"
                + category_rule +
                "1. 현재 날씨와 기분, 동행 정보를 조합해 '오늘 같은 날엔 ~', '혼자 먹기 딱 좋은' 같은 감성적인 표현을 사용하세요.\n"
                "2. 칼로리/단백질 수치는 가볍게 한두 번만 언급하고, '얼큰하게', '담백하게', '기름지게', '기분 전환'처럼 사용자의 입맛과 감정을 자극하는 설명을 중심으로 쓰세요.\n"
                "3. 각 메뉴별 추천 문구는 메뉴의 맛(매콤, 담백, 든든함 등)과 상황(점심/저녁, 혼밥/모임)을 자연스럽게 녹여주세요.\n"
                "형식: JSON 응답. {\"query\": \"선택된메뉴이름 주변맛집\", \"advice\": \"...\", \"selected_food_names\": [\"메뉴1\", \"메뉴2\", \"메뉴3\", \"메뉴4\", \"메뉴5\"], \"reasons\": {\"메뉴1\": \"한줄설명\", ...}}"
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
        # LLM이 고른 순서 유지: selected_names 순으로 top_candidates에서 매칭 (최대 5개)
        name_to_candidate = {c["name"]: c for c in top_candidates}
        selected_candidates = []
        for name in selected_names[:5]:
            if name in name_to_candidate and name_to_candidate[name] not in selected_candidates:
                selected_candidates.append(name_to_candidate[name])
        
        if not selected_candidates:
            selected_candidates = top_candidates[:5]
        
        # reasons: 메뉴별 감성 한줄 설명 (없으면 호출부에서 fallback 생성)
        reasons = result.get("reasons") or {}
        if not isinstance(reasons, dict):
            reasons = {}
        result['reasons'] = reasons

        result['candidates'] = selected_candidates[:5]
        return result
        
    except Exception as e:
        print(f"LLM generation error: {e}")
        return {"query": top_candidates[0]['name'] if top_candidates else "맛집", "advice": "사용자 맞춤형 추천입니다.", "candidates": top_candidates[:5]}

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
    use_location: Optional[bool] = None,
    weather: Optional[str] = "맑음",
    hour: Optional[int] = None,
    emotion: Optional[str] = None,
    companion: Optional[str] = None,
    preference: Optional[str] = None,
    budget: Optional[str] = None,
    categories: Optional[str] = None,
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
    
    # 사용자가 선택한 음식 종류(중식, 패스트푸드, 아시안 등) — 이 종류만 추천되도록
    allowed_categories: List[str] = []
    if categories and categories.strip():
        allowed_categories = [c.strip() for c in categories.split(",") if c.strip()]
    
    # 0. Check if it's a dessert flow
    is_dessert_flow = preference in ['커피, 음료, 차', '빵, 케이크, 과자']
    
    # 1. Evaluate User Features for Ranker
    target_cal = profile.get("target_calories", 2000) if profile else 2000
    consumed_cal = sum(m.get("calories", 0) for m in meals_data)
    
    # 랭커에는 감정(emotion)을 넣지 않고, 순수하게 시간/날씨/칼로리/카테고리/예산 기반으로만 점수화.
    # 감정은 아래 LLM 프롬프트와 추천 사유(reason)에만 반영한다.
    user_features = {
        'target_calories': target_cal,
        'consumed_calories': consumed_cal,
        'hour': current_hour,
        'weather': weather,
        'companion': companion,
        'preference': preference,
        'budget': budget,
        'categories': allowed_categories,
    }
    
    # 2. Fetch candidates & Rank (커피·디저트면 meal_role=side, food_group=음료 및 차류/빵 및 과자류만)
    all_candidates = get_foods_v2_candidates()
    print(f"[DEBUG][recommend] foods_v2 all_candidates: {len(all_candidates)}")
    if is_dessert_flow:
        all_candidates = _filter_side_candidates(all_candidates, preference)
    if all_candidates:
        from models.ranker import RecommendationRanker
        ranker = RecommendationRanker()
        ranked_candidates = ranker.score_candidates(all_candidates, user_features)
        print(f"[DEBUG][recommend] ranked_candidates: {len(ranked_candidates)}")
        # 사용자가 음식 종류를 선택했으면, 선정 후보는 선택한 종류만 넘김 (일식 등 비선택 종류 제외)
        if allowed_categories:
            filtered = [c for c in ranked_candidates if (c.get('category') or '').strip() in allowed_categories]
            print(f"[DEBUG][recommend] allowed_categories={allowed_categories}, filtered={len(filtered)}")
            top_candidates = (filtered[:10] if filtered else ranked_candidates[:10])
        else:
            top_candidates = ranked_candidates[:10]
    else:
        top_candidates = []
    print(f"[DEBUG][recommend] top_candidates: {len(top_candidates)}")

    # 3. LLM Logic (선택한 음식 종류만 선정하도록 user_qna에 전달)
    user_qna = {'emotion': emotion, 'companion': companion, 'preference': preference, 'budget': budget, 'categories': allowed_categories}
    llm_result = await generate_personalized_query_and_reasons(
        user_id, profile, meals_data, weather, current_hour, top_candidates, user_qna
    )
    
    query_text = llm_result.get("query", "맛집")
    personal_advice = llm_result.get("advice", "오늘 기분에 딱 맞는 한 끼를 골라봤어요.")
    llm_reasons = llm_result.get("reasons") or {}
    if not isinstance(llm_reasons, dict):
        llm_reasons = {}
    # 커피·디저트 플로우는 LLM이 candidates를 안 넘기므로, 랭킹된 side 후보를 그대로 사용
    selected_foods = llm_result.get("candidates", []) if not is_dessert_flow else top_candidates[:5]
    print(f"[DEBUG][recommend] llm_result keys={list(llm_result.keys())}, candidates_len={len(llm_result.get('candidates', []) if isinstance(llm_result, dict) else [])}")
    print(f"[DEBUG][recommend] selected_foods: {len(selected_foods)}, is_dessert_flow={is_dessert_flow}")

    # 4. Location-aware vs. "similar only" search
    # use_location=false: 위치 없음 → 지역 키워드 없이 메뉴명만 검색 (비슷한 맛집). 강남 기본값 사용 안 함.
    # use_location=true 또는 생략 + 좌표 있음: 행정동 + 메뉴명으로 주변 맛집 검색.
    use_location_search = use_location if use_location is not None else (lat is not None and lng is not None)
    if use_location_search and lat is not None and lng is not None:
        admin_address = await get_address_from_coords(lat, lng)
        # 동만 쓰면 다른 시·도(예: 대전) 결과가 섞일 수 있음 → 시·구·동 전체로 검색 (예: 광주 동구 서석동)
        location_keyword = admin_address.strip() if admin_address else ""
    else:
        location_keyword = ""
        # 좌표 없을 때는 Kakao 호출하지 않음 (기본값 강남으로 주소 받지 않음)

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

    # 메뉴별 맞춤 추천 사유: LLM이 준 reasons를 우선 사용하고, 없으면 기분/동행/메뉴명을 섞어 감성적인 문구를 생성
    reasons_by_food_name: dict[str, str] = {}
    for food in display_foods:
        fname = (food.get("name") or "").strip()
        if not fname:
            continue
        if fname in llm_reasons:
            reasons_by_food_name[fname] = str(llm_reasons[fname])[:60]
        else:
            mood = emotion or user_qna.get("emotion") or ""
            comp = companion or user_qna.get("companion") or ""
            base = personal_advice or "지금 컨디션에 잘 맞는 한 끼예요."
            extra = ""
            if mood:
                extra = f" 오늘처럼 {mood} 날엔 '{fname}'가 딱 어울려요."
            elif comp:
                extra = f" {comp} 함께 먹기 좋은 메뉴예요."
            reasons_by_food_name[fname] = (base + extra)[:60]
    # 위치 검색 시: 다른 시·도/다른 광주(경기도 광주시 vs 광주광역시) 결과 제외용
    # 예: "광주광역시 서구 치평동" -> "광주광역시 서구" 로 필터 (시/도 + 구 단위)
    def _region_filter_word(addr: str) -> str:
        if not addr or not addr.strip():
            return ""
        parts = addr.split()
        if len(parts) >= 2:
            # "광주광역시 서구" / "서울특별시 강남구" / "경기도 성남시" 등
            return f"{parts[0].strip()} {parts[1].strip()}".strip()
        return parts[0].strip()

    region_filter = _region_filter_word(location_keyword) if location_keyword else ""

    # 패스트푸드/커피 브랜드: 메뉴 검색 시 이 상호가 1등으로 나오면 스킵하고 다음 결과 사용
    _SKIP_BRANDS = ("버거킹", "맥도날드", "롯데리아", "KFC", "킹스맥", "스타벅스", "이디야", "투썸", "빽다방", "메가커피", "컴포즈", "세븐일레븐", "GS25", "CU", "이마트", "홈플러스")

    def _title_matches_food(item: dict, food_name: str, category: str) -> bool:
        """식당 제목/카테고리/설명에 메뉴명 또는 관련 키워드가 있으면 True."""
        title = (item.get("title") or "").replace("<b>", "").replace("</b>", "").lower()
        desc = (item.get("description") or "").lower()
        nav_cat = (item.get("category") or "").lower()
        name_lower = (food_name or "").strip().lower()
        cat_lower = (category or "").strip().lower()
        if name_lower and (name_lower in title or name_lower in desc or name_lower in nav_cat):
            return True
        if cat_lower and cat_lower in title:
            return True
        # 메뉴명과 식당명에 공통 어근이 있으면 매칭 (예: 마라탕 ↔ 마라키친)
        if name_lower and len(name_lower) >= 2:
            for i in range(len(name_lower) - 1):
                for j in range(i + 2, len(name_lower) + 1):
                    sub = name_lower[i:j]
                    if len(sub) >= 2 and sub in title:
                        return True
        return False

    def _is_skip_brand(title: str) -> bool:
        return any(b in title for b in _SKIP_BRANDS)

    async def find_restaurant_for_food(food, idx):
        # use_location: "[시·구·동] [메뉴명] 맛집" (주변). no location: "[메뉴명] 맛집" (비슷한 맛집만)
        if location_keyword:
            search_query = f"{location_keyword} {food['name']} 맛집"
            fallback_query = f"{location_keyword} {food.get('category', '맛집')}"
        else:
            search_query = f"{food['name']} 맛집"
            fallback_query = f"{food.get('category', '맛집')} 맛집"
        print(f"[DEBUG] Searching for specific food: {search_query}")
        
        items = await search_naver_local(search_query)
        used_fallback = False
        if not items:
            items = await search_naver_local(fallback_query)
            used_fallback = True
        
        if not items:
            return None
        
        # 같은 시·도만 허용 (광주 사용자에게 대전 등 다른 지역 상호 제외)
        if region_filter:
            combined = lambda i: (i.get("address") or "") + " " + (i.get("roadAddress") or "")
            items = [i for i in items if region_filter in combined(i)]
        if not items:
            return None
        
        # 메뉴와 어울리지 않는 상호(패스트푸드/커피 브랜드) 스킵: 해당 메뉴 검색인데 1등이 브랜드면 다음 결과 사용
        if not used_fallback:
            while items and _is_skip_brand((items[0].get("title") or "").replace("<b>", "").replace("</b>", "")):
                items = items[1:]
        if not items:
            return None
        
        food_name = food.get("name") or ""
        food_cat = food.get("category") or "맛집"
        # 메뉴명 검색이든 fallback이든: 식당 제목/카테고리/설명에 메뉴(또는 카테고리)가 들어간 결과를 우선 사용
        matched = [i for i in items if _title_matches_food(i, food_name, food_cat)]
        if matched:
            items = matched
            signature_display = food_name
        else:
            # 매칭되는 식당이 없어도 5개 유지를 위해 첫 결과 사용. 단, 해당 메뉴를 판다고 주장하지 않고 "{카테고리} 추천"으로 표시
            signature_display = f"{food_cat} 추천"
        item = items[0]
        name = item.get("title", "").replace("<b>", "").replace("</b>", "")
        # 네이버 결과에 주소가 있으면 항상 표시(위치 미허용이어도 식당 위치는 보여줌). 없을 때만 안내 문구
        raw_address = (item.get("roadAddress") or item.get("address") or "").strip()
        address = raw_address if raw_address else ADDRESS_WHEN_NO_LOCATION
        naver_link = item.get("link", "https://map.naver.com")
        cat = food.get("category", "맛집")
        
        # 거리 + 길찾기용 좌표: 사용자 좌표와 식당 주소로 실제 거리 계산
        distance_km = 0.5
        place_lat_opt: Optional[float] = None
        place_lng_opt: Optional[float] = None
        if use_location_search and lat is not None and lng is not None and address and address != ADDRESS_WHEN_NO_LOCATION:
            place_coords = await get_coords_from_address(address)
            if place_coords:
                place_lat_val, place_lon_val = place_coords
                distance_km = _haversine_km(lat, lng, place_lat_val, place_lon_val)
                place_lat_opt, place_lng_opt = place_lat_val, place_lon_val
        base = DEFAULT_RECOMMENDATIONS[idx % len(DEFAULT_RECOMMENDATIONS)]
        if distance_km <= 0:
            distance_km = base.get("distance", 0.5)
        
        # 평점: 네이버 지역검색 API는 평점 미제공 → 식당명 기준으로 4.0~4.9 다양하게 표시
        rating = 4.0 + (hash(name) % 10) / 10.0 if name else 4.5
        rating = round(rating, 1)
        
        # 이미지: Google Places 실제 식당 사진 우선 → 실패 시 네이버 이미지 검색
        image_url = None
        if name and address and address != ADDRESS_WHEN_NO_LOCATION:
            image_url = await get_google_place_photo(name, address)
        if not image_url:
            img_query = f"{name} {food['name']}"
            image_url = await search_naver_image(img_query, fallback_category=cat, menu_name=food.get('name'))
        
        # 이 메뉴/식당 조합에 맞는 감성 추천 문구 선택
        reason_text = reasons_by_food_name.get(food_name, personal_advice)

        return RestaurantRecommendation(
            id=f"rec_{idx}_{food['name']}",
            name=name,
            category=cat,
            distance=distance_km,
            rating=rating,
            reviewCount=base.get("reviewCount", 100),
            signature=signature_display,
            signatureCalories=int(food.get("calories", 500)),
            price=f"{int(food.get('price_per_serving', 12000))}원" if food.get('price_per_serving') else base.get("price", "12,000원"),
            deliveryTime=base.get("deliveryTime", "20-30분"),
            naverLink=naver_link,
            imageUrl=image_url,
            reason=reason_text,
            protein=float(food.get("protein", 20)),
            carbs=float(food.get("carbs", 50)),
            fat=float(food.get("fat", 15)),
            address=address,
            place_lat=place_lat_opt,
            place_lng=place_lng_opt,
        )

    # Process each recommended food in parallel to find matching restaurants (최대 5개)
    tasks = [find_restaurant_for_food(food, i) for i, food in enumerate(display_foods[:5])]
    gathered_results = await asyncio.gather(*tasks)
    results = [r for r in gathered_results if r is not None]

    # 정렬: 위치 검색 시 거리 가까운 순, 아니면 LLM/추천 순서 유지
    if use_location_search and lat is not None and lng is not None:
        results.sort(key=lambda r: r.distance)

    # 주변 검색을 해봤는데도 결과가 0개인 경우:
    # - 예전에는 서울 강남 테헤란로에 있는 DEFAULT_RECOMMENDATIONS 를 그대로 돌려줘서
    #   광주 등 다른 지역 사용자에게도 강남 주소가 떠버리는 문제가 있었음.
    # - 이제는 위치 기반 모드(use_location_search=True)에서는 같은 기본 카드라도
    #   주소/좌표를 "현재 사용자의 행정동"으로 덮어써서 보여준다.
    if not results:
        # admin_address 는 use_location_search & lat/lng 있을 때만 정의됨 (없으면 None 처리)
        user_addr = locals().get("admin_address") or DEFAULT_LOCATION_NAME
        fallback: List[RestaurantRecommendation] = []
        for idx, base in enumerate(DEFAULT_RECOMMENDATIONS[:5]):
            payload = {**base}
            payload["id"] = payload.get("id", f"default_{idx}")
            # 위치 기반이면 주소/좌표를 사용자 근처로 맞춰 준다.
            if use_location_search and lat is not None and lng is not None:
                payload["address"] = user_addr
                payload["place_lat"] = lat
                payload["place_lng"] = lng
                payload["distance"] = payload.get("distance", 0.5)
            fallback.append(RestaurantRecommendation(**payload))
        return fallback

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
