# 🍱 TasteMate (밥친구)
> **AI & RAG 기반 초개인화 식단 관리 및 맛집 추천 솔루션**

TasteMate는 단순한 식단 기록을 넘어, 사용자의 **신체 정보, 영양 상태, 실시간 위치, 그리고 외부 환경(날씨/시간)**을 종합적으로 분석하여 최적의 메뉴를 결정해주는 "지능형 식사 가이드"입니다.

---

## 🌟 핵심 가치 (Core Values)

TasteMate는 현대인들의 "오늘 뭐 먹지?"라는 고민을 해결하기 위해 개발되었습니다. RAG(Retrieval-Augmented Generation) 기술과 정교한 랭킹 알고리즘을 통해, 단순 검색이 아닌 '나에게 가장 필요한 한 끼'를 제안합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 지능형 온보딩 및 신체 데이터 분석
*   **정밀 계산**: Harris-Benedict 공식을 활용하여 기초대사량(BMR) 및 TDEE(일일 총 에너지 소비량)를 자동 산출합니다.
*   **목표 관리**: 다이어트, 체중 유지, 벌크업 등 사용자의 목표에 따른 맞춤형 영양 가이드라인을 설정합니다.

### 2. 고도화된 추천 알고리즘 (Hybrid Re-ranker)
*   **RAG 랭킹 모델**: 외부 식당 데이터와 벡터 DB를 결합하여 단순 카테고리 매칭을 넘어선 수학적 재정렬(Re-ranking)을 수행합니다.
*   **컨텍스트 분석**: 현재 날씨, 시간대, 사용자의 감정 및 동행자 유무를 고려한 다차원 추천 엔진이 탑재되어 있습니다.

### 3. 심리스한 사용자 경험 (UX Persistence)
*   **상태 영속화**: 내비게이션 상태와 위치 정보를 로컬 저장소 및 DB에 동기화하여, 새로고침이나 탭 이동 시에도 끊김 없는 경험을 제공합니다.
*   **실시간 위치 동기화**: Reverse Geocoding을 통해 사용자의 실시간 주소를 감지하고 프로필에 자동 반영합니다.

### 4. AI 챗봇 및 영양 리포트
*   **대화형 인터페이스**: LLM 기반 챗봇이 식단 고민에 대해 전문가 수준의 피드백을 제공합니다.
*   **시각화 리포트**: 캘린더 및 통계 대시보드를 통해 일일 탄/단/지 섭취 비중을 한눈에 파악할 수 있습니다.

---

## 🛠 기술 스택 (Technical Architecture)

### **Frontend Layer**
- **Library**: `React 18` (Vite 기반 고속 빌드)
- **Styling**: `Tailwind CSS` (Modern UI/UX)
- **State Management**: `React Hooks` & `LocalStorage Persistence`
- **Icons**: `Lucide React`

### **Backend Layer**
- **Framework**: `FastAPI` (High Performance Python Framework)
- **Database**: `Supabase` (PostgreSQL 기반의 실시간 DB & Auth)
- **AI/LLM**: `OpenAI GPT-4o-mini` (추천 로직 및 챗봇 엔진)
- **Algorithm**: `Vector DB (RAG)` 연계형 랭킹 알고리즘

---

## 📂 프로젝트 구조 (Structure)

```text
taste_mate/
├── backend/            # FastAPI 기반 고성능 백엔드 API
│   ├── api/            # 엔드포인트 및 라우터 (Profile, Recommend, Meals)
│   ├── core/           # 시스템 설정 및 보안
│   └── db/             # Supabase 연동 및 SQL 스키마
├── frontend/           # React 기반 싱글 페이지 애플리케이션 (SPA)
│   ├── src/components/ # 재사용 가능한 UI 컴포넌트
│   └── src/api/        # API 클라이언트 모듈
├── docs/               # 상세 개발 리포트 및 아키텍처 문서 (1~14번 보고서)
└── docker-compose.yml  # 하이브리드 서비스 통합 관리 설정
```

---

## 🐳 개발 환경 및 실행 방법

### 1. 환경 설정 (Environment Variables)
- 프로젝트 루트의 `backend/.env`와 `frontend/.env`에 Supabase URL, API Key 등을 설정해야 합니다.

### 2. Docker를 이용한 원클릭 실행
터미널에서 아래 명령어를 실행하면 모든 환경이 자동으로 빌드 및 가동됩니다.
```bash
docker-compose up --build
```

### 3. 접속 정보
- **Service Link**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📄 문서 가이드 (Documentation)
상세한 개발 여정 및 기술적 결정 사항은 `docs/` 폴더 내의 리포트를 참조하세요.
- **[보고서 13]**: RAG 기반 추천 알고리즘 고도화 전략
- **[보고서 14]**: UX 영속성 처리 및 프로필 관리 시스템 개선 내역
