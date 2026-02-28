import json
import httpx
import asyncio

async def test_api():
    user_id = "cfc57904-0732-408c-885a-be0b9622f525"
    url = f"http://localhost:8000/api/v1/recommend/{user_id}?weather=맑음&hour=16"
    print(f"Testing URL: {url}")
    try:
        async with httpx.AsyncClient() as client:
            # High timeout to avoid the ReadTimeout issue
            response = await client.get(url, timeout=20.0) 
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Received {len(data)} items.")
                # Just print the first one's keys and image URL to be sure
                if data:
                    print("Sample item keys:", list(data[0].keys()))
                    print("Sample imageUrl:", data[0].get("imageUrl"))
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
