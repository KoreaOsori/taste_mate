from typing import List, Dict
import numpy as np


class RecommendationRanker:
    def __init__(self, model_path: str = None):
        self.model = None  # Placeholder for future ML model

    def score_candidates(self, candidates: List[Dict], user_features: Dict) -> List[Dict]:
        """
        세그먼트 필터를 거친 후보들에 대해 가중치 기반 스코어를 부여한다.
        SegmentFilter.apply() 이후에 호출하는 것을 권장하며,
        이 함수는 같은 세그먼트 내에서의 최종 순위 결정에 집중한다.

        user_features:
          - target_calories: int
          - consumed_calories: int
          - hour: int
          - weather: str
          - emotion: str (optional)
          - companion: str (optional)
          - preference: str (optional)
          - budget: str (optional)
        """
        target_cal  = user_features.get("target_calories", 2000)
        consumed    = user_features.get("consumed_calories", 0)
        remaining   = max(0, target_cal - consumed)
        hour        = user_features.get("hour", 12)
        weather     = user_features.get("weather", "맑음")
        emotion     = user_features.get("emotion") or ""
        companion   = user_features.get("companion") or ""
        preference  = user_features.get("preference") or ""

        for c in candidates:
            score = 0.0
            cal   = c.get("calories", 0) or 0
            fat   = c.get("fat", 0) or 0
            prot  = c.get("protein", 0) or 0
            spicy = c.get("spicy_level", 0) or 0

            # ── 1. 위치 기준 (Location 40점) ─────────────────────
            # 음식(메뉴) 레벨에서는 위치를 아직 모르므로 기본 40점 부여 (이후 거리 스킵 로직에서 거름)
            score += 40.0

            # ── 2. 영양 적합도 (Nutrition 30점) ──────────────────
            if cal > 0:
                diff = abs(remaining - cal)
                # 오차 0이면 30점 만점, 500 이상 나면 0점
                nutrition_score = max(0.0, 30.0 - (diff / 500.0) * 30.0)
                score += nutrition_score

            # ── 3. 취향/선호도 일치 (Preference 20점) ─────────────
            heaviness = (c.get("meal_heaviness") or "").lower()
            taste     = (c.get("taste") or "").lower()
            pref_score = 0.0

            if preference == "가벼운":
                pref_score = 20 if ("가벼운" in heaviness or cal < 500) else 0
            elif preference == "든든한":
                pref_score = 20 if ("무거운" in heaviness or cal > 600) else 0
            elif preference == "매콤한":
                pref_score = 20 if spicy > 0 or "매콤" in taste else 0
            elif preference == "담백한":
                pref_score = 20 if ("담백" in taste or (spicy == 0 and fat < 15)) else 0
            elif preference == "기름진":
                pref_score = 20 if fat > 20 else 0
            else:
                pref_score = 10  # 선호도 없음 (기본 중간 점수)
            
            score += pref_score

            # ── 4. 상황 (Context 10점 - 날씨/시간/감정/동행 종합) ────
            context_score = 0.0
            food_weather = (c.get("preferred_weather") or "").lower()
            food_emotion = (c.get("emotion_state") or "").lower()
            food_people  = (c.get("preferred_people") or "").lower()

            # 날씨 (최대 3점)
            if "비" in weather and ("비" in food_weather or "얼큰" in taste):
                context_score += 3
            elif "더워" in weather and ("여름" in food_weather or "냉" in taste):
                context_score += 3
            elif "추워" in weather and ("겨울" in food_weather or "국물" in taste):
                context_score += 3
            elif "맑음" in weather and "맑음" in food_weather:
                context_score += 1
                
            # 시간대 (최대 3점)
            if 7 <= hour <= 10 and ("가벼운" in heaviness or cal < 400):
                context_score += 3
            elif 17 <= hour <= 21 and cal > 400:
                context_score += 3
            elif hour >= 22 and (spicy > 0 or "기름" in taste):
                context_score += 3
                
            # 감정/동행 (최대 4점)
            if "스트레스" in emotion and (spicy > 0 or "스트레스" in food_emotion):
                context_score += 2
            elif "우울" in emotion and ("위로" in food_emotion or "국물" in taste):
                context_score += 2
                
            if "혼자" in companion and ("혼자" in food_people or "1인" in food_people):
                context_score += 2
            elif "여럿" in companion and "여럿" in food_people:
                context_score += 2
                
            score += min(10.0, context_score)

            # ── 5. 랜덤 노이즈 (동점 브레이킹) ─────────
            score += np.random.uniform(0.0, 1.0)

            c["score"] = round(score, 3)

        return sorted(candidates, key=lambda x: x.get("score", 0), reverse=True)

