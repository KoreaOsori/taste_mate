# Node.js 20 이미지를 베이스로 사용
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# Vite 개발 서버 포트 노출
EXPOSE 5173

# 앱 실행
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
