import { useEffect, useState } from 'react';
import { UserProfile, Meal, Screen } from '../App';
import { Bell, MapPin, ChevronRight, Clock, Star, ThumbsUp, ThumbsDown, Flame } from 'lucide-react';
import { Button } from './ui/button';

interface HomeScreenProps {
  userProfile: UserProfile;
  onNavigate: (screen: Screen) => void;
  todaysMeals: Meal[];
  setTodaysMeals: (meals: Meal[]) => void;
  updateCurrentCalories: (calories: number) => void;
}

interface FoodRecommendation {
  id: string;
  restaurantName: string;
  menuName: string;
  category: string;
  calories: number;
  distance: number;
  rating: number;
  reviewCount: number;
  price: string;
  oneLiner: string;
  imageUrl: string;
  deliveryAvailable: boolean;
}

export function HomeScreenNew({ userProfile, onNavigate, todaysMeals }: HomeScreenProps) {
  const [currentMealTime, setCurrentMealTime] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    
    // Determine greeting and meal time
    if (hour < 11) {
      setGreeting('좋은 아침이에요');
      setCurrentMealTime('breakfast');
    } else if (hour < 16) {
      setGreeting('점심 드셨나요?');
      setCurrentMealTime('lunch');
    } else {
      setGreeting('저녁 뭐 드실래요?');
      setCurrentMealTime('dinner');
    }

    generateRecommendations();
  }, [userProfile.preferredCategories]);

  const generateRecommendations = () => {
    const mockRecommendations: FoodRecommendation[] = [
      {
        id: '1',
        restaurantName: '맛있는 집',
        menuName: '김치찌개 정식',
        category: '한식',
        calories: 520,
        distance: 0.3,
        rating: 4.8,
        reviewCount: 1247,
        price: '9,000원',
        oneLiner: '얼큰하고 진한 국물이 일품이에요',
        imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop',
        deliveryAvailable: true,
      },
      {
        id: '2',
        restaurantName: '그린 샐러드 바',
        menuName: '닭가슴살 시저 샐러드',
        category: '샐러드',
        calories: 320,
        distance: 0.5,
        rating: 4.6,
        reviewCount: 892,
        price: '12,000원',
        oneLiner: '신선한 채소와 부드러운 닭가슴살',
        imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
        deliveryAvailable: true,
      },
      {
        id: '3',
        restaurantName: '일품 돈까스',
        menuName: '로스까스 정식',
        category: '일식',
        calories: 680,
        distance: 0.7,
        rating: 4.9,
        reviewCount: 2103,
        price: '11,000원',
        oneLiner: '바삭한 튀김옷과 부드러운 고기',
        imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop',
        deliveryAvailable: false,
      },
      {
        id: '4',
        restaurantName: '베이징 반점',
        menuName: '짜장면',
        category: '중식',
        calories: 720,
        distance: 0.9,
        rating: 4.5,
        reviewCount: 1534,
        price: '7,000원',
        oneLiner: '옛날식 짜장면의 정석',
        imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop',
        deliveryAvailable: true,
      },
    ];

    // Filter based on user preferences if any
    const filtered = mockRecommendations.filter(rec => 
      userProfile.preferredCategories.length === 0 || 
      userProfile.preferredCategories.some(cat => rec.category.includes(cat))
    );

    setRecommendations(filtered.length > 0 ? filtered : mockRecommendations);
  };

  const getMealTimeText = () => {
    switch (currentMealTime) {
      case 'breakfast': return '아침';
      case 'lunch': return '점심';
      case 'dinner': return '저녁';
    }
  };

  const getMealTimeEmoji = () => {
    switch (currentMealTime) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
    }
  };

  const totalCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-6 pb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{greeting}, {userProfile.name}님!</h1>
            <div className="flex items-center gap-2 text-green-100 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{userProfile.location || '서울시 강남구'}</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('profile')}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Today's Calorie Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-100 mb-1">오늘 섭취한 칼로리</p>
              <p className="text-2xl font-bold">{totalCalories} kcal</p>
            </div>
            <button
              onClick={() => onNavigate('stats')}
              className="flex items-center gap-1 text-sm bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              자세히
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-4">
        {/* Meal Time Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">{getMealTimeEmoji()}</div>
            <div>
              <h2 className="text-xl font-bold">{getMealTimeText()} 뭐 먹을까요?</h2>
              <div className="flex items-center gap-2 text-green-100 text-sm mt-1">
                <Clock className="w-4 h-4" />
                <span>
                  {currentMealTime === 'breakfast' && `평소 ${userProfile.breakfastTime}에 식사하시죠?`}
                  {currentMealTime === 'lunch' && `평소 ${userProfile.lunchTime}에 식사하시죠?`}
                  {currentMealTime === 'dinner' && `평소 ${userProfile.dinnerTime}에 식사하시죠?`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {userProfile.name}님을 위한 추천 🎯
            </h3>
            <button 
              onClick={() => onNavigate('restaurant')}
              className="text-sm text-green-600 font-medium flex items-center gap-1"
            >
              더보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48">
                  <img
                    src={rec.imageUrl}
                    alt={rec.menuName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium">{rec.calories}kcal</span>
                  </div>
                  {rec.deliveryAvailable && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      배달 가능
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-green-600 px-2 py-0.5 bg-green-50 rounded">
                          {rec.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{rec.distance}km</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{rec.menuName}</h4>
                      <p className="text-sm text-gray-600">{rec.restaurantName}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-gray-900">{rec.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500">리뷰 {rec.reviewCount}</p>
                    </div>
                  </div>

                  {/* One-liner */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 italic">"{rec.oneLiner}"</p>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-green-600">{rec.price}</p>
                    <div className="flex gap-2">
                      <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ThumbsDown className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ThumbsUp className="w-4 h-4 text-gray-400" />
                      </button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onNavigate('restaurant')}
                      >
                        선택하기
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">바로가기</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('stats')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium mb-1">칼로리 캘린더</p>
              <p className="text-xs opacity-90">식습관 분석하기</p>
            </button>

            <button
              onClick={() => onNavigate('community')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">🗺️</div>
              <p className="font-medium mb-1">동네 맛집</p>
              <p className="text-xs opacity-90">커뮤니티 추천</p>
            </button>
          </div>
        </div>

        {/* Tip Section */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-5 border border-green-100 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">오늘의 TIP</h4>
              <p className="text-sm text-gray-700">
                {userProfile.goal === 'lose' 
                  ? '다이어트 중이시군요! 저칼로리 고단백 메뉴를 추천드려요.'
                  : userProfile.goal === 'gain'
                  ? '영양 보충이 필요하시네요! 영양가 높은 메뉴를 추천드려요.'
                  : '균형잡힌 식단으로 건강을 유지하세요!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
