import { useState } from 'react';
import { UserProfile } from '../App';
import { User, Settings, Bell, Lock, HelpCircle, LogOut, ChevronRight, Edit2, MapPin, Globe, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabaseUrl, supabaseAnonKey } from '../utils/supabaseClient';

import { profileService } from '../api/apiClient';

interface ProfileScreenProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

export function ProfileScreen({ userProfile, setUserProfile, onLogout }: ProfileScreenProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    age: userProfile?.age?.toString() || '',
    height: userProfile?.height?.toString() || '',
    weight: userProfile?.weight?.toString() || '',
    target_weight: userProfile?.target_weight?.toString() || '',
    breakfast_time: userProfile?.breakfast_time || '08:00',
    lunch_time: userProfile?.lunch_time || '12:00',
    dinner_time: userProfile?.dinner_time || '18:00',
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(userProfile?.location_consent || false);

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleSave = async () => {
    const updatedProfile = {
      ...userProfile,
      name: formData.name,
      age: parseInt(formData.age),
      height: parseInt(formData.height),
      weight: parseInt(formData.weight),
      target_weight: parseInt(formData.target_weight),
      breakfast_time: formData.breakfast_time,
      lunch_time: formData.lunch_time,
      dinner_time: formData.dinner_time,
    };

    try {
      await profileService.updateProfile(userProfile.user_id, updatedProfile);
      setUserProfile(updatedProfile);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Still update local state to reflect UI changes if desired, or show alert
      setUserProfile(updatedProfile);
      setShowEditModal(false);
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    setIsLocationEnabled(enabled);

    const updatedProfile = {
      ...userProfile,
      location_consent: enabled
    };

    try {
      await profileService.updateProfile(userProfile.user_id, updatedProfile);
      setUserProfile(updatedProfile);

      // 위치 서비스를 켰을 때 즉시 현재 위치 가져오기 시도
      if (enabled && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Location immediately updated from settings:', position.coords);
          },
          (error) => {
            console.warn('Immediate location update failed:', error);
          }
        );
      }
    } catch (error) {
      console.error('Error updating location consent:', error);
    }
  };

  const bmi = (userProfile.weight / Math.pow(userProfile.height / 100, 2)).toFixed(1);
  let bmiCategory = '';
  if (parseFloat(bmi) < 18.5) bmiCategory = '저체중';
  else if (parseFloat(bmi) < 23) bmiCategory = '정상';
  else if (parseFloat(bmi) < 25) bmiCategory = '과체중';
  else bmiCategory = '비만';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">프로필</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {userProfile.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{userProfile.name}</h2>
              <p className="text-sm text-gray-600">{userProfile.age}세 · {userProfile.gender === 'male' ? '남성' : '여성'}</p>
              <p className="text-xs text-green-600 mt-0.5 truncate">
                목표: {userProfile.goal === 'lose' ? '체중 감량' : userProfile.goal === 'gain' ? '체중 증가' : '중 유지'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-0.5">키</p>
              <p className="text-base font-bold text-gray-900">{userProfile.height}cm</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-0.5">체중</p>
              <p className="text-base font-bold text-gray-900">{userProfile.weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-0.5">BMI</p>
              <p className="text-base font-bold text-green-600">{bmi}</p>
            </div>
          </div>

          <div className="mt-3 px-3 py-2.5 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">BMI 상태</p>
                <p className="text-sm font-medium text-green-700">{bmiCategory}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">목표 칼러리</p>
                <p className="text-sm font-bold text-green-700">{userProfile.target_calories} kcal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Info */}
      <div className="px-4 py-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">건강 정보</h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-3.5 flex items-center justify-between border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">목표 체중</p>
              <p className="text-xs text-gray-600 mt-0.5">{userProfile.target_weight}kg</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
          <div className="p-3.5 flex items-center justify-between border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">활동 수준</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {userProfile.activity_level === 'sedentary' ? '거의 운동 안함' :
                  userProfile.activity_level === 'light' ? '가벼운 운동' :
                    userProfile.activity_level === 'moderate' ? '중간 운동' :
                      userProfile.activity_level === 'active' ? '적극적 운동' : '매우 적극적'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">식사 시간</p>
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                아침 {userProfile.breakfast_time} · 점심 {userProfile.lunch_time} · 저녁 {userProfile.dinner_time}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">설정</h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button className="w-full p-3.5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">알림 설정</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          <button
            onClick={() => setShowLocationModal(true)}
            className="w-full p-3.5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">위치 서비스</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${userProfile.location_consent ? 'text-green-600' : 'text-gray-400'}`}>
                {userProfile.location_consent ? '사용 중' : '사용 안함'}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </button>
          <button className="w-full p-3.5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">개인정보 보호</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          <button className="w-full p-3.5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">언어 설정</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          <button className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">도움말 및 지원</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* App Info & Logout */}
      <div className="px-4 pb-24">
        <div className="bg-gray-100 rounded-xl p-3 text-center mb-3">
          <p className="text-xs text-gray-600 mb-1">밥친구 v1.0.0</p>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
            <button className="hover:text-green-600 transition-colors">이용약관</button>
            <span>·</span>
            <button className="hover:text-green-600 transition-colors">개인정보처리방침</button>
          </div>
        </div>

        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold">프로필 수정</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">이름</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-age">나이</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-height">키 (cm)</Label>
                  <Input
                    id="edit-height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-weight">체중 (kg)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-target">목표 체중 (kg)</Label>
                  <Input
                    id="edit-target"
                    type="number"
                    value={formData.target_weight}
                    onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>식사 시간</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">아침</p>
                    <Input
                      type="time"
                      value={formData.breakfast_time}
                      onChange={(e) => setFormData({ ...formData, breakfast_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">점심</p>
                    <Input
                      type="time"
                      value={formData.lunch_time}
                      onChange={(e) => setFormData({ ...formData, lunch_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">저녁</p>
                    <Input
                      type="time"
                      value={formData.dinner_time}
                      onChange={(e) => setFormData({ ...formData, dinner_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Service Toggle Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">위치 서비스 설정</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                실시간 위치 정보를 활용하여 주변의 최적화된 식당을 추천해 드립니다. 개인 정보는 안전하게 보호됩니다.
              </p>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-6">
                <span className="font-semibold text-gray-900">실시간 위치 정보 활용</span>
                <button
                  onClick={() => handleLocationToggle(!isLocationEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isLocationEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLocationEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-12"
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}