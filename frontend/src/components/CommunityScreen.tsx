import { useState, useEffect } from 'react';
import { UserProfile, CommunityPost } from '../App';
import { Heart, MessageCircle, Plus, X, Image as ImageIcon, MapPin, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { supabaseUrl, supabaseAnonKey } from '../utils/supabaseClient';

interface CommunityScreenProps {
  userProfile: UserProfile;
}

export function CommunityScreen({ userProfile }: CommunityScreenProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'diet' | 'restaurant' | 'recipe' | 'daily'>('all');
  const [formData, setFormData] = useState({
    content: '',
    calories: '',
    location: '',
    tags: '',
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const url = supabaseUrl;
      const key = supabaseAnonKey;

      if (!url || !key) {
        console.log('Supabase not configured, using local data only');
        return;
      }

      const response = await fetch(
        `${url}/functions/v1/make-server-4e0538b1/community/posts`,
        {
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!formData.content.trim()) return;

    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

    const newPost: CommunityPost = {
      id: crypto.randomUUID(),
      userId: userProfile.user_id,
      userName: userProfile.name,
      content: formData.content,
      calories: formData.calories ? parseInt(formData.calories) : undefined,
      location: formData.location,
      tags,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    try {
      const url = supabaseUrl;
      const key = supabaseAnonKey;

      if (url && key) {
        const response = await fetch(
          `${url}/functions/v1/make-server-4e0538b1/community/posts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
              user_id: userProfile.user_id,
              userName: userProfile.name,
              content: formData.content,
              calories: formData.calories ? parseInt(formData.calories) : undefined,
              location: formData.location,
              tags,
            }),
          }
        );

        if (response.ok) {
          const { post } = await response.json();
          newPost.id = post.id;
        }
      } else {
        console.log('Supabase not configured, using local data only');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      // Always add post locally
      setPosts([newPost, ...posts]);
      setFormData({ content: '', calories: '', location: '', tags: '' });
      setShowCreateModal(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const url = supabaseUrl;
      const key = supabaseAnonKey;

      if (!url || !key) {
        return;
      }

      const response = await fetch(
        `${url}/functions/v1/make-server-4e0538b1/community/posts/${postId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        }
      );

      if (response.ok) {
        const { post } = await response.json();
        setPosts(posts.map(p => p.id === postId ? post : p));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'diet') return post.tags.some(t => t.includes('다이어트') || t.includes('건강'));
    if (selectedFilter === 'restaurant') return post.tags.some(t => t.includes('맛집') || t.includes('식당'));
    if (selectedFilter === 'recipe') return post.tags.some(t => t.includes('레시피') || t.includes('요리'));
    if (selectedFilter === 'daily') return post.tags.some(t => t.includes('일상') || t.includes('소통'));
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            글쓰기
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: '전체' },
            { value: 'diet', label: '다이어트' },
            { value: 'restaurant', label: '맛집' },
            { value: 'recipe', label: '레시피' },
            { value: 'daily', label: '일상' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === filter.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="p-4 space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">아직 게시물이 없어요</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
              첫 게시물 작성하기
            </Button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} userProfile={userProfile} />
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold">새 게시물</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="오늘 먹은 음식이나 건강 팁을 공유해보세요!"
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="calories">칼로리 (선택)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="350"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">위치 (선택)</Label>
                <div className="flex gap-2 mt-1">
                  <MapPin className="w-5 h-5 text-gray-400 mt-2" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="예: 서울숲 맛집"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">태그 (선택)</Label>
                <div className="flex gap-2 mt-1">
                  <Hash className="w-5 h-5 text-gray-400 mt-2" />
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="다이어트, 맛집, 건강식 (쉼표로 구분)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">쉼표로 태그를 구분해주세요</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  💡 <strong>팁:</strong> 음식 사진을 추가하면 더 많은 사람들이 관심을 가질 거예요! (향후 업데이트 예정)
                </p>
              </div>

              <Button
                onClick={handleCreatePost}
                disabled={!formData.content.trim()}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                게시하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onLike, userProfile }: { post: CommunityPost; onLike: (postId: string) => void; userProfile: UserProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const url = supabaseUrl;
      const key = supabaseAnonKey;

      if (!url || !key) {
        return;
      }

      const response = await fetch(
        `${url}/functions/v1/make-server-4e0538b1/community/posts/${post.id}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            user_id: userProfile.user_id,
            userName: userProfile.name,
            content: commentText,
          }),
        }
      );

      if (response.ok) {
        setCommentText('');
        // Reload to get updated post
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
            {post.userName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{post.userName}</p>
            <p className="text-xs text-gray-500">
              {new Date(post.timestamp).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-900 mb-3 whitespace-pre-wrap">{post.content}</p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.calories && (
            <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
              🔥 {post.calories} kcal
            </span>
          )}
          {post.location && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {post.location}
            </span>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag, index) => (
              <span key={index} className="text-green-600 text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {/* Comment List */}
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          <div className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              등록
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}