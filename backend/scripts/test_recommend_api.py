import json
import httpx
import asyncio
import traceback

async def test_api():
    user_id = "cfc57904-0732-408c-885a-be0b9622f525"
    url = f"http://localhost:8000/api/v1/recommend/{user_id}"
    print(f"Testing URL: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Found {len(data)} items.")
                print(json.dumps(data[:1], indent=2, ensure_ascii=False))
            else:
                print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Exception during request: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api())
