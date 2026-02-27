import { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { TrendingUp, TrendingDown, Calendar, Target, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface StatsScreenProps {
  userProfile: UserProfile;
}

export function StatsScreen({ userProfile }: StatsScreenProps) {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    generateWeeklyData();
  }, [userProfile]);

  const generateWeeklyData = () => {
    // Generate mock data for the last 7 days
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const data = days.map((day, index) => ({
      day,
      calories: Math.floor(Math.random() * 500) + userProfile.target_calories - 300,
      protein: Math.floor(Math.random() * 30) + 50,
      target: userProfile.target_calories,
    }));
    setWeeklyData(data);
  };

  const avgCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0) / weeklyData.length || 0;
  const caloriesTrend = avgCalories > userProfile.target_calories ? 'over' : 'under';
  const trendPercentage = Math.abs(((avgCalories - userProfile.target_calories) / userProfile.target_calories) * 100);

  const achievements = [
    { icon: '🔥', title: '7일 연속 기록', description: '꾸준히 기록중!', earned: true },
    { icon: '🎯', title: '목표 달성', description: '주간 목표 달성', earned: true },
    { icon: '💪', title: '단백질 챔피언', description: '단백질 목표 달성', earned: false },
    { icon: '🥗', title: '채식주의자', description: '채소 5회 이상', earned: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-6 pb-8">
        <h1 className="text-2xl font-bold mb-2">건강 통계</h1>
        <p className="text-green-100 text-sm">나의 건강 관리 현황을 확인해보세요</p>
      </div>

      {/* Period Selector */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'week'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            주간
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'month'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            월간
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">평균 칼로리</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(avgCalories)}</p>
          <p className="text-xs text-gray-500 mt-1">kcal/일</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            {caloriesTrend === 'over' ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-600" />
            )}
            <span className="text-xs text-gray-600">목표 대비</span>
          </div>
          <p className={`text-2xl font-bold ${caloriesTrend === 'over' ? 'text-red-600' : 'text-green-600'}`}>
            {caloriesTrend === 'over' ? '+' : '-'}{trendPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {caloriesTrend === 'over' ? '초과' : '부족'}
          </p>
        </div>
      </div>

      {/* Calorie Chart */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">일일 칼로리 추이</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="calories" fill="#16a34a" radius={[8, 8, 0, 0]} />
              <Bar dataKey="target" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span className="text-gray-600">실제 섭취</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-gray-600">목표</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Breakdown */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">주간 영양소 평균</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">단백질</span>
                <span className="font-medium text-gray-900">65g / 80g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '81%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">탄수화물</span>
                <span className="font-medium text-gray-900">180g / 200g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">지방</span>
                <span className="font-medium text-gray-900">45g / 50g</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Progress */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">체중 변화</h2>
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">현재 체중</p>
              <p className="text-xl font-bold text-gray-900">{userProfile.weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">목표 체중</p>
              <p className="text-xl font-bold text-green-600">{userProfile.target_weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">남은 거리</p>
              <p className="text-xl font-bold text-blue-600">
                {Math.abs(userProfile.weight - userProfile.target_weight)}kg
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(((userProfile.weight - userProfile.target_weight) / userProfile.weight) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            목표까지 {Math.abs(userProfile.weight - userProfile.target_weight)}kg 남았어요! 💪
          </p>
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">업적</h2>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${achievement.earned
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="font-medium text-gray-900 text-sm mb-1">{achievement.title}</p>
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">💡 이번 주 인사이트</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>평균적으로 목표 칼로리를 잘 지키고 계세요!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>단백질 섭취를 조금 더 늘려보는 것이 좋겠어요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>주말에 칼로리 섭취가 높아지는 경향이 있어요</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
