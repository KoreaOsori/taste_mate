import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, X, Heart, RefreshCcw, Utensils } from 'lucide-react';

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
  const [dragProgress, setDragProgress] = useState(0);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      if (currentIndex < restaurants.length - 1) {
        setExitX(-1000);
        setTimeout(() => { setCurrentIndex(p => p + 1); setExitX(0); }, 200);
      } else {
        setExitX(-1000);
        setTimeout(() => { setCurrentIndex(0); setExitX(0); }, 200);
      }
    } else {
      if (currentIndex > 0) {
        setExitX(1000);
        setTimeout(() => { setCurrentIndex(p => p - 1); setExitX(0); }, 200);
      } else {
        setExitX(20);
        setTimeout(() => setExitX(0), 100);
      }
    }
  };

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else setCurrentIndex(0);
  };

  if (restaurants.length === 0 || currentIndex >= restaurants.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <RefreshCcw className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">모든 추천을 다 보셨어요!</h2>
        <p className="text-gray-600 mb-6">새로운 맛집을 찾으러 가볼까요?</p>
        <button onClick={handleRefresh} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all">
          다시 추천받기
        </button>
      </div>
    );
  }

  const currentRestaurant = restaurants[currentIndex];

  return (
    // Outer: fills the entire parent container, vertical flex layout
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50" style={{ minHeight: 0 }}>

      {/* ── 헤더: 제목 + 인덱스 ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">오늘의 추천</h2>
        <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {restaurants.length}
        </span>
      </div>

      {/* ── 카드 영역: flex-1로 남은 높이 전부 사용 ── */}
      <div className="flex-1 px-4 pt-3 pb-1 overflow-hidden" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRestaurant.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDrag={(_, info) => setDragProgress(info.offset.x)}
            onDragEnd={(_, info) => {
              setDragProgress(0);
              if (info.offset.x > 100) handleSwipe('right');
              else if (info.offset.x < -100) handleSwipe('left');
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: exitX, opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100 flex flex-col"
          >
            {/* 사진 영역: 고정 높이 비율 */}
            <div
              className="relative w-full shrink-0"
              style={{ height: '48%' }}
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
              {/* 카테고리 배지 */}
              <span className="absolute top-3 left-3 bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-md">
                {currentRestaurant.category}
              </span>
              <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold">
                네이버 실사 기반
              </span>
              {/* 스와이프 힌트 */}
              <motion.div
                style={{ opacity: dragProgress > 40 ? Math.min((dragProgress - 40) / 100, 1) : 0 }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <span className="border-4 border-blue-500 text-blue-500 bg-white/80 text-xl font-black px-4 py-1 rounded-lg -rotate-12">PREV</span>
              </motion.div>
              <motion.div
                style={{ opacity: dragProgress < -40 ? Math.min(Math.abs(dragProgress + 40) / 100, 1) : 0 }}
                className="absolute inset-0 flex items-center justify-center z-20"
              >
                <span className="border-4 border-green-500 text-green-600 bg-white/80 text-xl font-black px-4 py-1 rounded-lg rotate-12">NEXT</span>
              </motion.div>
            </div>

            {/* 정보 영역: 나머지 높이 사용 */}
            <div className="flex-1 flex flex-col overflow-hidden px-5 pt-4 pb-3">
              {/* 이름 + 별점 */}
              <div className="flex items-start justify-between mb-1.5 shrink-0">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter leading-tight pr-2 flex-1">
                  {currentRestaurant.name}
                </h3>
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-lg shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-yellow-700">{currentRestaurant.rating}</span>
                </div>
              </div>

              {/* 주소 */}
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-3 shrink-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentRestaurant.address}</span>
              </div>

              {/* 추천 이유 */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mb-3 shrink-0">
                <p className="text-[13px] text-gray-700 leading-relaxed font-medium line-clamp-3">
                  {currentRestaurant.reason}
                </p>
              </div>

              {/* 추천 메뉴 + 칼로리 */}
              <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-3 shrink-0">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[9px] text-green-600 font-black uppercase tracking-widest mb-0.5">강력 추천 메뉴</p>
                  <p className="font-bold text-gray-900 text-sm truncate">{currentRestaurant.signature}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mb-0.5">CALORIES</p>
                  <p className="text-base font-black text-green-700 tracking-tighter">{currentRestaurant.signatureCalories}kcal</p>
                </div>
              </div>

              {/* 영양소 */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <div className="bg-blue-50 border border-blue-100 rounded-xl py-2 flex flex-col items-center">
                  <p className="text-[9px] text-blue-500 font-black mb-0.5">PROT</p>
                  <p className="font-bold text-gray-900 text-sm">{currentRestaurant.protein}g</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl py-2 flex flex-col items-center">
                  <p className="text-[9px] text-orange-500 font-black mb-0.5">CARB</p>
                  <p className="font-bold text-gray-900 text-sm">{currentRestaurant.carbs}g</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl py-2 flex flex-col items-center">
                  <p className="text-[9px] text-red-500 font-black mb-0.5">FAT</p>
                  <p className="font-bold text-gray-900 text-sm">{currentRestaurant.fat}g</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 액션 버튼: 카드 아래 별도 행 ── */}
      <div className="shrink-0 flex items-center justify-center gap-6 py-4 bg-gray-50">
        <button
          onClick={() => { onDislike?.(currentRestaurant); handleSwipe('left'); }}
          className="w-14 h-14 rounded-full bg-white shadow-lg border border-red-100 flex items-center justify-center text-red-400 hover:scale-110 active:scale-95 transition-all"
        >
          <X className="w-7 h-7" />
        </button>

        <button
          onClick={handleRefresh}
          className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:rotate-180 transition-all duration-500"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => { onLike?.(currentRestaurant); handleSwipe('left'); }}
          className="w-14 h-14 rounded-full bg-white shadow-lg border border-green-100 flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart className="w-7 h-7 fill-green-500" />
        </button>
      </div>

      {/* 스와이프 힌트 */}
      <p className="shrink-0 text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest pb-2 bg-gray-50">
        Swipe left/right • Buttons to like/nope
      </p>
    </div>
  );
}