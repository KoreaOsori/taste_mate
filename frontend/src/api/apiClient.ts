import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface MealRecord {
    id?: string;
    user_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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
    target_calories: number;
    current_calories: number;
    weight?: number;
    target_weight?: number;
}

export interface Recommendation {
    food_name: string;
    reason: string;
    calories: number;
    restaurant: string;
}

export const mealService = {
    getMeals: async (userId: string, date?: string) => {
        const response = await apiClient.get<MealRecord[]>('/meals/', {
            params: { user_id: userId, date },
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

export const recommendService = {
    getRecommendations: async (userId: string) => {
        const response = await apiClient.get<Recommendation[]>(`/recommend/${userId}`);
        return response.data;
    },
};

export default apiClient;
