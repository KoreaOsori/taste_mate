import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface RecommendationLoadingScreenProps {
  onComplete?: () => void;
  duration?: number; // 로딩 시간 (ms), 기본값 3000
}

// 재료 이모지와 색상
const ingredients = [
  { emoji: '🥬', color: '#4ade80' }, // 양상추 - 초록
  { emoji: '🍅', color: '#ef4444' }, // 토마토 - 빨강
  { emoji: '🥕', color: '#f97316' }, // 당근 - 주황
  { emoji: '🧅', color: '#a855f7' }, // 양파 - 보라
  { emoji: '🥒', color: '#22c55e' }, // 오이 - 초록
  { emoji: '🌶️', color: '#dc2626' }, // 고추 - 빨강
  { emoji: '🥦', color: '#10b981' }, // 브로콜리 - 초록
  { emoji: '🍖', color: '#b45309' }, // 고기 - 갈색
];

// 친근한 메시지 목록
const messages = [
  '신선한 재료 고르는 중...',
  '완벽한 조합 찾는 중...',
  '맛난 음식 추천 중...',
  '네 취향 생각해보는 중...',
  '오늘의 맛집 찾는 중...',
];

export function RecommendationLoadingScreen({ onComplete, duration = 3000 }: RecommendationLoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [fallingIngredients, setFallingIngredients] = useState<Array<{
    id: number;
    emoji: string;
    color: string;
    left: number;
    delay: number;
    duration: number;
  }>>([]);

  // 지정된 시간 후 onComplete 호출
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onComplete, duration]);

  // 메시지 순환
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(messageInterval);
  }, []);

  // 재료들이 화면 전체에서 균등하게 비처럼 떨어지기
  useEffect(() => {
    const ingredientInterval = setInterval(() => {
      const randomIngredient = ingredients[Math.floor(Math.random() * ingredients.length)];
      
      const newIngredient = {
        id: Date.now() + Math.random(),
        emoji: randomIngredient.emoji,
        color: randomIngredient.color,
        left: Math.random() * 100, // 0 ~ 100% 전체 화면에 균등 분포
        delay: 0,
        duration: 2 + Math.random() * 2, // 2 ~ 4초
      };

      setFallingIngredients((prev) => [...prev.slice(-15), newIngredient]); // 최대 16개 유지
    }, 150); // 0.15초마다 재료 하나씩

    return () => clearInterval(ingredientInterval);
  }, []);

  // 떨어진 재료 제거 (애니메이션 끝난 후)
  useEffect(() => {
    if (fallingIngredients.length > 0) {
      const timeout = setTimeout(() => {
        setFallingIngredients((prev) => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [fallingIngredients]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* 떨어지는 재료들 - 비처럼 위에서 아래로 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {fallingIngredients.map((ingredient) => (
          <motion.div
            key={ingredient.id}
            initial={{ 
              x: `${ingredient.left}vw`,
              y: '-10vh',
              rotate: 0,
              opacity: 1,
              scale: 1
            }}
            animate={{ 
              x: `${ingredient.left}vw`,
              y: '110vh',
              rotate: 360 + Math.random() * 360,
              opacity: [0, 1, 1, 1, 0.5],
              scale: [0.5, 1, 1, 0.8]
            }}
            transition={{ 
              duration: ingredient.duration,
              delay: ingredient.delay,
              ease: 'linear'
            }}
            className="absolute text-4xl"
            style={{
              filter: `drop-shadow(0 4px 12px ${ingredient.color}40)`,
            }}
          >
            {ingredient.emoji}
          </motion.div>
        ))}
      </div>

      {/* 중앙 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* 볼 아이콘 */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -10, 10, -10, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="text-8xl"
        >
          🥗
        </motion.div>

        {/* 메시지 */}
        <div className="text-center">
          <motion.h2
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-semibold text-gray-800"
          >
            {messages[currentMessage]}
          </motion.h2>
          <motion.p
            className="text-sm text-gray-500 mt-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            조금만 기다려주세요
          </motion.p>
        </div>

        {/* 로딩 바 */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-green-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: 3,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* 작은 텍스트 */}
        <motion.div
          className="flex gap-2 items-center text-xs text-gray-400"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>✨</span>
          <span>맞춤 추천 준비 중</span>
          <span>✨</span>
        </motion.div>
      </div>
    </div>
  );
}