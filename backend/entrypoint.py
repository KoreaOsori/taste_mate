#!/usr/bin/env python3
"""Container entrypoint: set DNS for Supabase then run uvicorn. No shell = no CRLF issues."""
import os
import sys

def main():
    # Railway 등 클라우드 환경에서는 /etc/resolv.conf 수정 권한이 없을 수 있으므로 예외 처리 강화
    try:
        if os.path.exists("/etc/resolv.conf"):
            with open("/etc/resolv.conf", "a") as f:
                # 수정 대신 추가 시도, 실패해도 무시
                pass
    except Exception as e:
        print(f"[entrypoint] Note: skipping resolv.conf modification: {e}")
    
    # 텔레메트리 비활성화 등 추가 설정 가능
    os.execvp("uvicorn", ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])

if __name__ == "__main__":
    main()
