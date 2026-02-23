from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.router import api_router
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Tastemate Advanced Backend", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running with RAG support"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
