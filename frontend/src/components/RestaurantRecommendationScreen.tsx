import { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { MapPin, Star, Clock, Flame, ExternalLink, Navigation, ChevronRight, Filter } from 'lucide-react';
import { Button } from './ui/button';

interface RestaurantRecommendationScreenProps {
  userProfile: UserProfile;
}

interface Restaurant {
  id: string;
  name: string;
  category: string;
  distance: number;
  rating: number;
  reviewCount: number;
  avgCalories: number;
  signature: string;
  signatureCalories: number;
  price: string;
  deliveryTime: string;
  naverLink: string;
  baeminLink?: string;
  yogiyoLink?: string;
  imageUrl: string;
}

export function RestaurantRecommendationScreen({ userProfile }: RestaurantRecommendationScreenProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    // Determine meal type based on current time
    const hour = new Date().getHours();
    if (hour < 10) {
      setMealType('breakfast');
    } else if (hour < 16) {
      setMealType('lunch');
    } else {
      setMealType('dinner');
    }

    generateRestaurants();
  }, []);

  const generateRestaurants = () => {
    const mockRestaurants: Restaurant[] = [
      {
        id: '1',
        name: '헬시키친 강남점',
        category: '샐러드',
        distance: 0.3,
        rating: 4.8,
        reviewCount: 1247,
        avgCalories: 350,
        signature: '닭가슴살 시저 샐러드',
        signatureCalories: 320,
        price: '12,000원',
        deliveryTime: '25-35분',
        naverLink: 'https://map.naver.com',
        baeminLink: 'https://www.baemin.com',
        yogiyoLink: 'https://www.yogiyo.co.kr',
        imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
      },
      {
        id: '2',
        name: '현미밥상',
        category: '한식',
        distance: 0.5,
        rating: 4.6,
        reviewCount: 892,
        avgCalories: 480,
        signature: '연어 현미 덮밥',
        signatureCalories: 450,
        price: '13,500원',
        deliveryTime: '30-40분',
        naverLink: 'https://map.naver.com',
        baeminLink: 'https://www.baemin.com',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
      },
      {
        id: '3',
        name: '그린볼 카페',
        category: '샐러드',
        distance: 0.7,
        rating: 4.7,
        reviewCount: 1534,
        avgCalories: 380,
        signature: '퀴노아 파워볼',
        signatureCalories: 420,
        price: '14,000원',
        deliveryTime: '20-30분',
        naverLink: 'https://map.naver.com',
        yogiyoLink: 'https://www.yogiyo.co.kr',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      },
      {
        id: '4',
        name: '두부마을',
        category: '한식',
        distance: 0.9,
        rating: 4.5,
        reviewCount: 678,
        avgCalories: 420,
        signature: '두부 스테이크 정식',
        signatureCalories: 380,
        price: '11,000원',
        deliveryTime: '35-45분',
        naverLink: 'https://map.naver.com',
        baeminLink: 'https://www.baemin.com',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      },
      {
        id: '5',
        name: '포케하우스',
        category: '하와이안',
        distance: 1.2,
        rating: 4.9,
        reviewCount: 2103,
        avgCalories: 520,
        signature: '연어 포케볼',
        signatureCalories: 510,
        price: '15,500원',
        deliveryTime: '30-40분',
        naverLink: 'https://map.naver.com',
        baeminLink: 'https://www.baemin.com',
        yogiyoLink: 'https://www.yogiyo.co.kr',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400&h=300&fit=crop',
      },
      {
        id: '6',
        name: '라이트밀',
        category: '다이어트',
        distance: 1.5,
        rating: 4.4,
        reviewCount: 523,
        avgCalories: 300,
        signature: '저칼로리 도시락',
        signatureCalories: 280,
        price: '9,900원',
        deliveryTime: '40-50분',
        naverLink: 'https://map.naver.com',
        baeminLink: 'https://www.baemin.com',
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop',
      },
    ];

    setRestaurants(mockRestaurants);
  };

  const filteredRestaurants = restaurants.filter(r =>
    filterCategory === 'all' || r.category === filterCategory
  );

  const getMealTypeText = () => {
    switch (mealType) {
      case 'breakfast': return '아침';
      case 'lunch': return '점심';
      case 'dinner': return '저녁';
    }
  };

  const remainingCalories = userProfile.target_calories - userProfile.current_calories;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{getMealTypeText()} 추천</h1>
            <p className="text-green-100 text-sm">건강한 식사 장소를 찾아보세요</p>
          </div>
          <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        {/* Calorie Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-100 mb-1">이번 식사 권장 칼로리</p>
              <p className="text-2xl font-bold">{Math.round(remainingCalories / 3)}</p>
              <p className="text-xs text-green-100 mt-1">
                오늘 남은 칼로리: {remainingCalories}kcal
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Flame className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Location Status */}
      {locationEnabled && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <MapPin className="w-4 h-4" />
            <span>현재 위치: 서울시 강남구 역삼동</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          {['all', '샐러드', '한식', '하와이안', '다이어트'].map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant List */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">
            {filteredRestaurants.length}개의 추천 장소
          </p>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <Filter className="w-4 h-4" />
            필터
          </button>
        </div>

        {filteredRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Restaurant Image */}
            <div className="relative h-40">
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-600" />
                <span className="text-xs font-medium">{restaurant.signatureCalories}kcal</span>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{restaurant.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">
                      {restaurant.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {restaurant.distance}km
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {restaurant.deliveryTime}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900">{restaurant.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">리뷰 {restaurant.reviewCount}</p>
                </div>
              </div>

              {/* Signature Menu */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 mb-1">대표 메뉴</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{restaurant.signature}</p>
                  <p className="text-sm font-bold text-green-600">{restaurant.price}</p>
                </div>
              </div>

              {/* Delivery Links */}
              <div className="flex gap-2">
                <a
                  href={restaurant.naverLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  네이버 지도
                </a>
                {restaurant.baeminLink && (
                  <a
                    href={restaurant.baeminLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                  >
                    배민
                  </a>
                )}
                {restaurant.yogiyoLink && (
                  <a
                    href={restaurant.yogiyoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                  >
                    요기요
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-5 text-center">
          <h3 className="font-bold mb-2">직접 입력하고 싶으신가요?</h3>
          <p className="text-sm text-green-100 mb-4">
            식사 내용을 직접 기록하고 칼로리를 계산해보세요
          </p>
          <Button
            className="w-full bg-white text-green-600 hover:bg-green-50"
          >
            식사 직접 입력하기
          </Button>
        </div>
      </div>
    </div>
  );
}
