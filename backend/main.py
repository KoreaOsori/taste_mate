from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.router import api_router
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Tastemate Advanced Backend", version="1.0.0")

# CORS: 반드시 allow_origins를 먼저 등록 (미들웨어 순서)
# 환경 변수에서 프론트엔드 URL을 가져옴 (배포 시 Vercel 주소 등록용)
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """모든 미처리 예외에 대해 JSON 응답 반환 (CORS 헤더가 붙도록)."""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) or "Internal server error"},
    )

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running with RAG support"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
