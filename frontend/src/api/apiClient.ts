import axios from 'axios';

// Docker 등에서 VITE_USE_PROXY=true 이면 같은 출처(/api/v1)로 요청 → Vite가 백엔드로 프록시
const API_BASE_URL =
  import.meta.env.VITE_USE_PROXY === 'true'
    ? '/api/v1'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1');

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface MealRecord {
    id?: string;
    user_id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    restaurant_link?: string;
    timestamp: string;
}

export interface UserProfile {
    user_id: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    height: number;
    weight: number;
    target_weight?: number;
    target_calories: number;
    current_calories: number;
    breakfast_time?: string;
    lunch_time?: string;
    dinner_time?: string;
    activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
    goal: 'lose' | 'balanced' | 'gain';
    preferred_categories: string[];
    disliked_foods?: string[];
    restricted_foods?: string[];
    location?: string;
    location_consent?: boolean;
}

export interface Restaurant {
    id: string;
    name: string;
    category: string;
    distance: number;
    rating: number;
    reviewCount: number;
    signature: string;
    signatureCalories: number;
    price: string;
    deliveryTime: string;
    naverLink: string;
    baeminLink?: string;
    yogiyoLink?: string;
    imageUrl: string;
    reason: string;
    protein: number;
    carbs: number;
    fat: number;
    address: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export const mealService = {
    getMeals: async (userId: string, date?: string) => {
        const response = await apiClient.get<MealRecord[]>('/meals/', {
            params: { user_id: userId, date },
        });
        return response.data;
    },
    /** 해당 월 전체 식사 조회 (캘린더에 '데이터 있는 날' 표시용) */
    getMealsForMonth: async (userId: string, year: number, month: number) => {
        const response = await apiClient.get<MealRecord[]>('/meals/', {
            params: { user_id: userId, year, month },
        });
        return response.data;
    },
    createMeal: async (meal: MealRecord) => {
        const response = await apiClient.post<MealRecord>('/meals/', meal);
        return response.data;
    },
};

export const profileService = {
    getProfile: async (userId: string) => {
        const response = await apiClient.get<UserProfile>(`/profile/${userId}`);
        return response.data;
    },
    updateProfile: async (userId: string, profile: UserProfile) => {
        const response = await apiClient.put<UserProfile>(`/profile/${userId}`, profile);
        return response.data;
    },
};

/** 음식 이름 검색 추천 (식사 추가 시 foods_v2 기반) */
export interface FoodSuggestion {
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export const recommendService = {
    getRecommendations: async (userId: string, lat?: number, lng?: number, weather?: string, hour?: number, emotion?: string, companion?: string, preference?: string, budget?: string) => {
        const response = await apiClient.get<Restaurant[]>(`/recommend/${userId}`, {
            params: { lat, lng, weather, hour, emotion, companion, preference, budget },
        });
        return response.data;
    },
    getAddress: async (lat: number, lng: number) => {
        const response = await apiClient.get<{ address: string }>('/recommend/address', {
            params: { lat, lng },
        });
        return response.data;
    },
    /** 음식 이름으로 DB 검색 → 비슷한 음식 추천 (칼로리·영양소 자동 입력용) */
    foodSearch: async (q: string): Promise<FoodSuggestion[]> => {
        if (!q?.trim()) return [];
        const response = await apiClient.get<FoodSuggestion[]>('/recommend/food-search', {
            params: { q: q.trim() },
        });
        return response.data ?? [];
    },
};

export const chatService = {
    getHistory: async (userId: string) => {
        const response = await apiClient.get<ChatMessage[]>(`/chat/history/${userId}`);
        return response.data;
    },
    sendMessage: async (userId: string, message: string, userProfile: Record<string, unknown>) => {
        const response = await apiClient.post<{ message: ChatMessage }>('/chat/message', {
            user_id: userId,
            message,
            user_profile: userProfile,
        });
        return response.data;
    },
};

export const authService = {
    checkUser: async (email: string) => {
        const response = await apiClient.post<{ exists: boolean }>('/auth/check-user', { email });
        return response.data;
    },
};

export default apiClient;
