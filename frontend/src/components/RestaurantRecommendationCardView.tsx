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

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentRestaurant = restaurants[currentIndex];
    if (direction === 'right' && onLike) {
      onLike(currentRestaurant);
    } else if (direction === 'left' && onDislike) {
      onDislike(currentRestaurant);
    }

    setExitX(direction === 'left' ? -1000 : 1000);
    setTimeout(() => {
      if (currentIndex < restaurants.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setExitX(0);
      } else {
        // 모든 카드를 다 봤을 때 처리 (예: 처음으로 돌아가거나 새로고침 유도)
        alert('모든 추천을 확인했습니다! 다시 추천받아보세요.');
        onRefresh?.();
      }
    }, 200);
  };

  const handleRefresh = () => {
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
  const [dragProgress, setDragProgress] = useState(0);

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-white overflow-hidden p-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-2 mb-2 shrink-0">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">오늘의 추천</h2>
        <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {restaurants.length}
        </div>
        {/* Diagnostic Marker */}
        <span className="sr-only" data-ui-version="2.1-robust-inline"></span>
      </div>

      {/* Card Container */}
      <div 
        className="relative w-full flex-1 max-w-md perspective-1000 my-2 z-10"
        style={{ minHeight: '420px', display: 'flex' }}
      >
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentRestaurant.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDrag={(_, info) => {
              setDragProgress(info.offset.x);
            }}
            onDragEnd={(_, info) => {
              setDragProgress(0);
              if (info.offset.x > 100) handleSwipe('right');
              else if (info.offset.x < -100) handleSwipe('left');
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitX, opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100"
          >
              {/* Image Section */}
              <div
                className="relative h-full w-full bg-gray-100"
                onClick={() => onSelectRestaurant(currentRestaurant)}
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
                
                {/* Swipe Stamps */}
                <motion.div 
                  style={{ opacity: dragProgress > 20 ? Math.min((dragProgress - 20) / 100, 1) : 0 }}
                  className="absolute top-10 left-10 z-20 border-4 border-green-500 rounded-lg px-4 py-1 -rotate-12 bg-white/10"
                >
                  <span className="text-green-500 text-4xl font-black tracking-widest">LIKE</span>
                </motion.div>

                <motion.div 
                  style={{ opacity: dragProgress < -20 ? Math.min(Math.abs(dragProgress + 20) / 100, 1) : 0 }}
                  className="absolute top-10 right-10 z-20 border-4 border-red-500 rounded-lg px-4 py-1 rotate-12 bg-white/10"
                >
                  <span className="text-red-500 text-4xl font-black tracking-widest">NOPE</span>
                </motion.div>

                {/* Gradient Overlay - Stronger for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />

              {/* Detail Info Indicator */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2">
                <Info className="w-5 h-5 text-white" />
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
                    {currentRestaurant.category}
                  </span>
                  <div className="items-center gap-1 text-yellow-400 flex drop-shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-bold">{currentRestaurant.rating}</span>
                  </div>
                </div>

                <h3 className="text-3xl font-black mb-2 tracking-tight line-clamp-1 drop-shadow-md">
                  {currentRestaurant.name}
                </h3>
                
                <div className="flex items-center gap-3 mb-5 text-gray-100 text-sm drop-shadow-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{currentRestaurant.address}</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 mb-6 shadow-canvas">
                  <p className="text-base font-medium leading-relaxed italic drop-shadow-sm">
                    "{currentRestaurant.reason}"
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-sm">
                    <p className="text-xs text-gray-300 mb-1 font-semibold uppercase tracking-wider">대표메뉴</p>
                    <p className="font-bold truncate text-lg drop-shadow-sm">{currentRestaurant.signature}</p>
                  </div>
                  <div className="bg-green-600/90 backdrop-blur-md rounded-xl p-3 px-6 flex flex-col items-center justify-center shadow-lg border border-white/10">
                    <p className="text-xs text-white/80 mb-0.5 font-bold">칼로리</p>
                    <p className="text-xl font-black drop-shadow-sm">{currentRestaurant.signatureCalories}kcal</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center justify-center gap-6 py-6 mt-auto shrink-0">
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
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-50 text-gray-400 hover:rotate-180 transition-all duration-500"
          title="다시 추천받기"
        >
          <RefreshCcw className="w-5 h-5" />
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

      {/* Mobile Hint */}
      <div className="text-xs text-gray-400 font-medium animate-bounce mb-2">
        사진을 클릭하면 상세 정보를 볼 수 있어요!
      </div>
    </div>
  );
}