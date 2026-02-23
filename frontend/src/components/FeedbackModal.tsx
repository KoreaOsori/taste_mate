import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: { name: string; menu: string } | null;
}

export function FeedbackModal({ open, onOpenChange, restaurant }: FeedbackModalProps) {
  const [satisfaction, setSatisfaction] = useState<number>(0); // 1-5
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [additionalComment, setAdditionalComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const satisfactionEmojis = [
    { value: 1, emoji: '😢', label: '별로였어요' },
    { value: 2, emoji: '😐', label: '그냥 그래요' },
    { value: 3, emoji: '🙂', label: '괜찮았어요' },
    { value: 4, emoji: '😊', label: '맛있었어요' },
    { value: 5, emoji: '😍', label: '완벽했어요!' },
  ];

  const feedbackOptions = [
    { icon: '🍽️', label: '양이 딱 좋았어요', value: 'portion_good' },
    { icon: '💰', label: '가격이 합리적이에요', value: 'price_good' },
    { icon: '⏰', label: '빨리 받았어요', value: 'fast_delivery' },
    { icon: '🌡️', label: '따뜻하게 왔어요', value: 'warm' },
    { icon: '😋', label: '또 먹고 싶어요', value: 'want_again' },
    { icon: '👎', label: '별로였어요', value: 'not_good' },
  ];

  const handleSubmit = () => {
    if (!restaurant) return;
    
    // 피드백 데이터 저장 (Supabase 또는 localStorage)
    const feedbackData = {
      restaurantName: restaurant.name,
      menuName: restaurant.menu,
      satisfaction,
      selectedFeedback,
      additionalComment,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Feedback submitted:', feedbackData);
    
    // localStorage에 저장 (나중에 Supabase로 전환 가능)
    const existingFeedback = JSON.parse(localStorage.getItem('tastemate_feedback') || '[]');
    existingFeedback.push(feedbackData);
    localStorage.setItem('tastemate_feedback', JSON.stringify(existingFeedback));
    
    setIsSubmitted(true);
    
    // 2초 후 자동 닫기
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const toggleFeedback = (value: string) => {
    if (selectedFeedback.includes(value)) {
      setSelectedFeedback(selectedFeedback.filter(f => f !== value));
    } else {
      setSelectedFeedback([...selectedFeedback, value]);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // 상태 초기화
    setTimeout(() => {
      setSatisfaction(0);
      setSelectedFeedback([]);
      setAdditionalComment('');
      setIsSubmitted(false);
    }, 300);
  };

  if (!restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">어땠어요?</DialogTitle>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Restaurant Info */}
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <p className="font-bold text-gray-900">{restaurant.name}</p>
                    <p className="text-sm text-gray-600">{restaurant.menu}</p>
                  </div>
                </div>
              </div>

              {/* Satisfaction Rating */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-center">만족도를 알려주세요</h3>
                <div className="flex items-center justify-between gap-2">
                  {satisfactionEmojis.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setSatisfaction(item.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all flex-1 ${
                        satisfaction === item.value
                          ? 'bg-green-100 border-2 border-green-600 scale-105'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-4xl">{item.emoji}</span>
                      <span className={`text-xs font-medium text-center ${
                        satisfaction === item.value ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Feedback */}
              {satisfaction > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">
                    {satisfaction >= 4 ? '무엇이 좋았나요?' : '어떤 점이 아쉬웠나요?'}
                    <span className="text-sm font-normal text-gray-500 ml-2">(여러 개 선택 가능)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackOptions
                      .filter(option => {
                        // 만족도에 따라 옵션 필터링
                        if (satisfaction >= 4) {
                          return option.value !== 'not_good';
                        } else {
                          return true;
                        }
                      })
                      .map((option) => (
                        <button
                          key={option.value}
                          onClick={() => toggleFeedback(option.value)}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                            selectedFeedback.includes(option.value)
                              ? 'bg-green-50 border-green-600'
                              : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <span className="text-2xl">{option.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Additional Comment */}
              {satisfaction > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">
                    더 하고 싶은 말이 있나요?
                    <span className="text-sm font-normal text-gray-500 ml-2">(선택사항)</span>
                  </h3>
                  <textarea
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                    placeholder="자유롭게 의견을 남겨주세요"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="space-y-2">
                <Button
                  onClick={handleSubmit}
                  disabled={satisfaction === 0}
                  className={`w-full py-6 rounded-xl font-bold text-lg transition-all ${
                    satisfaction === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  }`}
                >
                  {satisfaction === 0 ? '만족도를 선택해주세요' : '의견 보내기'}
                </Button>

                <button
                  onClick={handleClose}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  다음에 할게요
                </button>
              </div>
            </div>
          </>
        ) : (
          // Success Message
          <div className="py-12 text-center">
            <div className="mb-4">
              <span className="text-7xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">소중한 의견 감사해요!</h3>
            <p className="text-gray-600 mb-6">
              다음 추천에 반영할게요
            </p>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <ThumbsUp className="w-5 h-5" />
              <span className="font-medium">밥친구가 더 똑똑해졌어요!</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}