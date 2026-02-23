# 🍚 밥친구 (Ricefreind)
> **개인 맞춤형 식단 추천 서비스 (Swipe UX)**

![Project Banner](https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop)

밥친구는 사용자의 현재 감정, 상황, 영양 상태를 분석하여 최적의 식단을 추천해주는 AI 기반 서비스입니다. 직관적인 스와이프 인터페이스를 통해 즐겁게 메뉴를 선택하고 건강한 식습관을 관리할 수 있습니다.

---

## ✨ 주요 기능 (Key Features)

### 1. 틴더 스타일 스와이프 추천
- **몰입형 UI**: 이미지가 화면의 70%를 차지하는 시각 중심의 카드 인터페이스.
- **직관적 제스처**: 좌(거절) / 우(선택) 스와이프로 간편한 메뉴 탐색.
- **점진적 정보 노출**: 카드 클릭 시 칼로리, 탄/단/지 영양 성분, 추천 사유 상세 확인 가능.

### 2. AI 개인화 엔진 (RAG + ML)
- **상황 기반 추천**: 오늘의 날씨, 기분, 동행인, 예산을 고려한 지능형 필터링.
- **GPT-4o 연동**: OpenAI의 RAG(Retrieval-Augmented Generation) 모델을 활용한 정교한 추천 사유 생성.

### 3. 식단 관리 및 커뮤니티
- **영양 기록**: 일일 칼로리 섭취량 및 목표 체중 관리.
- **실시간 소통**: 커뮤니티 포스팅을 통한 사용자 간 식단 공유.

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
- **Core**: React 18.3, TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion (Swipe UX 핵심)
- **Icons/UI**: Lucide React, Radix UI

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: Supabase (PostgreSQL)
- **AI/LLM**: OpenAI GPT-4o (RAG Logic)
- **Auth**: Supabase Auth + Kakao Login

---

## 📂 프로젝트 구조 (Structure)

```text
taste_mate/
├── frontend/           # React + Vite 프론트엔드
│   ├── src/components/ # UX 컴포넌트 (SwipeCard 등)
│   └── src/App.tsx     # 메인 로직 및 라우팅
├── backend/            # FastAPI 백엔드
│   ├── api/endpoints/  # API 라우터 (meals, profile, recommend)
│   ├── core/           # RAG 및 AI 비즈니스 로직
│   └── db/             # Supabase 클라이언트 및 스키마
└── docs/               # 기술 가이드 및 로드맵
```

---

## 🚀 시작하기 (Getting Started)

### 1. 환경 변수 설정
`backend/.env.example`을 참고하여 `.env` 파일을 생성하고 필요한 API 키를 입력하세요.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `KAKAO_REST_API_KEY`

### 2. 백엔드 실행
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 상세 문서
더 자세한 기술 정보는 [docs/03_기술_가이드_및_환경_설명.md](docs/03_기술_가이드_및_환경_설명.md)를 참고하세요.

---

> [!NOTE]
> 본 프로젝트는 **Interactive Grocery Mobile App**의 진화형 버전으로, 고도의 AI 추천 알고리즘과 몰입감 있는 UX를 지향합니다.
