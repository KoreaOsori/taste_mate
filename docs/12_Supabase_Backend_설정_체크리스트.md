# 백엔드 Supabase 설정 체크리스트

`backend/.env` 에서 사용하는 변수와 Supabase 대시보드 확인 방법입니다.

---

## 1. 백엔드가 읽는 변수 (정확한 이름)

| 변수명 | 설명 | 예시 형식 |
|--------|------|-----------|
| `SUPABASE_URL` | 프로젝트 URL (끝에 `/` 없음) | `https://xxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 역할 비밀 키 (JWT, anon 아님) | `eyJhbGci...` 긴 문자열 |

**주의:** 프론트용 `SUPABASE_ANON_KEY` 가 아니라 **`SUPABASE_SERVICE_ROLE_KEY`** 를 써야 합니다.

---

## 2. Supabase 대시보드에서 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) → 해당 **프로젝트** 선택  
2. **Settings (⚙️)** → **API**  
3. 아래와 비교:
   - **Project URL** → `SUPABASE_URL` 과 **완전히 동일**한지 (https 포함, 끝 슬래시 없음)
   - **Project API keys** 중 **`service_role`** (Secret) → 복사해서 `SUPABASE_SERVICE_ROLE_KEY` 와 동일한지  
     - `anon` / `public` 이 아니라 **service_role** 사용
4. **General** → 프로젝트가 **Paused** 상태가 아닌지 확인

---

## 3. 흔한 실수

- `SUPABASE_URL` 끝에 `/` 붙임 → 제거 (예: `https://xxx.supabase.co` 만)
- `SUPABASE_ANON_KEY` 를 백엔드에 넣음 → 백엔드는 반드시 **SUPABASE_SERVICE_ROLE_KEY**
- 키 복사 시 앞뒤 공백/줄바꿈 들어감 → 한 줄, 공백 없이
- 프로젝트 일시 중지(Paused) → 재개 후 다시 시도

---

## 4. 설정이 맞는데도 503이 나올 때

- **Docker에서 백엔드 실행 시:** 컨테이너 안에서 Supabase 주소 DNS 조회 실패일 수 있음.  
  → `docs/07_Docker_Setup_Guide.md` Q3 참고 (백엔드만 로컬 실행 등).
- **로컬에서 백엔드 실행 시:** 위 체크리스트 다시 확인 후, 대시보드에서 **service_role** 키 재복사해 `.env` 에 덮어쓰고 재시작.
