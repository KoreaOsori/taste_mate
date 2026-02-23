import { useState } from 'react';
import { UserProfile } from '../App';
import { ShoppingCart, Star, Flame, Leaf, Zap, Heart, TrendingUp, ChevronRight, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface FoodFarmScreenProps {
  userProfile: UserProfile;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  benefits: string[];
  calories: number;
  nutrients: {
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
  aiRecommended: boolean;
  bestSeller: boolean;
  tags: string[];
}

export function FoodFarmScreen({ userProfile }: FoodFarmScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ai-recommended');
  const [cart, setCart] = useState<string[]>([]);

  const products: Product[] = [
    {
      id: '1',
      name: '프리미엄 닭가슴살 (100g x 10팩)',
      category: '단백질',
      price: 24900,
      originalPrice: 32000,
      rating: 4.9,
      reviewCount: 3421,
      description: '국내산 닭가슴살을 부드럽게 조리했어요. 다이어트에 최적화된 고단백 저지방 식품입니다.',
      benefits: ['고단백질', '저지방', '저칼로리', '국내산'],
      calories: 110,
      nutrients: { protein: 23, carbs: 0, fat: 1 },
      imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop',
      aiRecommended: true,
      bestSeller: true,
      tags: ['체중감량', '근육증가'],
    },
    {
      id: '2',
      name: '오메가3 연어 필렛 (150g x 5팩)',
      category: '단백질',
      price: 35900,
      rating: 4.8,
      reviewCount: 1892,
      description: '노르웨이산 프리미엄 연어로 만든 고품질 필렛입니다. 오메가3가 풍부해요.',
      benefits: ['오메가3', '고단백질', '건강한 지방'],
      calories: 206,
      nutrients: { protein: 22, carbs: 0, fat: 13 },
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop',
      aiRecommended: true,
      bestSeller: false,
      tags: ['체중감량', '심혈관건강'],
    },
    {
      id: '3',
      name: '유기농 퀴노아 (500g)',
      category: '탄수화물',
      price: 12900,
      rating: 4.7,
      reviewCount: 2156,
      description: '페루산 유기농 퀴노아로 필수 아미노산이 풍부합니다.',
      benefits: ['유기농', '완전단백질', '글루텐프리'],
      calories: 120,
      nutrients: { protein: 4, carbs: 21, fat: 2 },
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
      aiRecommended: true,
      bestSeller: false,
      tags: ['체중유지', '건강식'],
    },
    {
      id: '4',
      name: '그릭 요거트 (150g x 12개)',
      category: '단백질',
      price: 18900,
      originalPrice: 24000,
      rating: 4.9,
      reviewCount: 4521,
      description: '무가당 그릭 요거트로 단백질이 풍부하고 소화에 좋아요.',
      benefits: ['고단백질', '무가당', '유산균'],
      calories: 100,
      nutrients: { protein: 10, carbs: 6, fat: 4 },
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
      aiRecommended: false,
      bestSeller: true,
      tags: ['체중감량', '장건강'],
    },
    {
      id: '5',
      name: '슈퍼푸드 믹스 넛츠 (300g)',
      category: '간식',
      price: 15900,
      rating: 4.6,
      reviewCount: 1337,
      description: '7가지 견과류와 건과일을 혼합한 영양 간식입니다.',
      benefits: ['항산화', '비타민E', '건강한지방'],
      calories: 170,
      nutrients: { protein: 5, carbs: 8, fat: 14 },
      imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop',
      aiRecommended: false,
      bestSeller: true,
      tags: ['간식', '에너지'],
    },
    {
      id: '6',
      name: '저칼로리 곤약 라면 (10개입)',
      category: '다이어트',
      price: 19900,
      rating: 4.5,
      reviewCount: 2891,
      description: '밀가루 대신 곤약으로 만든 저칼로리 라면입니다.',
      benefits: ['저칼로리', '식이섬유', '포만감'],
      calories: 45,
      nutrients: { protein: 1, carbs: 8, fat: 0 },
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
      aiRecommended: true,
      bestSeller: false,
      tags: ['체중감량', '저칼로리'],
    },
  ];

  const filteredProducts = selectedCategory === 'ai-recommended'
    ? products.filter(p => p.aiRecommended)
    : selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const toggleCart = (productId: string) => {
    if (cart.includes(productId)) {
      setCart(cart.filter(id => id !== productId));
    } else {
      setCart([...cart, productId]);
    }
  };

  const getRecommendationReason = () => {
    if (userProfile.goal === 'lose') {
      return '체중 감량에 도움이 되는 저칼로리 고단백 제품을 추천해요';
    } else if (userProfile.goal === 'gain') {
      return '근육 증가에 필요한 고단백 고영양 제품을 추천해요';
    } else {
      return '균형잡힌 영양 섭취를 위한 건강식품을 추천해요';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">푸드팜 🌿</h1>
            <p className="text-green-100 text-sm">AI 맞춤 건강식품</p>
          </div>
          <button className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                {cart.length}
              </div>
            )}
          </button>
        </div>

        {/* AI Recommendation Banner */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium mb-1">{userProfile.name}님을 위한 AI 추천</p>
              <p className="text-sm text-green-100">{getRecommendationReason()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          {[
            { id: 'ai-recommended', label: 'AI 추천', icon: Zap },
            { id: 'all', label: '전체', icon: Package },
            { id: '단백질', label: '단백질', icon: Flame },
            { id: '탄수화물', label: '탄수화물', icon: Leaf },
            { id: '간식', label: '간식', icon: Heart },
            { id: '다이어트', label: '다이어트', icon: TrendingUp },
          ].map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600 mb-4">
          {filteredProducts.length}개의 상품
        </p>

        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative h-48">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.aiRecommended && (
                    <Badge className="bg-green-600 text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      AI 추천
                    </Badge>
                  )}
                  {product.bestSeller && (
                    <Badge className="bg-red-600 text-white">
                      베스트
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium">{product.calories}kcal</span>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-green-600 px-2 py-0.5 bg-green-50 rounded">
                        {product.category}
                      </span>
                      {product.tags.map(tag => (
                        <span key={tag} className="text-xs text-gray-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {product.benefits.map((benefit) => (
                    <span
                      key={benefit}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Nutrients */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">단백질</p>
                      <p className="font-bold text-gray-900">{product.nutrients.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">탄수화물</p>
                      <p className="font-bold text-gray-900">{product.nutrients.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">지방</p>
                      <p className="font-bold text-gray-900">{product.nutrients.fat}g</p>
                    </div>
                  </div>
                </div>

                {/* Rating & Price */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900">{product.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">리뷰 {product.reviewCount}</span>
                  </div>
                  <div className="text-right">
                    {product.originalPrice && (
                      <p className="text-xs text-gray-400 line-through">
                        {product.originalPrice.toLocaleString()}원
                      </p>
                    )}
                    <p className="text-xl font-bold text-gray-900">
                      {product.price.toLocaleString()}원
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => toggleCart(product.id)}
                  className={`w-full ${
                    cart.includes(product.id)
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {cart.includes(product.id) ? (
                    <>장바구니에 담김 ✓</>
                  ) : (
                    <>장바구니에 담기</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-6">
          <button className="w-full max-w-md mx-auto bg-green-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between hover:bg-green-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold">장바구니 {cart.length}개</p>
                <p className="text-sm text-green-100">주문하기</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
