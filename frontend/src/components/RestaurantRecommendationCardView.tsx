import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, X, Heart, RefreshCcw, Info, Utensils } from 'lucide-react';

interface Restaurant {
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

interface RestaurantRecommendationCardViewProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onShowFeedback: (restaurant: { name: string; menu: string }) => void;
  onRefresh?: () => void;
  onLike?: (restaurant: Restaurant) => void;
  onDislike?: (restaurant: Restaurant) => void;
}

export function RestaurantRecommendationCardView({
  restaurants,
  onSelectRestaurant,
  onShowFeedback,
  onRefresh,
  onLike,
  onDislike
}: RestaurantRecommendationCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitX, setExitX] = useState<number | string>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSwipe = (direction: 'left' | 'right') => {
    // 단순히 카드만 넘기고, like/dislike는 별도 버튼으로만 처리
    setExitX(direction === 'left' ? -1000 : 1000);
    setTimeout(() => {
      if (currentIndex < restaurants.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // 모든 카드를 다 봤을 때는 같은 추천 안에서 처음 카드로만 돌아가고,
        // 실제 "다시 추천받기"는 중앙 새로고침 버튼을 눌렀을 때만 수행.
        setCurrentIndex(0);
      }
      setExitX(0);
    }, 200);
  };

  const handleRefresh = () => {
    // 짧은 피드백용 스피너 표시
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 700);

    if (onRefresh) {
      onRefresh();
    } else {
      setCurrentIndex(0);
    }
  };

  if (restaurants.length === 0 || currentIndex >= restaurants.length) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <RefreshCcw className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">모든 추천을 다 보셨어요!</h2>
        <p className="text-gray-600 mb-6">새로운 맛집을 찾으러 가볼까요?</p>
        <button
          onClick={handleRefresh}
          className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all"
        >
          다시 추천받기
        </button>
      </div>
    );
  }

  const currentRestaurant = restaurants[currentIndex];
  // Calculate relative drag distance for stamps
  // 스와이프로 인한 이동이 이하면 "탭"으로 간주 → 상세 모달 열기 (드래그 시에는 click 이벤트가 안 뜨는 문제 보정)
  const TAP_THRESHOLD_PX = 40;
  const SWIPE_DISTANCE_PX = 80;

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-white overflow-hidden p-4 pt-3 min-h-0">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-2 mb-1 shrink-0">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">오늘의 추천</h2>
        <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {restaurants.length}
        </div>
        {/* Diagnostic Marker */}
        <span className="sr-only" data-ui-version="2.1-robust-inline"></span>
      </div>
      {/* Hint */}
      <div className="w-full text-[11px] text-gray-400 font-medium px-2 mb-1 shrink-0">
        카드를 탭하면 상세 정보를 볼 수 있어요.
      </div>

      {/* Card Container: flex-1 + min-h-0 으로 남은 높이만 차지해 하단 버튼이 잘리지 않게 */}
      <div 
        className="relative w-full flex-1 min-h-0 max-w-md perspective-1000 my-2 z-10 flex flex-col"
      >
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentRestaurant.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDrag={(_, info) => {}}
            onDragEnd={(_, info) => {
              setDragProgress(0);
              const dx = info.offset.x;

              if (dx > SWIPE_DISTANCE_PX) {
                handleSwipe('right');
              } else if (dx < -SWIPE_DISTANCE_PX) {
                handleSwipe('left');
              } else if (Math.abs(dx) <= TAP_THRESHOLD_PX) {
                // 스와이프가 아니면 탭으로 간주 → 상세(추가 정보 + 이걸로 먹을게요) 열기
                onSelectRestaurant(currentRestaurant);
              }
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitX, opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="absolute inset-0 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer active:cursor-grabbing border border-gray-100"
            onClick={() => onSelectRestaurant(currentRestaurant)}
          >
              {/* 상단: 이미지만 (비율 고정, 텍스트 없음 → 읽기 부담 감소) */}
              <div
                className="relative w-full flex-shrink-0 bg-gray-100"
                style={{ height: '38%' }}
              >
                {currentRestaurant.imageUrl ? (
                  <img
                    src={currentRestaurant.imageUrl}
                    alt={currentRestaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-green-50">
                    <Utensils className="w-12 h-12 text-green-200" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                  <Info className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* 하단: 카드에는 거리·추천 사유·가격대만 (칼로리·대표메뉴는 클릭 시 세부 정보에) */}
              <div className="flex-1 overflow-y-auto p-4 pb-2 bg-white min-h-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider">
                    {currentRestaurant.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight line-clamp-1 flex-1 min-w-0">
                    {currentRestaurant.name}
                  </h3>
                  <div className="items-center gap-1 text-amber-500 flex shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-bold text-gray-800">{currentRestaurant.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2 text-gray-600 text-base">
                  <span><span className="text-gray-500 font-medium">거리</span> {currentRestaurant.distance}km</span>
                  <span className="text-gray-300">·</span>
                  <span><span className="text-gray-500 font-medium">예상가격</span> <span className="font-semibold text-gray-800">{currentRestaurant.price}</span></span>
                </div>
                <div className="flex items-start gap-1.5 mb-3 text-gray-600 text-sm min-h-[2.5rem]">
                  <MapPin className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-semibold mb-1">식당 위치</p>
                    <p className="text-gray-700 line-clamp-2">{currentRestaurant.address || '위치 정보 없음'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
                  <p className="text-xs text-gray-500 font-semibold mb-1">추천 사유</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentRestaurant.reason}
                  </p>
                </div>
              </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center justify-center gap-6 py-4 mt-auto shrink-0">
        {/* Dislike - Slide Left */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-red-50 text-red-500 hover:scale-110 active:scale-95 transition-all"
          title="추천받지 않기"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-50 text-gray-400 transition-all duration-500 ${
            isRefreshing ? 'rotate-180' : 'hover:rotate-180'
          }`}
          title="다시 추천받기"
        >
          <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Like - Slide Right */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-green-50 text-green-500 hover:scale-110 active:scale-95 transition-all"
          title="찜하기"
        >
          <Heart className="w-8 h-8" />
        </button>
      </div>

    </div>
  );
}
