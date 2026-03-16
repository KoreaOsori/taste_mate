import { useState, useEffect, useRef } from 'react';
import { UserProfile, Meal, Screen } from '../App';
import { ChevronLeft, ChevronRight, ChevronDown, Flame, TrendingUp, TrendingDown, Minus, Sparkles, Plus, Loader2, UtensilsCrossed, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { mealService, recommendService, type FoodSuggestion } from '../api/apiClient';

interface CalendarScreenProps {
  userProfile: UserProfile;
  onNavigate: (screen: Screen) => void;
  initialSelectedDate?: string;
}

interface DayData {
  date: string;
  calories: number;
  meals: Meal[];
}

export function CalendarScreenWithReport({ userProfile, onNavigate, initialSelectedDate }: CalendarScreenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate ?? null);
  /** 'month' = 캘린더만, 'day' = 그날 메뉴 전용 화면(한 단계 깊이) */
  const [calendarView, setCalendarView] = useState<'month' | 'day'>('month');
  const [showAddMealDialog, setShowAddMealDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMeal, setNewMeal] = useState({
    type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [foodSuggestions, setFoodSuggestions] = useState<FoodSuggestion[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  const [addMealError, setAddMealError] = useState<string | null>(null);
  const foodSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 음식 이름 입력 시 디바운스 검색 → 비슷한 음식 추천
  useEffect(() => {
    if (!showAddMealDialog) return;
    const name = newMeal.foodName.trim();
    if (name.length < 1) {
      setFoodSuggestions([]);
      return;
    }
    if (foodSearchTimeoutRef.current) clearTimeout(foodSearchTimeoutRef.current);
    foodSearchTimeoutRef.current = setTimeout(async () => {
      setFoodSearchLoading(true);
      try {
        const list = await recommendService.foodSearch(name);
        setFoodSuggestions(list);
      } catch {
        setFoodSuggestions([]);
      } finally {
        setFoodSearchLoading(false);
      }
    }, 300);
    return () => {
      if (foodSearchTimeoutRef.current) clearTimeout(foodSearchTimeoutRef.current);
    };
  }, [showAddMealDialog, newMeal.foodName]);

  const applyFoodSuggestion = (s: FoodSuggestion) => {
    setNewMeal(prev => ({
      ...prev,
      foodName: s.name,
      calories: String(Math.round(s.calories ?? 0)),
      protein: s.protein != null ? String(s.protein) : '',
      carbs: s.carbs != null ? String(s.carbs) : '',
      fat: s.fat != null ? String(s.fat) : '',
    }));
    setFoodSuggestions([]);
  };

  // Prop에서 초기 선택 날짜가 바뀌면 동기화 (추천에서 넘어올 때 오늘 그날 보기로 진입)
  useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDate(initialSelectedDate);
      setCalendarView('day');
    }
  }, [initialSelectedDate]);

  const mapMealsToDay = (meals: any[]): Meal[] =>
    meals.map((m: any) => ({
      id: m.id || Math.random().toString(),
      type: m.type as any,
      foodName: m.food_name,
      calories: m.calories,
      protein: m.protein || 0,
      carbs: m.carbs || 0,
      fat: m.fat || 0,
      timestamp: m.timestamp
    }));

  // 표시 중인 월의 식사 데이터를 한 번에 조회 → 캘린더에 '데이터 있는 날' 표시
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-based for API
    const fetchMonth = async () => {
      setIsLoading(true);
      try {
        const meals = await mealService.getMealsForMonth(userProfile.user_id, year, month);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const next: Record<string, DayData> = {};
        for (let d = 1; d <= lastDay; d++) {
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayMeals = meals.filter((m: any) => {
            const t = new Date(m.timestamp);
            return t.getFullYear() === year && t.getMonth() + 1 === month && t.getDate() === d;
          });
          const mapped = mapMealsToDay(dayMeals);
          const calories = mapped.reduce((sum, m) => sum + m.calories, 0);
          next[dateKey] = { date: dateKey, calories, meals: mapped };
        }
        setCalendarData(prev => ({ ...prev, ...next }));
      } catch (e) {
        console.error("Failed to fetch month meals:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMonth();
  }, [currentDate.getFullYear(), currentDate.getMonth(), userProfile.user_id]);

  // 그날 보기 화면인데 해당 날짜 데이터가 아직 없으면 → 해당 일자만 조회해서 반드시 채움 (로딩 무한 방지)
  useEffect(() => {
    if (calendarView !== 'day' || !selectedDate) return;
    if (calendarData[selectedDate] !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const meals = await mealService.getMeals(userProfile.user_id, selectedDate);
        if (cancelled) return;
        const mapped = mapMealsToDay(meals);
        const calories = mapped.reduce((s, m) => s + m.calories, 0);
        setCalendarData(prev => ({ ...prev, [selectedDate]: { date: selectedDate, calories, meals: mapped } }));
      } catch (e) {
        if (cancelled) return;
        console.error("Failed to fetch day meals:", e);
        setCalendarData(prev => ({ ...prev, [selectedDate]: { date: selectedDate, calories: 0, meals: [] } }));
      }
    })();
    return () => { cancelled = true; };
  }, [calendarView, selectedDate, userProfile.user_id]);

  // 날짜 클릭 → 해당 월로 이동(필요 시) + 그날 보기 화면으로 한 단계 진입
  const onSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    const d = new Date(dateKey + 'T12:00:00');
    if (d.getFullYear() !== currentDate.getFullYear() || d.getMonth() !== currentDate.getMonth()) {
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setCalendarView('day');
  };

  const backToCalendar = () => {
    setCalendarView('month');
  };

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
    // 로컬 시간 기준 YYYY-MM-DD (UTC 변환 시 하루 밀리는 문제 방지)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const target = userProfile.target_calories;
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
    setAddMealError(null);
    const name = newMeal.foodName?.trim();
    if (!name) {
      setAddMealError('음식 이름을 입력해 주세요.');
      return;
    }
    if (!selectedDate) {
      setAddMealError('날짜를 먼저 선택해 주세요. 캘린더에서 날짜를 탭한 뒤 다시 시도해 주세요.');
      return;
    }
    setIsLoading(true);
    try {
      const mealToCreate = {
        user_id: userProfile.user_id,
        type: newMeal.type,
        food_name: name,
        calories: parseFloat(newMeal.calories) || 0,
        protein: parseFloat(newMeal.protein) || 0,
        carbs: parseFloat(newMeal.carbs) || 0,
        fat: parseFloat(newMeal.fat) || 0,
        timestamp: new Date(selectedDate + 'T12:00:00').toISOString(),
      };

      const createdMeal = await mealService.createMeal(mealToCreate as any);

      // Update local state so the new meal shows immediately
      const updatedMeals: Meal[] = [...(calendarData[selectedDate]?.meals || []), {
        id: createdMeal.id || Math.random().toString(),
        type: createdMeal.type as any,
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
      setAddMealError(null);
      setNewMeal({
        type: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
      });
    } catch (error: any) {
      console.error("Failed to add meal:", error);
      const message = error?.response?.data?.detail ?? error?.message ?? '식사 저장에 실패했습니다. 다시 시도해 주세요.';
      setAddMealError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setIsLoading(false);
    }
  };

  const dayLabel = (type: string) =>
    type === 'breakfast' ? '아침' : type === 'lunch' ? '점심' : type === 'dinner' ? '저녁' : '간식';

  const handleDeleteMeal = async (meal: Meal) => {
    if (!selectedDate) return;
    if (!confirm(`"${meal.foodName}" 메뉴를 삭제할까요?`)) return;
    try {
      await mealService.deleteMeal(userProfile.user_id, meal.id);
    } catch (e) {
      console.warn('Delete meal (backend):', e);
    }
    const nextMeals = (calendarData[selectedDate]?.meals || []).filter((m) => m.id !== meal.id);
    const totalCalories = nextMeals.reduce((sum: number, m: Meal) => sum + m.calories, 0);
    setCalendarData((prev) => ({
      ...prev,
      [selectedDate]: {
        date: selectedDate,
        calories: totalCalories,
        meals: nextMeals,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {calendarView === 'day' && selectedDate ? (
        /* 그날 보기 전용 화면 (한 단계 깊이) */
        <div className="min-h-screen bg-gray-50">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
            <button
              onClick={backToCalendar}
              className="p-2 -ml-1 rounded-lg hover:bg-gray-100"
              aria-label="캘린더로 돌아가기"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 flex-1">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </h1>
          </div>
          <div className="px-4 py-5 pb-24">
            {!selectedDayData ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <span>해당 날짜 불러오는 중...</span>
              </div>
            ) : selectedDayData.meals.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-1">이 날 기록된 식사가 없어요</p>
                <p className="text-sm text-gray-500 mb-6">첫 식사를 기록해 보세요</p>
                <Button onClick={() => setShowAddMealDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  첫 식사 기록하기
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">총 섭취 칼로리</span>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-2xl font-bold text-gray-900">{selectedDayData.calories}kcal</span>
                    </div>
                  </div>
                  {(() => {
                    const status = getCalorieStatus(selectedDayData.calories);
                    const StatusIcon = status.icon;
                    return (
                      <div className={`flex items-center gap-2 text-sm ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{status.text}</span>
                        <span className="text-gray-400">· 목표 {userProfile.target_calories}kcal</span>
                      </div>
                    );
                  })()}
                </div>

                {selectedDayData.meals.length > 0 && (() => {
                  const rawP = selectedDayData.meals.reduce((s, m) => s + m.protein, 0);
                  const rawC = selectedDayData.meals.reduce((s, m) => s + m.carbs, 0);
                  const rawF = selectedDayData.meals.reduce((s, m) => s + m.fat, 0);
                  const totalMacros = rawP + rawC + rawF;
                  const totalProtein = Math.round(rawP * 10) / 10;
                  const totalCarbs = Math.round(rawC * 10) / 10;
                  const totalFat = Math.round(rawF * 10) / 10;
                  let proteinPercent = totalMacros ? Math.round((rawP / totalMacros) * 100) : 0;
                  let carbsPercent = totalMacros ? Math.round((rawC / totalMacros) * 100) : 0;
                  let fatPercent = totalMacros ? Math.round((rawF / totalMacros) * 100) : 0;
                  const sum = proteinPercent + carbsPercent + fatPercent;
                  if (sum !== 100 && sum > 0) {
                    const diff = 100 - sum;
                    if (diff > 0) fatPercent += diff;
                    else if (diff < 0) fatPercent = Math.max(0, fatPercent + diff);
                  }
                  return (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 mb-6 border border-green-100">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        영양소 균형
                      </h3>
                      <div className="flex h-6 rounded-full overflow-hidden mb-3 bg-gray-100">
                        <div className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium transition-all" style={{ width: `${proteinPercent}%` }}>{proteinPercent > 12 && `${proteinPercent}%`}</div>
                        <div className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium transition-all" style={{ width: `${carbsPercent}%` }}>{carbsPercent > 12 && `${carbsPercent}%`}</div>
                        <div className="bg-orange-500 flex items-center justify-center text-xs text-white font-medium transition-all" style={{ width: `${fatPercent}%` }}>{fatPercent > 12 && `${fatPercent}%`}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div><span className="text-gray-500">단백질</span> <span className="font-semibold text-gray-900">{totalProtein}g</span></div>
                        <div><span className="text-gray-500">탄수화물</span> <span className="font-semibold text-gray-900">{totalCarbs}g</span></div>
                        <div><span className="text-gray-500">지방</span> <span className="font-semibold text-gray-900">{totalFat}g</span></div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-green-600" />
                    오늘 메뉴
                  </h3>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => setShowAddMealDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedDayData.meals.map((meal) => (
                    <div key={meal.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-green-600 uppercase">{dayLabel(meal.type)}</span>
                          <h4 className="font-semibold text-gray-900 mt-0.5 truncate">{meal.foodName}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(meal.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-lg font-bold text-green-600 inline-flex items-baseline gap-1">
                            {meal.calories}
                            <span className="text-sm font-medium text-gray-500">kcal</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(meal)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                            aria-label="메뉴 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                        <span>단백질 {meal.protein}g</span>
                        <span>탄수화물 {meal.carbs}g</span>
                        <span>지방 {meal.fat}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* 월 보기: 캘린더 그리드만 (하단 상세 패널 없음) */
        <>
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
                onClick={() => onSelectDate(dateKey)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center transition-all ${isSelected
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : isToday
                    ? 'bg-green-100 text-green-900'
                    : dayData && dayData.meals.length > 0
                      ? 'bg-white shadow-sm hover:shadow-md'
                      : 'bg-gray-50 text-gray-400'
                  }`}
              >
                <span className={`text-sm font-medium mb-1 ${isSelected ? 'text-white' : ''}`}>
                  {date.getDate()}
                </span>
                {dayData && dayData.meals.length > 0 && (
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
        <p className="text-center text-sm text-gray-500 mt-2">날짜를 탭하면 그날 메뉴를 볼 수 있어요</p>

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
        </>
      )}

      {/* 식사 추가 다이얼로그 (월/일 뷰 공통) */}
      <Dialog
        open={showAddMealDialog}
        onOpenChange={(open) => {
          setShowAddMealDialog(open);
          if (!open) {
            setFoodSuggestions([]);
            setAddMealError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>식사 추가</DialogTitle>
            {addMealError && (
              <p className="text-sm text-red-600 font-medium mt-2" role="alert">
                {addMealError}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mealType">식사 시간</Label>
              <Select
                value={newMeal.type}
                onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') =>
                  setNewMeal({ ...newMeal, type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="식사 시간 선택">
                    {newMeal.type === 'breakfast' ? '아침' :
                      newMeal.type === 'lunch' ? '점심' :
                        newMeal.type === 'dinner' ? '저녁' : '간식'}
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
            <div className="space-y-2 relative">
              <Label htmlFor="foodName">음식 이름</Label>
              <Input
                id="foodName"
                placeholder="예: 김치찌개, 국밥"
                value={newMeal.foodName}
                onChange={(e) => setNewMeal({ ...newMeal, foodName: e.target.value })}
              />
              {!foodSearchLoading && foodSuggestions.length > 0 && (
                <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden bg-white shadow-sm max-h-48 overflow-y-auto">
                  {foodSuggestions.map((s, i) => (
                    <button
                      key={`${s.name}-${i}`}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-green-50 flex items-center justify-between gap-2 text-sm"
                      onClick={() => applyFoodSuggestion(s)}
                    >
                      <span className="font-medium text-gray-900 truncate">{s.name}</span>
                      <span className="text-green-600 shrink-0">{Math.round(s.calories ?? 0)}kcal</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories" className="text-gray-700">칼로리</Label>
              <p className="text-xs text-gray-500 mb-1">모르면 비워두거나 아래에서 골라보세요</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: '가벼운 ~200', value: '200' },
                  { label: '보통 ~450', value: '450' },
                  { label: '든든한 ~600', value: '600' },
                ].map(({ label, value }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={newMeal.calories === value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setNewMeal({ ...newMeal, calories: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Input
                id="calories"
                type="number"
                placeholder="직접 입력 (kcal)"
                value={newMeal.calories}
                onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
              />
            </div>
            <Collapsible defaultOpen={false} className="border rounded-lg border-gray-200">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <span>상세 영양 정보 (선택)</span>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="protein" className="text-gray-600">단백질 (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="선택"
                      value={newMeal.protein}
                      onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs" className="text-gray-600">탄수화물 (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="선택"
                      value={newMeal.carbs}
                      onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat" className="text-gray-600">지방 (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      placeholder="선택"
                      value={newMeal.fat}
                      onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
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
    </div>
  );
}