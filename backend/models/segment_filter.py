"""
segment_filter.py
-----------------
질문 흐름(Q&A)의 응답을 기반으로 foods_v2 후보 풀을
단계적으로 좁혀가는 세그먼트 필터 모듈.

흐름:
  1. 메인 디쉬 / 커피·디저트 여부  → 대분류(meal_role) 필터
  2. 음식 종류 (category)           → 카테고리 필터
  3. 맛/식감 (preference)           → heaviness / taste / spicy_level 필터
  4. 동행 (companion)               → preferred_people 필터
  5. 예산 (budget)                  → price_per_serving 필터
  6. 감정 (emotion)                 → emotion_state 필터 (soft: 점수로만)

사용법:
  from models.segment_filter import SegmentFilter
  sf = SegmentFilter(user_qna)
  candidates = sf.apply(all_foods)
"""

from typing import List, Dict, Optional


class SegmentFilter:
    """
    사용자의 질문 응답(user_qna)을 바탕으로
    foods_v2 후보 리스트를 단계적으로 필터링한다.
    """

    # ── 카테고리 매핑 ───────────────────────────────────────────
    # 사용자가 질문에서 선택하는 "음식 종류" 텍스트 → foods_v2.category 값
    CATEGORY_MAP: Dict[str, List[str]] = {
        "한식":   ["한식", "한국음식"],
        "중식":   ["중식", "중국음식"],
        "일식":   ["일식", "일본음식", "스시", "라멘"],
        "양식":   ["양식", "파스타", "피자", "버거", "스테이크"],
        "아시안": ["아시안", "태국음식", "베트남음식", "인도음식"],
        "패스트푸드": ["패스트푸드", "버거", "치킨", "피자"],
        "샐러드/건강식": ["샐러드", "건강식", "포케"],
        "커피, 음료, 차": ["음료 및 차류", "카페"],
        "빵, 케이크, 과자": ["빵 및 과자류", "디저트", "베이커리"],
    }

    # ── 맛/식감 매핑 ────────────────────────────────────────────
    # preference → (필드명, 매칭 조건 함수)
    # 함수는 candidate dict를 받아 bool 반환
    @staticmethod
    def _pref_match(pref: str, candidate: Dict) -> bool:
        heaviness = (candidate.get("meal_heaviness") or "").lower()
        taste     = (candidate.get("taste") or "").lower()
        spicy     = candidate.get("spicy_level", 0) or 0
        fat       = candidate.get("fat", 0) or 0
        cal       = candidate.get("calories", 500) or 500

        if pref == "가벼운":
            return "가벼운" in heaviness or cal < 500
        elif pref == "든든한":
            return "무거운" in heaviness or "든든" in heaviness or cal > 600
        elif pref == "매콤한":
            return spicy > 0 or "매콤" in taste or "맵" in taste
        elif pref == "담백한":
            return "담백" in taste or (spicy == 0 and fat < 15)
        elif pref == "기름진":
            return fat > 20 or "기름" in taste
        elif pref == "아무거나":
            return True  # 제한 없음
        return True

    # ── 예산 매핑 ────────────────────────────────────────────────
    BUDGET_RANGE: Dict[str, tuple] = {
        "저렴":  (0, 10000),
        "보통":  (10000, 20000),
        "고급":  (20000, 999999),
    }

    def __init__(self, user_qna: Dict):
        """
        user_qna 예시:
        {
          'meal_type': 'main',          # 'main' | 'dessert'
          'categories': ['중식'],        # 사용자가 선택한 음식 종류 목록
          'preference': '매콤한',        # 맛/식감
          'companion': '혼자',           # 동행
          'budget': '보통',              # 예산
          'emotion': '스트레스',         # 감정 (soft 필터용)
        }
        """
        self.meal_type   = user_qna.get("meal_type", "main")
        self.categories  = user_qna.get("categories") or []
        self.preference  = user_qna.get("preference")
        self.companion   = user_qna.get("companion")
        self.budget      = user_qna.get("budget")
        self.emotion     = user_qna.get("emotion")

    def apply(self, candidates: List[Dict]) -> List[Dict]:
        """
        후보 리스트에 단계별 필터를 적용하고 남은 목록을 반환한다.
        각 단계에서 결과가 너무 적으면(<3) 해당 단계 필터를 완화한다.
        """
        result = list(candidates)

        # Step 1: meal_role (메인 / 사이드·디저트)
        result = self._filter_meal_role(result)
        if not result:
            result = list(candidates)  # 안전 폴백

        # Step 2: category (음식 종류)
        if self.categories:
            filtered = self._filter_category(result)
            result = filtered if len(filtered) >= 3 else result

        # Step 3: preference (맛/식감)
        if self.preference and self.preference != "아무거나":
            filtered = self._filter_preference(result)
            result = filtered if len(filtered) >= 3 else result

        # Step 4: budget (예산)
        if self.budget:
            filtered = self._filter_budget(result)
            result = filtered if len(filtered) >= 3 else result

        # Step 5: companion (동행) — soft; 너무 좁혀지면 스킵
        if self.companion and len(result) >= 5:
            filtered = self._filter_companion(result)
            result = filtered if len(filtered) >= 3 else result

        return result

    # ── 내부 필터 함수들 ────────────────────────────────────────

    def _filter_meal_role(self, candidates: List[Dict]) -> List[Dict]:
        """메인 디쉬 / 커피·디저트 분류"""
        is_dessert = self.meal_type == "dessert" or (
            self.preference in ["커피, 음료, 차", "빵, 케이크, 과자"]
        )
        target_role = "side" if is_dessert else "main"
        filtered = [c for c in candidates if (c.get("meal_role") or "main") == target_role]
        return filtered if filtered else candidates  # 역할 데이터 없으면 전부 허용

    def _filter_category(self, candidates: List[Dict]) -> List[Dict]:
        """음식 종류 필터 — CATEGORY_MAP을 통해 foods_v2.category와 매칭"""
        allowed_db_cats: set = set()
        for user_cat in self.categories:
            mapped = self.CATEGORY_MAP.get(user_cat, [user_cat])
            allowed_db_cats.update(mapped)

        return [
            c for c in candidates
            if (c.get("category") or "").strip() in allowed_db_cats
        ]

    def _filter_preference(self, candidates: List[Dict]) -> List[Dict]:
        return [c for c in candidates if self._pref_match(self.preference, c)]

    def _filter_budget(self, candidates: List[Dict]) -> List[Dict]:
        lo, hi = self.BUDGET_RANGE.get(self.budget, (0, 999999))
        return [
            c for c in candidates
            if lo <= (c.get("price_per_serving") or 12000) <= hi
        ]

    def _filter_companion(self, candidates: List[Dict]) -> List[Dict]:
        """동행 필터 — preferred_people 필드 기준"""
        people = (c.get("preferred_people") or "" for c in candidates)
        comp = self.companion or ""
        
        if "혼자" in comp:
            target_keywords = ["혼자", "1인"]
        elif "친구" in comp or "동료" in comp:
            target_keywords = ["여럿", "친구", "다같이"]
        elif "연인" in comp or "가족" in comp:
            target_keywords = ["가족", "연인", "다같이"]
        else:
            return candidates

        result = []
        for c in candidates:
            pp = c.get("preferred_people") or ""
            if any(kw in pp for kw in target_keywords):
                result.append(c)

        return result if result else candidates
