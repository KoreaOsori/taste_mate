import { useState } from 'react';
import { UserProfile } from '../App';
import { ArrowRight, Clock, Utensils, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getSupabaseConfig } from '../utils/supabase-config';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
  userName?: string;
}

const foodCategories = [
  { id: 'korean', label: '한식', emoji: '🍚' },
  { id: 'chinese', label: '중식', emoji: '🥟' },
  { id: 'japanese', label: '일식', emoji: '🍱' },
  { id: 'western', label: '양식', emoji: '🍝' },
  { id: 'fast-food', label: '패스트푸드', emoji: '🍔' },
  { id: 'cafe', label: '카페/디저트', emoji: '☕' },
  { id: 'asian', label: '아시안', emoji: '🍜' },
  { id: 'bunsik', label: '분식', emoji: '🍢' },
  { id: 'chicken', label: '치킨', emoji: '🍗' },
  { id: 'pizza', label: '피자', emoji: '🍕' },
  { id: 'salad', label: '샐러드', emoji: '🥗' },
  { id: 'healthy', label: '건강식', emoji: '🥙' },
];

export function OnboardingScreenNew({ onComplete, userName = '' }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName,
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '18:00',
    preferredCategories: [] as string[],
    healthGoal: 'balanced' as 'lose' | 'balanced' | 'gain',
  });

  const toggleCategory = (categoryId: string) => {
    if (formData.preferredCategories.includes(categoryId)) {
      setFormData({
        ...formData,
        preferredCategories: formData.preferredCategories.filter(id => id !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        preferredCategories: [...formData.preferredCategories, categoryId],
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const profile: UserProfile = {
      userId: crypto.randomUUID(),
      name: formData.name,
      age: parseInt(formData.age) || 25,
      gender: formData.gender,
      height: 170,
      weight: 65,
      targetWeight: 65,
      targetCalories: 2000,
      currentCalories: 0,
      breakfastTime: formData.breakfastTime,
      lunchTime: formData.lunchTime,
      dinnerTime: formData.dinnerTime,
      activityLevel: 'moderate',
      goal: formData.healthGoal,
      preferredCategories: formData.preferredCategories,
      location: '', // Will be updated by geolocation
    };

    try {
      const { url, key, isConfigured } = getSupabaseConfig();
      
      if (isConfigured) {
        const response = await fetch(
          `${url}/functions/v1/make-server-4e0538b1/profile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify(profile),
          }
        );

        if (!response.ok) {
          console.warn('Failed to save profile to backend, continuing with local data');
        }
      } else {
        console.log('Supabase not configured, using local data only');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      console.log('Continuing with local data only');
    } finally {
      setIsSubmitting(false);
      onComplete(profile);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-green-50 to-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">단계 {step}/3</span>
              <span className="text-sm text-green-600 font-medium">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Utensils className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">기본 정보</h1>
                <p className="text-sm text-gray-600">맞춤 추천을 위해 알려주세요</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="홍길동"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="age">나이</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="25"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">성별</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.age}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  다음 <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Meal Times */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">식사 시간</h1>
                <p className="text-sm text-gray-600">평소 식사 시간을 알려주세요</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="breakfast">아침 식사 시간</Label>
                  <Input
                    id="breakfast"
                    type="time"
                    value={formData.breakfastTime}
                    onChange={(e) => setFormData({ ...formData, breakfastTime: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lunch">점심 식사 시간</Label>
                  <Input
                    id="lunch"
                    type="time"
                    value={formData.lunchTime}
                    onChange={(e) => setFormData({ ...formData, lunchTime: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dinner">저녁 식사 시간</Label>
                  <Input
                    id="dinner"
                    type="time"
                    value={formData.dinnerTime}
                    onChange={(e) => setFormData({ ...formData, dinnerTime: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="w-full"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    다음 <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Food Preferences */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Utensils className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">음식 취향</h1>
                <p className="text-sm text-gray-600">좋아하는 음식을 모두 선택해주세요</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm">선호하는 음식 카테고리 (복수 선택)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {foodCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`p-2.5 rounded-lg border-2 transition-all ${
                          formData.preferredCategories.includes(category.id)
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{category.emoji}</div>
                        <div className="text-[10px] font-medium text-gray-900">{category.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    선택한 카테고리: {formData.preferredCategories.length}개
                  </p>
                </div>

                <div>
                  <Label className="text-sm">식습관 목표</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { value: 'lose', label: '다이어트', emoji: '🥗' },
                      { value: 'balanced', label: '균형잡힌', emoji: '⚖️' },
                      { value: 'gain', label: '영양보충', emoji: '💪' },
                    ].map((goal) => (
                      <button
                        key={goal.value}
                        onClick={() => setFormData({ ...formData, healthGoal: goal.value as any })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.healthGoal === goal.value
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{goal.emoji}</div>
                        <div className="text-[10px] font-medium">{goal.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-green-900 mb-1">준비 완료!</h3>
                  <p className="text-xs text-green-700">
                    {formData.name}님의 취향에 맞는 맛집을 추천해드릴게요 🎉
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    이전
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || formData.preferredCategories.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />
                        저장 중...
                      </span>
                    ) : (
                      '시작하기 🎉'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
