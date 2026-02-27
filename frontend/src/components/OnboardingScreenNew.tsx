import { useState } from 'react';
import { UserProfile } from '../App';
import { ArrowRight, Clock, Utensils, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabaseUrl, supabaseAnonKey } from '../utils/supabaseClient';
import { profileService } from '../api/apiClient';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
  userId: string;
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

export function OnboardingScreenNew({ onComplete, userId, userName = '' }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName,
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '18:00',
    preferredCategories: [] as string[],
    dislikedFoods: '',
    healthGoal: 'balanced' as 'lose' | 'balanced' | 'gain',
    activityLevel: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
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

  const calculateTargetCalories = () => {
    const weightNum = parseInt(formData.weight) || 70;
    const heightNum = parseInt(formData.height) || 170;
    const ageNum = parseInt(formData.age) || 25;

    // Harris-Benedict Equation (Simplified)
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 88.36 + (13.4 * weightNum) + (4.8 * heightNum) - (5.7 * ageNum);
    } else {
      bmr = 447.6 + (9.2 * weightNum) + (3.1 * heightNum) - (4.3 * ageNum);
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very-active': 1.9,
    };

    let tdee = bmr * activityMultipliers[formData.activityLevel];

    if (formData.healthGoal === 'lose') tdee -= 500;
    if (formData.healthGoal === 'gain') tdee += 500;

    return Math.round(tdee);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const targetCalories = calculateTargetCalories();

    const profile: any = {
      user_id: userId,
      name: formData.name,
      age: parseInt(formData.age) || 25,
      gender: formData.gender,
      height: parseInt(formData.height) || 170,
      weight: parseInt(formData.weight) || 65,
      target_weight: parseInt(formData.weight) || 65,
      target_calories: targetCalories,
      current_calories: 0,
      breakfast_time: formData.breakfastTime,
      lunch_time: formData.lunchTime,
      dinner_time: formData.dinnerTime,
      activity_level: formData.activityLevel,
      goal: formData.healthGoal,
      preferred_categories: formData.preferredCategories,
      disliked_foods: formData.dislikedFoods.split(',').map(s => s.trim()).filter(s => s !== ''),
      location: '',
    };

    try {
      // Create/Update profile via backend API
      const response = await profileService.updateProfile(profile.user_id, profile);
      console.log('Profile saved to DB via backend:', response);
    } catch (error) {
      console.error('Error saving profile via backend:', error);
      console.warn('Continuing with local storage fallback');
    } finally {
      setIsSubmitting(false);
      onComplete(profile as unknown as UserProfile);
    }
  };

  const totalSteps = 4;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header & Progress (Fixed) */}
      <div className="bg-white px-6 pt-8 pb-4 border-b border-gray-100 flex-none">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-xs font-bold text-green-600 tracking-wider">ONBOARDING</span>
              <h2 className="text-lg font-bold text-gray-900">단계 {step}/{totalSteps}</h2>
            </div>
            <span className="text-sm font-bold text-green-600">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        <div className="max-w-md mx-auto w-full my-auto">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">기본 신체 정보</h1>
                <p className="text-sm text-gray-500">정확한 영양 분석을 위해 반드시 필요해요 (필수)</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="홍길동"
                    className="h-12 border-gray-200 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-gray-700 font-medium">나이</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="25"
                      className="h-12 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-gray-700 font-medium">성별</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full h-12 px-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-gray-700 font-medium">키 (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="175"
                      className="h-12 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-gray-700 font-medium">체중 (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="70"
                      className="h-12 border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">식사 시간 설정</h1>
                <p className="text-sm text-gray-500">정해진 시간에 맞춰 알림을 보내드릴게요 (필수)</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: '아침 식사', id: 'breakfastTime', icon: '🌅' },
                  { label: '점심 식사', id: 'lunchTime', icon: '☀️' },
                  { label: '저녁 식사', id: 'dinnerTime', icon: '🌙' },
                ].map((meal) => (
                  <div key={meal.id} className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                    <span className="text-2xl">{meal.icon}</span>
                    <div className="flex-1">
                      <Label htmlFor={meal.id} className="text-sm font-semibold text-gray-700">{meal.label}</Label>
                      <Input
                        id={meal.id}
                        type="time"
                        value={(formData as any)[meal.id]}
                        onChange={(e) => setFormData({ ...formData, [meal.id]: e.target.value })}
                        className="border-none bg-transparent h-8 p-0 font-bold text-lg focus-visible:ring-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">식사 취향 및 제한</h1>
                <p className="text-sm text-gray-500">좋아하는 음식과 피하고 싶은 음식을 알려주세요 (선택)</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-gray-900 font-bold">선호하는 음식 (복수 선택)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {foodCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${formData.preferredCategories.includes(category.id)
                          ? 'border-green-600 bg-green-50 shadow-sm'
                          : 'border-gray-100 hover:border-green-200 bg-white'
                          }`}
                      >
                        <span className="text-xl">{category.emoji}</span>
                        <span className="text-[11px] font-bold text-gray-700">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disliked" className="text-gray-900 font-bold">기피하거나 못 먹는 음식</Label>
                  <Input
                    id="disliked"
                    value={formData.dislikedFoods}
                    onChange={(e) => setFormData({ ...formData, dislikedFoods: e.target.value })}
                    placeholder="예: 오이, 가지, 견과류 (쉼표로 구분)"
                    className="h-12 border-gray-200"
                  />
                  <p className="text-xs text-gray-400">추천 알고리즘에서 최대한 제외해 드릴게요.</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">목표 및 활동량</h1>
                <p className="text-sm text-gray-500">목표 달성을 위한 칼로리를 계산해 드려요 (선택)</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-gray-900 font-bold">나의 목표</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'lose', label: '체중 감량', emoji: '🥗' },
                      { value: 'balanced', label: '건강 유지', emoji: '⚖️' },
                      { value: 'gain', label: '근육 성장', emoji: '💪' },
                    ].map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setFormData({ ...formData, healthGoal: g.value as any })}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${formData.healthGoal === g.value
                          ? 'border-green-600 bg-green-50 shadow-sm'
                          : 'border-gray-100 hover:border-green-200 bg-white'
                          }`}
                      >
                        <span className="text-xl">{g.emoji}</span>
                        <span className="text-[11px] font-bold text-gray-700">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-900 font-bold">활동 수준</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'sedentary', label: '비활동적', desc: '주로 앉아서 생활함' },
                      { value: 'moderate', label: '적당함', desc: '일주일에 1-3회 운동' },
                      { value: 'active', label: '활기참', desc: '일주일에 4-5회 격렬한 운동' },
                    ].map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setFormData({ ...formData, activityLevel: level.value as any })}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${formData.activityLevel === level.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-100 bg-white'
                          }`}
                      >
                        <p className="font-bold text-sm text-gray-900">{level.label}</p>
                        <p className="text-xs text-gray-500">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons (Moved into content area to reduce gap) */}
          <div className="mt-8 flex gap-3 pb-4">
            <div className="flex-1">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="w-full h-12 border-gray-200 text-gray-600 font-bold"
                  disabled={isSubmitting}
                >
                  이전
                </Button>
              )}
            </div>

            <div className="flex-1">
              <Button
                onClick={step === totalSteps ? handleSubmit : () => setStep(step + 1)}
                disabled={isSubmitting || (step === 1 && (!formData.name || !formData.age || !formData.height || !formData.weight))}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-100"
              >
                {step === totalSteps
                  ? (isSubmitting ? <Loader2 className="animate-spin" /> : '프로필 완성하기 🎉')
                  : '다음 단계로'
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
