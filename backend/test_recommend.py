import asyncio
import httpx
import json

async def test_recommend():
    # Use a dummy user_id that might exist, or the API will use defaults
    # From foods_v2 schema fetch, we know we have connection to Supabase
    user_id = "test-user-placeholder"
    
    url = f"http://localhost:8000/api/v1/recommend/{user_id}"
    params = {
        "lat": 37.4979,
        "lng": 127.0276,
        "weather": "비",
        "hour": 19,
        "emotion": "기분 좋을 때",
        "companion": "혼자",
        "preference": "가벼운",
        "budget": "저렴"
    }
    
    print(f"Testing GET {url}")
    print(f"Params: {params}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                print("\n=== SUCCESS: Recommendations ===")
                for i, r in enumerate(data):
                    print(f"\n[{i+1}] {r['name']} ({r['category']})")
                    print(f"    대표메뉴: {r['signature']} ({r['signatureCalories']}kcal)")
                    print(f"    추천사유: {r['reason']}")
                    print(f"    단/탄/지: {r['protein']}g / {r['carbs']}g / {r['fat']}g")
                    print(f"    가격: {r['price']}")
                    print(f"    주소: {r['address']}")
            else:
                print(f"Error: HTTP {response.status_code}")
                print(response.text)
                
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_recommend())
