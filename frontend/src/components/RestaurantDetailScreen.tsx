import { useState } from 'react';
import { MapPin, Star, Clock, Flame, ExternalLink, Navigation2, Phone, Heart, Share2 } from 'lucide-react';
import { Button } from './ui/button';

interface Restaurant {
  id: string;
  name: string;
  menuName: string;
  category: string;
  calories: number;
  distance: number;
  rating: number;
  reviewCount: number;
  price: string;
  oneLiner: string;
  imageUrl: string;
  address: string;
  phone: string;
  openingHours: string;
  naverLink: string;
  baeminLink?: string;
  yogiyoLink?: string;
}

interface RestaurantDetailScreenProps {
  restaurant: Restaurant;
  onSelect: (deliveryType: 'delivery' | 'dine-in') => void;
  onBack: () => void;
}

export function RestaurantDetailScreen({ restaurant, onSelect, onBack }: RestaurantDetailScreenProps) {
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'delivery' | 'dine-in' | null>(null);
  const [satisfaction, setSatisfaction] = useState<number>(0);

  const handleDeliverySelect = (type: 'delivery' | 'dine-in') => {
    setSelectedDeliveryType(type);
    setShowSatisfactionModal(true);
  };

  const handleSatisfactionSubmit = () => {
    if (selectedDeliveryType && satisfaction > 0) {
      // Save satisfaction rating
      console.log('Satisfaction:', satisfaction, 'Delivery Type:', selectedDeliveryType);
      onSelect(selectedDeliveryType);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.menuName}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          ←
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Heart className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-600" />
          <span className="font-bold">{restaurant.calories}kcal</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-green-600 px-2 py-1 bg-green-50 rounded">
                  {restaurant.category}
                </span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{restaurant.distance}km</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{restaurant.menuName}</h1>
              <p className="text-gray-600">{restaurant.name}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold text-gray-900">{restaurant.rating}</span>
              </div>
              <p className="text-xs text-gray-500">리뷰 {restaurant.reviewCount}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-900 italic">"{restaurant.oneLiner}"</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <p className="text-3xl font-bold text-green-600">{restaurant.price}</p>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h3 className="font-bold text-gray-900 mb-3">매장 정보</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">{restaurant.phone}</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">{restaurant.openingHours}</p>
            </div>
          </div>
        </div>

        {/* Delivery Options */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">어떻게 드실건가요?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDeliverySelect('delivery')}
              className="bg-white border-2 border-green-600 text-green-600 rounded-xl p-4 text-center hover:bg-green-50 transition-colors"
            >
              <div className="text-2xl mb-2">🛵</div>
              <p className="font-medium">배달 주문</p>
              <p className="text-xs opacity-75 mt-1">30-40분 소요</p>
            </button>
            <button
              onClick={() => handleDeliverySelect('dine-in')}
              className="bg-white border-2 border-green-600 text-green-600 rounded-xl p-4 text-center hover:bg-green-50 transition-colors"
            >
              <div className="text-2xl mb-2">🚶</div>
              <p className="font-medium">방문 식사</p>
              <p className="text-xs opacity-75 mt-1">도보 {Math.round(restaurant.distance * 12)}분</p>
            </button>
          </div>
        </div>

        {/* Delivery Links */}
        {selectedDeliveryType === 'delivery' && (
          <div className="mb-6 animate-in fade-in duration-300">
            <h3 className="font-bold text-gray-900 mb-3">배달 앱 선택</h3>
            <div className="space-y-2">
              <a
                href={restaurant.naverLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-600 transition-colors"
              >
                <span className="font-medium text-gray-900">네이버 주문</span>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>
              {restaurant.baeminLink && (
                <a
                  href={restaurant.baeminLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-600 transition-colors"
                >
                  <span className="font-medium text-gray-900">배달의민족</span>
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </a>
              )}
              {restaurant.yogiyoLink && (
                <a
                  href={restaurant.yogiyoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-600 transition-colors"
                >
                  <span className="font-medium text-gray-900">요기요</span>
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Map Link for Dine-in */}
        {selectedDeliveryType === 'dine-in' && (
          <div className="mb-6 animate-in fade-in duration-300">
            <a
              href={restaurant.naverLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Navigation2 className="w-5 h-5" />
              <span className="font-medium">길찾기</span>
            </a>
          </div>
        )}
      </div>

      {/* Satisfaction Modal */}
      {showSatisfactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md animate-in slide-in-from-bottom duration-300">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">만족도를 알려주세요</h2>
              <p className="text-sm text-gray-600 mb-6">
                다음 추천에 반영됩니다
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSatisfaction(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= satisfaction
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  {satisfaction === 0 && '별점을 선택해주세요'}
                  {satisfaction === 1 && '😞 별로였어요'}
                  {satisfaction === 2 && '😕 그저 그래요'}
                  {satisfaction === 3 && '😊 괜찮아요'}
                  {satisfaction === 4 && '😄 좋아요!'}
                  {satisfaction === 5 && '🤩 최고예요!'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowSatisfactionModal(false);
                    setSelectedDeliveryType(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSatisfactionSubmit}
                  disabled={satisfaction === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  완료
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
