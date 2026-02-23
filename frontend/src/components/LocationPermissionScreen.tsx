import { useState } from 'react';
import { Button } from './ui/button';
import { MapPin, Navigation, CheckCircle2, XCircle } from 'lucide-react';

interface LocationPermissionScreenProps {
  onComplete: (location: { latitude: number; longitude: number } | null) => void;
}

export function LocationPermissionScreen({ onComplete }: LocationPermissionScreenProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const requestLocation = async () => {
    setIsRequesting(true);
    
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        setPermissionStatus('granted');
        setTimeout(() => {
          onComplete({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }, 1000);
      } catch (error) {
        setPermissionStatus('denied');
        setIsRequesting(false);
      }
    } else {
      // Geolocation not supported
      setPermissionStatus('denied');
      setIsRequesting(false);
    }
  };

  const skipLocation = () => {
    onComplete(null);
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-green-50 to-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="max-w-md mx-auto text-center w-full">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              {permissionStatus === 'pending' && <MapPin className="w-16 h-16 text-green-600" />}
              {permissionStatus === 'granted' && <CheckCircle2 className="w-16 h-16 text-green-600" />}
              {permissionStatus === 'denied' && <XCircle className="w-16 h-16 text-red-600" />}
            </div>
            {permissionStatus === 'pending' && (
              <div className="absolute -right-2 top-8 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Navigation className="w-6 h-6 text-green-600" />
              </div>
            )}
          </div>

          {/* Content */}
          {permissionStatus === 'pending' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                위치 기반 맞춤 추천
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                현재 위치를 바탕으로<br />
                주변 건강한 식당과 메뉴를 추천해드립니다
              </p>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">위치 정보 활용</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>주변 건강 식당 추천</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>거리 기반 배달 서비스 연동</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>지역 커뮤니티 정보 제공</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={requestLocation}
                  disabled={isRequesting}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                >
                  {isRequesting ? '위치 확인 중...' : '위치 서비스 허용'}
                </Button>
                
                <Button
                  onClick={skipLocation}
                  variant="ghost"
                  className="w-full text-gray-600"
                >
                  나중에 설정하기
                </Button>
              </div>
            </>
          )}

          {permissionStatus === 'granted' && (
            <>
              <h1 className="text-2xl font-bold text-green-600 mb-3">
                위치 서비스 활성화 완료!
              </h1>
              <p className="text-gray-600">
                맞춤형 추천을 준비하고 있습니다...
              </p>
            </>
          )}

          {permissionStatus === 'denied' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                위치 서비스를 사용할 수 없습니다
              </h1>
              <p className="text-gray-600 mb-8">
                브라우저 설정에서 위치 권한을 허용해주세요.<br />
                나중에 설정에서 다시 시도할 수 있습니다.
              </p>
              
              <Button
                onClick={skipLocation}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                계속하기
              </Button>
            </>
          )}

          <p className="text-xs text-gray-500 mt-6">
            위치 정보는 서비스 제공 목적으로만 사용되며,<br />
            언제든지 설정에서 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}