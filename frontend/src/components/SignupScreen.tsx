import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowRight, Loader2 } from 'lucide-react';
import logoImage from 'figma:asset/df871c26aa10ae23c0ba14499a1666fccdfbb972.png';
import { supabase } from '../utils/supabaseClient';

interface SignupScreenProps {
  onComplete: (userId: string, email: string, name: string) => void;
  onLoginClick: () => void;
}

export function SignupScreen({ onComplete, onLoginClick }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    auth: '',
  });

  const validateForm = () => {
    const newErrors = { email: '', password: '', confirmPassword: '', auth: '' };
    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = '유효한 이메일을 입력해주세요';
      isValid = false;
    }

    if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, auth: '' }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrors(prev => ({ ...prev, auth: '이미 가입된 이메일입니다.' }));
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setErrors(prev => ({ ...prev, auth: '비밀번호는 최소 6자 이상이어야 합니다.' }));
        } else {
          setErrors(prev => ({ ...prev, auth: '회원가입에 실패했습니다. 입력 정보를 확인해주세요.' }));
        }
        return;
      }

      if (data.user) {
        onComplete(data.user.id, formData.email, formData.name);
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, auth: '회원가입 중 오류가 발생했습니다.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert('카카오 로그인 중 오류가 발생했습니다: ' + err.message);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-green-50 to-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8 pt-4">
            <div className="w-48 h-48 mx-auto mb-6">
              <img src={logoImage} alt="밥친구 로고" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">오늘 뭐먹지?</h2>
            <h2 className="text-2xl font-bold text-gray-900">고민 끝!</h2>
          </div>

          <div className="space-y-5">
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

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                className="mt-1"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="6자 이상"
                className="mt-1"
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="비밀번호 재입력"
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.auth && (
              <p className="text-sm text-red-600 font-medium text-center">{errors.auth}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  가입 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  회원가입
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <Button
              onClick={handleKakaoSignup}
              className="w-full h-12 text-base bg-[#FEE500] hover:bg-[#FDD835] text-gray-900 font-medium"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.703 1.773 5.076 4.454 6.551-.184.677-.611 2.263-.698 2.626-.1.425.156.42.329.305.138-.091 2.165-1.457 3.063-2.065.549.076 1.112.116 1.852.116 5.523 0 10-3.477 10-7.533C22 6.477 17.523 3 12 3z" />
              </svg>
              카카오로 시작하기
            </Button>

            <div className="text-center text-sm text-gray-600 pt-4">
              이미 계정이 있으신가요?{' '}
              <button className="text-green-600 font-medium hover:underline" onClick={onLoginClick}>
                로그인
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-8">
          회원가입 시 <span className="text-green-600 underline">이용약관</span> 및{' '}
          <span className="text-green-600 underline">개인정보처리방침</span>에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}