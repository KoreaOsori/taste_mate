import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    url: str = os.environ.get("SUPABASE_URL")
    # SERVICE_ROLE_KEY 또는 ANON_KEY 둘 다 시도 (유연성 확보)
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print(f"[ERROR] Supabase configuration missing! URL: {'Found' if url else 'Missing'}, Key: {'Found' if key else 'Missing'}")
        # Railway 로그에서 확인 가능하도록 명시적 에러 발생
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) must be set in environment variables.")
        
    return create_client(url, key)
