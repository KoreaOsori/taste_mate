import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Star, X, Heart, RefreshCcw, Info, MapPin } from 'lucide-react';
import './CardStack.css';

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

const CATEGORY_IMAGES: Record<string, string> = {
  '한식': 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=800',
  '중식': 'https://images.unsplash.com/photo-1525755662778-989d0224087e?auto=format&fit=crop&q=80&w=800',
  '일식': 'https://images.unsplash.com/photo-1583953623787-ada99d338235?auto=format&fit=crop&q=80&w=800',
  '양식': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=800',
  '카페': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800',
  'BUNSIK': 'https://images.unsplash.com/photo-1620138546344-7b2c08e5c446?auto=format&fit=crop&q=80&w=800',
  'KOREAN': 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=800',
  'WESTERN': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=800',
  'CHINESE': 'https://images.unsplash.com/photo-1525755662778-989d0224087e?auto=format&fit=crop&q=80&w=800',
  'default': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
};

export function RestaurantRecommendationCardView({
  restaurants,
  onSelectRestaurant,
  onShowFeedback,
  onRefresh
}: RestaurantRecommendationCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const x = useMotionValue(0);

  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const rotateValue = useTransform(x, [-200, 200], [-10, 10]);

  useEffect(() => {
    setCurrentIndex(0);
    x.set(0);
  }, [restaurants, x]);

  const handleSwipeAction = (swipeDir: 'prev' | 'next') => {
    if (swipeDir === 'next') {
      if (currentIndex < restaurants.length - 1) {
        setDirection(1);
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      if (currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex(prev => prev - 1);
      }
    }
    x.set(0);
  };

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white min-h-[500px]">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
          <RefreshCcw className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">추천 메뉴가 없습니다.</h2>
        <button
          onClick={onRefresh}
          className="px-10 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg"
        >
          로딩 새로고침
        </button>
      </div>
    );
  }

  const res = restaurants[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : direction < 0 ? -500 : 0,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500, // Exit in the opposite direction of entry
      opacity: 0,
    })
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-hidden p-6 gap-4 recommendation-container">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">메뉴 추천</h2>
          <p className="text-sm text-gray-400 font-semibold">{currentIndex + 1} / {restaurants.length}</p>
        </div>
        {/* Refresh button moved to footer as requested */}
      </div>

      {/* Main Container */}
      <div className="flex-1 relative flex items-center justify-center overflow-visible">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ x: x, rotate: rotateValue }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_e, { offset, velocity }) => {
              if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
                // Swapped: Swipe Left for Next, Swipe Right for Previous
                handleSwipeAction(offset.x > 0 ? 'prev' : 'next');
              }
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="standard-card absolute overflow-hidden bg-white rounded-3xl shadow-xl"
          >
            {/* Stamps */}
            <motion.div style={{ opacity: likeOpacity }} className="stamp border-blue-500 text-blue-500 left-8 top-12 rotate-[-10deg] absolute">PREV</motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="stamp border-green-500 text-green-500 right-8 top-12 rotate-[10deg] absolute">NEXT</motion.div>

            <div className="card-image-section">
              <img src={CATEGORY_IMAGES[res.category.toUpperCase()] || CATEGORY_IMAGES[res.category] || CATEGORY_IMAGES['default']} alt={res.signature} className="pointer-events-none" />
            </div>

            <div className="card-content-section p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-green-600 text-[10px] font-bold uppercase tracking-widest mb-1">추천 메뉴</p>
                  <h3 className="text-2xl font-bold text-gray-900 line-clamp-1">{res.signature}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <div className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold mb-1">{res.category}</div>
                  <div className="flex items-center gap-1 text-[12px] font-bold text-gray-800">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {res.rating}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-500 mb-6">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[14px] font-bold text-gray-700">{res.name}</span>
                <span className="text-[12px] text-gray-400 ml-1">• {res.distance}km</span>
              </div>
              <div className="flex gap-3 mb-8">
                <div className="bg-gray-50 px-4 py-2 rounded-xl flex flex-col gap-0.5 min-w-[70px]">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">KCAL</span>
                  <span className="text-sm font-bold text-gray-900">{res.signatureCalories}</span>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-xl flex flex-col gap-0.5 min-w-[70px]">
                  <span className="text-[9px] text-gray-400 font-bold uppercase">PROTEIN</span>
                  <span className="text-sm font-bold text-gray-900">{res.protein}g</span>
                </div>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onSelectRestaurant(res); }}
                className="w-full mt-auto py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                상세 정보 <Info className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Button Controls: X(NEXT) | REFRESH | HEART(PREV) */}
      <div className="flex items-center justify-center gap-6 py-4">
        <button
          onClick={(e) => { e.stopPropagation(); handleSwipeAction('next'); }}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 text-gray-400 hover:text-green-500 transition-all active:scale-90"
          title="다음 메뉴 (왼쪽)"
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onRefresh?.(); }}
          className="w-16 h-16 rounded-full bg-green-600 shadow-xl flex items-center justify-center text-white hover:bg-green-700 transition-all active:rotate-180"
          title="새로고침"
        >
          <RefreshCcw className="w-8 h-8" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleSwipeAction('prev'); }}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 text-gray-400 hover:text-blue-500 transition-all active:scale-90"
          title="이전 메뉴 (오른쪽)"
        >
          <Heart className="w-6 h-6" />
        </button>
      </div>

      <div className="text-center pb-2">
        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
          왼쪽: 다음 • 오른쪽: 이전
        </p>
      </div>
    </div>
  );
}
