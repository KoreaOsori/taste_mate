import { useState } from 'react';
import { UserProfile, Meal } from '../App';
import { ChevronLeft, ChevronRight, Flame, TrendingUp, TrendingDown, Minus, Apple, Droplet, Zap, Trash2 } from 'lucide-react';

interface CalendarScreenProps {
  userProfile: UserProfile;
  todaysMeals: Meal[];
  onDeleteMeal?: (mealId: string) => void;
}

interface DayData {
  date: string;
  calories: number;
  meals: Meal[];
}

export function CalendarScreen({ userProfile, todaysMeals, onDeleteMeal }: CalendarScreenProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }); // Default to today

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Mock data for demonstration
  const mockCalendarData: Record<string, DayData> = {
    '2025-01-20': {
      date: '2025-01-20',
      calories: 1850,
      meals: [
        {
          id: '1',
          mealType: 'breakfast',
          foodName: '계란 토스트',
          calories: 320,
          protein: 15,
          carbs: 35,
          fat: 12,
          timestamp: '2025-01-20T08:00:00',
        },
        {
          id: '2',
          mealType: 'lunch',
          foodName: '닭가슴살 샐러드',
          calories: 450,
          protein: 35,
          carbs: 25,
          fat: 18,
          timestamp: '2025-01-20T12:30:00',
        },
        {
          id: '3',
          mealType: 'dinner',
          foodName: '연어 구이',
          calories: 580,
          protein: 42,
          carbs: 30,
          fat: 28,
          timestamp: '2025-01-20T19:00:00',
        },
        {
          id: '4',
          mealType: 'snack',
          foodName: '그릭 요거트',
          calories: 150,
          protein: 12,
          carbs: 15,
          fat: 4,
          timestamp: '2025-01-20T15:00:00',
        },
      ],
    },
    '2025-01-21': {
      date: '2025-01-21',
      calories: 2150,
      meals: [
        {
          id: '5',
          mealType: 'breakfast',
          foodName: '아보카도 토스트',
          calories: 380,
          protein: 12,
          carbs: 42,
          fat: 18,
          timestamp: '2025-01-21T08:30:00',
        },
        {
          id: '6',
          mealType: 'lunch',
          foodName: '김치찌개 정식',
          calories: 720,
          protein: 28,
          carbs: 65,
          fat: 22,
          timestamp: '2025-01-21T12:00:00',
        },
        {
          id: '7',
          mealType: 'dinner',
          foodName: '파스타',
          calories: 850,
          protein: 25,
          carbs: 95,
          fat: 32,
          timestamp: '2025-01-21T19:30:00',
        },
      ],
    },
    '2025-01-22': {
      date: '2025-01-22',
      calories: 1650,
      meals: [],
    },
  };

  // Add today's meals to mock data
  const todayKey = formatDateKey(today);
  if (todaysMeals.length > 0) {
    mockCalendarData[todayKey] = {
      date: todayKey,
      calories: todaysMeals.reduce((sum, meal) => sum + meal.calories, 0),
      meals: todaysMeals,
    };
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty days for the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getDayData = (date: Date | null): DayData | null => {
    if (!date) return null;
    const key = formatDateKey(date);
    return mockCalendarData[key] || null;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const selectedDayData = selectedDate ? mockCalendarData[selectedDate] : null;

  // Calculate target macros based on goal
  const targetProtein = userProfile.goal === 'lose' ? 120 : userProfile.goal === 'gain' ? 150 : 100;
  const targetCarbs = userProfile.goal === 'lose' ? 180 : userProfile.goal === 'gain' ? 250 : 220;
  const targetFat = userProfile.goal === 'lose' ? 50 : userProfile.goal === 'gain' ? 70 : 60;

  // Calculate today's nutrition totals from selectedDayData
  const todayCalories = selectedDayData?.calories || 0;
  const todayProtein = selectedDayData?.meals.reduce((sum, meal) => sum + meal.protein, 0) || 0;
  const todayCarbs = selectedDayData?.meals.reduce((sum, meal) => sum + meal.carbs, 0) || 0;
  const todayFat = selectedDayData?.meals.reduce((sum, meal) => sum + meal.fat, 0) || 0;

  // Calculate percentages
  const proteinPercentage = Math.min((todayProtein / targetProtein) * 100, 100);
  const carbsPercentage = Math.min((todayCarbs / targetCarbs) * 100, 100);
  const fatPercentage = Math.min((todayFat / targetFat) * 100, 100);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold mb-2">밥친구 일지</h1>
        <p className="text-green-100 text-sm">식습관을 한눈에 확인하세요</p>
      </div>

      <div className="px-6 py-6">
        {/* Monthly Summary */}
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-5 border-2 border-blue-200 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">이달의 식습관 요약</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 rounded-xl p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-700 mb-1">평균 칼로리</p>
              <p className="text-2xl font-bold text-gray-900">1,883</p>
              <p className="text-xs text-gray-600 mt-1">kcal/일</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-700 mb-1">목표 달성률</p>
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-xs text-gray-600 mt-1">23일 / 25일</p>
            </div>
          </div>
        </div>

        {/* Today's Nutrition Details */}
        {selectedDayData && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">오늘 먹은 영양소</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Calories */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border-2 border-orange-300 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span className="text-xs font-bold text-gray-800">칼로리</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{todayCalories}</span>
                  <span className="text-xs font-medium text-gray-600">/ {userProfile.targetCalories}</span>
                </div>
                <div className="bg-orange-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((todayCalories / userProfile.targetCalories) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Protein - 파란색 (캘린더 뷰와 통일) */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-300 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold text-gray-800">단백질</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{todayProtein}g</span>
                  <span className="text-xs font-medium text-gray-600">/ {targetProtein}g</span>
                </div>
                <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${proteinPercentage}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border-2 border-yellow-300 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="w-5 h-5 text-yellow-700" />
                  <span className="text-xs font-bold text-gray-800">탄수화물</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{todayCarbs}g</span>
                  <span className="text-xs font-medium text-gray-600">/ {targetCarbs}g</span>
                </div>
                <div className="bg-yellow-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${carbsPercentage}%` }}
                  />
                </div>
              </div>

              {/* Fat - 주황색 (캘린더 뷰와 통일) */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border-2 border-orange-300 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="w-5 h-5 text-orange-600" />
                  <span className="text-xs font-bold text-gray-800">지방</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{todayFat}g</span>
                  <span className="text-xs font-medium text-gray-600">/ {targetFat}g</span>
                </div>
                <div className="bg-orange-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${fatPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Meal Records */}
        {selectedDayData && selectedDayData.meals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">오늘의 식사 기록</h3>
            <div className="space-y-3">
              {selectedDayData.meals.map((meal) => (
                <div key={meal.id} className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-gray-600 uppercase">
                        {meal.mealType === 'breakfast' ? '아침' :
                         meal.mealType === 'lunch' ? '점심' :
                         meal.mealType === 'dinner' ? '저녁' : '간식'}
                      </span>
                      <h5 className="text-base font-bold text-gray-900 mt-1">{meal.foodName}</h5>
                      <p className="text-xs font-medium text-gray-500 mt-1">
                        {new Date(meal.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{meal.calories}</p>
                        <p className="text-xs text-gray-500">kcal</p>
                      </div>
                      {onDeleteMeal && (
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="삭제"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs font-medium text-gray-700 pt-2 border-t border-gray-100">
                    <span>단백질 {meal.protein}g</span>
                    <span>탄수화물 {meal.carbs}g</span>
                    <span>지방 {meal.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-7 h-7 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-7 h-7 text-gray-600" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="text-center text-base font-bold text-gray-700 py-2">
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
                className={`aspect-square rounded-2xl p-2 flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-green-600 text-white shadow-xl scale-105'
                    : isToday
                    ? 'bg-green-100 text-green-900 border-2 border-green-400'
                    : dayData
                    ? 'bg-white shadow-md hover:shadow-lg border-2 border-gray-200'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                <span className={`text-base font-bold mb-1 ${isSelected ? 'text-white' : ''}`}>
                  {date.getDate()}
                </span>
                {dayData && (
                  <div className="flex items-center gap-1">
                    <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
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
          <div className="bg-white rounded-3xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom duration-300 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {new Date(selectedDate!).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </h3>
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {selectedDayData.calories}kcal
                </span>
              </div>
            </div>

            {/* Calorie Status */}
            <div className="mb-6">
              {(() => {
                const status = getCalorieStatus(selectedDayData.calories);
                const StatusIcon = status.icon;
                return (
                  <div className={`flex items-center gap-2 ${status.color} text-base font-semibold`}>
                    <StatusIcon className="w-6 h-6" />
                    <span>{status.text}</span>
                    <span className="text-sm text-gray-600">
                      (목표: {userProfile.targetCalories}kcal)
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Meals List */}
            {selectedDayData.meals.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-800 mb-3">식사 기록</h4>
                {selectedDayData.meals.map((meal) => (
                  <div key={meal.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-gray-600 uppercase">
                          {meal.mealType === 'breakfast' ? '아침' :
                           meal.mealType === 'lunch' ? '점심' :
                           meal.mealType === 'dinner' ? '저녁' : '간식'}
                        </span>
                        <h5 className="text-lg font-bold text-gray-900 mt-1">{meal.foodName}</h5>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                          {new Date(meal.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{meal.calories}</p>
                        <p className="text-sm text-gray-500">kcal</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm font-medium text-gray-700 pt-2 border-t-2 border-gray-200">
                      <span>단백질 {meal.protein}g</span>
                      <span>탄수화물 {meal.carbs}g</span>
                      <span>지방 {meal.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Flame className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">기록된 식사가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}