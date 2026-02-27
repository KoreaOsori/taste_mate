import { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { MapPin, Star, ExternalLink, Check, ChevronLeft, ChevronRight, RefreshCw, Navigation, Car, MapPinned, ArrowRight, Sparkles, Zap, MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { RecommendationLoadingScreen } from './RecommendationLoadingScreen';
import { FeedbackModal } from './FeedbackModal';
import { RestaurantRecommendationCardView } from './RestaurantRecommendationCardView';
import { recommendService } from '../api/apiClient';


interface RestaurantRecommendationScreenNewProps {
  userProfile: UserProfile;
  userLocation?: { latitude: number; longitude: number } | null;
}

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

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: '밥도둑 제육볶음',
    category: '한식',
    distance: 0.3,
    rating: 4.8,
    reviewCount: 1247,
    signature: '매콤한 제육볶음',
    signatureCalories: 680,
    price: '9,000원',
    deliveryTime: '25-35분',
    naverLink: 'https://map.naver.com',
    baeminLink: 'https://www.baemin.com',
    yogiyoLink: 'https://www.yogiyo.co.kr',
    imageUrl: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=400&h=300&fit=crop',
    reason: '지금 주변에서 가장 인기있는 메뉴!',
    protein: 38,
    carbs: 75,
    fat: 22,
    address: '서울시 강남구 역삼동 123-45',
  },
  {
    id: '2',
    name: '샐러디',
    category: '샐러드',
    distance: 0.5,
    rating: 4.7,
    reviewCount: 892,
    signature: '닭가슴살 시저 샐러드',
    signatureCalories: 320,
    price: '12,000원',
    deliveryTime: '20-30분',
    naverLink: 'https://map.naver.com',
    baeminLink: 'https://www.baemin.com',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
    reason: '건강하고 가볍게!',
    protein: 35,
    carbs: 15,
    fat: 12,
    address: '서울시 강남구 역삼동 234-56',
  },
];

type QuestionStep = 'initial' | 'emotion' | 'companion' | 'preference' | 'budget' | 'loading' | 'result';

