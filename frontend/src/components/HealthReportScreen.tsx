import { UserProfile } from '../App';
import { TrendingUp, TrendingDown, Award, AlertCircle, CheckCircle, Lightbulb, Target, Brain, Heart, Activity, Coffee, Moon, Salad, ArrowLeft, Crown, Lock, ChartBar, Calendar } from 'lucide-react';
import { Progress } from './ui/progress';
import { useState } from 'react';

interface HealthReportScreenProps {
  userProfile: UserProfile;
  onBack?: () => void;
}

export function HealthReportScreen({ userProfile, onBack }: HealthReportScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'basic' | 'premium'>('basic');

  // Mock analysis data
  const weeklyAverage = 1920;
  const proteinAverage = 75;
  const carbsAverage = 220;
  const fatAverage = 65;

  const targetProtein = 80;
  const targetCarbs = 200;
  const targetFat = 60;

  const getMealPatternInsight = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return '아침 식사를 규칙적으로 하고 계시네요! 👍';
    } else if (hour < 18) {
      return '점심 시간대 식사가 활발합니다.';
    } else {
      return '저녁 식사 시간을 잘 지키고 계십니다.';
    }
  };

  const recommendations = [
    {
      type: 'protein',
      status: proteinAverage < targetProtein ? 'increase' : 'good',
      message: proteinAverage < targetProtein
        ? '단백질 섭취를 조금 더 늘려보세요'
        : '단백질 섭취가 적절합니다',
      foods: ['닭가슴살', '계란', '두부', '연어'],
    },
    {
      type: 'carbs',
      status: carbsAverage > targetCarbs ? 'decrease' : 'good',
      message: carbsAverage > targetCarbs
        ? '탄수화물 섭취를 줄이는 것이 좋겠어요'
        : '탄수화물 섭취가 균형잡혀 있습니다',
      foods: ['현미', '귀리', '고구마', '퀴노아'],
    },
    {
      type: 'fat',
      status: fatAverage > targetFat ? 'decrease' : 'good',
      message: fatAverage > targetFat
        ? '지방 섭취를 조금 줄여보세요'
        : '지방 섭취가 적절합니다',
      foods: ['아보카도', '견과류', '올리브오일', '연어'],
    },
  ];

  // Additional AI insights
  const aiInsights = [
    {
      icon: Brain,
      title: '식습관 패턴 분석',
      description: '주중에는 건강한 식단을 유지하고, 주말에는 다양한 음식을 즐기는 균형잡힌 패턴을 보이고 있어요',
      color: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-600',
    },
    {
      icon: Heart,
      title: '선호 음식 분석',
      description: '한식을 자주 드시며, 특히 단백질이 풍부한 메뉴를 선호하시네요. 이는 건강한 선택입니다!',
      color: 'from-red-50 to-orange-50',
      iconBg: 'bg-red-600',
    },
    {
      icon: Activity,
      title: '칼로리 트렌드',
      description: '최근 일주일간 목표 칼로리를 96% 달성했어요. 꾸준한 관리가 돋보입니다',
      color: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-600',
    },
    {
      icon: Coffee,
      title: '간식 패턴',
      description: '오후 3-4시에 건강한 간식을 드시는 습관이 좋아요. 혈당 조절에 도움이 됩니다',
      color: 'from-amber-50 to-yellow-50',
      iconBg: 'bg-amber-600',
    },
    {
      icon: Moon,
      title: '저녁 식사 시간',
      description: '저녁 식사를 7-8시에 드시고 계시네요. 숙면을 위해 조금만 더 일찍 드시면 좋을 것 같아요',
      color: 'from-indigo-50 to-purple-50',
      iconBg: 'bg-indigo-600',
    },
    {
      icon: Salad,
      title: '채소 섭취',
      description: '샐러드와 채소 반찬을 자주 드시고 있어요. 식이섬유 섭취가 충분합니다!',
      color: 'from-green-50 to-emerald-50',
      iconBg: 'bg-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 건강 리포트</h1>
            <p className="text-green-100 text-sm">맞춤형 식습관 분석</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedTab('basic')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${selectedTab === 'basic'
                ? 'bg-white text-green-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ChartBar className="w-5 h-5" />
              <span>일반 리포트</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('premium')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${selectedTab === 'premium'
                ? 'bg-white text-green-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5" />
              <span>프리미엄</span>
            </div>
          </button>
        </div>
      </div>

      {selectedTab === 'basic' ? (
        /* Basic Report */
        <div className="px-6 py-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 mb-1">종합 건강 점수</p>
                <p className="text-4xl font-bold">85점</p>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="w-10 h-10" />
              </div>
            </div>
            <p className="text-sm text-green-100">
              {userProfile.name}님의 식습관은 평균 이상입니다! 계속 유지하세요 💪
            </p>
          </div>

          {/* Weekly Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">주간 요약</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">평균 칼로리</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{weeklyAverage}kcal</span>
                    {weeklyAverage < userProfile.target_calories ? (
                      <TrendingDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                <Progress
                  value={(weeklyAverage / userProfile.target_calories) * 100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  목표: {userProfile.target_calories}kcal
                </p>
              </div>
            </div>
          </div>

          {/* Nutrient Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">영양소 분석</h2>
            <div className="space-y-4">
              {/* Protein */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">단백질</span>
                  <span className="font-bold text-gray-900">{proteinAverage}g / {targetProtein}g</span>
                </div>
                <Progress
                  value={(proteinAverage / targetProtein) * 100}
                  className="h-2"
                />
              </div>

              {/* Carbs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">탄수화물</span>
                  <span className="font-bold text-gray-900">{carbsAverage}g / {targetCarbs}g</span>
                </div>
                <Progress
                  value={(carbsAverage / targetCarbs) * 100}
                  className="h-2"
                />
              </div>

              {/* Fat */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">지방</span>
                  <span className="font-bold text-gray-900">{fatAverage}g / {targetFat}g</span>
                </div>
                <Progress
                  value={(fatAverage / targetFat) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Meal Pattern */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">식사 패턴</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">규칙적인 식사</p>
                  <p className="text-sm text-gray-600">{getMealPatternInsight()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">다양한 음식</p>
                  <p className="text-sm text-gray-600">
                    {userProfile.preferred_categories.length}개 카테고리를 즐기고 계시네요
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">AI 맞춤 제안</h2>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const Icon = rec.status === 'good' ? CheckCircle : AlertCircle;
                const iconColor = rec.status === 'good' ? 'text-green-600' : 'text-orange-600';

                return (
                  <div key={index} className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{rec.message}</p>
                        {rec.status !== 'good' && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-2">추천 음식:</p>
                            <div className="flex flex-wrap gap-2">
                              {rec.foods.map((food) => (
                                <span
                                  key={food}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
                                >
                                  {food}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">이번 주 건강 팁</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 식사 30분 전 물 한 잔을 마시면 포만감에 도움이 됩니다</li>
                  <li>• 저녁은 잠들기 3시간 전에 마치는 것이 좋습니다</li>
                  <li>• 천천히 씹어먹으면 소화에 도움이 되고 과식을 방지합니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Premium Report */
        <div className="px-6 py-6 space-y-6">
          {/* Premium Badge */}
          <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">프리미엄 리포트</h2>
                  <p className="text-amber-100 text-sm">주간·월간 데이터 기반 심층 분석</p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
              <p className="text-white font-medium mb-2">🎯 프리미엄 기능</p>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• 주간/월간 데이터 비교 분석</li>
                <li>• 개인 맞춤 식단 플래닝</li>
                <li>• 영양사 전문가 코멘트</li>
                <li>• 상세 건강 리스크 분석</li>
              </ul>
            </div>
          </div>

          {/* Weekly vs Monthly Comparison */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-amber-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">주간 vs 월간 데이터 분석</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">지난 주</p>
                <p className="text-3xl font-bold text-gray-900">1,920</p>
                <p className="text-sm text-gray-600 mt-1">평균 kcal/일</p>
                <div className="mt-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">+5%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-1">이번 달</p>
                <p className="text-3xl font-bold text-gray-900">1,850</p>
                <p className="text-sm text-gray-600 mt-1">평균 kcal/일</p>
                <div className="mt-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">-3%</span>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm font-medium text-amber-900">
                💡 <strong>전문가 코멘트:</strong> 최근 일주일 섭취량이 증가했지만, 월간 평균은 목표에 잘 맞춰져 있습니다. 주말 식사량 조절에 신경쓰시면 더 좋은 결과를 얻으실 수 있어요.
              </p>
            </div>
          </div>

          {/* AI Deep Insights Section */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">AI 심층 패턴 분석</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {aiInsights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <div key={index} className={`bg-gradient-to-br ${insight.color} rounded-xl p-5 border-2 border-gray-200 shadow-sm`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${insight.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-2">{insight.title}</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personalized Meal Plan */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <Salad className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">맞춤 식단 플래닝</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-green-700">아침</span>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">480 kcal</span>
                </div>
                <p className="text-gray-900 font-medium mb-2">현미밥 + 계란찜 + 시금치나물</p>
                <p className="text-sm text-gray-600">단백질 중심의 든든한 아침 식사로 하루를 시작하세요</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-blue-700">점심</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">650 kcal</span>
                </div>
                <p className="text-gray-900 font-medium mb-2">닭가슴살 샐러드 + 퀴노아</p>
                <p className="text-sm text-gray-600">활동량이 많은 오후를 위한 영양 균형식</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border-2 border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-orange-700">저녁</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">580 kcal</span>
                </div>
                <p className="text-gray-900 font-medium mb-2">연어 구이 + 브로콜리 + 고구마</p>
                <p className="text-sm text-gray-600">가볍지만 영양소가 풍부한 저녁 메뉴</p>
              </div>
            </div>
          </div>

          {/* Health Risk Analysis */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-6 shadow-lg border-2 border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">건강 리스크 분석</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-white/80 rounded-xl p-4 border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">주말 과식 패턴 발견</p>
                    <p className="text-sm text-gray-700">금요일 저녁부터 일요일까지 평균 300kcal 초과 섭취가 지속되고 있습니다. 주말 활동량을 늘리거나 식사량 조절을 권장합니다.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">수분 섭취 양호</p>
                    <p className="text-sm text-gray-700">하루 평균 2리터 이상의 수분을 섭취하고 계십니다. 훌륭합니다!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goal Progress Premium */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-indigo-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">목표 달성 상세 분석</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-700">이번 주 목표 달성률</span>
                <span className="text-3xl font-bold text-green-600">87%</span>
              </div>
              <Progress value={87} className="h-4" />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">월</p>
                  <p className="text-2xl font-bold text-blue-600">95%</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-1">화</p>
                  <p className="text-2xl font-bold text-green-600">92%</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold mb-1">수</p>
                  <p className="text-2xl font-bold text-purple-600">88%</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 bg-indigo-50 rounded-lg p-4 border border-indigo-200 mt-4">
                {userProfile.goal === 'lose'
                  ? '💪 다이어트 목표를 향해 꾸준히 노력하고 계시네요! 이대로만 유지하시면 2주 내에 목표 체중에 도달할 수 있습니다.'
                  : userProfile.goal === 'gain'
                    ? '🏋️ 영양 보충 목표를 순조롭게 달성하고 있습니다! 단백질 섭취를 조금 더 늘리면 더 좋은 결과를 얻을 수 있어요.'
                    : '⚖️ 균형잡힌 식습관을 훌륭하게 유지하고 계세요! 현재 패턴을 계속 이어가시면 건강한 생활을 오래 유지하실 수 있습니다.'}
              </p>
            </div>
          </div>

          {/* Lock Message for Non-Premium Users */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 text-center border-2 border-gray-300">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">프리미엄 구독이 필요합니다</h3>
            <p className="text-sm text-gray-600 mb-6">
              프리미엄 리포트는 구독 서비스입니다.<br />
              더 상세한 분석과 맞춤 식단으로 건강을 관리하세요!
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              프리미엄 구독하기 ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}