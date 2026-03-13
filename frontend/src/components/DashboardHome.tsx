import { useEffect, useState, useRef } from 'react';
import { UserProfile, Meal, Screen } from '../App';
import { MapPin, Flame, Apple, Droplet, Zap, ChevronRight, Sparkles, Users, Egg, Wheat, Nut } from 'lucide-react';

interface DashboardHomeProps {
  userProfile: UserProfile;
  onNavigate: (screen: Screen) => void;
  todaysMeals: Meal[];
}

export function DashboardHome({ userProfile, onNavigate, todaysMeals }: DashboardHomeProps) {
  const [greeting, setGreeting] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentCommunityIndex, setCurrentCommunityIndex] = useState(0);
  const communityTouchStartX = useRef<number>(0);
  const communityTouchEndX = useRef<number>(0);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 10) {
      setGreeting('좋은 아침이에요');
      setMealTime('아침');
    } else if (hour < 16) {
      setGreeting('좋은 오후에요');
      setMealTime('점심');
    } else {
      setGreeting('좋은 저녁이에요');
      setMealTime('저녁');
    }
  }, []);

  // Auto slide for tips (every 7 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % healthTips.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Touch handlers for community carousel
  const handleCommunityTouchStart = (e: React.TouchEvent) => {
    communityTouchStartX.current = e.touches[0].clientX;
  };

  const handleCommunityTouchMove = (e: React.TouchEvent) => {
    communityTouchEndX.current = e.touches[0].clientX;
  };

  const handleCommunityTouchEnd = () => {
    const totalItems = communityItems.length + 1; // +1 for the "view all" button
    if (communityTouchStartX.current - communityTouchEndX.current > 50) {
      // Swipe left (next)
      setCurrentCommunityIndex((prev) => (prev + 1) % totalItems);
    }
    if (communityTouchEndX.current - communityTouchStartX.current > 50) {
      // Swipe right (previous)
      setCurrentCommunityIndex((prev) => (prev - 1 + totalItems) % totalItems);
    }
  };

  // Calculate today's nutrition totals
  const todayCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const todayProtein = todaysMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const todayCarbs = todaysMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const todayFat = todaysMeals.reduce((sum, meal) => sum + meal.fat, 0);
  // 메인 표시용: 소수 깔끔하게 (17.7000... → 17.7)
  const displayCalories = Math.round(todayCalories);
  const displayProtein = Math.round(todayProtein * 10) / 10;
  const displayCarbs = Math.round(todayCarbs * 10) / 10;
  const displayFat = Math.round(todayFat * 10) / 10;

  // Calculate target macros based on goal
  const targetProtein = userProfile.goal === 'lose' ? 120 : userProfile.goal === 'gain' ? 150 : 100;
  const targetCarbs = userProfile.goal === 'lose' ? 180 : userProfile.goal === 'gain' ? 250 : 220;
  const targetFat = userProfile.goal === 'lose' ? 50 : userProfile.goal === 'gain' ? 70 : 60;

  // Calculate percentages
  const caloriePercentage = Math.min((todayCalories / userProfile.target_calories) * 100, 100);
  const proteinPercentage = Math.min((todayProtein / targetProtein) * 100, 100);
  const carbsPercentage = Math.min((todayCarbs / targetCarbs) * 100, 100);
  const fatPercentage = Math.min((todayFat / targetFat) * 100, 100);

  // Calculate weekly achievement rate (using goal and meals)
  const calculateWeeklyRate = () => {
    if (todaysMeals.length === 0) return 0;
    const rate = (todayCalories / userProfile.target_calories) * 100;
    return Math.min(Math.round(rate), 100);
  };

  const weeklyAchievementRate = calculateWeeklyRate();

  // Get user's actual preferred cuisine from profile
  const preferredCuisine = userProfile.preferred_categories?.[0] || 'korean';

  // Character evolution based on profile categories
  const getCharacterByCuisine = (cuisine: string) => {
    const cuisineMap: Record<string, { emoji: string; type: string; icon: string }> = {
      'korean': { emoji: '🍚', type: '한식 마스터', icon: '🥢' },
      'japanese': { emoji: '🍱', type: '일식 러버', icon: '🍣' },
      'chinese': { emoji: '🍜', type: '중식 매니아', icon: '🥟' },
      'western': { emoji: '🍝', type: '양식 전문가', icon: '🍕' },
      'asian': { emoji: '🍲', type: '아시안 마스터', icon: '🍜' },
    };
    return cuisineMap[cuisine] || { emoji: '🍚', type: '성장하는 미식가', icon: '🍽️' };
  };

  // Character emotion based on daily achievement (using profile target)
  const getCharacterEmotion = (rate: number) => {
    if (rate >= 80 && rate <= 110) {
      return { emoji: '🥳', mood: '목표 달성!', color: 'from-green-400 to-emerald-400' };
    } else if (rate > 110) {
      return { emoji: '😵', mood: '과식 주의!', color: 'from-orange-400 to-red-400' };
    } else if (rate >= 40) {
      return { emoji: '😊', mood: '잘하고 있어요!', color: 'from-blue-400 to-cyan-400' };
    } else {
      return { emoji: '😴', mood: '조금 더 채워봐요', color: 'from-gray-300 to-slate-300' };
    }
  };

  const characterType = getCharacterByCuisine(preferredCuisine);
  const characterEmotion = getCharacterEmotion(weeklyAchievementRate);

  // Expanded health tips with habit information
  const healthTips = [
    {
      title: '수분 섭취',
      content: '물을 충분히 마시는 것도 건강한 식습관의 시작이에요! 하루 2리터를 목표로 해보세요.',
      icon: '💧',
      color: 'from-blue-400 to-cyan-400'
    },
    {
      title: '규칙적인 식사',
      content: '규칙적인 식사 시간을 유지하면 신진대사가 개선되고 몸이 더 건강해져요.',
      icon: '⏰',
      color: 'from-purple-400 to-pink-400'
    },
    {
      title: '천천히 씹기',
      content: '천천히 씹어 먹으면 소화도 잘 되고 포만감도 더 오래 가요. 한 입에 20번씩 씹어보세요!',
      icon: '🍴',
      color: 'from-green-400 to-teal-400'
    },
    {
      title: '다양한 채소',
      content: '다양한 색깔의 채소를 먹으면 더 많은 영양소를 섭취할 수 있어요. 무지개 식단에 도전해보세요!',
      icon: '🥗',
      color: 'from-orange-400 to-red-400'
    },
    {
      title: '건강한 간식',
      content: '간식은 식사와 식사 사이 3-4시간 간격으로 먹는 게 좋아요. 견과류나 과일을 추천해요!',
      icon: '🥜',
      color: 'from-yellow-400 to-orange-400'
    },
    {
      title: '식사 후 휴식',
      content: '식사 직후 바로 눕거나 격한 운동은 피해주세요. 가벼운 산책이 소화에 도움이 돼요.',
      icon: '🚶',
      color: 'from-indigo-400 to-purple-400'
    },
    {
      title: '아침 식사의 중요성',
      content: '아침을 거르면 점심에 과식하기 쉬워요. 간단하게라도 아침을 챙겨보세요!',
      icon: '🌅',
      color: 'from-pink-400 to-rose-400'
    },
    {
      title: '야식 줄이기',
      content: '자기 3시간 전부터는 음식 섭취를 자제하면 숙면에 도움이 되고 살도 덜 찌워요.',
      icon: '🌙',
      color: 'from-slate-400 to-gray-500'
    },
  ];

  // Mock community and challenge data
  const communityItems = [
    {
      type: 'community',
      icon: '🔥',
      badge: 'HOT',
      title: '직장인 점심 메뉴 추천',
      author: '밥친구123',
      likes: 234,
      comments: 45,
    },
    {
      type: 'community',
      icon: '💪',
      badge: 'HOT',
      title: '다이어트 중 야식 극복법',
      author: '헬스왕',
      likes: 189,
      comments: 32,
    },
    {
      type: 'challenge',
      icon: '🏆',
      badge: '챌린지',
      title: '7일 단백질 챌린지',
      participants: 1247,
      daysLeft: 3,
    },
    {
      type: 'challenge',
      icon: '🥗',
      badge: '챌린지',
      title: '매일 채소 먹기',
      participants: 892,
      daysLeft: 5,
    },
  ];

  const getDietaryAdvice = () => {
    if (todayCalories === 0) {
      return '아직 오늘 첫 식사를 하지 않으셨네요! 영양가 있는 식사로 하루를 시작해보세요 🌅';
    } else if (todayProtein < targetProtein * 0.3 && todaysMeals.length >= 2) {
      return '오늘은 단백질 섭취가 조금 부족해요. 저녁에는 생선이나 두부 요리는 어떨까요? 🐟';
    } else if (todayCarbs > targetCarbs * 0.7 && todayFat < targetFat * 0.3) {
      return '탄수화물 섭취가 충분하니 견과류나 아보카도 같은 건강한 지방을 더해보세요! 🥑';
    } else if (todaysMeals.length >= 3 && caloriePercentage >= 90) {
      return '오늘 목표를 거의 달성하셨어요! 가벼운 산책과 함께 마무리하면 완벽해요 ✨';
    } else {
      return '균형잡힌 식단을 잘 유지하고 계시네요! 이대로 꾸준히 해봐요 💪';
    }
  };

  // Calculate nutrition balance score
  const getBalanceScore = () => {
    if (todaysMeals.length === 0) return 0;
    const proteinScore = Math.min((todayProtein / targetProtein) * 100, 100);
    const carbsScore = Math.min((todayCarbs / targetCarbs) * 100, 100);
    const fatScore = Math.min((todayFat / targetFat) * 100, 100);
    return Math.round((proteinScore + carbsScore + fatScore) / 3);
  };

  const balanceScore = getBalanceScore();

  const currentTip = healthTips[currentTipIndex];
  const currentCommunityItem = currentCommunityIndex < communityItems.length
    ? communityItems[currentCommunityIndex]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* 인사말 / 위치 */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {userProfile.name}님</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{userProfile.location || '위치 정보 확인 중...'}</span>
          </div>
        </div>
      </div>

      {/* 오늘 식사/영양 요약 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-3xl font-bold text-gray-900">오늘의 영양소 섭취</h2>
          <div className="text-center bg-green-50 rounded-2xl px-4 py-2 border-2 border-green-200">
            <div className="text-4xl font-bold text-green-600">{balanceScore}</div>
            <div className="text-sm font-semibold text-gray-600">점</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {/* Calories */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-6 border-3 border-orange-300 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-7 h-7 text-orange-600" />
              <span className="text-base font-bold text-gray-800">칼로리</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900">{displayCalories}</span>
              <span className="text-base font-medium text-gray-600">/ {userProfile.target_calories}</span>
            </div>
            <div className="bg-orange-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${caloriePercentage}%` }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-3 border-amber-300 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Egg className="w-7 h-7 text-amber-700" />
              <span className="text-base font-bold text-gray-800">단백질</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900">{displayProtein}g</span>
              <span className="text-base font-medium text-gray-600">/ {targetProtein}g</span>
            </div>
            <div className="bg-amber-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${proteinPercentage}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-6 border-3 border-yellow-300 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Wheat className="w-7 h-7 text-yellow-700" />
              <span className="text-base font-bold text-gray-800">탄수화물</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900">{displayCarbs}g</span>
              <span className="text-base font-medium text-gray-600">/ {targetCarbs}g</span>
            </div>
            <div className="bg-yellow-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${carbsPercentage}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border-3 border-blue-300 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Nut className="w-7 h-7 text-blue-600" />
              <span className="text-base font-bold text-gray-800">지방</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900">{displayFat}g</span>
              <span className="text-base font-medium text-gray-600">/ {targetFat}g</span>
            </div>
            <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${fatPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 오늘의 식습관 조언 */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-xl p-10 text-white">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 bg-white/30 rounded-3xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">오늘의 식습관 조언</h2>
              <p className="text-white text-xl leading-relaxed font-medium">
                {getDietaryAdvice()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 조언/팁/커뮤니티 - Community & Challenge Carousel */}
      <div className="px-6 py-2">
        <div className="relative h-40 overflow-hidden">
          {currentCommunityItem ? (
            <div
              className="bg-white rounded-3xl shadow-xl p-8 border-3 border-gray-200 transition-all duration-500"
              key={currentCommunityIndex}
              onTouchStart={handleCommunityTouchStart}
              onTouchMove={handleCommunityTouchMove}
              onTouchEnd={handleCommunityTouchEnd}
            >
              <div className="flex items-start gap-5">
                <div className="text-5xl">{currentCommunityItem.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${currentCommunityItem.type === 'community'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-purple-100 text-purple-600'
                      }`}>
                      {currentCommunityItem.badge}
                    </span>
                    {currentCommunityItem.type === 'community' && (
                      <span className="text-sm font-medium text-gray-500">@{currentCommunityItem.author}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-3">{currentCommunityItem.title}</h3>
                  <div className="flex items-center gap-5 text-base font-semibold text-gray-700">
                    {currentCommunityItem.type === 'community' ? (
                      <>
                        <span>❤️ {currentCommunityItem.likes}</span>
                        <span>💬 {currentCommunityItem.comments}</span>
                      </>
                    ) : (
                      <>
                        <span>👥 {currentCommunityItem.participants}명 참여</span>
                        <span>⏰ {currentCommunityItem.daysLeft}일 남음</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('community')}
              className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-xl flex items-center justify-center gap-4 text-white hover:shadow-2xl transition-all"
            >
              <Users className="w-8 h-8" />
              <span className="text-2xl font-bold">커뮤니티 / 챌린지 보러가기</span>
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[...communityItems, null].map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentCommunityIndex
                ? 'w-8 bg-green-500'
                : 'w-2 bg-gray-300'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Health Tips Auto Carousel - Enhanced text */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">알아두면 좋은 식습관 정보</h2>
          <div className="flex gap-1.5">
            {healthTips.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentTipIndex
                  ? 'w-8 bg-green-500'
                  : 'w-2 bg-gray-300'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className={`bg-gradient-to-br ${currentTip.color} rounded-3xl p-10 text-white shadow-xl transition-all duration-500`}>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 bg-white/30 rounded-3xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm text-5xl">
              {currentTip.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-4">{currentTip.title}</h3>
              <p className="text-white text-xl leading-relaxed font-medium">
                {currentTip.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}