export function RestaurantRecommendationScreenNew({ userProfile, userLocation }: RestaurantRecommendationScreenNewProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Question flow states
  const [questionStep, setQuestionStep] = useState<QuestionStep>('initial');
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [selectedCompanion, setSelectedCompanion] = useState<string>('');
  const [selectedPreference, setSelectedPreference] = useState<string>('');
  const [selectedBudget, setSelectedBudget] = useState<string>('');

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRestaurant, setFeedbackRestaurant] = useState<{ name: string; menu: string } | null>(null);

  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string } | null>(null);
  const [userLocationData, setUserLocationData] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Priority: 1. Props from App.tsx, 2. Geolocation API, 3. Default (Seoul)
    if (userLocation) {
      const { latitude, longitude } = userLocation;
      setUserLocationData({ lat: latitude, lng: longitude });
      fetchWeather(latitude, longitude);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocationData({ lat: latitude, lng: longitude });
          fetchWeather(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation failed or denied:', error);
          const defaultLoc = { lat: 37.5665, lng: 126.9780 };
          setUserLocationData(defaultLoc);
          fetchWeather(defaultLoc.lat, defaultLoc.lng);
        }
      );
    }
  }, [userLocation]);

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      );
      const data = await response.json();
      if (data.current_weather) {
        setWeatherData({
          temp: Math.round(data.current_weather.temperature),
          condition: data.current_weather.weathercode < 3 ? '맑음' : data.current_weather.weathercode < 50 ? '흐림' : '비',
        });
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherData({ temp: 20, condition: '맑음' });
    }
  };

  const generateRecommendations = async (isQuick: boolean) => {
    try {
      const currentHour = new Date().getHours();
      const weather = weatherData?.condition || '맑음';

      // Ensure we use the latest userProfile.user_id
      const data = await recommendService.getRecommendations(
        userProfile.user_id,
        userLocationData?.lat,
        userLocationData?.lng,
        weather,
        currentHour
      );

      if (data && data.length > 0) {
        setRestaurants(data as unknown as Restaurant[]);
        setQuestionStep('result');
        return;
      } else {
        console.warn('추천 API에서 데이터가 반환되지 않았습니다.');
      }
    } catch (err) {
      console.error('추천 API 호출 중 오류 발생:', err);
    }

    // Fallback to mock data
    setRestaurants(MOCK_RESTAURANTS);
    setQuestionStep('result');
  };

  const handleQuickRecommendation = () => {
    setIsQuickMode(true);
    setQuestionStep('loading');
    generateRecommendations(true);
  };

  const handleCustomRecommendation = () => {
    setIsQuickMode(false);
    setQuestionStep('emotion');
  };

  const handleNextQuestion = (value: string, currentStep: QuestionStep) => {
    switch (currentStep) {
      case 'emotion':
        setSelectedEmotion(value);
        setQuestionStep('companion');
        break;
      case 'companion':
        setSelectedCompanion(value);
        setQuestionStep('preference');
        break;
      case 'preference':
        setSelectedPreference(value);
        setQuestionStep('budget');
        break;
      case 'budget':
        setSelectedBudget(value);
        setQuestionStep('loading');
        setTimeout(() => generateRecommendations(false), 1500);
        break;
    }
  };

  const handleBack = () => {
    switch (questionStep) {
      case 'emotion':
        setQuestionStep('initial');
        break;
      case 'companion':
        setQuestionStep('emotion');
        break;
      case 'preference':
        setQuestionStep('companion');
        break;
      case 'budget':
        setQuestionStep('preference');
        break;
      case 'result':
        setQuestionStep('initial');
        setRestaurants([]);
        break;
    }
  };

  const handleOrderClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowOrderModal(true);
  };

  const handleConfirmOrder = (restaurant: Restaurant) => {
    setShowOrderModal(false);
    setFeedbackRestaurant({ name: restaurant.name, menu: restaurant.signature });
    setShowFeedbackModal(true);
  };

  // Initial Question Screen
  if (questionStep === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-5 pb-20">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <p className="text-base font-bold text-gray-600 mb-2">1/5</p>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s === 1 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />
              ))}
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">오늘은 뭐 먹을까요?</h1>
            <p className="text-base text-gray-600">선택해주시면 딱 맞는 메뉴를<br />추천해드릴게요!</p>
          </div>
          <div className="space-y-3">
            <button onClick={handleQuickRecommendation} className="w-full bg-white rounded-2xl p-6 shadow-md border-2 border-green-500 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center"><Zap className="w-7 h-7 text-white" /></div>
                <div className="flex-1 text-left"><h3 className="text-lg font-bold text-gray-900 mb-1">귀찮아요, 바로 추천해주세요</h3><p className="text-sm text-gray-600">질문없이 빠르게!</p></div>
                <ArrowRight className="w-6 h-6 text-green-600" />
              </div>
            </button>
            <button onClick={handleCustomRecommendation} className="w-full bg-white rounded-2xl p-6 shadow-md border-2 border-blue-500 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center"><MessageCircle className="w-7 h-7 text-white" /></div>
                <div className="flex-1 text-left"><h3 className="text-lg font-bold text-gray-900 mb-1">상황에 맞는 음식을 추천받고 싶어요</h3><p className="text-sm text-gray-600">질문으로 알아보기</p></div>
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Emotion Question (2/5)
  if (questionStep === 'emotion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">2/5</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 2 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">지금 기분은 어떠세요?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[{ emoji: '😊', text: '기분 좋아요', value: '기분 좋을 때' }, { emoji: '😴', text: '피곤해요', value: '피곤할 때' }, { emoji: '🤔', text: '고민돼요', value: '고민될 때' }, { emoji: '😋', text: '배고파요', value: '배고플 때' }].map((option) => (
              <button key={option.value} onClick={() => handleNextQuestion(option.value, 'emotion')} className="bg-white rounded-2xl p-5 shadow-md border-2 border-transparent hover:border-green-500 group">
                <div className="text-4xl mb-2">{option.emoji}</div>
                <p className="text-base font-bold text-gray-900">{option.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Companion Question (3/5)
  if (questionStep === 'companion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">3/5</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 3 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">누구랑 드시나요?</h2>
          <div className="space-y-3">
            {[{ emoji: '🙋', text: '혼자', desc: '나만의 시간' }, { emoji: '👥', text: '친구/동료와', desc: '함께 즐겁게' }, { emoji: '❤️', text: '연인/가족과', desc: '특별한 식사' }].map((option) => (
              <button key={option.text} onClick={() => handleNextQuestion(option.text, 'companion')} className="w-full bg-white rounded-2xl p-5 shadow-md border-2 border-transparent hover:border-green-500 group">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{option.emoji}</div>
                  <div className="flex-1 text-left"><p className="text-base font-bold text-gray-900">{option.text}</p><p className="text-sm text-gray-600">{option.desc}</p></div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Preference Question (4/5)
  if (questionStep === 'preference') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">4/5</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 4 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">어떤 음식이 땡기시나요?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[{ emoji: '🥗', text: '가볍게', value: '가벼운' }, { emoji: '🍜', text: '든든하게', value: '든든한' }, { emoji: '🌶️', text: '매콤하게', value: '매콤한' }, { emoji: '🍚', text: '담백하게', value: '담백한' }, { emoji: '🍕', text: '기름진 거', value: '기름진' }, { emoji: '✨', text: '아무거나', value: '아무거나' }].map((option) => (
              <button key={option.value} onClick={() => handleNextQuestion(option.value, 'preference')} className="bg-white rounded-2xl p-5 shadow-md border-2 border-transparent hover:border-green-500 group">
                <div className="text-3xl mb-2">{option.emoji}</div>
                <p className="text-sm font-bold text-gray-900">{option.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Budget Question (5/5)
  if (questionStep === 'budget') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">5/5</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5].map((s) => (<div key={s} className="w-8 h-1.5 bg-green-600 rounded-full" />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">예산은 어느 정도인가요?</h2>
          <div className="space-y-3">
            {[{ emoji: '💵', text: '1만원 이하', desc: '가성비 최고', value: '저렴' }, { emoji: '💰', text: '1~2만원', desc: '적당한 가격', value: '보통' }, { emoji: '💎', text: '2만원 이상', desc: '제대로 즐기기', value: '고급' }].map((option) => (
              <button key={option.value} onClick={() => handleNextQuestion(option.value, 'budget')} className="w-full bg-white rounded-2xl p-5 shadow-md border-2 border-transparent hover:border-green-500 group">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{option.emoji}</div>
                  <div className="flex-1 text-left"><p className="text-base font-bold text-gray-900">{option.text}</p><p className="text-sm text-gray-600">{option.desc}</p></div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (questionStep === 'loading') {
    return <RecommendationLoadingScreen />;
  }

  // Result Screen
  if (questionStep === 'result' && restaurants.length > 0) {
    return (
      <>
        <RestaurantRecommendationCardView
          restaurants={restaurants}
          onSelectRestaurant={handleOrderClick}
          onShowFeedback={(r) => { setFeedbackRestaurant(r); setShowFeedbackModal(true); }}
          onRefresh={() => generateRecommendations(isQuickMode)}
        />
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="sm:max-w-md rounded-t-3xl p-0 overflow-hidden border-none max-h-[90vh] flex flex-col">
            <DialogHeader className="p-0">
              <div className="relative h-64 w-full">
                {selectedRestaurant && (
                  <>
                    <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <button onClick={() => setShowOrderModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X className="w-6 h-6" /></button>
                    <div className="absolute bottom-6 left-6 text-white text-left">
                      <p className="text-sm font-bold text-green-400 mb-1">{selectedRestaurant.category}</p>
                      <DialogTitle className="text-3xl font-bold text-white mb-0">{selectedRestaurant.name}</DialogTitle>
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedRestaurant && (
                <>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div><p className="text-sm text-gray-500">대표 메뉴</p><p className="text-xl font-bold">{selectedRestaurant.signature}</p></div>
                    <div className="text-right"><p className="text-sm text-gray-500">가격</p><p className="text-xl font-bold text-green-600">{selectedRestaurant.price}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center"><Zap className="w-5 h-5 text-orange-500" /><span className="text-xs text-gray-500">열량</span><span className="font-bold">{selectedRestaurant.signatureCalories}kcal</span></div>
                    <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center"><Navigation className="w-5 h-5 text-blue-500" /><span className="text-xs text-gray-500">거리</span><span className="font-bold">{selectedRestaurant.distance}km</span></div>
                    <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center"><Star className="w-5 h-5 text-yellow-500" /><span className="text-xs text-gray-500">평점</span><span className="font-bold">{selectedRestaurant.rating}</span></div>
                  </div>
                  <div className="flex gap-4 bg-green-50 p-4 rounded-2xl">
                    <MapPin className="w-6 h-6 text-green-600 shrink-0" />
                    <div><p className="text-sm font-bold">식당 위치</p><p className="text-xs text-gray-600">{selectedRestaurant.address}</p></div>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 pt-0">
              <Button className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold" onClick={() => selectedRestaurant && handleConfirmOrder(selectedRestaurant)}>
                <Check className="w-6 h-6 mr-2" />좋아요, 이걸로 먹을게요!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {feedbackRestaurant && <FeedbackModal open={showFeedbackModal} onOpenChange={(open) => { setShowFeedbackModal(open); if (!open) setFeedbackRestaurant(null); }} restaurant={feedbackRestaurant} />}
      </>
    );
  }

  return null;
}
