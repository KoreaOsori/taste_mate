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
import { Home, Calendar, Users, PlusCircle, Utensils, User } from 'lucide-react';
import { getSupabaseConfig } from './utils/supabase-config';

export type Screen = 'login' | 'signup' | 'location' | 'onboarding' | 'home' | 'chat' | 'community' | 'meal-log' | 'calendar' | 'health-report' | 'profile' | 'restaurant' | 'foodfarm';

export interface UserProfile {
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  targetWeight: number;
  targetCalories: number;
  currentCalories: number;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'lose' | 'balanced' | 'gain';
  preferredCategories: string[];
  location?: string;
}

export interface Meal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [signupData, setSignupData] = useState<{ userId: string; email: string; name: string } | null>(null);

  useEffect(() => {
    // Check if user has profile
    const savedUserId = localStorage.getItem('tastemate_userId');
    if (savedUserId) {
      fetchUserProfile(savedUserId);
      setCurrentScreen('home');
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Check if Supabase is configured
      const { url, key, isConfigured } = getSupabaseConfig();
      
      if (!isConfigured) {
        console.log('Supabase not configured, using local data only');
        return;
      }

      const response = await fetch(
        `${url}/functions/v1/make-server-4e0538b1/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        }
      );
      
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
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
      userId: 'guest',
      name: '게스트',
      age: 30,
      gender: 'male',
      height: 170,
      weight: 70,
      targetWeight: 65,
      targetCalories: 2000,
      currentCalories: 0,
      breakfastTime: '08:00',
      lunchTime: '12:00',
      dinnerTime: '18:00',
      activityLevel: 'moderate',
      goal: 'balanced',
      preferredCategories: ['한식', '일식', '중식', '양식'],
      location: '서울시 강남구',
    };
    setUserProfile(guestProfile);
    setCurrentScreen('home');
  };

  const handleLocationComplete = (location: { latitude: number; longitude: number } | null) => {
    setUserLocation(location);
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('tastemate_userId', profile.userId);
    setCurrentScreen('home');
  };

  const updateCurrentCalories = (calories: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        currentCalories: userProfile.currentCalories + calories,
      });
    }
  };

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
          <LocationPermissionScreen onComplete={handleLocationComplete} />
        )}
        {currentScreen === 'onboarding' && (
          <OnboardingScreenNew 
            onComplete={handleOnboardingComplete}
            userName={signupData?.name}
          />
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
          <RestaurantRecommendationScreenNew userProfile={userProfile} />
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
            onLogout={() => {
              localStorage.removeItem('tastemate_userId');
              setUserProfile(null);
              setSignupData(null);
              setUserLocation(null);
              setCurrentScreen('login');
            }}
          />
        )}
      </div>

      {/* Bottom navigation - only show after onboarding */}
      {currentScreen !== 'login' && currentScreen !== 'signup' && currentScreen !== 'location' && currentScreen !== 'onboarding' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-inset-bottom">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <button
              onClick={() => setCurrentScreen('home')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                currentScreen === 'home' ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">홈</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('calendar')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                currentScreen === 'calendar' ? 'text-green-600' : 'text-gray-500'
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
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                currentScreen === 'community' ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">커뮤니티</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                currentScreen === 'profile' ? 'text-green-600' : 'text-gray-500'
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