# Python 3.11 slim 버전을 베이스 이미지로 사용
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 환경 변수 설정 (패이썬 컴파일 방지 및 버퍼링 끔)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 시스템 종속성 설치 (필요한 경우)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 8000 포트 노출
EXPOSE 8000

# Python entrypoint: 컨테이너 DNS를 8.8.8.8로 고정(Supabase 연결용). shell 스크립트 대신 사용해 Windows CRLF 문제 회피
ENTRYPOINT ["python3", "/app/entrypoint.py"]
