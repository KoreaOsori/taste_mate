# Python 3.11 slim 버전을 베이스 이미지로 사용
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 환경 변수 설정 (패이썬 컴파일 방지 및 버퍼링 끔)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

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

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 8000 포트 노출
EXPOSE 8000

# Python entrypoint: 컨테이너 DNS를 8.8.8.8로 고정(Supabase 연결용). shell 스크립트 대신 사용해 Windows CRLF 문제 회피
ENTRYPOINT ["python3", "/app/entrypoint.py"]
