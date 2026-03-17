import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, X, Heart, RefreshCcw, Utensils, ArrowRight, Sparkles, Zap, Navigation } from 'lucide-react';

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
  theme?: 'morning' | 'afternoon' | 'evening' | 'night';
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onShowFeedback: (restaurant: { name: string; menu: string }) => void;
  onRefresh?: () => void;
  onLike?: (restaurant: Restaurant) => void;
  onDislike?: (restaurant: Restaurant) => void;
}

const TAP_THRESHOLD_PX = 10;

export function RestaurantRecommendationCardView({
  restaurants,
  theme = 'afternoon',
  onSelectRestaurant,
  onShowFeedback,
  onRefresh,
  onLike,
  onDislike,
}: RestaurantRecommendationCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);
  const [exitX, setExitX] = useState<number | string>(0);

  if (!restaurants || restaurants.length === 0) return null;

  const currentRestaurant = restaurants[currentIndex % restaurants.length];
  const isNight = theme === 'night';

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      if (onLike) onLike(currentRestaurant);
      setExitX(1000);
    } else {
      if (onDislike) onDislike(currentRestaurant);
      setExitX(-1000);
    }
    setTimeout(() => {
      setExitX(0);
      setCurrentIndex((prev) => (prev + 1) % restaurants.length);
      setDragProgress(0);
    }, 250);
  };

  /* ── 영양소 바 ─────────────────────────── */
  const NutrientBar = ({
    label,
    value,
    bgColor,
    textColor,
    barColor,
    maxValue = 100,
  }: {
    label: string;
    value: number;
    bgColor: string;
    textColor: string;
    barColor: string;
    maxValue?: number;
  }) => (
    <div className={`flex flex-col gap-2 flex-1 px-4 py-4 rounded-2xl border ${bgColor}`}>
      <div className="flex justify-between items-center">
        <span className={`text-[11px] font-bold tracking-wide uppercase ${textColor}`}>{label}</span>
        <span className={`text-sm font-black ${isNight ? 'text-white' : 'text-gray-900'}`}>{value}g</span>
      </div>
      <div className={`h-3 w-full rounded-full overflow-hidden ${isNight ? 'bg-slate-700' : 'bg-white/70'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor} shadow-sm`}
        />
      </div>
    </div>
  );

  /* ── 핵심 정보 스탯 카드 ─────────────────── */
  const StatCard = ({
    icon: Icon,
    value,
    label,
    bg,
    iconColor,
    valueColor,
  }: {
    icon: React.ElementType;
    value: string;
    label: string;
    bg: string;
    iconColor: string;
    valueColor: string;
  }) => (
    <div className={`flex flex-col items-center gap-1.5 py-4 rounded-3xl border-2 ${bg} ${isNight ? 'border-slate-700/50' : 'border-transparent'}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span className={`text-base font-black leading-none ${valueColor}`}>{value}</span>
      <span className={`text-[10px] font-semibold tracking-wide ${isNight ? 'text-slate-500' : 'text-gray-400'}`}>{label}</span>
    </div>
  );

  return (
    <div className={`relative w-full h-full flex flex-col items-center overflow-hidden p-4 pt-2 pb-6 transition-all duration-1000 ${isNight ? 'bg-slate-950' : 'bg-slate-50'}`}>

      {/* ── 헤더 ─────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-2 mt-2 mb-3 shrink-0 max-w-lg z-20">
        <h2 className={`text-sm font-bold tracking-tight flex items-center gap-1.5 ${isNight ? 'text-white/50' : 'text-gray-400'}`}>
          <Sparkles className="w-4 h-4" />
          근처 맛집 추천
        </h2>
        <div className={`font-black px-3 py-1 rounded-full text-[11px] shadow-sm ${isNight ? 'bg-indigo-600/40 text-white/70' : 'bg-white text-gray-500 shadow'}`}>
          {currentIndex + 1} / {restaurants.length}
        </div>
      </div>

      {/* ── 메인 카드 ────────────────────────── */}
      <div className="relative w-full flex-[1.2] max-w-lg z-10 flex flex-col mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRestaurant.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDrag={(_, info) => setDragProgress(info.offset.x)}
            onDragEnd={(_, info) => {
              const dx = info.offset.x;
              if (dx > 100) handleSwipe('right');
              else if (dx < -100) handleSwipe('left');
              else {
                setDragProgress(0);
                if (Math.abs(dx) <= TAP_THRESHOLD_PX) onSelectRestaurant(currentRestaurant);
              }
            }}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitX, opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
            className={`relative flex flex-col w-full h-full rounded-[3rem] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.28)] overflow-hidden ${isNight ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
          >
            {/* ── 이미지 영역: 55% 고정 (스크롤 방지 가능 마지노선) ────────── */}
            <div className="relative w-full shrink-0 overflow-hidden bg-gray-100" style={{ height: '55%' }}>
              {currentRestaurant.imageUrl ? (
                <img
                  src={currentRestaurant.imageUrl}
                  alt={currentRestaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000';
                  }}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isNight ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <Utensils className={`w-28 h-28 ${isNight ? 'text-slate-700' : 'text-gray-200'}`} />
                </div>
              )}

              {/* 하단 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              {/* 카테고리 배지 (좌상단) - 완전한 흰색 배경에 초록색 큰 글씨로 시인성 극대화 */}
              <div className="absolute top-4 left-4">
                <span className="text-lg font-black px-5 py-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] tracking-wide bg-white text-green-700">
                  {currentRestaurant.category}
                </span>
              </div>

              {/* 스와이프 스탬프 */}
              <motion.div
                style={{ opacity: dragProgress > 60 ? Math.min((dragProgress - 60) / 100, 1) : 0 }}
                className="absolute bottom-6 left-8 z-20 border-[5px] border-emerald-400 rounded-3xl px-7 py-2.5 -rotate-12 bg-white/95 shadow-2xl pointer-events-none"
              >
                <span className="text-emerald-500 text-3xl font-black uppercase">LIKE</span>
              </motion.div>
              <motion.div
                style={{ opacity: dragProgress < -60 ? Math.min(Math.abs(dragProgress + 60) / 100, 1) : 0 }}
                className="absolute bottom-6 right-8 z-20 border-[5px] border-rose-400 rounded-3xl px-7 py-2.5 rotate-12 bg-white/95 shadow-2xl pointer-events-none"
              >
                <span className="text-rose-500 text-3xl font-black uppercase">PASS</span>
              </motion.div>
            </div>

            {/* ── 정보 영역 (40%) ───────────────── */}
            <div className={`px-6 pt-5 pb-5 flex flex-col gap-4 flex-1 overflow-y-auto ${isNight ? 'bg-slate-900 text-white' : 'bg-white'}`}>

              {/* 식당명 */}
              <div className="flex items-start justify-between gap-3">
                {/* 식당명 크기 대폭 증가 (h2급, 30px) */}
                <h3 className={`text-3xl font-black tracking-tight leading-tight flex-1 ${isNight ? 'text-white' : 'text-gray-900'}`}>
                  {currentRestaurant.name}
                </h3>
              </div>

              {/* 주요 메뉴 표시 (크기 확대) */}
              <div className={`flex items-center gap-2 mt-1 ${isNight ? 'text-indigo-300' : 'text-green-700'}`}>
                <Utensils className="w-5 h-5 shrink-0" />
                <span className={`text-sm font-bold ${isNight ? 'text-slate-400' : 'text-gray-500'}`}>주요 메뉴</span>
                <span className="text-lg font-black">:</span>
                <span className="text-lg font-black flex-1 truncate">
                  {currentRestaurant.signature}
                  <span className={`ml-2 text-sm font-bold px-2.5 py-0.5 rounded-full shadow-sm ${isNight ? 'bg-indigo-800/60 text-indigo-300' : 'bg-green-100/80 text-green-700'}`}>
                    추천음식
                  </span>
                </span>
              </div>

              {/* 핵심 통계 3개 */}
              <div className="grid grid-cols-3 gap-2.5">
                <StatCard
                  icon={MapPin}
                  value={`${currentRestaurant.distance}km`}
                  label="거리"
                  bg={isNight ? 'bg-blue-900/30' : 'bg-blue-50'}
                  iconColor="text-blue-500"
                  valueColor={isNight ? 'text-blue-300' : 'text-blue-700'}
                />
                <StatCard
                  icon={Utensils}
                  value={currentRestaurant.price}
                  label="가격"
                  bg={isNight ? 'bg-orange-900/30' : 'bg-orange-50'}
                  iconColor="text-orange-500"
                  valueColor={isNight ? 'text-orange-300' : 'text-orange-700'}
                />
                <StatCard
                  icon={Zap}
                  value={`${currentRestaurant.signatureCalories}`}
                  label="kcal"
                  bg={isNight ? 'bg-emerald-900/30' : 'bg-emerald-50'}
                  iconColor="text-emerald-500"
                  valueColor={isNight ? 'text-emerald-300' : 'text-emerald-700'}
                />
              </div>

              {/* 한줄평 - 글자 크기 증가 */}
              <div className={`px-4 py-3 rounded-2xl border ${isNight ? 'bg-slate-800/60 border-slate-700/40' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-base font-semibold leading-snug italic text-center ${isNight ? 'text-slate-200' : 'text-gray-700'}`}>
                  "{currentRestaurant.reason}"
                </p>
              </div>

              {/* 영양 정보 */}
              <div className={`rounded-3xl border-2 p-4 ${isNight ? 'bg-slate-800/30 border-slate-700/40' : 'bg-slate-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🔬</span>
                  <span className={`text-xs font-black tracking-widest uppercase ${isNight ? 'text-slate-400' : 'text-gray-500'}`}>
                    영양 밸런스
                  </span>
                </div>
                <div className="flex gap-2">
                  <NutrientBar
                    label="탄수화물"
                    value={currentRestaurant.carbs}
                    bgColor={isNight ? 'bg-blue-900/40 border-blue-700/30' : 'bg-blue-50 border-blue-100'}
                    textColor={isNight ? 'text-blue-400' : 'text-blue-500'}
                    barColor="bg-blue-500"
                    maxValue={100}
                  />
                  <NutrientBar
                    label="단백질"
                    value={currentRestaurant.protein}
                    bgColor={isNight ? 'bg-rose-900/40 border-rose-700/30' : 'bg-red-50 border-red-100'}
                    textColor={isNight ? 'text-rose-400' : 'text-rose-500'}
                    barColor="bg-rose-500"
                    maxValue={60}
                  />
                  <NutrientBar
                    label="지방"
                    value={currentRestaurant.fat}
                    bgColor={isNight ? 'bg-amber-900/40 border-amber-700/30' : 'bg-amber-50 border-amber-100'}
                    textColor={isNight ? 'text-amber-400' : 'text-amber-500'}
                    barColor="bg-amber-500"
                    maxValue={50}
                  />
                </div>
              </div>

              {/* CTA 버튼 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectRestaurant(currentRestaurant)}
                className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${isNight
                  ? 'bg-indigo-600 text-white shadow-indigo-900'
                  : 'bg-green-600 text-white shadow-green-200 hover:bg-green-700'
                }`}
              >
                <Navigation className="w-5 h-5" />
                <span className="tracking-tight">상세 정보 및 예약하러 가기</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 하단 액션 버튼 3개 (이모지 버튼) ─────────────────
           X(Nope) → dislike / 다음 추천 제외
           ↺      → 새 추천 목록 가져오기
           ♥(Like) → like / 알고리즘 반영
      ──────────────────────────────────────── */}
      <div className="w-full flex items-center justify-center gap-[4.5rem] py-3 shrink-0 max-w-lg z-20 pb-6">

        {/* PASS (Nope) 버튼 */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSwipe('left')}
            className={`w-[68px] h-[68px] rounded-full flex items-center justify-center text-4xl shadow-lg border border-gray-100 transition-all ${isNight ? 'bg-slate-800' : 'bg-white'}`}
          >
            ❌
          </motion.button>
          <span className={`text-[12px] font-black uppercase ${isNight ? 'text-slate-500' : 'text-gray-400'}`}>Nope</span>
        </div>

        {/* 새로고침 버튼 */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => { if (onRefresh) onRefresh(); }}
            className={`w-[68px] h-[68px] rounded-full flex items-center justify-center text-4xl shadow-md border border-gray-100 transition-all ${isNight ? 'bg-slate-800' : 'bg-white'}`}
          >
            🔄
          </motion.button>
          <span className={`text-[12px] font-black uppercase ${isNight ? 'text-slate-500' : 'text-gray-400'}`}>새추천</span>
        </div>

        {/* LIKE 버튼 */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSwipe('right')}
            className={`w-[68px] h-[68px] rounded-full flex items-center justify-center text-4xl shadow-lg border border-gray-100 transition-all ${isNight ? 'bg-slate-800' : 'bg-white'}`}
          >
            💖
          </motion.button>
          <span className={`text-[12px] font-black uppercase ${isNight ? 'text-slate-500' : 'text-gray-400'}`}>Like</span>
        </div>
      </div>
    </div>
  );
}
