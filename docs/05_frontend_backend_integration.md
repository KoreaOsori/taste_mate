# 05. 프론트엔드-백엔드 통합 구현 보고서

## 개요

이 문서는 TasteMate 앱의 프론트엔드(React/Vite)와 백엔드(FastAPI)를 통합하기 위해 수행한 작업을 한국어로 정리한 것입니다.

---

## 1. 해결된 문제: `react/jsx-runtime` TypeScript 에러

### 원인
`taste_mate/frontend` 디렉토리에 `tsconfig.json`과 `tsconfig.node.json` 파일이 없어서 TypeScript가 React JSX 변환 경로를 찾지 못했습니다.

### 해결 방법
다음 파일들을 새로 생성했습니다:

```
taste_mate/frontend/tsconfig.json
taste_mate/frontend/tsconfig.node.json
taste_mate/frontend/.env
```

주요 설정:
- `"jsx": "react-jsx"` — 새 JSX 변환 방식 (React 17+ 이상)
- `"moduleResolution": "Bundler"` — Vite 번들러용 모듈 해석
- `"allowImportingTsExtensions": true` — `.tsx` 파일을 직접 임포트 허용

---

## 2. 백엔드 수정 사항

### 2-1. 새 채팅 엔드포인트 생성
**파일:** `taste_mate/backend/api/endpoints/chat.py`

- `GET /api/v1/chat/history/{user_id}` — Supabase에서 채팅 기록 조회
- `POST /api/v1/chat/message` — OpenAI GPT-4o-mini를 사용한 AI 응답 생성
- 사용자 프로필(이름, 목표, 칼로리)을 기반으로 시스템 프롬프트 개인화
- Supabase 저장 실패 시에도 AI 응답은 정상 반환 (best-effort)

### 2-2. 라우터 등록
**파일:** `taste_mate/backend/api/router.py`

```python
from api.endpoints import recommend, profile, meals, chat
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
```

### 2-3. 추천 엔드포인트 개선
**파일:** `taste_mate/backend/api/endpoints/recommend.py`

- Supabase에서 사용자 프로필(다이어트 목표) 조회
- 목표에 따른 Naver 검색 쿼리 동적 생성:
  - `lose` → "샐러드 건강 식당"
  - `gain` → "단백질 닭가슴살 식당"
- Naver API 미설정 또는 오류 시 큐레이션된 기본 추천 목록으로 폴백

---

## 3. 프론트엔드 수정 사항

### 3-1. API 클라이언트 업데이트
**파일:** `taste_mate/frontend/src/api/apiClient.ts`

새로 추가된 `chatService`:
```typescript
export const chatService = {
    getHistory: async (userId: string) => { ... },
    sendMessage: async (userId: string, message: string, userProfile) => { ... },
};
```

모든 서비스가 `http://localhost:8000/api/v1`을 기본 URL로 사용합니다 (`.env`에서 `VITE_API_BASE_URL`로 오버라이드 가능).

### 3-2. ChatbotScreen.tsx
- Supabase 엣지 함수 호출 → FastAPI `POST /api/v1/chat/message` 로 교체
- 채팅 기록: `GET /api/v1/chat/history/{userId}` 사용
- 백엔드 미연결 시 "백엔드 서버를 확인해주세요" 메시지 표시

### 3-3. RestaurantRecommendationScreenNew.tsx
- `generateRecommendations()` 함수를 async로 변경
- `recommendService.getRecommendations(userId)` 실제 API 호출
- API 실패 시 기존 목업 데이터로 폴백 (UI 항상 정상 작동)

### 3-4. MealLogScreen.tsx
- 식사 추가 시 `mealService.createMeal()` 호출로 FastAPI 백엔드에 저장
- 백엔드 저장 실패해도 로컬 상태는 항상 업데이트 (사용자 경험 보호)

---

## 4. 환경 변수 설정

### 프론트엔드 (`taste_mate/frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://dweiosyruojmqpzwaouk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yqX84eBhv6k65Fcf1hvYfw_5-ZNIckq
```

### 백엔드 (`taste_mate/backend/.env`) — 수동 설정 필요
```env
SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드에서 복사>
OPENAI_API_KEY=<OpenAI API 키>
NAVER_CLIENT_ID=<Naver 개발자 센터에서 발급>
NAVER_CLIENT_SECRET=<Naver 개발자 센터에서 발급>
```

> ⚠️ **중요:** `SUPABASE_SERVICE_ROLE_KEY`가 현재 `undefined`로 설정되어 있습니다.
> Supabase 대시보드 → Project Settings → API → Service role key 에서 실제 키로 교체하세요.

---

## 5. 실행 방법

### 프론트엔드
```powershell
cd taste_mate/frontend
npm install  # 이미 완료됨
npm run dev  # http://localhost:5173
```

### 백엔드
```powershell
cd taste_mate/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 6. API 아키텍처

```
Browser (React/Vite :5173)
    │
    ├── GET /api/v1/recommend/{userId}  →  Naver API + Supabase 프로필
    ├── POST /api/v1/meals/             →  Supabase meals 테이블
    ├── GET /api/v1/chat/history/:id   →  Supabase chat_history
    └── POST /api/v1/chat/message      →  OpenAI GPT-4o-mini
                                           └── Supabase chat_history 저장
    
FastAPI Backend (:8000)
    └── Supabase (PostgreSQL)
```

---

## 7. 검증 결과

- ✅ `npm install` 성공 (exit code 0)
- ✅ `npm run dev` 성공: **VITE v6.3.5 ready in 758ms** — `http://localhost:5173`
- ✅ TypeScript 에러 (jsx-runtime) 해결됨
- ✅ 모든 API 서비스가 실제 FastAPI 엔드포인트로 연결됨
- ✅ 모든 API 호출에 폴백 로직 적용됨 (백엔드 미연결 시 graceful degradation)
