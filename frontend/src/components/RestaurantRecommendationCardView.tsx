import React, { useState, useRef } from 'react';
import { Star, MapPin, Check, MapPinned, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

export function RestaurantRecommendationCardView({
  restaurants,
  onSelectRestaurant,
  onShowFeedback
}: RestaurantRecommendationCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleNext = () => {
    if (currentIndex < restaurants.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      handleNext();
    }
    if (touchEndX.current - touchStartX.current > 50) {
      handlePrevious();
    }
  };

  if (restaurants.length === 0) return null;

  const currentRestaurant = restaurants[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          오늘은 이걸로!
        </h1>
        <p className="text-center text-gray-600 text-base">
          {currentIndex + 1} / {restaurants.length}
        </p>
      </div>

      {/* Card Stack - Full width */}
      <div
        className="px-4 py-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Image Section - Much bigger */}
            <div className="relative h-96">
              <img
                src={currentRestaurant.imageUrl}
                alt={currentRestaurant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />

              {/* Category Badge */}
              <div className="absolute top-6 left-6 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                {currentRestaurant.category}
              </div>

              {/* Bottom Info Overlay - Bigger text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">{currentRestaurant.name}</h2>
                <div className="flex items-center gap-4 text-base">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-white" />
                    <span className="font-bold">{currentRestaurant.rating}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5" />
                    <span>{currentRestaurant.distance}km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section - Bigger padding and text */}
            <div className="p-6 space-y-5">
              {/* Signature Menu */}
              <div className="bg-green-50 rounded-3xl p-6 border-2 border-green-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">추천 메뉴</p>
                    <p className="font-bold text-gray-900 text-2xl">{currentRestaurant.signature}</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{currentRestaurant.price}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-semibold">{currentRestaurant.signatureCalories}kcal</span>
                  <span>•</span>
                  <span>배달 {currentRestaurant.deliveryTime}</span>
                </div>
              </div>

              {/* Recommendation Reason - Bigger */}
              <div className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-100">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">💬</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">밥친구의 추천 이유</p>
                    <p className="text-base text-gray-900 leading-relaxed font-medium">{currentRestaurant.reason}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Bigger */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => onSelectRestaurant(currentRestaurant)}
                  className="flex items-center justify-center gap-3 w-full px-6 py-5 bg-green-600 text-white rounded-3xl font-bold text-xl hover:bg-green-700 transition-all shadow-xl"
                >
                  <Check className="w-6 h-6" />
                  이거 먹을게요!
                </button>

                <a
                  href={currentRestaurant.naverLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-3xl font-semibold text-lg hover:bg-gray-50 transition-colors"
                >
                  <MapPinned className="w-6 h-6" />
                  식당 정보 보기
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-5 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-10"
            >
              <ChevronLeft className="w-7 h-7 text-gray-900" />
            </button>
          )}

          {currentIndex < restaurants.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-5 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-10"
            >
              <ChevronRight className="w-7 h-7 text-gray-900" />
            </button>
          )}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {restaurants.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === currentIndex ? 'bg-green-600 w-10' : 'bg-gray-300 w-2.5'
                }`}
            />
          ))}
        </div>

        {/* Swipe Hint - Bigger */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            👈 좌우로 스와이프 👉
          </p>
        </div>

        {/* Test Feedback Button */}
        <button
          onClick={() => onShowFeedback({
            name: currentRestaurant.name,
            menu: currentRestaurant.signature
          })}
          className="mt-4 w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
        >
          🔹 피드백 팝업 미리보기 (테스트용)
        </button>
      </div>
    </div>
  );
}