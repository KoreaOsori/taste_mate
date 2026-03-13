import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { LocationPermissionScreen } from './components/LocationPermissionScreen';
import { OnboardingScreenNew } from './components/OnboardingScreenNew';
import { DashboardHome } from './components/DashboardHome';
import { ChatbotScreen } from './components/ChatbotScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { MealLogScreen } from './components/MealLogScreen';
import { CalendarScreenWithReport } from './components/CalendarScreenWithReport';
import { HealthReportScreen } from './components/HealthReportScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { RestaurantRecommendationScreenNew } from './components/RestaurantRecommendationScreenNew';
import { FoodFarmScreen } from './components/FoodFarmScreen';
import { Home, Calendar, Users, PlusCircle, Utensils, User, Bell, BellOff, Power, PowerOff } from 'lucide-react';
import { profileService, recommendService } from './api/apiClient';

export type Screen = 'login' | 'signup' | 'location' | 'onboarding' | 'home' | 'chat' | 'community' | 'meal-log' | 'calendar' | 'health-report' | 'profile' | 'restaurant' | 'foodfarm';

export interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  target_weight: number;
  target_calories: number;
  current_calories: number;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
  breakfast_active: boolean;
  lunch_active: boolean;
  dinner_active: boolean;
  breakfast_notify: boolean;
  lunch_notify: boolean;
  dinner_notify: boolean;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'lose' | 'balanced' | 'gain';
  preferred_categories: string[];
  disliked_foods?: string[];
  restricted_foods?: string[];
  location?: string;
  location_consent?: boolean;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  restaurantLink?: string;
  timestamp: string;
  satisfaction?: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  calories?: number;
  location?: string;
  tags: string[];
  timestamp: string;
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

import { supabase } from './utils/supabaseClient';

