# 🍱 TasteMate (밥친구)
> **AI 기반 맞춤형 식단 관리 및 맛집 추천 서비스**

TasteMate는 사용자의 신체 정보, 식습관, 현재 위치를 결합하여 최적의 영양 분석과 맛집 추천을 제공하는 스마트 식단 가이드 애플리케이션입니다.

---

## 🚀 주요 기능 (Core Features)

### 1. 지능형 온보딩 (Smart Onboarding)
*   사용자의 나이, 성별, 키, 체중, 활동량, 건강 목표 수집.
*   Harris-Benedict 공식을 활용한 기초대사량(BMR) 및 일일 권장 칼로리(TDEE) 자동 계산.
*   식사 취향(기호품/기피 음식) 및 식사 시간 설정.

### 2. AI 영양 분석 및 대시보드
*   일일 목표 칼로리 대비 실시간 섭취량 시각화.
*   식사 기록(아침, 점심, 저녁, 간식)별 상세 영양소 추적.
*   사용자 데이터 기반 맞춤형 건강 인사이트 제공.

### 3. 맞춤형 맛집 추천
*   사용자의 선호 카테고리 및 위치 기반 실시간 식당 추천.
*   AI 챗봇을 통한 메뉴 결정 및 식단 고민 상담.

---

## 🛠 기술 스택 (Tech Stack)

### **Frontend**
*   **Framework**: React 18 (Vite)
*   **UI/UX**: Tailwind CSS, Lucide Icons, Shadcn UI
*   **State/API**: Axios, React Hooks

### **Backend**
*   **Framework**: FastAPI (Python 3.11)
*   **Database/Auth**: Supabase (PostgreSQL)
*   **AI Engine**: OpenAI GPT-4o / Google Gemini
*   **Data Analysis**: Pandas, Scikit-learn (추천 엔진 로직)

---

## 🐳 개발 환경 및 실행 방법 (Docker)

본 프로젝트는 서비스 간의 의존성 해결과 일관된 실행 환경을 위해 Docker를 사용합니다.

### 1. 사전 준비 (Pre-requisites)
*   Docker 및 Docker Desktop 설치
*   `backend/.env` 및 `frontend/.env` 파일 설정 완료

### 2. 가동 방법
터미널에서 프로젝트 루트 디렉토리로 이동한 후 아래 명령어를 입력합니다.
```bash
docker-compose up --build
```

### 3. 접속 정보
*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend API**: [http://localhost:8000](http://localhost:8000)
*   **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 📂 프로젝트 구조 (Architecture)

```text
taste_mate/
├── backend/            # FastAPI 백엔드 (API, 추천 엔진, DB 연동)
├── frontend/           # React 프런트엔드 (Vite, UI 컴포넌트)
├── docs/               # 상세 기술 및 요약 보고서 문서함
│   ├── 05_Onboarding_Expansion_Report.md
│   ├── 06_API_Integration_DB_Persistence_Report.md
│   └── 07_Docker_Setup_Guide.md
└── docker-compose.yml  # 하이브리드 서비스 통합 관리 설정
```

---

## 📄 라이선스 및 문서
자세한 개발 내역은 `docs/` 폴더 내의 각 리포트를 참조하세요.
*   [Docker 상세 가이드](docs/07_Docker_Setup_Guide.md)
*   [API 연동 및 DB 영속화 리포트](docs/06_API_Integration_DB_Persistence_Report.md)
