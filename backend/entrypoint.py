#!/usr/bin/env python3
"""Container entrypoint: set DNS for Supabase then run uvicorn. No shell = no CRLF issues."""
import os
import sys

def main():
    # Railway 등 클라우드 환경에서는 /etc/resolv.conf 수정 권한이 없을 수 있으므로 예외 처리 강화
    try:
        if os.path.exists("/etc/resolv.conf"):
            # 권한 문제 등으로 실패할 수 있으므로 간단히 pass 처리하거나 수정 시도
            pass
    except Exception as e:
        print(f"[entrypoint] Note: skipping resolv.conf modification: {e}")

    # Railway 등 클라우드 환경에서 지정하는 PORT 환경 변수를 반영
    port = os.environ.get("PORT", "8000")
    
    # 텔레메트리 비활성화 등 추가 설정 가능
    os.execvp("uvicorn", ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", port])

if __name__ == "__main__":
    main()
