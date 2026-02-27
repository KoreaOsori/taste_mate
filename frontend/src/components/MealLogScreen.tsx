import { useState } from 'react';
import { UserProfile, Meal } from '../App';
import { Plus, X, Search, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { mealService } from '../api/apiClient';

interface MealLogScreenProps {
  userProfile: UserProfile;
  todaysMeals: Meal[];
  setTodaysMeals: (meals: Meal[]) => void;
  updateCurrentCalories: (calories: number) => void;
}

export function MealLogScreen({ userProfile, todaysMeals, setTodaysMeals, updateCurrentCalories }: MealLogScreenProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    restaurantLink: '',
  });

  const handleAddMeal = async () => {
    if (!formData.foodName || !formData.calories) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      type: formData.type,
      foodName: formData.foodName,
      calories: parseInt(formData.calories),
      protein: parseInt(formData.protein) || 0,
      carbs: parseInt(formData.carbs) || 0,
      fat: parseInt(formData.fat) || 0,
      restaurantLink: formData.restaurantLink,
      timestamp: new Date().toISOString(),
    };

    try {
      // Send to FastAPI backend
      const saved = await mealService.createMeal({
        user_id: userProfile.user_id,
        type: formData.type,
        food_name: formData.foodName,
        calories: parseInt(formData.calories),
        protein: parseInt(formData.protein) || 0,
        carbs: parseInt(formData.carbs) || 0,
        fat: parseInt(formData.fat) || 0,
        restaurant_link: formData.restaurantLink || undefined,
        timestamp: new Date().toISOString(),
      });
      // Use server-assigned ID if available
      if (saved?.id) newMeal.id = saved.id;
    } catch (error) {
      console.warn('식사 기록 백엔드 저장 실패 (로컬 저장):', error);
    } finally {
      // Always add meal locally regardless of backend result
      setTodaysMeals([...todaysMeals, newMeal]);
      updateCurrentCalories(newMeal.calories);

      setFormData({
        type: 'lunch',
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        restaurantLink: '',
      });
      setShowAddModal(false);
    }
  };


  const handleDeleteMeal = async (meal: Meal) => {
    try {
      // Check if Supabase is configured
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-4e0538b1/meals/${userProfile.user_id}/${today}/${meal.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          console.warn('Failed to delete meal from backend');
        }
      } else {
        console.log('Supabase not configured, deleting locally only');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    } finally {
      // Always delete locally
      setTodaysMeals(todaysMeals.filter(m => m.id !== meal.id));
      updateCurrentCalories(-meal.calories);
    }
  };

  const searchRestaurant = (foodName: string) => {
    const encodedFood = encodeURIComponent(foodName);
    window.open(`https://search.naver.com/search.naver?query=${encodedFood}+맛집`, '_blank');
  };

  const totalCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const mealsByType = {
    breakfast: todaysMeals.filter(m => m.type === 'breakfast'),
    lunch: todaysMeals.filter(m => m.type === 'lunch'),
    dinner: todaysMeals.filter(m => m.type === 'dinner'),
    snack: todaysMeals.filter(m => m.type === 'snack'),
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">식사 기록</h1>
        <p className="text-sm text-gray-600 mt-1">
          오늘 {totalCalories}kcal / {userProfile.target_calories}kcal
        </p>
      </div>

      {/* Add Meal Button */}
      <div className="px-6 py-4">
        <Button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-green-600 hover:bg-green-700 h-14 text-base"
        >
          <Plus className="w-5 h-5 mr-2" />
          식사 추가하기
        </Button>
      </div>

      {/* Meals by Type */}
      <div className="px-6 space-y-6">
        {/* Breakfast */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">🌅 아침</h2>
            <span className="text-sm text-gray-600">
              {mealsByType.breakfast.reduce((sum, m) => sum + m.calories, 0)} kcal
            </span>
          </div>
          {mealsByType.breakfast.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-500">아직 기록이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mealsByType.breakfast.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} onSearch={searchRestaurant} />
              ))}
            </div>
          )}
        </div>

        {/* Lunch */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">☀️ 점심</h2>
            <span className="text-sm text-gray-600">
              {mealsByType.lunch.reduce((sum, m) => sum + m.calories, 0)} kcal
            </span>
          </div>
          {mealsByType.lunch.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-500">아직 기록이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mealsByType.lunch.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} onSearch={searchRestaurant} />
              ))}
            </div>
          )}
        </div>

        {/* Dinner */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">🌙 저녁</h2>
            <span className="text-sm text-gray-600">
              {mealsByType.dinner.reduce((sum, m) => sum + m.calories, 0)} kcal
            </span>
          </div>
          {mealsByType.dinner.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-500">아직 기록이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mealsByType.dinner.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} onSearch={searchRestaurant} />
              ))}
            </div>
          )}
        </div>

        {/* Snacks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">🍪 간식</h2>
            <span className="text-sm text-gray-600">
              {mealsByType.snack.reduce((sum, m) => sum + m.calories, 0)} kcal
            </span>
          </div>
          {mealsByType.snack.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-500">아직 기록이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mealsByType.snack.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDeleteMeal} onSearch={searchRestaurant} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold">식사 추가</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label>식사 시간</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { value: 'breakfast', label: '아침', emoji: '🌅' },
                    { value: 'lunch', label: '점심', emoji: '☀️' },
                    { value: 'dinner', label: '저녁', emoji: '🌙' },
                    { value: 'snack', label: '간식', emoji: '🍪' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all ${formData.type === type.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200'
                        }`}
                    >
                      <div className="text-xl mb-1">{type.emoji}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="foodName">음식 이름 *</Label>
                <Input
                  id="foodName"
                  value={formData.foodName}
                  onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                  placeholder="예: 닭가슴살 샐러드"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="calories">칼로리 (kcal) *</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="350"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="protein">단백질 (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    placeholder="30"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">탄수화물 (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    placeholder="25"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fat">지방 (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={formData.fat}
                    onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="restaurantLink">식당/배달 링크 (선택)</Label>
                <Input
                  id="restaurantLink"
                  value={formData.restaurantLink}
                  onChange={(e) => setFormData({ ...formData, restaurantLink: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">네이버, 배민, 요기요 링크를 저장할 수 있어요</p>
              </div>

              <Button
                onClick={handleAddMeal}
                disabled={!formData.foodName || !formData.calories}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                추가하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({ meal, onDelete, onSearch }: { meal: Meal; onDelete: (meal: Meal) => void; onSearch: (foodName: string) => void }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{meal.foodName}</h3>
          <div className="flex gap-3 text-xs text-gray-600">
            <span>단백질 {meal.protein}g</span>
            <span>탄수화물 {meal.carbs}g</span>
            <span>지방 {meal.fat}g</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">{meal.calories}</p>
          <p className="text-xs text-gray-500">kcal</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {meal.restaurantLink && (
          <a
            href={meal.restaurantLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-100"
          >
            <ExternalLink className="w-3 h-3" />
            링크 보기
          </a>
        )}
        <button
          onClick={() => onSearch(meal.foodName)}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-200"
        >
          <Search className="w-3 h-3" />
          맛집 검색
        </button>
        <button
          onClick={() => onDelete(meal)}
          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100"
        >
          삭제
        </button>
      </div>
    </div>
  );
}