# 카카오 로그인 – "sent an invalid response" 해결 가이드

카카오 로그인 시 **"This page isn't working – xxx.supabase.co sent an invalid response"** 가 나오면, 대부분 **Supabase 리다이렉트 URL 설정** 또는 **카카오 프로바이더 설정** 문제입니다.

---

## 1. Supabase 대시보드 설정 (필수)

### 1) Redirect URLs 등록

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택  
2. **Authentication** → **URL Configuration**  
3. **Redirect URLs**에 아래를 **그대로** 추가 (개발/운영 환경에 맞게 사용)
   - 로컬: `http://localhost:3000`
   - 로컬(슬래시 포함): `http://localhost:3000/`
   - Docker 등 다른 포트 사용 시: `http://localhost:포트번호` 도 추가

**중요**: 앱에서 사용하는 `redirectTo`(예: `window.location.origin`)와 **완전히 일치**하는 URL을 등록해야 합니다. 하나라도 누락되면 "invalid response"가 날 수 있습니다.

### 2) Site URL (선택)

- **Site URL**은 이메일 인증·비밀번호 재설정 등에 쓰입니다.
- 로컬 테스트 시: `http://localhost:3000` 으로 두어도 됩니다.

---

## 2. 카카오(Kakao) 프로바이더 설정

1. Supabase: **Authentication** → **Providers** → **Kakao**  
2. **Enable** 켜기  
3. **Kakao Client ID** (REST API 키), **Kakao Client Secret** 입력  
   - 키 발급: [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 앱 키 / REST API 키

### 카카오 개발자 콘솔에서 할 일

1. **내 애플리케이션** → 해당 앱 → **카카오 로그인** → **활성화 ON**  
2. **Redirect URI**에 아래 **Supabase 콜백 URL**을 등록:
   ```text
   https://dweiosyruojmqpzwaouk.supabase.co/auth/v1/callback
   ```
   (프로젝트마다 `dweiosyruojmqpzwaouk` 부분이 다를 수 있음. Supabase Auth → Providers → Kakao 화면에 안내된 URL 확인)

3. **동의 항목**에서 필요한 항목(프로필, 이메일 등) 설정

---

## 3. 체크리스트

| 확인 항목 | 위치 |
|-----------|------|
| Redirect URLs에 `http://localhost:3000` (및 `/` 포함 버전) 추가 | Supabase → Auth → URL Configuration |
| Kakao 프로바이더 Enable + Client ID/Secret 입력 | Supabase → Auth → Providers → Kakao |
| Redirect URI에 `https://<프로젝트>.supabase.co/auth/v1/callback` 등록 | Kakao Developers → 카카오 로그인 → Redirect URI |
| 브라우저에서 접속하는 주소와 Redirect URLs에 등록한 주소 일치 | 예: `http://localhost:3000` 으로 접속했다면 동일 URL 등록 |

---

## 4. Enable이 안 될 때 (토글/저장이 안 됨)

다음 순서대로 확인해 보세요.

### 4.1 들어가는 위치

- **Supabase Dashboard** → 프로젝트 선택  
- 왼쪽 메뉴 **Authentication** (🔐)  
- **Providers** (또는 **Sign In / Providers** / **Configuration** 아래)  
- 목록에서 **Kakao** 를 펼친 뒤 **Kakao Enabled** 를 ON

일부 대시보드는 **Authentication** → **Configuration** → **Auth Providers** 에 있습니다.

### 4.2 먼저 Client ID / Secret 입력

- **Client ID**와 **Client Secret**을 **비워둔 상태**에서는 Enable이 비활성화되거나, 켜도 저장이 안 되는 경우가 있습니다.
- **Kakao Client ID**(REST API 키), **Kakao Client Secret**을 입력한 뒤 **Save** 누르고, 그 다음 **Kakao Enabled** 를 ON 하고 다시 **Save** 해 보세요.

### 4.3 카카오 쪽에서 키/설정 확인

- [Kakao Developers](https://developers.kakao.com) → **내 애플리케이션** → 해당 앱  
- **앱 설정** → **앱** → **플랫폼** 에서 **REST API 키** 확인 (Client ID로 사용)  
- **제품 설정** → **카카오 로그인** → **일반** 에서 **카카오 로그인** 사용 상태 **ON**  
- **플랫폼** → **Web** 에서 **Redirect URI** 에  
  `https://dweiosyruojmqpzwaouk.supabase.co/auth/v1/callback`  
  등록 후 저장  

키나 Redirect URI가 없으면 Supabase에서 Enable을 켜도 로그인 시 오류가 나므로, 먼저 카카오 쪽 설정을 마치는 것이 좋습니다.

### 4.4 그밖에

- **권한**: 해당 Supabase 프로젝트의 Owner/관리자만 Auth 설정을 바꿀 수 있습니다. 팀원이 넣어둔 프로젝트면, 설정은 프로젝트 소유자나 팀원이 해야 할 수 있습니다.  
- **브라우저**: 시크릿 모드나 다른 브라우저에서 대시보드 접속 후 다시 시도.  
- **Kakao가 목록에 없음**: Supabase는 계정/리전과 관계없이 Kakao를 제공합니다. 왼쪽에서 **Authentication** → **Providers** 스크롤해서 **Kakao**가 있는지 확인하고, 없다면 Supabase 지원에 문의하는 수밖에 없습니다.

---

## 5. 그래도 안 될 때 (로그인 오류 등)

- **캐시/시크릿 모드**: 시크릿 창에서 `http://localhost:3000` 으로 다시 시도  
- **Docker/다른 포트**: 실제 접속 URL(예: `http://localhost:3001`)을 Redirect URLs에 추가  
- **콘솔 로그**: 브라우저 개발자 도구(F12) → Console/Network에서 에러 메시지 확인  
- Supabase 프로젝트가 **Paused** 상태가 아닌지 대시보드에서 확인  

설정 반영 후에는 Supabase/카카오 쪽에서 즉시 적용되므로, 앱만 새로고침해서 다시 카카오 로그인을 눌러보면 됩니다.

---

**요약 (Enable이 안 될 때)**  
1) Authentication → Providers → Kakao 위치 확인  
2) **Client ID + Client Secret 먼저 입력** 후 Save → 그다음 Enabled ON → Save  
3) 카카오 개발자 콘솔에서 앱·카카오 로그인 ON, Redirect URI 등록  
4) 프로젝트 권한(Owner/관리자) 확인
