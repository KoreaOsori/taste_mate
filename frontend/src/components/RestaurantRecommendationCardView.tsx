import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, X, Heart, RefreshCcw, Info } from 'lucide-react';

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
}

export function RestaurantRecommendationCardView({
  restaurants,
  onSelectRestaurant,
  onShowFeedback,
  onRefresh
}: RestaurantRecommendationCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitX, setExitX] = useState<number | string>(0);

  const handleSwipe = (direction: 'left' | 'right') => {
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

  return (
    <div className="relative h-[calc(100vh-140px)] flex flex-col items-center justify-between bg-white overflow-hidden p-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-2 mb-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">오늘의 추천</h2>
        <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {restaurants.length}
        </div>
      </div>

      {/* Card Container */}
      <div className="relative w-full flex-1 max-w-md perspective-1000">
        <AnimatePresence>
          <motion.div
            key={currentRestaurant.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
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
              className="relative h-full w-full"
              onClick={() => onSelectRestaurant(currentRestaurant)}
            >
              <img
                src={currentRestaurant.imageUrl}
                alt={currentRestaurant.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/0" />

              {/* Detail Info Indicator */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2">
                <Info className="w-5 h-5 text-white" />
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-4xl font-bold mb-2 drop-shadow-lg">{currentRestaurant.name}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{currentRestaurant.rating}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <MapPin className="w-4 h-4" />
                    <span>{currentRestaurant.distance}km</span>
                  </div>
                </div>

                <p className="text-lg font-medium bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 line-clamp-2">
                  "{currentRestaurant.reason}"
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-green-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-bold">
                    {currentRestaurant.category}
                  </span>
                  <span className="bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-bold">
                    {currentRestaurant.signatureCalories}kcal
                  </span>
                </div>
              </div>

              {/* Swipe Stamps */}
              {/* These appear while dragging - simplified for now */}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center justify-center gap-6 py-6 mt-4">
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