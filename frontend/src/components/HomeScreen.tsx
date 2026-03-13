import { useEffect, useState } from 'react';
import { UserProfile, Meal, Screen } from '../App';
import { Bell, TrendingUp, Apple, Flame, Activity, ChevronRight, Info, Users } from 'lucide-react';
import { Progress } from './ui/progress';
import { supabaseUrl, supabaseAnonKey } from '../utils/supabaseClient';

interface HomeScreenProps {
  userProfile: UserProfile;
  onNavigate: (screen: Screen) => void;
  todaysMeals: Meal[];
  setTodaysMeals: (meals: Meal[]) => void;
  updateCurrentCalories: (calories: number) => void;
}

// Age group calorie reference data
const getAgeGroupCalories = (age: number, gender: string) => {
  if (gender === 'male') {
    if (age >= 15 && age <= 18) return { min: 2500, max: 3000, avg: 2700 };
    if (age >= 19 && age <= 29) return { min: 2400, max: 2800, avg: 2600 };
    if (age >= 30 && age <= 49) return { min: 2200, max: 2600, avg: 2400 };
    if (age >= 50 && age <= 64) return { min: 2000, max: 2400, avg: 2200 };
    if (age >= 65) return { min: 1800, max: 2200, avg: 2000 };
  } else {
    if (age >= 15 && age <= 18) return { min: 2000, max: 2400, avg: 2200 };
    if (age >= 19 && age <= 29) return { min: 1900, max: 2300, avg: 2100 };
    if (age >= 30 && age <= 49) return { min: 1800, max: 2200, avg: 2000 };
    if (age >= 50 && age <= 64) return { min: 1600, max: 2000, avg: 1800 };
    if (age >= 65) return { min: 1400, max: 1800, avg: 1600 };
  }
  return { min: 2000, max: 2400, avg: 2200 };
};

