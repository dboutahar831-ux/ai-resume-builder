import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Hash, ArrowLeft, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import api from '../api/axios';

export default function HashtagPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState([]);
  const myUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hashtags/${encodeURIComponent(tag)}`);
      setPosts(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [tag]);

  useEffect(() => {
    loadPosts();
    api.get('/hashtags/trending').then(r => setTrending(r.data)).catch(() => {});
  }, [loadPosts]);

  const handleDelete = (id) => setPosts(p => p.filter(post => post.id !== id));
  const handleUpdate = (id, data) => setPosts(p => p.map(post => post.id === id ? { ...post, ...data } : post));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/home" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
              <Hash size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">#{tag}</h1>
              {!loading && (
                <p className="text-xs text-gray-400">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Posts column */}
          <div className="flex-1 min-w-0 space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <Hash size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="font-semibold text-gray-600 dark:text-gray-400">No posts yet for #{tag}</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to use this hashtag!</p>
                <Link to="/home"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
                  style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                  Go to Feed
                </Link>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  myUser={myUser}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>

          {/* Trending sidebar — desktop only */}
          {trending.length > 0 && (
            <aside className="hidden lg:block w-52 flex-shrink-0">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sticky top-6">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-[#6C5CE7]" /> Trending
                </p>
                <div className="space-y-1">
                  {trending.slice(0, 10).map(t => (
                    <Link key={t.tag} to={`/hashtag/${t.tag}`}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${t.tag === tag ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                      <span className={`text-sm font-medium transition-colors ${t.tag === tag ? 'text-indigo-600 dark:text-indigo-400' : 'text-[#6C5CE7] group-hover:text-[#BF5AF2]'}`}>
                        #{t.tag}
                      </span>
                      <span className="text-[10px] text-gray-400">{t.post_count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}
