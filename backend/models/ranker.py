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
        """
        
        target_cal = user_features.get('target_calories', 2000)
        consumed_cal = user_features.get('consumed_calories', 0)
        remaining_cal = max(0, target_cal - consumed_cal)
        
        emotion = user_features.get('emotion')
        companion = user_features.get('companion')
        preference = user_features.get('preference')
        budget = user_features.get('budget')
        weather = user_features.get('weather', '맑음')
        goal = user_features.get('goal', 'balanced')
        hour = user_features.get('hour', 12)
        disliked_ids = user_features.get('disliked_ids', [])
        
        for candidate in candidates:
            # 0. Check Negative Feedback (Disliked items)
            item_id = str(candidate.get('id', ''))
            if item_id in disliked_ids:
                candidate['score'] = -100.0 # Force to bottom
                continue

            score = 0.0
            
            # --- 1. User Preference (Selected Category) Match (50% Base + Absolute Multiplier) ---
            pref_points = 0.0
            food_category = candidate.get('category', '')
            food_heaviness = candidate.get('meal_heaviness', '')
            food_taste = candidate.get('taste', '')
            food_price = candidate.get('price_per_serving', 0)
            
            if preference:
                # ABSOLUTE MATCH: If the user explicitly chose this category, it takes precedence.
                if preference in food_category or preference in food_heaviness:
                    score += 100.0 # Massive priority boost for exact category match
                
                # Soft match against description or specific preference string
                if preference in food_taste:
                    pref_points += 25
                
                # Spicy/Heaviness match
                if '매콤' in preference and candidate.get('spicy_level', 0) > 0:
                    pref_points += 20
                elif '든든' in preference and '무거운' in food_heaviness:
                    pref_points += 20
                elif '가벼운' in preference and '가벼운' in food_heaviness:
                    pref_points += 20

            # Budget check
            if budget:
                if budget == '저렴' and food_price <= 12000: pref_points += 10
                elif budget == '보통' and 12000 < food_price <= 25000: pref_points += 10
                elif budget == '고급' and food_price > 25000: pref_points += 10
            
            score += min(50, pref_points)
            
            # --- 2. Nutrition Match (30% / Max 30 points) ---
            nutri_points = 0.0
            food_cal = candidate.get('calories', 0)
            if food_cal > 0:
                diff = abs(remaining_cal - food_cal)
                # Perfect match (0 diff) -> 20 pts, diff of 500 -> 0 pts
                cal_score = max(0, 20 - (diff / 25))
                nutri_points += cal_score
            
            # Protein/Carb/Fat balance hint
            # If target macro is high protein and food is high protein, add points
            if goal == 'protein_high' and candidate.get('protein', 0) > 30:
                nutri_points += 10
            elif goal == 'weight_loss' and food_cal < 500:
                nutri_points += 10
            
            score += min(30, nutri_points)
            
            # --- 3. Context Match (20% / Max 20 points) ---
            context_points = 0.0
            food_weather = candidate.get('preferred_weather', '')
            food_emotion = candidate.get('emotion_state', '')
            
            # Weather match
            if weather:
                if weather in food_weather: context_points += 10
                elif '비' in weather and '얼큰' in food_taste: context_points += 10
            
            # Emotion/Time match
            if emotion and any(e in food_emotion for e in ['회복', '보상', '위로']):
                context_points += 5
            
            if 11 <= hour <= 14: # Lunch
                if '든든' in food_heaviness: context_points += 5
            elif hour >= 20: # Late night
                if '가벼운' in food_heaviness: context_points += 5
            
            score += min(20, context_points)
                
            # Randomness to break ties (minimal)
            score += np.random.uniform(0, 0.5)
            
            candidate['score'] = score
            
        return sorted(candidates, key=lambda x: x['score'], reverse=True)
