import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../App';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { chatService } from '../api/apiClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatbotScreenProps {
  userProfile: UserProfile;
}

export function ChatbotScreen({ userProfile }: ChatbotScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = (): Message => ({
    id: 'welcome',
    role: 'assistant',
    content: `안녕하세요, ${userProfile.name}님! 😊\n\n저는 건강한 식단 관리를 도와드리는 AI 영양 상담사입니다.\n\n다음과 같은 도움을 드릴 수 있어요:\n• 🍽️ 맞춤 식사 메뉴 추천\n• 📊 칼로리 및 영양소 분석\n• 💪 건강 목표 달성 조언\n• 🏃‍♂️ 운동 및 생활습관 팁\n\n무엇을 도와드릴까요?`,
    timestamp: new Date().toISOString(),
  });

  const loadChatHistory = async () => {
    try {
      const history = await chatService.getHistory(userProfile.user_id);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([getWelcomeMessage()]);
      }
    } catch (error) {
      console.warn('채팅 기록 로드 실패 (백엔드 미연결):', error);
      setMessages([getWelcomeMessage()]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const profileForRequest: Record<string, unknown> = {
        name: userProfile.name,
        goal: userProfile.goal,
        target_calories: userProfile.target_calories,
        current_calories: userProfile.current_calories,
        weight: userProfile.weight,
      };
      const result = await chatService.sendMessage(userProfile.user_id, userMessage, profileForRequest);
      setMessages(prev => [...prev, result.message]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '죄송합니다. 현재 AI 상담사 서버에 연결할 수 없어요. 백엔드 서버가 실행 중인지 확인해 주세요.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };



  const quickActions = [
    '오늘 점심 메뉴 추천해줘',
    '칼로리 현황 알려줘',
    '단백질 많은 음식 추천',
    '운동 조언 필요해',
  ];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI 영양 상담사</h1>
            <p className="text-sm text-green-100">맞춤형 건강 관리 도우미</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                ? 'bg-green-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">AI 상담사</span>
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                <span className="text-sm text-gray-600">답변을 생성하는 중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">빠른 질문</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(action)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-green-600 hover:text-green-600 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="메시지를 입력하세요..."
              className="bg-transparent border-0 px-0 py-1 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 p-0 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}