export function HomeScreen({ userProfile, onNavigate, todaysMeals, setTodaysMeals, updateCurrentCalories }: HomeScreenProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('좋은 아침이에요');
    } else if (hour < 18) {
      setGreeting('좋은 오후에요');
    } else {
      setGreeting('좋은 저녁이에요');
    }

    loadTodaysMeals();
    generateRecommendations();
  }, []);

  const loadTodaysMeals = async () => {
    try {
      // Check if Supabase is configured
      const url = supabaseUrl;
      const key = supabaseAnonKey;
      if (!url || !key) {
        console.log('Supabase not configured, using local data only');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${url}/functions/v1/make-server-4e0538b1/meals/${userProfile.user_id}?date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        }
      );

      if (response.ok) {
        const meals = await response.json();
        setTodaysMeals(meals);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const generateRecommendations = () => {
    const hour = new Date().getHours();
    const recs = [];

    if (hour < 10) {
      recs.push('🥣 아보카도 토스트 (320kcal)');
      recs.push('🥛 그릭 요거트 + 베리 (180kcal)');
      recs.push('🍳 스크램블 에그 + 토마토 (220kcal)');
    } else if (hour < 14) {
      recs.push('🥗 닭가슴살 샐러드 (350kcal)');
      recs.push('🍚 현미밥 + 연어구이 (480kcal)');
      recs.push('🥙 퀴노아 볼 (420kcal)');
    } else {
      recs.push('🍲 두부 스테이크 (380kcal)');
      recs.push('🥘 닭고기 볶음밥 (520kcal)');
      recs.push('🍜 새우 쌀국수 (450kcal)');
    }

    setRecommendations(recs);
  };

  const totalCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const calorieProgress = (totalCalories / userProfile.target_calories) * 100;
  const remainingCalories = userProfile.target_calories - totalCalories;

  const totalProtein = todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = todaysMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = todaysMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  const ageGroupCalories = getAgeGroupCalories(userProfile.age, userProfile.gender);
  const bmi = (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1);
  const targetBMI = (userProfile.target_weight / ((userProfile.height / 100) ** 2)).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-6 pb-24 rounded-b-3xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{greeting}, {userProfile.name}님! 👋</h1>
            <p className="text-green-100 text-sm">오늘도 건강한 하루 보내세요</p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Calorie Progress Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-green-100 text-sm mb-1">오늘의 칼로리</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{totalCalories}</span>
                <span className="text-green-100">/ {userProfile.target_calories} kcal</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-100 mb-1">남은 칼로리</p>
              <p className="text-xl font-bold">{remainingCalories > 0 ? remainingCalories : 0}</p>
            </div>
          </div>
          <Progress value={Math.min(calorieProgress, 100)} className="h-2 bg-white/20" />
          <p className="text-xs text-green-100 mt-2">
            {calorieProgress < 80 ? '목표까지 순조롭게 진행 중이에요! 💪' :
              calorieProgress < 100 ? '거의 다 왔어요! 조금만 더 신경 써주세요' :
                '오늘 목표를 초과했어요. 내일은 조절해볼까요?'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-16 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2 mx-auto">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600 text-center mb-1">단백질</p>
            <p className="text-lg font-bold text-center">{totalProtein}g</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg mb-2 mx-auto">
              <Apple className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-600 text-center mb-1">탄수화물</p>
            <p className="text-lg font-bold text-center">{totalCarbs}g</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mb-2 mx-auto">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600 text-center mb-1">지방</p>
            <p className="text-lg font-bold text-center">{totalFat}g</p>
          </div>
        </div>
      </div>

      {/* Health Info Section */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">내 건강 정보</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">현재 BMI</p>
              <p className="text-2xl font-bold text-gray-900">{bmi}</p>
              <p className="text-xs text-gray-500 mt-1">
                {parseFloat(bmi) < 18.5 ? '저체중' :
                  parseFloat(bmi) < 23 ? '정상' :
                    parseFloat(bmi) < 25 ? '과체중' : '비만'}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">목표 BMI</p>
              <p className="text-2xl font-bold text-green-600">{targetBMI}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.abs(userProfile.weight - userProfile.target_weight).toFixed(1)}kg {userProfile.goal === 'lose' ? '감량' : userProfile.goal === 'gain' ? '증량' : '유지'}
              </p>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">연령대 권장 칼로리</p>
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {userProfile.gender === 'male' ? '남성' : '여성'}, {userProfile.age}세 기준
            </p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600">권장 범위:</span>
              <span className="font-bold text-gray-900">{ageGroupCalories.min} - {ageGroupCalories.max} kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">평균:</span>
              <span className="font-bold text-green-600">{ageGroupCalories.avg} kcal</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Info className="w-3 h-3" />
                <span>
                  내 목표: <strong className="text-green-600">{userProfile.target_calories} kcal</strong>
                  {' '}
                  ({userProfile.goal === 'lose' ? '체중감량' : userProfile.goal === 'gain' ? '체중증가' : '체중유지'} 기준)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">오늘의 식사</h2>
          <button
            onClick={() => onNavigate('meal-log')}
            className="text-sm text-green-600 font-medium"
          >
            전체보기
          </button>
        </div>

        {todaysMeals.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Apple className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-3">아직 기록된 식사가 없어요</p>
            <button
              onClick={() => onNavigate('meal-log')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              식사 기록하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysMeals.slice(0, 3).map((meal) => (
              <div key={meal.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {meal.mealType === 'breakfast' ? '아침' :
                          meal.mealType === 'lunch' ? '점심' :
                            meal.mealType === 'dinner' ? '저녁' : '간식'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(meal.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{meal.foodName}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal Recommendations */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">추천 메뉴</h2>
          <button
            onClick={() => onNavigate('chat')}
            className="text-sm text-green-600 font-medium"
          >
            AI 상담
          </button>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <button
              key={index}
              onClick={() => onNavigate('chat')}
              className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center text-2xl">
                  {rec.split(' ')[0]}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{rec.split(' ').slice(1, -1).join(' ')}</p>
                  <p className="text-sm text-gray-500">AI 추천 메뉴</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">빠른 메뉴</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('calendar')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <TrendingUp className="w-8 h-8 mb-3" />
            <p className="font-medium mb-1">주간 리포트</p>
            <p className="text-xs opacity-90">통계 확인하기</p>
          </button>

          <button
            onClick={() => onNavigate('community')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <Activity className="w-8 h-8 mb-3" />
            <p className="font-medium mb-1">커뮤니티</p>
            <p className="text-xs opacity-90">건강 이야기 나누기</p>
          </button>
        </div>
      </div>
    </div>
  );
}