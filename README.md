# 🍱 TasteMate (밥친구)
> **AI & RAG 기반 초개인화 식단 관리 및 맛집 추천 솔루션**

TasteMate는 단순한 식단 기록을 넘어, 사용자의 **신체 정보, 영양 상태, 실시간 위치, 그리고 외부 환경(날씨/시간)**을 종합적으로 분석하여 최적의 메뉴를 결정해주는 "지능형 식사 가이드"입니다.

---

## 🌟 핵심 가치 (Core Values)

TasteMate는 현대인들의 "오늘 뭐 먹지?"라는 고민을 해결하기 위해 개발되었습니다. LLM(GPT-4o-mini)과 정교한 랭킹 알고리즘을 통해, 단순 검색이 아닌 '나에게 가장 필요한 한 끼'를 제안합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 고도화된 온보딩 및 영양 분석 (4-Step Onboarding)
*   **정밀 계산**: Harris-Benedict 공식을 활용하여 기초대사량(BMR) 및 TDEE(일일 총 에너지 소비량)를 자동 산출합니다.
*   **단계별 수집**: 기본 신체 정보 → 식사 패턴(알림 설정) → 기명 및 알레르기 제한 → 목표 및 활동량 설정의 4단계 프로세스를 제공합니다.
*   **위치 동기화**: 실시간 위치 정보 활용 동의를 통해 최신 추천 정보를 제공합니다.

### 2. 상황 맞춤형 7단계 추천 엔진 (Multi-step Recommendation)
*   **정밀 큐레이션**: 메뉴 타입 선정 → 추천 모드 선택 → 기분 분석 → 카테고리 필터링 → 선호 맛/질감 → 동행자 확인 → 예산 설정의 7단계 flow를 통해 최적의 메뉴를 도출합니다.
*   **지능형 랭커**: `foods_v2` 메타데이터와 실시간 컨텍스트(날씨, 시간)를 결합한 가중치 기반 랭킹 알고리즘이 작동합니다.
*   **AI 어드바이저**: 선정된 메뉴에 대해 AI가 "왜 이 음식을 먹어야 하는지" 정량적 수치와 함께 다정한 조언을 생성합니다.

### 3. 고도화된 캘린더 및 식단 관리 (Advanced Calendar)
*   **이중 뷰 시스템**: 월간 흐름을 파악하는 '월 보기'와 상세 식단을 관리하는 '일 보기' 뷰를 지원합니다.
*   **영양 밸런스 시각화**: 일별 탄/단/지 섭취 비중을 그래프로 제공하여 영양 불균형을 즉각 확인합니다.
*   **스마트 검색 기록**: 1,000여 종의 음식 데이터를 기반으로 한 디바운스 검색을 통해 간편하게 식단을 기록합니다.

### 4. 실시간 위치 및 외부 API 연동
*   **Naver Search**: 실시간 주변 맛집 정보 매칭 및 네이버 지도 연동.
*   **Kakao Local**: 좌표 기반 Reverse Geocoding으로 실제 도로명 주소 자동 감지.
*   **Open-Meteo**: 실시간 기상 데이터를 추천 로직의 변수로 활용.

### 5. UI/UX 현대화 및 정밀 데이터 (Modern UI & Nano-banana)
*   **스와이프 인터페이스**: Framer Motion을 활용한 직관적인 틴더 스타일 추천 UI 제공.
*   **상세 정보 고도화**: 단순 API 정보를 넘어 '나노바나나(Scraping) & Vision(Parsing)' 기술을 통해 실제 매장의 **주간 영업시간, 브레이크타임, 실시간 전화번호**를 추출 및 노출합니다.
*   **지도 기반 내비게이션**: 팝업 내 카카오맵 연동으로 사용자와 식당 위치를 동시 표시하며, 원클릭 길찾기 기능을 지원합니다.
*   **상태 유지 (Persistence)**: `sessionStorage`를 통해 앱 재진입 시에도 추천 단계와 팝업 상태를 완벽하게 보존합니다.

---

## 🛠 기술 스택 (Technical Architecture)

### **Frontend Layer**
- **Library**: `React 18` (Vite 6), `Lucide React`, `Framer Motion` (Animation)
- **Styling**: `Tailwind CSS`, `Vanilla CSS (Modern Aesthetics)`
- **State**: `React Hooks`, `Context API`, `SessionStorage Persistence`

### **Backend Layer**
- **Framework**: `FastAPI` (Python asynchronous framework)
- **Database**: `Supabase` (Auth, PostgreSQL DB, Edge Functions)
- **Data Strategy**: `Nano-banana` (Custom scraper for Naver Place enrichment)
- **AI Engine**: `OpenAI GPT-4o-mini` (LLM Reasoning & Advice generation)

---

## 📂 프로젝트 구조 (Structure)

```text
taste_mate/
├── backend/            # FastAPI 기반 고성능 백엔드 API
│   ├── api/            # 엔드포인트 및 라우터 (Profile, Recommend, Meals)
│   ├── models/         # Recommendation Ranker 및 LLM 로직
│   └── db/             # Supabase 연동 모듈
├── frontend/           # React 기반 싱글 페이지 애플리케이션 (SPA)
│   ├── src/components/ # 고도화된 UI 컴포넌트 (Swipe UI, Map, Calendar)
│   └── src/api/        # API 클라이언트 (Axios)
├── docs/               # 개발 리포트 및 아키텍처 문서 (1~19번 보고서)
└── docker-compose.yml  # 서비스 통합 배포 설정
```

---

## 🐳 실행 방법 (Getting Started)

### 1. 환경 설정
- `backend/.env` 및 `frontend/.env` 파일에 필요한 API Key(Supabase, OpenAI, Naver, Kakao)를 설정합니다.

### 2. 실행
```bash
docker-compose up --build
```

### 3. 접속
- **Frontend**: [http://localhost:5173](http://localhost:5173) (Vite Default)
- **API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📄 문서 가이드 (Documentation)
상세한 개발 여정 및 기술적 결정 사항은 `docs/` 폴더 내의 리포트를 참조하세요.
- **[보고서 15]**: 서비스 전반 분석 및 고도화 개발 로드맵 (추천 Flow & 캘린더 개선)
- **[보고서 18]**: 음식 추천 UI 개선 및 고도화 (스와이프 UI & 상태 유지 전술)
- **[보고서 19]**: 상세 정보 UI 개선 및 고도화 (나노바나나 & 실제 데이터 통합 전략)
