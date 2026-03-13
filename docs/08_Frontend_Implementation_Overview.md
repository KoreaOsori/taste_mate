# TasteMate 프론트엔드 구현 현황 문서

> React 18 + Vite + TypeScript 기반. 상태는 `App.tsx`의 `currentScreen`으로 관리하며, React Router 미사용.

---

## 1. 기술 스택

| 구분 | 내용 |
|------|------|
| **프레임워크** | React 18, Vite 6 |
| **스타일** | Tailwind CSS 4 |
| **UI 컴포넌트** | Shadcn UI (Radix 기반), Lucide Icons |
| **폼** | react-hook-form |
| **차트** | recharts |
| **API** | Axios (`api/apiClient.ts`), Supabase Auth/Client |

---

## 2. 앱 흐름 (화면 전환)

```
[로그인] → (세션 있음 + 프로필 있음) → [홈]
    ↓
[회원가입] → [위치 동의] → [온보딩] → [홈]

[홈] 이후 하단 네비게이션: 홈 | 캘린더 | 추천(맛집) | 커뮤니티 | 프로필
```

- **라우팅**: URL이 아닌 `App.tsx`의 `currentScreen` 상태로 화면 결정.
- **인증**: Supabase `getSession()` + `onAuthStateChange`. 프로필 없으면 404 시 location → onboarding 진행.
- **전역 상태**: `userProfile`, `todaysMeals`, `userLocation`, `authUserId`, `signupData` (모두 `App.tsx` state).

---

## 3. 화면(Screen) 목록 및 역할

### 3.1 인증·온보딩 (진입 ~ 첫 사용)

| 화면 | 컴포넌트 | 역할 |
|------|----------|------|
| **login** | `LoginScreen` | 이메일/비밀번호 로그인, 카카오 OAuth, 게스트 로그인, 회원가입 이동 |
| **signup** | `SignupScreen` | 회원가입 후 `location`으로 이동 |
| **location** | `LocationPermissionScreen` | 위치 권한 요청, 동의 시 `onboarding`으로 |
| **onboarding** | `OnboardingScreenNew` | 이름/나이/성별/키/몸무게, 식사 시간, 선호 카테고리, 목표(감량·유지·증량), 활동량, 위치 동의. Harris-Benedict로 목표 칼로리 계산 후 프로필 저장 → `home` |

### 3.2 메인 (하단 네비게이션 노출)

| 화면 | 컴포넌트 | 역할 |
|------|----------|------|
| **home** | `DashboardHome` | 인사말, 위치, 커뮤니티/챌린지 캐러셀, 오늘의 식습관 조언, 칼로리/단백질/탄수화물/지방 진행률, 식습관 팁 캐러셀. **식사 추가·챗봇 진입 버튼 없음** (별도 화면으로 이동 경로 없음) |
| **calendar** | `CalendarScreenWithReport` | 월별 캘린더, 일별 식사 목록·칼로리, 식사 추가 다이얼로그, **health-report**로 이동 |
| **restaurant** | `RestaurantRecommendationScreenNew` | 위치·프로필 기반 맛집 추천 API 호출, 카드 스와이프, 피드백 모달, 상세(네이버/배민/요기요 링크) |
| **community** | `CommunityScreen` | 커뮤니티 글 목록, 필터(전체/다이어트/맛집/레시피/일상), 글쓰기 모달. Supabase Edge Function 연동 |
| **profile** | `ProfileScreen` | 프로필 정보 표시, 편집 모달(이름/나이/키/몸무게/목표몸무게/식사시간), 위치 동의 토글, 로그아웃 |

### 3.3 서브·특수 화면 (네비에 없음)

| 화면 | 컴포넌트 | 진입 경로 | 역할 |
|------|----------|-----------|------|
| **health-report** | `HealthReportScreen` | 캘린더 화면에서 이동 | 주간 칼로리/영양소 요약, 식사 패턴 인사이트, 기본/프리미엄 탭 (목업 데이터) |
| **meal-log** | `MealLogScreen` | **현재 홈에서 링크 없음** | 오늘 식사 목록, 식사 추가 모달(유형/이름/칼로리/단백질/탄수화물/지방), 백엔드 `mealService` 연동 |
| **chat** | `ChatbotScreen` | **현재 홈에서 링크 없음** | AI 영양 상담 챗봇, `chatService.getHistory` / `sendMessage`, 프로필 맥락 반영 |
| **foodfarm** | `FoodFarmScreen` | **어디서도 링크 없음** | 건강식품 쇼핑 목업 (카테고리, 장바구니 등) |

