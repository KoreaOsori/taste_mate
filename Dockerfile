# TasteMate Root Dockerfile (Railway 특화)
# 이 파일은 프로젝트 루트(/)에서 백엔드를 빌드하기 위한 설정입니다.

FROM python:3.11-slim

WORKDIR /app

# 시스템 종속성 및 Playwright 브라우저 실행을 위한 라이브러리 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Playwright 설치 및 브라우저 바이너리(Chromium) 미리 다운로드
RUN pip install --no-cache-dir playwright && playwright install chromium

# 의존성 파일 복사 및 설치 (백엔드 폴더 기준)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스 코드 전체 복사
COPY backend/ .

# 8000 포트 노출
EXPOSE 8000

# 앱 실행 (entrypoint.py가 backend 폴더 안에 있으므로 루트로 복사됨)
CMD ["python3", "entrypoint.py"]
