from typing import List, Dict
import numpy as np

class RecommendationRanker:
    def __init__(self, model_path: str = None):
        self.model = None # Placeholder for future ML model
        
    def score_candidates(self, candidates: List[Dict], user_features: Dict) -> List[Dict]:
        """
        Scores candidates based on user features and item features (foods_v2 schema).
        user_features expects:
          - target_calories: int (from user profile)
          - consumed_calories: int (from today's meals)
          - hour: int
          - weather: str
          - emotion: str (optional)
          - companion: str (optional)
          - preference: str (optional)
          - budget: str (optional)
          - categories: list of str (optional) — 사용자가 선택한 음식 종류(중식, 패스트푸드 등). 이 목록에 있는 종류만 추천.
        """
        
        target_cal = user_features.get('target_calories', 2000)
        consumed_cal = user_features.get('consumed_calories', 0)
        remaining_cal = max(0, target_cal - consumed_cal)
        
        emotion = user_features.get('emotion')
        companion = user_features.get('companion')
        preference = user_features.get('preference')
        budget = user_features.get('budget')
        weather = user_features.get('weather', '맑음')
        allowed_categories = user_features.get('categories') or []
        
        for candidate in candidates:
            score = 0.0
            
            # --- 0. Category Match (필수) — 사용자가 선택한 음식 종류만 추천 ---
            if allowed_categories:
                food_category = (candidate.get('category') or '').strip()
                if food_category in allowed_categories:
                    score += 20  # 선택한 종류면 큰 가산
                else:
                    score -= 50  # 선택 안 한 종류(예: 일식)는 강한 감점으로 하단으로
            # allowed_categories 비어 있으면 카테고리 제한 없음 (바로 추천 모드 등)
            
            # --- 1. Nutrition Match (Calories) ---
            food_cal = candidate.get('calories', 0)
            if food_cal > 0:
                # We want the food calories to be close to the remaining calories, 
                # or at least not strictly exceed it by a huge margin.
                # A simple heuristic: penalty for difference
                diff = abs(remaining_cal - food_cal)
                # Max 10 points for perfect match, decreasing as diff increases
                cal_score = max(0, 10 - (diff / 100))
                score += cal_score
            
            # --- 2. User Q&A Matching ---
            
            # Preference (Heaviness / Taste)
            # mapping preference options like '가벼운', '든든한', '매콤한', '담백한'
            food_heaviness = candidate.get('meal_heaviness', '')
            food_taste = candidate.get('taste', '')
            
            if preference:
                if preference == '가벼운' and '가벼운' in food_heaviness:
                    score += 5
                elif preference == '든든한' and '무거운' in food_heaviness:
                    score += 5
                elif preference == '매콤한' and candidate.get('spicy_level', 0) > 0:
                    score += 5
                elif preference == '담백한' and '담백' in food_taste:
                    score += 5
                elif preference == '기름진' and candidate.get('fat', 0) > 20: # Example logic
                    score += 5
            
            # Emotion Match
            # Mapping emojis/feelings to `emotion_state` like '위로/안정/회복'
            food_emotion = candidate.get('emotion_state', '')
            if emotion:
                if '피곤' in emotion and '회복' in food_emotion:
                    score += 3
                elif '기분 좋을' in emotion and '축하' in food_emotion:
                    score += 3
                # Add more heuristics as foods_v2 metadata gets richer
            
            # Companion Match
            food_people = candidate.get('preferred_people', '')
            if companion:
                if '혼자' in companion and '혼자' in food_people:
                    score += 3
                elif '친구' in companion and '여럿' in food_people:
                    score += 3
                elif '가족' in companion and '다같이' in food_people:
                    score += 3
            
            # Budget Match
            food_price = candidate.get('price_per_serving', 0)
            if budget:
                if budget == '저렴' and food_price <= 10000:
                    score += 4
                elif budget == '보통' and 10000 < food_price <= 20000:
                    score += 4
                elif budget == '고급' and food_price > 20000:
                    score += 4
                
            # --- 3. Context Match ---
            food_weather = candidate.get('preferred_weather', '')
            if '비' in weather and '비' in food_weather:
                score += 2
            elif '눈' in weather and '눈' in food_weather:
                score += 2
            elif '맑음' in weather and '맑음' in food_weather:
                score += 2
                
            # Randomness to break ties and introduce variety
            score += np.random.uniform(0, 1)
            
            candidate['score'] = score
            
        return sorted(candidates, key=lambda x: x['score'], reverse=True)