### 3.4 사용하지 않는/레거시 컴포넌트

- `HomeScreen`, `HomeScreenNew`: 과거 홈. `meal-log`, `chat` 링크 있음. **현재는 `DashboardHome`만 사용.**
- `OnboardingScreen`: 구버전 온보딩.
- `RestaurantRecommendationScreen`, `RestaurantDetailScreen`, `RecommendationLoadingScreen`: 추천 플로우 내부에서만 사용.
- `ProductListPage`, `BasketPage`, `CheckoutPage` 등: Figma/목업용 페이지로 보이며, 현재 앱 플로우에는 미연결.

---

## 4. 공통 UI 컴포넌트

- **경로**: `src/components/ui/`
- **내용**: Shadcn/Radix 기반 (button, input, label, card, dialog, sheet, select, tabs, progress, form, calendar, chart 등). `components/shared/StatusBar.tsx`, `components/figma/ImageWithFallback.tsx` 등 보조 컴포넌트 존재.

---

## 5. API·Supabase 연동

| 용도 | 위치 | 비고 |
|------|------|------|
| **프로필** | `profileService.getProfile`, `updateProfile` | FastAPI `/api/v1/profile` |
| **식사** | `mealService.getMeals`, `createMeal` | FastAPI `/api/v1/meals` |
| **맛집 추천** | `recommendService.getRecommendations`, `getAddress` | FastAPI `/api/v1/recommend` |
| **챗** | `chatService.getHistory`, `sendMessage` | FastAPI `/api/v1/chat` |
| **이메일 존재 여부** | `authService.checkUser` | FastAPI `/api/v1/auth/check-user` |
| **로그인/회원가입** | `supabase.auth` | Supabase Auth |
| **커뮤니티 글** | `fetch(SUPABASE_URL/functions/v1/...)` | Supabase Edge Function |
| **식사 삭제** | `MealLogScreen` 내 `fetch(.../meals/... DELETE)` | Supabase Edge Function (선택) |

---

## 6. 현재 발견된 구조 이슈

1. **접근 불가 화면**  
   `meal-log`, `chat`, `foodfarm`은 라우트/화면으로 존재하지만, **현재 홈(`DashboardHome`)이나 네비에서 진입 경로가 없음.**  
   → 홈에 “식사 기록하기”/“AI 상담” 버튼 추가 또는 네비/프로필에서 연결 필요.

2. **홈 화면 이중화**  
   `HomeScreen`(meal-log/chat 링크 있음) vs `DashboardHome`(대시 위주). 하나로 통합하거나, DashboardHome에 meal-log/chat 진입점 추가하는 편이 일관됨.

3. **식사 데이터 소스**  
   `todaysMeals`는 `App` state로만 유지. 캘린더/식사 기록은 백엔드에서 불러오므로, **홈의 “오늘 식사”는 초기 로드 시 `/meals?date=오늘`로 채우는 로직**이 있으면 좋음.

4. **커뮤니티**  
   Supabase Edge Function에 의존. 백엔드가 없거나 URL이 다르면 빈 목록/에러 처리 필요.

---

## 7. 디렉터리 구조 요약

```
frontend/src/
├── App.tsx                 # 화면 상태, 인증, 하단 네비, 전역 state
├── main.tsx
├── api/
│   └── apiClient.ts        # Axios 인스턴스, profile/meal/recommend/chat/auth 서비스
├── components/             # 화면·공통 컴포넌트
│   ├── ui/                 # Shadcn 기반
│   ├── *Screen*.tsx        # 메인 화면
│   ├── *Page*.tsx          # 일부만 앱 플로우에 연결
│   └── ...
├── utils/
│   └── supabaseClient.ts   # Supabase URL/Anon Key
└── ...
```

---

문서 작성일: 2026-03-04
