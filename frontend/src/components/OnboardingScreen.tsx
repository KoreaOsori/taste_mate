import { useState } from 'react';
import { UserProfile } from '../App';
import { ArrowRight, Target, Activity, Clock, Loader2, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getSupabaseConfig } from '../utils/supabase-config';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
  userName?: string;
}

export function OnboardingScreen({ onComplete, userName = '' }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName,
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    targetWeight: '',
    goal: 'lose' as 'lose' | 'maintain' | 'gain',
    activityLevel: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '18:00',
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const targetCalories = calculateTargetCalories();
    
    const profile: UserProfile = {
      userId: crypto.randomUUID(),
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseInt(formData.height),
      weight: parseInt(formData.weight),
      targetWeight: parseInt(formData.targetWeight),
      targetCalories,
      currentCalories: 0,
      breakfastTime: formData.breakfastTime,
      lunchTime: formData.lunchTime,
      dinnerTime: formData.dinnerTime,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
    };

    try {
      // Check if Supabase is configured
      const { url, key, isConfigured } = getSupabaseConfig();
      
      if (isConfigured) {
        // Try to save to backend, but don't block if it fails
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
      // Always complete onboarding, even if backend fails
      setIsSubmitting(false);
      onComplete(profile);
    }
  };

  const calculateTargetCalories = () => {
    const weight = parseInt(formData.weight);
    const height = parseInt(formData.height);
    const age = parseInt(formData.age);
    
    // Harris-Benedict Equation
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very-active': 1.9,
    };

    let tdee = bmr * activityMultipliers[formData.activityLevel];

    if (formData.goal === 'lose') {
      tdee -= 500;
    } else if (formData.goal === 'gain') {
      tdee += 500;
    }

    return Math.round(tdee);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
      <div className="max-w-md mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">건강 정보 입력</h1>
              <p className="text-gray-600">맞춤형 건강 관리를 위해 기본 정보를 알려주세요</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">나이</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="30"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">성별</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">키 (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="170"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="weight">체중 (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.age || !formData.height || !formData.weight}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                다음 <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">목표 설정</h1>
              <p className="text-gray-600">건강 관리 목표를 선택해주세요</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="targetWeight">목표 체중 (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                  placeholder="65"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>목표</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { value: 'lose', label: '체중 감량', emoji: '📉' },
                    { value: 'maintain', label: '유지', emoji: '⚖️' },
                    { value: 'gain', label: '체중 증가', emoji: '📈' },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setFormData({ ...formData, goal: goal.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.goal === goal.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{goal.emoji}</div>
                      <div className="text-xs font-medium">{goal.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>활동 수준</Label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="sedentary">거의 운동 안함</option>
                  <option value="light">가벼운 운동 (주 1-3회)</option>
                  <option value="moderate">중간 운동 (주 3-5회)</option>
                  <option value="active">적극적 운동 (주 6-7회)</option>
                  <option value="very-active">매우 적극적 (하루 2회)</option>
                </select>
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
                  disabled={!formData.targetWeight}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  다음 <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Meal Times */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">식사 시간 설정</h1>
              <p className="text-gray-600">규칙적인 식사를 위해 알림을 받아보세요</p>
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
                <p className="text-xs text-gray-500 mt-1">30분 전에 알림을 보내드려요</p>
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
                <p className="text-xs text-gray-500 mt-1">30분 전에 알림을 보내드려요</p>
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
                <p className="text-xs text-gray-500 mt-1">30분 전에 알림을 보내드려요</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">설정 완료!</h3>
                <p className="text-sm text-green-700">
                  일일 목표 칼로리: <strong>{calculateTargetCalories()}kcal</strong>
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
                  disabled={isSubmitting}
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
  );
}