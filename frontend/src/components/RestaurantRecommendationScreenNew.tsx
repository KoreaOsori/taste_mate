import { useState, useEffect, useRef } from 'react';
import { UserProfile, Screen } from '../App';
import { MapPin, Star, ExternalLink, Check, ChevronLeft, ChevronRight, RefreshCw, Navigation, Car, MapPinned, ArrowRight, Sparkles, Zap, MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { RecommendationLoadingScreen } from './RecommendationLoadingScreen';
import { FeedbackModal } from './FeedbackModal';
import { RestaurantRecommendationCardView } from './RestaurantRecommendationCardView';
import { recommendService, mealService } from '../api/apiClient';

const FOOD_CATEGORIES = [
  { id: 'korean', label: '한식', emoji: '🍚' },
  { id: 'chinese', label: '중식', emoji: '🥟' },
  { id: 'japanese', label: '일식', emoji: '🍱' },
  { id: 'western', label: '양식', emoji: '🍝' },
  { id: 'fast-food', label: '패스트푸드', emoji: '🍔' },
  { id: 'asian', label: '아시안', emoji: '🍜' },
  { id: 'bunsik', label: '분식', emoji: '🍢' },
  { id: 'chicken', label: '치킨', emoji: '🍗' },
  { id: 'pizza', label: '피자', emoji: '🍕' },
  { id: 'salad', label: '샐러드', emoji: '🥗' },
  { id: 'healthy', label: '건강식', emoji: '🥙' },
];

interface RestaurantRecommendationScreenNewProps {
  userProfile: UserProfile;
  userLocation?: { latitude: number; longitude: number } | null;
  onNavigate: (screen: Screen) => void;
  onLogMealToCalendar?: (dateKey: string) => void;
  /** 추천 탭이 다시 클릭될 때 App.tsx가 직접 바꺽니다. 값이 바뀐면 질문 첫 화면으로 리셋. */
  resetKey?: number;
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
  place_lat?: number | null;
  place_lng?: number | null;
}

// Mock data removed to ensure real API data usage

type QuestionStep = 'initial' | 'howMode' | 'dessertCategory' | 'emotion' | 'companion' | 'category' | 'preference' | 'budget' | 'loading' | 'result';

export function RestaurantRecommendationScreenNew({
  userProfile,
  userLocation,
  onNavigate,
  onLogMealToCalendar,
  resetKey,
}: RestaurantRecommendationScreenNewProps) {
  // sessionStorage로 이전 추천 결과 복원 (탭 이탈 후 재진입 대비)
  // sessionStorage로 이전 추천 결과 및 진행 상태 완벽 복원
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const saved = sessionStorage.getItem('recommendation_results');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Question flow states
  const [questionStep, setQuestionStep] = useState<QuestionStep>(() => {
    try {
      const savedStep = sessionStorage.getItem('recommendation_step');
      // [v2.2] loading 상태로 저장된 경우 initial로 복구해 멈춤 현상 방지
      if (savedStep && savedStep !== 'loading') return savedStep as QuestionStep;
      
      const savedResults = sessionStorage.getItem('recommendation_results');
      if (savedResults && JSON.parse(savedResults).length > 0) return 'result';
      
      return 'initial';
    } catch { return 'initial'; }
  });
  const [isQuickMode, setIsQuickMode] = useState(() => {
    try { return sessionStorage.getItem('recommendation_is_quick') === 'true'; }
    catch { return false; }
  });
  
  // 상태 저장을 위한 보조 상태들 (필요 시 복원 가능하도록 sessionStorage 연동)
  const [selectedMealType, setSelectedMealType] = useState<string>(() => sessionStorage.getItem('rec_meal_type') || '');
  const [selectedDessertCategory, setSelectedDessertCategory] = useState<string>(() => sessionStorage.getItem('rec_dessert_cat') || '');
  const [selectedEmotion, setSelectedEmotion] = useState<string>(() => sessionStorage.getItem('rec_emotion') || '');
  const [selectedCompanion, setSelectedCompanion] = useState<string>(() => sessionStorage.getItem('rec_companion') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('rec_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('rec_preferences');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedBudget, setSelectedBudget] = useState<string>(() => sessionStorage.getItem('rec_budget') || '');

  // sessionStorage 동기화 — 모든 진행 상태 보존
  useEffect(() => {
    try {
      if (restaurants.length > 0) {
        sessionStorage.setItem('recommendation_results', JSON.stringify(restaurants));
      }
      sessionStorage.setItem('recommendation_step', questionStep);
      sessionStorage.setItem('recommendation_is_quick', isQuickMode.toString());
      sessionStorage.setItem('rec_meal_type', selectedMealType);
      sessionStorage.setItem('rec_dessert_cat', selectedDessertCategory);
      sessionStorage.setItem('rec_emotion', selectedEmotion);
      sessionStorage.setItem('rec_companion', selectedCompanion);
      sessionStorage.setItem('rec_categories', JSON.stringify(selectedCategories));
      sessionStorage.setItem('rec_preferences', JSON.stringify(selectedPreferences));
      sessionStorage.setItem('rec_budget', selectedBudget);
    } catch (e) {
      console.error('Failed to save session state:', e);
    }
  }, [restaurants, questionStep, isQuickMode, selectedMealType, selectedDessertCategory, selectedEmotion, selectedCompanion, selectedCategories, selectedPreferences, selectedBudget]);

  // resetKey 변경 시(추천 탭 재클릭) 질문 첫 화면으로 리셋
  // [v2.2/v4.0] resetKey가 이전과 다르고 0보다 클 때만 리셋 (마운트 시 자동 리셋 방지)
  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (!resetKey || resetKey === 0 || resetKey === prevResetKey.current) {
      prevResetKey.current = resetKey;
      return;
    }
    
    prevResetKey.current = resetKey;
    setQuestionStep('initial');
    setRestaurants([]);
    setIsQuickMode(false);
    setSelectedMealType('');
    setSelectedDessertCategory('');
    setSelectedEmotion('');
    setSelectedCompanion('');
    setSelectedCategories([]);
    setSelectedPreferences([]);
    setSelectedBudget('');
    
    try {
      sessionStorage.removeItem('recommendation_results');
      sessionStorage.removeItem('recommendation_step');
      sessionStorage.removeItem('recommendation_is_quick');
      sessionStorage.removeItem('rec_meal_type');
      sessionStorage.removeItem('rec_dessert_cat');
      sessionStorage.removeItem('rec_emotion');
      sessionStorage.removeItem('rec_companion');
      sessionStorage.removeItem('rec_categories');
      sessionStorage.removeItem('rec_preferences');
      sessionStorage.removeItem('rec_budget');
    } catch (e) {}
  }, [resetKey]);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRestaurant, setFeedbackRestaurant] = useState<{ name: string; menu: string } | null>(null);

  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string } | null>(null);
  const [userLocationData, setUserLocationData] = useState<{ lat: number; lng: number } | null>(null);

  // Default coordinate (Gangnam)
  const DEFAULT_LAT = 37.4979;
  const DEFAULT_LNG = 127.0276;

  useEffect(() => {
    // Strict Location Logic:
    // 1. If location_consent is false, ALWAYS use DEFAULT (Gangnam)
    // 2. If location_consent is true, use userLocation prop (synced from App.tsx)
    // 3. If location_consent is true but userLocation is not yet available, we can wait or show a loading state

    if (!userProfile.location_consent) {
      console.log('Location consent is OFF, using Gangnam default');
      const defaultLoc = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
      setUserLocationData(defaultLoc);
      fetchWeather(defaultLoc.lat, defaultLoc.lng);
    } else {
      if (userLocation) {
        console.log('Location consent is ON, using synchronized GPS data');
        const { latitude, longitude } = userLocation;
        setUserLocationData({ lat: latitude, lng: longitude });
        fetchWeather(latitude, longitude);
      } else {
        console.log('Location consent is ON, waiting for GPS synchronization...');
        // Fallback to Gangnam while waiting, but keep checking for userLocation
        const defaultLoc = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
        setUserLocationData(defaultLoc);
        fetchWeather(defaultLoc.lat, defaultLoc.lng);
      }
    }
  }, [userLocation, userProfile.location_consent]);

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

      // 커피·디저트 + 서브카테고리 선택 시: 맛/동행/예산 대신 디저트 카테고리만 전달
      const isDessertFlow = selectedMealType === '커피·디저트' && selectedDessertCategory;
      const emotionParam = isDessertFlow ? undefined : (isQuick ? undefined : selectedEmotion);
      const companionParam = isDessertFlow ? undefined : (isQuick ? undefined : selectedCompanion);
      const preferenceParam = isDessertFlow ? selectedDessertCategory : (isQuick ? undefined : (selectedPreferences.length > 0 ? selectedPreferences.join(', ') : undefined));
      const budgetParam = isDessertFlow ? undefined : (isQuick ? undefined : selectedBudget);
      // 사용자가 선택한 음식 종류(중식, 패스트푸드, 아시안 등) — 질문 플로우에서만 전달, 이 종류만 추천되도록
      const categoriesParam = isDessertFlow ? undefined : (isQuick ? undefined : (selectedCategories.length > 0 ? selectedCategories : undefined));

      // 위치 없으면 use_location=false → 강남 기본값 사용 안 하고 비슷한 맛집만 검색
      const hasRealLocation = Boolean(userProfile.location_consent && userLocation);
      const lat = hasRealLocation ? (userLocationData?.lat ?? DEFAULT_LAT) : undefined;
      const lng = hasRealLocation ? (userLocationData?.lng ?? DEFAULT_LNG) : undefined;

      const data = await recommendService.getRecommendations(userProfile.user_id, lat, lng, {
        weather,
        hour: currentHour,
        emotion: emotionParam,
        companion: companionParam,
        preference: preferenceParam,
        budget: budgetParam,
        use_location: hasRealLocation,
        categories: categoriesParam,
      });

      if (data && data.length > 0) {
        setRestaurants(data as unknown as Restaurant[]);
        setQuestionStep('result');
        return;
      } else {
        console.warn('추천 API에서 데이터가 반환되지 않았습니다.');
        setRestaurants([]); // 결과 없음 UI 유도
        setQuestionStep('result');
        return;
      }
    } catch (err) {
      console.error('추천 API 호출 중 오류 발생:', err);
      setRestaurants([]); // 오류 시에도 빈 상태로 결과 화면 진입하여 안내 문구 노출
      setQuestionStep('result');
    }
  };

  const handleQuickRecommendation = () => {
    setIsQuickMode(true);
    setQuestionStep('loading');
    generateRecommendations(true);
  };

  const handleCustomRecommendation = () => {
    setIsQuickMode(false);
    if (selectedMealType === '커피·디저트') {
      setQuestionStep('dessertCategory');
    } else {
      setQuestionStep('emotion');
    }
  };

  const handleNextQuestion = (value: string, currentStep: QuestionStep) => {
    switch (currentStep) {
      case 'emotion':
        setSelectedEmotion(value);
        setQuestionStep('category');
        break;
      case 'category':
        // If main dish, go to preference
        setQuestionStep('preference');
        break;
      case 'preference':
        // Go to companion after preference
        setQuestionStep('companion');
        break;
      case 'companion':
        setSelectedCompanion(value);
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
      case 'howMode':
        setQuestionStep('initial');
        break;
      case 'dessertCategory':
        setQuestionStep('howMode');
        break;
      case 'emotion':
        setQuestionStep('howMode');
        break;
      case 'category':
        setQuestionStep('emotion');
        break;
      case 'preference':
        setQuestionStep('category');
        break;
      case 'companion':
        setQuestionStep('preference');
        break;
      case 'budget':
        setQuestionStep('companion');
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

  const handleConfirmOrder = async (restaurant: Restaurant) => {
    setShowOrderModal(false);

    const now = new Date();
    const hour = now.getHours();
    let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';

    if (hour < 11) mealType = 'breakfast';
    else if (hour < 15) mealType = 'lunch';
    else if (hour < 21) mealType = 'dinner';
    else mealType = 'snack';

    const dateKey = now.toISOString().split('T')[0];

    try {
      await mealService.createMeal({
        user_id: userProfile.user_id,
        type: mealType,
        food_name: restaurant.signature || restaurant.name,
        calories: restaurant.signatureCalories,
        protein: restaurant.protein,
        carbs: restaurant.carbs,
        fat: restaurant.fat,
        restaurant_link: restaurant.naverLink,
        timestamp: now.toISOString(),
      } as any);
      // 저장 성공 시에만 캘린더로 이동해 해당 날짜에 기록이 보이도록
      if (onLogMealToCalendar) {
        onLogMealToCalendar(dateKey);
      } else {
        onNavigate('calendar');
      }
      setFeedbackRestaurant({ name: restaurant.name, menu: restaurant.signature });
      setShowFeedbackModal(true);
    } catch (error) {
      console.error('Failed to log meal from recommendation:', error);
      setFeedbackRestaurant({ name: restaurant.name, menu: restaurant.signature });
      setShowFeedbackModal(true);
      // 실패해도 피드백 모달은 띄우고, 캘린더 이동은 하지 않음 (또는 토스트로 실패 안내 가능)
    }
  };

  // 1. 무엇을 추천해드릴까요? – 메인 / 커피·디저트
  if (questionStep === 'initial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-5 pb-20">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <p className="text-base font-bold text-gray-600 mb-2">1/{selectedMealType === '커피·디저트' ? '3' : '7'}</p>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3, 4, 5, 6, 7].slice(0, selectedMealType === '커피·디저트' ? 3 : 7).map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s === 1 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />
              ))}
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">무엇을 추천해드릴까요?</h1>
            <p className="text-base text-gray-600">식사부터 디저트까지 딱 맞춰서!</p>
          </div>
          <div className="space-y-3">
            {[
              { emoji: '🍽️', text: '메인디쉬', desc: '든든한 한 끼 식사' },
              { emoji: '☕', text: '커피·디저트', desc: '카페, 빵, 케이크' },
            ].map((option) => (
              <button key={option.text} onClick={() => { setSelectedMealType(option.text); setQuestionStep('howMode'); }} className="w-full bg-white rounded-2xl p-5 shadow-md border-2 border-transparent hover:border-green-500 group">
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

  // 2. 어떻게 추천해드릴까요? – 바로 추천 / 상황에 맞는 질문
  if (questionStep === 'howMode') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center mb-6">
            <p className="text-base font-bold text-gray-600 mb-2">2/{selectedMealType === '커피·디저트' ? '3' : '7'}</p>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3, 4, 5, 6, 7].slice(0, selectedMealType === '커피·디저트' ? 3 : 7).map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s <= 2 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />
              ))}
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">어떻게 추천해드릴까요?</h1>
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
                <div className="flex-1 text-left"><h3 className="text-lg font-bold text-gray-900 mb-1">상황에 맞는 메뉴 추천</h3><p className="text-sm text-gray-600">질문으로 알아보기</p></div>
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3-Dessert. 커피·디저트 – 유형 선택 (Option A/B)
  if (questionStep === 'dessertCategory') {
    const DESSERT_OPTIONS = [
      { emoji: '🥤', text: '커피, 음료, 차', desc: '시원하고 따뜻한 마실 거리', value: '음료중심' },
      { emoji: '🥐', text: '빵, 케이크, 과자', desc: '달콤하고 고소한 디저트류', value: '베이커리중심' },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <p className="text-base font-bold text-gray-600 mb-2">3/3</p>
            <div className="flex gap-1.5 justify-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s <= 3 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />
              ))}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">어떤 것이 땡기시나요?</h2>
          <p className="text-base text-gray-600 text-center mb-8">취향에 맞는 카페를 찾아드릴게요</p>
          <div className="space-y-4">
            {DESSERT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedDessertCategory(option.text);
                  setQuestionStep('loading');
                  setTimeout(() => generateRecommendations(false), 1500);
                }}
                className="w-full bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-green-500 transition-all text-left flex items-center gap-5 group"
              >
                <div className="text-5xl">{option.emoji}</div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-900">{option.text}</p>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-green-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Emotion Question (3/7)
  if (questionStep === 'emotion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">3/7</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5, 6, 7].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 3 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">기분이 어떠신가요?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '🙂', text: '그냥 그래요', value: '그냥 그래요' },
              { emoji: '😄', text: '기분 좋아요', value: '기분 좋아요' },
              { emoji: '😴', text: '피곤해요', value: '피곤해요' },
              { emoji: '😡', text: '스트레스 받아요', value: '스트레스 받아요' },
              { emoji: '🥺', text: '위로가 필요해요', value: '위로가 필요해요' },
            ].map((option) => (
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

  // Category Question (4/7) – 어떤 음식이 좋으신가요? (음식 메뉴)
  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const handleCategoryNext = () => {
    setQuestionStep('preference');
  };

  if (questionStep === 'category') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">4/7</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5, 6, 7].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 4 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">어떤 음식이 좋으신가요?</h2>
          <p className="text-sm text-gray-500 text-center mb-4">복수 선택 가능</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.label)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedCategories.includes(cat.label) ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-green-200 bg-white'}`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[11px] font-bold text-gray-700">{cat.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={handleCategoryNext} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl">
            다음 <ArrowRight className="w-5 h-5 ml-1 inline" />
          </Button>
        </div>
      </div>
    );
  }

  // Preference Question (5/7) – 어떤 맛이 땡기시나요? (복수 선택)
  const PREFERENCE_OPTIONS = [{ emoji: '🥗', text: '가볍게', value: '가벼운' }, { emoji: '🍜', text: '든든하게', value: '든든한' }, { emoji: '🌶️', text: '매콤하게', value: '매콤한' }, { emoji: '🍚', text: '담백하게', value: '담백한' }, { emoji: '🍕', text: '기름진 거', value: '기름진' }, { emoji: '✨', text: '아무거나', value: '아무거나' }];
  const togglePreference = (value: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  if (questionStep === 'preference') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">5/7</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5, 6, 7].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 5 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">어떤 맛이 땡기시나요?</h2>
          <p className="text-sm text-gray-500 text-center mb-4">복수 선택 가능</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PREFERENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => togglePreference(option.value)}
                className={`rounded-2xl p-5 shadow-md border-2 transition-all flex flex-col items-center justify-center min-h-[80px] ${selectedPreferences.includes(option.value) ? 'border-green-600 bg-green-50' : 'border-transparent bg-white hover:border-green-500 group'}`}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <p className="text-sm font-bold text-gray-900">{option.text}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setQuestionStep('companion')} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl">
            다음 <ArrowRight className="w-5 h-5 ml-1 inline" />
          </Button>
        </div>
      </div>
    );
  }

  // Companion Question (6/7) – 누구와 드시나요?
  if (questionStep === 'companion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">6/7</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5, 6, 7].map((s) => (<div key={s} className={`h-1.5 rounded-full transition-all ${s <= 6 ? 'w-8 bg-green-600' : 'w-6 bg-gray-300'}`} />))}</div></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">누구와 드시나요?</h2>
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

  // Budget Question (7/7)
  if (questionStep === 'budget') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-5 pt-6 pb-20">
        <button onClick={handleBack} className="mb-4 p-2 hover:bg-white/50 rounded-lg"><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6"><p className="text-base font-bold text-gray-600 mb-2">7/7</p><div className="flex gap-1.5 justify-center">{[1, 2, 3, 4, 5, 6, 7].map((s) => (<div key={s} className="w-8 h-1.5 bg-green-600 rounded-full" />))}</div></div>
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
  if (questionStep === 'result') {
    if (restaurants.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <MapPin className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">주변에 추천할 만한<br/>음식점이 없어요 😢</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            거리 제한(10km) 내에 선택하신 조건과 딱 맞는<br/>
            맛집을 찾지 못했습니다. 조건을 조금 바꾸거나<br/>
            다시 한 번 추천을 받아보시겠어요?
          </p>
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => {
                setQuestionStep('initial');
                setRestaurants([]);
              }}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all"
            >
              다시 추천받기
            </button>
          </div>
        </div>
      );
    }

    const getThemeInfo = () => {
      const hour = new Date().getHours();
      let themeId: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
      let themeClass = 'bg-white';

      if (hour >= 5 && hour < 11) {
        themeId = 'morning';
        themeClass = 'bg-gradient-to-br from-orange-50 to-amber-50';
      } else if (hour >= 11 && hour < 17) {
        themeId = 'afternoon';
        themeClass = 'bg-white';
      } else if (hour >= 17 && hour < 21) {
        themeId = 'evening';
        themeClass = 'bg-gradient-to-br from-orange-100 to-rose-50';
      } else {
        themeId = 'night';
        themeClass = 'bg-gradient-to-br from-slate-900 to-indigo-950';
      }
      
      return { id: themeId, class: themeClass };
    };

    const currentTheme = getThemeInfo();

    return (
      <div 
        className={`flex flex-col w-full flex-1 overflow-hidden relative transition-colors duration-1000 ${currentTheme.class}`}
        style={{ minHeight: 0 }}
      >
        <RestaurantRecommendationCardView
          restaurants={restaurants}
          theme={currentTheme.id}
          onSelectRestaurant={handleOrderClick}
          onShowFeedback={(r) => { setFeedbackRestaurant(r); setShowFeedbackModal(true); }}
          onRefresh={() => generateRecommendations(isQuickMode)}
          onLike={async (r) => {
            try {
              await recommendService.recordInterest(userProfile.user_id, r.name, 'like');
            } catch (err) {
              console.error('Failed to record like:', err);
            }
          }}
          onDislike={async (r) => {
            try {
              await recommendService.recordInterest(userProfile.user_id, r.name, 'dislike');
            } catch (err) {
              console.error('Failed to record dislike:', err);
            }
          }}
        />
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent hideCloseButton className="sm:max-w-md rounded-t-3xl p-0 overflow-hidden border-none max-h-[90vh] flex flex-col">
            <DialogHeader className="p-0 shrink-0">
              <div className="relative h-36 w-full">
                {selectedRestaurant && (
                  <>
                    <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <button type="button" onClick={() => setShowOrderModal(false)} className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/50 hover:bg-black/60 rounded-full flex items-center justify-center text-white shadow-lg" aria-label="닫기"><X className="w-5 h-5 stroke-[2.5]" strokeWidth={2.5} /></button>
                    <div className="absolute bottom-3 left-4 text-white text-left">
                      <span className="text-xs font-semibold text-green-300">{selectedRestaurant.category}</span>
                      <DialogTitle className="text-lg font-bold text-white leading-tight">{selectedRestaurant.name}</DialogTitle>
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>
            {selectedRestaurant && (
              <DialogDescription className="sr-only">
                {selectedRestaurant.name} 상세: 대표 메뉴 {selectedRestaurant.signature}, 가격 {selectedRestaurant.price}, 거리 {selectedRestaurant.distance}km, 추천 사유
              </DialogDescription>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
              {selectedRestaurant && (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">대표 메뉴</p>
                      <p className="text-base font-bold text-gray-900 truncate">{selectedRestaurant.signature}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">가격</p>
                      <p className="text-base font-bold text-green-600">{selectedRestaurant.price}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center gap-0.5">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="text-[11px] text-gray-500 font-medium">열량</span>
                      <span className="text-base font-bold text-gray-900">{selectedRestaurant.signatureCalories}kcal</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center gap-0.5">
                      <Navigation className="w-5 h-5 text-blue-500" />
                      <span className="text-[11px] text-gray-500 font-medium">거리</span>
                      <span className="text-base font-bold text-gray-900">{selectedRestaurant.distance}km</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl flex flex-col items-center gap-0.5">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-[11px] text-gray-500 font-medium">평점</span>
                      <span className="text-base font-bold text-gray-900">{selectedRestaurant.rating}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-700 mb-2">영양 밸런스</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center py-2 rounded-lg bg-blue-50/80">
                        <span className="text-[11px] text-blue-600 font-bold mb-0.5">탄수화물</span>
                        <span className="text-base font-bold text-gray-900">{selectedRestaurant.carbs}g</span>
                      </div>
                      <div className="flex flex-col items-center py-2 rounded-lg bg-red-50/80">
                        <span className="text-[11px] text-red-600 font-bold mb-0.5">단백질</span>
                        <span className="text-base font-bold text-gray-900">{selectedRestaurant.protein}g</span>
                      </div>
                      <div className="flex flex-col items-center py-2 rounded-lg bg-orange-50/80">
                        <span className="text-[11px] text-orange-600 font-bold mb-0.5">지방</span>
                        <span className="text-base font-bold text-gray-900">{selectedRestaurant.fat}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-green-50 p-4 rounded-xl border border-green-100">
                    <MapPin className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 mb-0.5">식당 위치</p>
                      <p className="text-sm text-gray-700 leading-snug break-words">{selectedRestaurant.address}</p>
                    </div>
                  </div>
                  {/* 길찾기: 네이버는 iframe 임베드 차단으로 새 탭 링크만 제공 */}
                  <div>
                    <p className="text-xs font-bold text-gray-800 mb-2">길찾기</p>
                    <p className="text-xs text-gray-500 mb-2">지도 앱에서 경로를 확인하세요.</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={selectedRestaurant.naverLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#03C75A] text-white rounded-xl text-sm font-bold hover:opacity-90"
                      >
                        <MapPin className="w-4 h-4" /> 네이버 지도에서 보기
                      </a>
                      {selectedRestaurant.place_lat != null && selectedRestaurant.place_lng != null && (
                        <a
                          href={`https://map.kakao.com/link/to/${encodeURIComponent(selectedRestaurant.name)},${selectedRestaurant.place_lat},${selectedRestaurant.place_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FEE500] text-[#191919] rounded-xl text-sm font-bold hover:opacity-90"
                        >
                          <MapPin className="w-4 h-4" /> 카카오맵 길찾기
                        </a>
                      )}
                    </div>
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
      </div>
    );
  }

  return null;
}
