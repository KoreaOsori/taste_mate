import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowRight, Loader2, UserCircle } from 'lucide-react';

import logoImage from 'figma:asset/df871c26aa10ae23c0ba14499a1666fccdfbb972.png';

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
  onSignupClick: () => void;
  onGuestLogin?: () => void;
}

export function LoginScreen({ onLoginSuccess, onSignupClick, onGuestLogin }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user exists in localStorage
    const savedUserId = localStorage.getItem('tastemate_userId');

    if (savedUserId) {
      onLoginSuccess(savedUserId);
    } else {
      setError('계정을 찾을 수 없습니다. 회원가입을 진행해주세요.');
    }

    setIsSubmitting(false);
  };

  const handleKakaoLogin = async () => {
    // 카카오 로그인 로직 (실제 카카오 SDK 연동 필요)
    alert('카카오 로그인은 카카오 개발자 앱 설정이 필요합니다.\n데모 버전에서는 게스트 로그인을 이용해주세요.');
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-green-50 to-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo and Header */}
          <div className="text-center mb-8 pt-4">
            <div className="w-48 h-48 mx-auto mb-6">
              <img src={logoImage} alt="밥친구 로고" className="w-[1300px] h-[1300px] object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">오늘 뭐먹지? 고민 끝!!</h1>
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.email || !formData.password}
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  로그인 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  로그인
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            {/* Social Login Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* Kakao Login Button */}
            <Button
              onClick={handleKakaoLogin}
              className="w-full h-12 text-base bg-[#FEE500] hover:bg-[#FDD835] text-gray-900 font-medium"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.703 1.773 5.076 4.454 6.551-.184.677-.611 2.263-.698 2.626-.1.425.156.42.329.305.138-.091 2.165-1.457 3.063-2.065.549.076 1.112.116 1.852.116 5.523 0 10-3.477 10-7.533C22 6.477 17.523 3 12 3z" />
              </svg>
              카카오 로그인
            </Button>

            {/* Guest Login Button */}
            {onGuestLogin && (
              <Button
                onClick={onGuestLogin}
                variant="outline"
                className="w-full h-12 text-base border-green-600 text-green-600 hover:bg-green-50"
              >
                <UserCircle className="w-5 h-5 mr-2" />
                게스트로 둘러보기
              </Button>
            )}

            <div className="text-center text-sm text-gray-600 pt-4">
              아직 계정이 없으신가요?{' '}
              <button
                onClick={onSignupClick}
                className="text-green-600 font-medium hover:underline"
              >
                회원가입
              </button>
            </div>

            <div className="text-center">
              <button className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6">
            밥친구와 함께 건강한 식습관을 만들어보세요
          </div>
        </div>
      </div>
    </div>
  );
}