export default function App() {
  // 첫 화면은 항상 로그인. 세션 확인 후 fetchUserProfile에서 저장된 화면으로 복원
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(() => {
    const saved = localStorage.getItem('tastemate_userLocation');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [signupData, setSignupData] = useState<{ userId: string; email: string; name: string } | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserProfile(session.user.id);
      } else {
        // 세션이 없을 경우 로컬 스토리지에서 게스트 정보 확인
        const savedGuest = localStorage.getItem('tastemate_guestProfile');
        if (savedGuest) {
          try {
            const guestData = JSON.parse(savedGuest);
            console.log('Restoring guest session:', guestData);
            setUserProfile(guestData);
            // 게스트의 경우 저장된 화면이 있으면 이동, 아니면 홈
            const savedScreen = localStorage.getItem('tastemate_currentScreen');
            if (savedScreen && savedScreen !== 'login' && savedScreen !== 'signup') {
              setCurrentScreen(savedScreen as Screen);
            } else {
              setCurrentScreen('home');
            }
          } catch (e) {
            console.error('Failed to parse saved guest profile:', e);
            setCurrentScreen('login');
          }
        } else {
          // 세션도 게스트 정보도 없으면 로그인 화면으로
          setCurrentScreen('login');
        }
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setCurrentScreen('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // currentScreen 변경 시 localStorage에 저장
  useEffect(() => {
    if (currentScreen !== 'login' && currentScreen !== 'signup') {
      localStorage.setItem('tastemate_currentScreen', currentScreen);
    }
  }, [currentScreen]);

  // location_consent 상태 변화 감지 및 위치 추적 트리거
  useEffect(() => {
    if (userProfile?.location_consent) {
      if ('geolocation' in navigator) {
        console.log('Location consent active, obtaining real-time coordinates...');
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log('Location synchronized:', location);
            setUserLocation(location);
            localStorage.setItem('tastemate_userLocation', JSON.stringify(location));

            // 주소 정보(Reverse Geocoding) 가져오기
            try {
              const addrResponse = await recommendService.getAddress(location.latitude, location.longitude);
              if (addrResponse && addrResponse.address) {
                console.log('Real-time address acquired:', addrResponse.address);

                // 로컬 상태 업데이트
                setUserProfile(prev => prev ? { ...prev, location: addrResponse.address } : null);

                // DB에 위치 정보 영구 저장 (프로필 동기화)
                if (userProfile && userProfile.user_id !== 'guest') {
                  const updatedProfile = { ...userProfile, location: addrResponse.address };
                  profileService.updateProfile(userProfile.user_id, updatedProfile as any)
                    .then(() => console.log('Location persisted to DB successfully'))
                    .catch(err => console.error('Failed to persist location to DB:', err));
                }
              }
            } catch (addrError) {
              console.warn('Failed to fetch address from coordinates:', addrError);
            }
          },
          (error) => {
            console.warn('Location tracking failed or denied:', error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    } else {
      if (userLocation) {
        console.log('Location consent revoked, clearing location data.');
        setUserLocation(null);
        localStorage.removeItem('tastemate_userLocation');
        setUserProfile(prev => prev ? { ...prev, location: '' } : null);
      }
    }
  }, [userProfile?.location_consent]);

  const fetchUserProfile = async (userId: string) => {
    if (!userId) return;

    setAuthUserId(userId);
    setIsLoading(true);
    try {
      console.log('Fetching profile for user:', userId);
      const profile = await profileService.getProfile(userId);

      if (profile && profile.user_id) {
        console.log('Profile fetched successfully:', profile);
        setUserProfile(profile as unknown as UserProfile);

        // 새로고침이나 재접속 시 기존 화면 유지, 없으면 홈으로
        const savedScreen = localStorage.getItem('tastemate_currentScreen');
        if (savedScreen && savedScreen !== 'login' && savedScreen !== 'signup' && savedScreen !== 'location' && savedScreen !== 'onboarding') {
          setCurrentScreen(savedScreen as Screen);
        } else {
          setCurrentScreen('home');
        }
      } else {
        console.log('Profile not found (empty), starting onboarding');
        setCurrentScreen('location');
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('New user (404 status), directing to location setup');
        setCurrentScreen('location');
      } else if (error.response && error.response.status === 503) {
        console.error('Backend could not reach DB (Supabase):', error);
        alert(
          '백엔드가 DB(Supabase)에 연결하지 못했습니다.\n\n' +
          'Docker 사용 시: docs/07_Docker_Setup_Guide.md 의 Q3 참고하여 백엔드만 로컬에서 실행해 보세요.\n' +
          '(프론트는 Docker, 백엔드는 PC에서 python main.py 또는 run_local.bat)'
        );
        handleLogout();
      } else if (error.request) {
        console.error('Network error requesting profile:', error);
        alert(
          '프로필 서버와 통신할 수 없습니다.\n\n' +
          '로그인은 Supabase로 되지만, 프로필/식단 등은 이 앱의 백엔드(FastAPI)를 통해 가져옵니다.\n\n' +
          '1. 백엔드가 port 8000에서 실행 중인지 확인해 주세요.\n' +
          '2. Docker 사용 시: 컨테이너를 재시작한 뒤 브라우저 새로고침(Ctrl+Shift+R) 해 보세요.'
        );
        handleLogout();
      } else {
        console.error('Other error fetching profile:', error);
        alert(`프로필 조회 중 오류가 발생했습니다: ${error.message}`);
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tastemate_userId');
    localStorage.removeItem('tastemate_guestProfile');
    localStorage.removeItem('tastemate_currentScreen');
    setUserProfile(null);
    setSignupData(null);
    setUserLocation(null);
    setAuthUserId(null);
    setCurrentScreen('login');
  };

  const handleSignupComplete = (userId: string, email: string, name: string) => {
    setSignupData({ userId, email, name });
    setCurrentScreen('location');
  };

  const handleLoginSuccess = (userId: string) => {
    fetchUserProfile(userId);
    setCurrentScreen('home');
  };

  const handleGuestLogin = () => {
    // Create a guest profile
    const guestProfile: UserProfile = {
      user_id: 'guest',
      name: '게스트',
      age: 30,
      gender: 'male',
      height: 170,
      weight: 70,
      target_weight: 65,
      target_calories: 2000,
      current_calories: 0,
      breakfast_time: '08:00',
      lunch_time: '12:00',
      dinner_time: '18:00',
      breakfast_active: true,
      lunch_active: true,
      dinner_active: true,
      breakfast_notify: true,
      lunch_notify: true,
      dinner_notify: true,
      activity_level: 'moderate',
      goal: 'balanced',
      preferred_categories: ['한식', '일식', '중식', '양식'],
      location: '서울시 강남구',
    };
    setUserProfile(guestProfile);
    localStorage.setItem('tastemate_guestProfile', JSON.stringify(guestProfile));
    setCurrentScreen('home');
  };

  const handleLocationComplete = (location: { latitude: number; longitude: number } | null) => {
    setUserLocation(location);
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('tastemate_userId', profile.user_id);
    setCurrentScreen('home');
  };

  const updateCurrentCalories = (calories: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        current_calories: userProfile.current_calories + calories,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-gray-600">9:41</div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 border border-gray-400 rounded-sm"></div>
          <div className="w-1 h-2 bg-gray-400 rounded-sm"></div>
        </div>
      </div>

      {/* Main content */}
      <div className={currentScreen === 'login' || currentScreen === 'signup' || currentScreen === 'location' || currentScreen === 'onboarding' ? '' : 'pb-20'}>
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onSignupClick={() => setCurrentScreen('signup')}
            onGuestLogin={handleGuestLogin}
          />
        )}
        {currentScreen === 'signup' && (
          <SignupScreen
            onComplete={handleSignupComplete}
            onLoginClick={() => setCurrentScreen('login')}
          />
        )}
        {currentScreen === 'location' && (
          <div className="flex flex-col min-h-screen">
            <div className="p-4 flex justify-end">
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 underline">로그아웃</button>
            </div>
            <LocationPermissionScreen onComplete={handleLocationComplete} />
          </div>
        )}
        {currentScreen === 'onboarding' && (
          <div className="flex flex-col min-h-screen">
            <div className="px-6 pt-4 flex justify-end">
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 underline">로그아웃</button>
            </div>
            <OnboardingScreenNew
              onComplete={handleOnboardingComplete}
              userId={authUserId || userProfile?.user_id || signupData?.userId || ''}
              userName={userProfile?.name || signupData?.name}
            />
          </div>
        )}
        {currentScreen === 'home' && userProfile && (
          <DashboardHome
            userProfile={userProfile}
            onNavigate={setCurrentScreen}
            todaysMeals={todaysMeals}
          />
        )}
        {currentScreen === 'chat' && userProfile && (
          <ChatbotScreen userProfile={userProfile} />
        )}
        {currentScreen === 'community' && userProfile && (
          <CommunityScreen userProfile={userProfile} />
        )}
        {currentScreen === 'meal-log' && userProfile && (
          <MealLogScreen
            userProfile={userProfile}
            todaysMeals={todaysMeals}
            setTodaysMeals={setTodaysMeals}
            updateCurrentCalories={updateCurrentCalories}
          />
        )}
        {currentScreen === 'restaurant' && userProfile && (
          <RestaurantRecommendationScreenNew
            userProfile={userProfile}
            userLocation={userLocation}
          />
        )}
        {currentScreen === 'foodfarm' && userProfile && (
          <FoodFarmScreen userProfile={userProfile} />
        )}
        {currentScreen === 'calendar' && userProfile && (
          <CalendarScreenWithReport userProfile={userProfile} onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'health-report' && userProfile && (
          <HealthReportScreen
            userProfile={userProfile}
            onBack={() => setCurrentScreen('calendar')}
          />
        )}
        {currentScreen === 'profile' && userProfile && (
          <ProfileScreen
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Bottom navigation - only show after onboarding */}
      {currentScreen !== 'login' && currentScreen !== 'signup' && currentScreen !== 'location' && currentScreen !== 'onboarding' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-inset-bottom">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <button
              onClick={() => setCurrentScreen('home')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${currentScreen === 'home' ? 'text-green-600' : 'text-gray-500'
                }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">홈</span>
            </button>

            <button
              onClick={() => setCurrentScreen('calendar')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${currentScreen === 'calendar' ? 'text-green-600' : 'text-gray-500'
                }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">캘린더</span>
            </button>

            <button
              onClick={() => setCurrentScreen('restaurant')}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-full text-white bg-green-600 -mt-4 shadow-lg"
            >
              <Utensils className="w-7 h-7" />
              <span className="text-xs">추천</span>
            </button>

            <button
              onClick={() => setCurrentScreen('community')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${currentScreen === 'community' ? 'text-green-600' : 'text-gray-500'
                }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">커뮤니티</span>
            </button>

            <button
              onClick={() => setCurrentScreen('profile')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${currentScreen === 'profile' ? 'text-green-600' : 'text-gray-500'
                }`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">프로필</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}