import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Star, MapPin, X, Heart, Info, ChevronLeft, MapPinned, ExternalLink, Flame, Utensils, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { UserProfile } from '../App';

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
  userProfile: UserProfile;
  onBack: () => void;
  onOrderClick: (restaurant: Restaurant) => void;
}

export function RestaurantRecommendationCardView({
  restaurants,
  userProfile,
  onBack,
  onOrderClick
}: RestaurantRecommendationCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const handleNext = (direction: 'left' | 'right') => {
    if (currentIndex < restaurants.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of cards, maybe show a reset or go back
      onBack();
    }
  };

  if (restaurants.length === 0 || currentIndex >= restaurants.length) return null;

  const currentRestaurant = restaurants[currentIndex];

  return (
    <div className="fixed inset-0 bg-white overflow-hidden z-20 flex flex-col">
      {/* Top Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-green-600">오늘의 추천</span>
          <span className="text-xs text-gray-400">{currentIndex + 1} / {restaurants.length}</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Card Stack Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 pt-2 pb-24">
        <AnimatePresence mode="popLayout">
          <SwipeCard
            key={currentRestaurant.id}
            restaurant={currentRestaurant}
            onSwipe={handleNext}
            onClick={() => setShowDetail(true)}
          />
        </AnimatePresence>
      </div>

      {/* Bottom Action Buttons (Tinder Style) */}
      <div className="px-8 pb-10 flex justify-center items-center gap-6 absolute bottom-0 left-0 right-0 py-6 bg-gradient-to-t from-white via-white/90 to-transparent">
        <button
          onClick={() => handleNext('left')}
          className="w-16 h-16 rounded-full border-2 border-red-100 bg-white shadow-lg flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-all"
        >
          <X className="w-8 h-8" />
        </button>

        <button
          onClick={() => setShowDetail(true)}
          className="w-12 h-12 rounded-full border-2 border-blue-100 bg-white shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Info className="w-6 h-6" />
        </button>

        <button
          onClick={() => {
            onOrderClick(currentRestaurant);
            handleNext('right');
          }}
          className="w-16 h-16 rounded-full border-2 border-green-100 bg-white shadow-lg flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart className="w-8 h-8 fill-green-500/10" />
        </button>
      </div>

      {/* Detail Overlay Sheet */}
      <AnimatePresence>
        {showDetail && (
          <DetailSheet
            restaurant={currentRestaurant}
            onClose={() => setShowDetail(false)}
            onSelect={() => {
              setShowDetail(false);
              onOrderClick(currentRestaurant);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component: Individual Swipeable Card
function SwipeCard({ restaurant, onSwipe, onClick }: {
  restaurant: Restaurant;
  onSwipe: (dir: 'left' | 'right') => void;
  onClick: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-25, 25]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]);

  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe('right');
        else if (info.offset.x < -100) onSwipe('left');
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }}
      className="absolute inset-0 max-w-sm mx-auto h-[70vh] cursor-grab active:cursor-grabbing"
    >
      <div
        className="w-full h-full bg-white rounded-[40px] shadow-2xl overflow-hidden relative border border-gray-100"
        onClick={onClick}
      >
        {/* Image - 70% height */}
        <div className="h-full relative">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Swipe Labels */}
          <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[-20deg] z-10 pointer-events-none">
            LIKE
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[20deg] z-10 pointer-events-none">
            NOPE
          </motion.div>

          {/* Core Info Overlay */}
          <div className="absolute bottom-10 left-8 right-8 text-white">
            <h2 className="text-4xl font-black mb-3 drop-shadow-lg">{restaurant.name}</h2>
            <div className="flex items-center gap-4 text-lg">
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{restaurant.rating}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <MapPin className="w-5 h-5" />
                <span>{restaurant.distance}km</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <p className="font-bold text-lg leading-tight line-clamp-1">{restaurant.signature}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Sub-component: Detail Sliding Sheet
function DetailSheet({ restaurant, onClose, onSelect }: { restaurant: Restaurant; onClose: () => void; onSelect: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 pb-10 z-50 max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />

        <div className="space-y-8">
          {/* Main Info */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-3xl font-black text-gray-900">{restaurant.name}</h2>
              <p className="text-2xl font-black text-green-600">{restaurant.price}</p>
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <Utensils className="w-4 h-4" /> {restaurant.category} · {restaurant.address}
            </p>
          </div>

          {/* Recommendation Reason */}
          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 밥친구의 추천 한줄평
            </h3>
            <p className="text-lg text-gray-900 leading-relaxed font-semibold italic">
              "{restaurant.reason}"
            </p>
          </div>

          {/* Menu & Nutrition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
              <h3 className="text-xs font-bold text-orange-600 mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4" /> 시그니처 메뉴
              </h3>
              <p className="text-xl font-black text-gray-900 mb-1">{restaurant.signature}</p>
              <div className="flex items-center gap-2 text-sm text-orange-700/70">
                <Flame className="w-4 h-4" /> <span>{restaurant.signatureCalories} kcal</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
              <h3 className="text-xs font-bold text-green-600 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> 배달 예상 시간
              </h3>
              <p className="text-xl font-black text-gray-900 mb-1">{restaurant.deliveryTime}</p>
              <p className="text-sm text-green-700/70">주변 추천 식당</p>
            </div>
          </div>

          {/* Nutritional Breakdown */}
          <div className="bg-gray-50 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-gray-500 mb-4">영양 성분 가이드</h3>
            <div className="flex justify-between items-center text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">단백질</p>
                <p className="text-lg font-bold text-gray-900">{restaurant.protein}g</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-xs text-gray-400 mb-1">탄수화물</p>
                <p className="text-lg font-bold text-gray-900">{restaurant.carbs}g</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-xs text-gray-400 mb-1">지방</p>
                <p className="text-lg font-bold text-gray-900">{restaurant.fat}g</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={onSelect}
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xl font-bold shadow-lg shadow-green-200"
            >
              오늘 점심은 이거다!
            </Button>
            <a
              href={restaurant.naverLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-2 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MapPinned className="w-5 h-5" /> 네이버 지도로 상세 보기
            </a>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Sparkles icon definition if missing (already used Sparkles from lucide-react)