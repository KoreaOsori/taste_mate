import { useState, useEffect } from 'react';
import { UserProfile, Meal, Screen } from '../App';
import { ChevronLeft, ChevronRight, Flame, TrendingUp, TrendingDown, Minus, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { mealService } from '../api/apiClient';

interface CalendarScreenProps {
  userProfile: UserProfile;
  onNavigate: (screen: Screen) => void;
}

interface DayData {
  date: string;
  calories: number;
  meals: Meal[];
}

export function CalendarScreenWithReport({ userProfile, onNavigate }: CalendarScreenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddMealDialog, setShowAddMealDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});

  // Fetch meals when month changes or on initial mount
  useEffect(() => {
    const fetchMonthMeals = async () => {
      setIsLoading(true);
      try {
        // In a real app, we might fetch the entire month. 
        // For now, we fetch for the currently selected date if it exists.
        if (selectedDate) {
          const meals = await mealService.getMeals(userProfile.userId, selectedDate);

          const dayMeals: Meal[] = meals.map((m: any) => ({
            id: m.id || Math.random().toString(),
            mealType: m.meal_type as any,
            foodName: m.food_name,
            calories: m.calories,
            protein: m.protein || 0,
            carbs: m.carbs || 0,
            fat: m.fat || 0,
            timestamp: m.timestamp
          }));

          const totalCalories = dayMeals.reduce((sum: number, m: Meal) => sum + m.calories, 0);

          setCalendarData(prev => ({
            ...prev,
            [selectedDate]: {
              date: selectedDate,
              calories: totalCalories,
              meals: dayMeals
            }
          }));
        }
      } catch (error) {
        console.error("Failed to fetch meals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthMeals();
  }, [selectedDate, userProfile.userId]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayData = (date: Date | null): DayData | null => {
    if (!date) return null;
    const key = formatDateKey(date);
    return calendarData[key] || null;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const selectedDayData = selectedDate ? calendarData[selectedDate] : null;

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  const getCalorieStatus = (calories: number) => {
    const target = userProfile.targetCalories;
    const diff = calories - target;
    const percentage = (diff / target) * 100;

    if (Math.abs(percentage) < 10) {
      return { icon: Minus, color: 'text-green-600', text: '목표 달성' };
    } else if (diff > 0) {
      return { icon: TrendingUp, color: 'text-red-600', text: `+${diff}kcal` };
    } else {
      return { icon: TrendingDown, color: 'text-blue-600', text: `${diff}kcal` };
    }
  };

  const handleAddMeal = async () => {
    if (selectedDate) {
      setIsLoading(true);
      try {
        const mealToCreate = {
          user_id: userProfile.userId,
          meal_type: newMeal.mealType,
          food_name: newMeal.foodName,
          calories: parseFloat(newMeal.calories),
          protein: parseFloat(newMeal.protein) || 0,
          carbs: parseFloat(newMeal.carbs) || 0,
          fat: parseFloat(newMeal.fat) || 0,
          timestamp: new Date(selectedDate + 'T12:00:00').toISOString(),
        };

        const createdMeal = await mealService.createMeal(mealToCreate as any);

        // Update local state
        const updatedMeals: Meal[] = [...(calendarData[selectedDate]?.meals || []), {
          id: createdMeal.id || Math.random().toString(),
          mealType: createdMeal.meal_type as any,
          foodName: createdMeal.food_name,
          calories: createdMeal.calories,
          protein: createdMeal.protein || 0,
          carbs: createdMeal.carbs || 0,
          fat: createdMeal.fat || 0,
          timestamp: createdMeal.timestamp
        }];

        const totalCalories = updatedMeals.reduce((sum: number, m: Meal) => sum + m.calories, 0);

        setCalendarData(prev => ({
          ...prev,
          [selectedDate]: {
            date: selectedDate,
            calories: totalCalories,
            meals: updatedMeals
          }
        }));

        setShowAddMealDialog(false);
        setNewMeal({
          mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
          foodName: '',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
        });
      } catch (error) {
        console.error("Failed to add meal:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}
      {/* Header with AI Report Button */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-1">밥친구 일지</h1>
            <p className="text-green-100 text-base">식습관을 한눈에 확인하세요</p>
          </div>
          <button
            onClick={() => onNavigate('health-report')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm border border-white/30"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-bold">AI 리포트</span>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-6 py-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayData = getDayData(date);
            const dateKey = formatDateKey(date);
            const isToday = formatDateKey(new Date()) === dateKey;
            const isSelected = selectedDate === dateKey;

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition-all ${isSelected
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : isToday
                    ? 'bg-green-100 text-green-900'
                    : dayData
                      ? 'bg-white shadow-sm hover:shadow-md'
                      : 'bg-gray-50 text-gray-400'
                  }`}
              >
                <span className={`text-sm font-medium mb-1 ${isSelected ? 'text-white' : ''}`}>
                  {date.getDate()}
                </span>
                {dayData && (
                  <div className="flex items-center gap-0.5">
                    <Flame className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                      {dayData.calories}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details */}
        {selectedDayData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {new Date(selectedDate!).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </h3>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {selectedDayData.calories}kcal
                </span>
              </div>
            </div>

            {/* Calorie Status */}
            <div className="mb-4">
              {(() => {
                const status = getCalorieStatus(selectedDayData.calories);
                const StatusIcon = status.icon;
                return (
                  <div className={`flex items-center gap-2 ${status.color}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-medium">{status.text}</span>
                    <span className="text-sm text-gray-500">
                      (목표: {userProfile.targetCalories}kcal)
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Nutrition Balance */}
            {selectedDayData.meals.length > 0 && (() => {
              const totalProtein = selectedDayData.meals.reduce((sum: number, meal: Meal) => sum + meal.protein, 0);
              const totalCarbs = selectedDayData.meals.reduce((sum: number, meal: Meal) => sum + meal.carbs, 0);
              const totalFat = selectedDayData.meals.reduce((sum: number, meal: Meal) => sum + meal.fat, 0);
              const totalMacros = totalProtein + totalCarbs + totalFat;

              const proteinPercent = Math.round((totalProtein / totalMacros) * 100);
              const carbsPercent = Math.round((totalCarbs / totalMacros) * 100);
              const fatPercent = Math.round((totalFat / totalMacros) * 100);

              return (
                <div className="mb-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 border border-green-100">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    영양소 균형
                  </h4>

                  {/* Macro Distribution Bar */}
                  <div className="mb-3">
                    <div className="flex h-6 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${proteinPercent}%` }}
                      >
                        {proteinPercent > 10 && `${proteinPercent}%`}
                      </div>
                      <div
                        className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${carbsPercent}%` }}
                      >
                        {carbsPercent > 10 && `${carbsPercent}%`}
                      </div>
                      <div
                        className="bg-orange-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${fatPercent}%` }}
                      >
                        {fatPercent > 10 && `${fatPercent}%`}
                      </div>
                    </div>
                  </div>

                  {/* Macro Details */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600">단백질</span>
                      </div>
                      <p className="font-bold text-gray-900">{totalProtein}g</p>
                      <p className="text-xs text-gray-500">{proteinPercent}%</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-gray-600">탄수화물</span>
                      </div>
                      <p className="font-bold text-gray-900">{totalCarbs}g</p>
                      <p className="text-xs text-gray-500">{carbsPercent}%</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-xs text-gray-600">지방</span>
                      </div>
                      <p className="font-bold text-gray-900">{totalFat}g</p>
                      <p className="text-xs text-gray-500">{fatPercent}%</p>
                    </div>
                  </div>

                  {/* Balance Assessment */}
                  <div className="mt-3 pt-3 border-t border-green-200">
                    {(() => {
                      // Ideal: Protein 20-35%, Carbs 45-65%, Fat 20-35%
                      const isBalanced =
                        proteinPercent >= 20 && proteinPercent <= 35 &&
                        carbsPercent >= 45 && carbsPercent <= 65 &&
                        fatPercent >= 20 && fatPercent <= 35;

                      if (isBalanced) {
                        return (
                          <p className="text-xs text-green-700 font-medium">
                            ✨ 영양 균형이 잘 맞춰져 있어요!
                          </p>
                        );
                      } else if (proteinPercent < 20) {
                        return (
                          <p className="text-xs text-blue-700 font-medium">
                            💪 단백질 섭취를 조금 더 늘려보세요
                          </p>
                        );
                      } else if (carbsPercent > 65) {
                        return (
                          <p className="text-xs text-yellow-700 font-medium">
                            🌾 탄수화물 비중이 높아요. 채소와 단백질을 더해보세요
                          </p>
                        );
                      } else if (fatPercent > 35) {
                        return (
                          <p className="text-xs text-orange-700 font-medium">
                            🥑 지방 섭취가 많아요. 가벼운 식사를 고려해보세요
                          </p>
                        );
                      } else {
                        return (
                          <p className="text-xs text-gray-600">
                            영양소를 골고루 섭취하고 있어요
                          </p>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Meals List */}
            {selectedDayData.meals.length > 0 ? (
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">식사 기록</h4>
                  <Button
                    onClick={() => setShowAddMealDialog(true)}
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
                {selectedDayData.meals.map((meal) => (
                  <div key={meal.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {meal.mealType === 'breakfast' ? '아침' :
                            meal.mealType === 'lunch' ? '점심' :
                              meal.mealType === 'dinner' ? '저녁' : '간식'}
                        </span>
                        <h5 className="font-medium text-gray-900 mt-1">{meal.foodName}</h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(meal.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{meal.calories}</p>
                        <p className="text-xs text-gray-500">kcal</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-600 pt-2 border-t border-gray-200">
                      <span>단백질 {meal.protein}g</span>
                      <span>탄수화물 {meal.carbs}g</span>
                      <span>지방 {meal.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Flame className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">기록된 식사가 없습니다</p>
                <Button
                  onClick={() => setShowAddMealDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 식사 기록하기
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Add Meal Dialog */}
        <Dialog open={showAddMealDialog} onOpenChange={setShowAddMealDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>식사 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mealType">식사 시간</Label>
                <Select
                  value={newMeal.mealType}
                  onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') =>
                    setNewMeal({ ...newMeal, mealType: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="식사 시간 선택">
                      {newMeal.mealType === 'breakfast' ? '아침' :
                        newMeal.mealType === 'lunch' ? '점심' :
                          newMeal.mealType === 'dinner' ? '저녁' : '간식'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">아침</SelectItem>
                    <SelectItem value="lunch">점심</SelectItem>
                    <SelectItem value="dinner">저녁</SelectItem>
                    <SelectItem value="snack">간식</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodName">음식 이름</Label>
                <Input
                  id="foodName"
                  value={newMeal.foodName}
                  onChange={(e) => setNewMeal({ ...newMeal, foodName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">칼로리 (kcal)</Label>
                <Input
                  id="calories"
                  value={newMeal.calories}
                  onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">단백질 (g)</Label>
                <Input
                  id="protein"
                  value={newMeal.protein}
                  onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">탄수화물 (g)</Label>
                <Input
                  id="carbs"
                  value={newMeal.carbs}
                  onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">지방 (g)</Label>
                <Input
                  id="fat"
                  value={newMeal.fat}
                  onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAddMeal}
                className="bg-green-600 hover:bg-green-700"
              >
                추가하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Summary Stats */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-gray-900 mb-4">이달의 식습관 요약</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">평균 칼로리</p>
              <p className="text-2xl font-bold text-gray-900">1,883</p>
              <p className="text-xs text-gray-500 mt-1">kcal/일</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">목표 달성률</p>
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-xs text-gray-500 mt-1">23일 / 25일</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}