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
    if (direction === 'left') {
      // 다음 카드 (1/5 -> 2/5)
      setExitX(-1000);
      setTimeout(() => {
        setExitX(0);
        setCurrentIndex((prev) => (prev + 1) % restaurants.length);
        setDragProgress(0);
      }, 200);
    } else {
      // 이전 카드 (2/5 -> 1/5)
      setExitX(1000);
      setTimeout(() => {
        setExitX(0);
        setCurrentIndex((prev) => (prev === 0 ? restaurants.length - 1 : prev - 1));
        setDragProgress(0);
      }, 200);
    }
  };

  /* ── 영양소 바 ─────────────────────────── */
  const NutrientBar = ({
    label,
    value,
    bgColor,
    textColor,
    barColor,
    maxValue = 100,
    labelTextColor,
    valueTextColor,
  }: {
    label: string;
    value: number;
    bgColor: string;
    textColor: string;
    barColor: string;
    maxValue?: number;
    labelTextColor?: string;
    valueTextColor?: string;
  }) => (
    <div className={`flex flex-col gap-2 flex-1 px-4 py-4 rounded-2xl border ${bgColor}`}>
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: labelTextColor || textColor }}>{label}</span>
        <span className="text-sm font-black" style={{ color: valueTextColor || '#111827' }}>{value}g</span>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden transition-all bg-gray-100">
        <motion.div
           initial={{ width: 0 }}
           animate={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
           transition={{ duration: 0.6, ease: 'easeOut' }}
           className="h-full rounded-full shadow-sm"
           style={{ backgroundColor: barColor }}
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
    labelColor,
  }: {
    icon: React.ElementType;
    value: string;
    label: string;
    bg: string;
    iconColor: string;
    valueColor: string;
    labelColor?: string;
  }) => (
    <div className={`flex flex-col items-center gap-1.5 py-4 rounded-3xl border-2 ${bg} border-transparent`}>
      <Icon className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
      <span className="text-base font-black leading-none" style={{ color: valueColor }}>{value}</span>
      <span className="text-[10px] font-semibold tracking-wide" style={{ color: labelColor || '#9ca3af' }}>{label}</span>
    </div>
  );

  // [v7.0] 가시성 100% 보장을 위해 다크룸(isNight) 테마 판단 로직을 텍스트 색상에서 제거하고, 
  // 흰 배경에 가장 잘 보이는 프리미엄 블랙/다크그레이 톤으로 고정합니다.
  const infoTextColor = '#111827'; // gray-900 (메인 텍스트)
  const subTextColor = '#374151'; // gray-700 (부가 정보)
  const labelTextColor = '#6b7280'; // gray-500 (라벨)

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden p-4 pt-2 pb-6 transition-all duration-1000 bg-slate-50">

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
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDrag={(_, info) => setDragProgress(info.offset.x)}
            onDragEnd={(_, info) => {
              const dx = info.offset.x;
              const vx = info.velocity.x;
              // 수평 스크롤이 80px 이상이거나 속도가 빠르면 Swipe 인정
              // 왼쪽으로 밀기 (dx < 0) -> Next
              // 오른쪽으로 밀기 (dx > 0) -> Prev
              if (dx < -80 || (dx < -30 && vx < -400)) handleSwipe('left');
              else if (dx > 80 || (dx > 30 && vx > 400)) handleSwipe('right');
              else {
                setDragProgress(0);
                if (Math.abs(dx) <= TAP_THRESHOLD_PX) onSelectRestaurant(currentRestaurant);
              }
            }}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: exitX, opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
            onClick={() => onSelectRestaurant(currentRestaurant)}
            className={`relative flex flex-col w-full h-full rounded-[3rem] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.28)] overflow-hidden ${isNight ? 'bg-slate-900 border border-slate-800' : 'bg-white text-gray-900'}`}
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

              {/* 스탬프 제거 - 갤러리식 양방향 탐색에 집중 */}
            </div>

            {/* ── 정보 영역 (40%) ───────────────── */}
            <div className="px-6 pt-5 pb-5 flex flex-col gap-4 flex-1 overflow-y-auto bg-white">

              {/* 식당명 */}
              <div className="flex items-start justify-between gap-3">
                {/* 식당명 크기 대폭 증가 (h2급, 30px) */}
                <h3 className="text-3xl font-black tracking-tight leading-tight flex-1" style={{ color: infoTextColor }}>
                  {currentRestaurant.name}
                </h3>
              </div>

              {/* 주요 메뉴 표시 (크기 확대) */}
              <div className="flex items-center gap-2 mt-1" style={{ color: '#15803d' }}>
                <Utensils className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold" style={{ color: labelTextColor }}>주요 메뉴</span>
                <span className="text-lg font-black">:</span>
                <span className="text-lg font-black flex-1 truncate" style={{ color: infoTextColor }}>
                  {currentRestaurant.signature}
                  <span className="ml-2 text-sm font-bold px-2.5 py-0.5 rounded-full shadow-sm bg-green-100/80 text-green-700">
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
                  bg="bg-blue-50"
                  iconColor="#3b82f6"
                  valueColor="#1d4ed8"
                  labelColor={labelTextColor}
                />
                <StatCard
                  icon={Utensils}
                  value={currentRestaurant.price}
                  label="가격"
                  bg="bg-orange-50"
                  iconColor="#f97316"
                  valueColor="#c2410c"
                  labelColor={labelTextColor}
                />
                <StatCard
                  icon={Zap}
                  value={`${currentRestaurant.signatureCalories}`}
                  label="kcal"
                  bg="bg-emerald-50"
                  iconColor="#10b981"
                  valueColor="#047857"
                  labelColor={labelTextColor}
                />
              </div>

              {/* 한줄평 - 글자 크기 증가 */}
              <div className="px-4 py-3 rounded-2xl border bg-gray-50 border-gray-100">
                <p className="text-base font-semibold leading-snug italic text-center" style={{ color: subTextColor }}>
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
                    bgColor="bg-blue-50 border-blue-100"
                    textColor="#3b82f6"
                    barColor="#3b82f6"
                    maxValue={100}
                    labelTextColor={labelTextColor}
                    valueTextColor={infoTextColor}
                  />
                  <NutrientBar
                    label="단백질"
                    value={currentRestaurant.protein}
                    bgColor="bg-red-50 border-red-100"
                    textColor="#f43f5e"
                    barColor="#f43f5e"
                    maxValue={60}
                    labelTextColor={labelTextColor}
                    valueTextColor={infoTextColor}
                  />
                  <NutrientBar
                    label="지방"
                    value={currentRestaurant.fat}
                    bgColor="bg-amber-50 border-amber-100"
                    textColor="#f59e0b"
                    barColor="#f59e0b"
                    maxValue={50}
                    labelTextColor={labelTextColor}
                    valueTextColor={infoTextColor}
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
      <div className="w-full flex items-center justify-center gap-4 py-3 shrink-0 max-w-lg z-20 pb-6">

        {/* PASS (Nope) 버튼 */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSwipe('left')}
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-4xl shadow-lg border border-gray-100 transition-all font-black bg-white"
            style={{ color: '#f43f5e' }}
          >
            X
          </motion.button>
          <span className="text-[12px] font-black uppercase text-gray-400">Nope</span>
        </div>

        {/* 새로고침 버튼 */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => { if (onRefresh) onRefresh(); }}
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-5xl shadow-md border border-gray-100 transition-all font-black bg-white"
            style={{ color: '#3b82f6' }}
          >
            ↻
          </motion.button>
          <span className="text-[12px] font-black uppercase text-gray-400">새추천</span>
        </div>

        {/* LIKE 버튼 */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
                if (onLike) onLike(currentRestaurant);
                handleSwipe('left');
            }}
            className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-4xl shadow-lg border border-gray-100 transition-all font-black bg-white"
            style={{ color: '#10b981' }}
          >
            ♥
          </motion.button>
          <span className="text-[12px] font-black uppercase text-gray-400">Like</span>
        </div>
      </div>
    </div>
  );
}
