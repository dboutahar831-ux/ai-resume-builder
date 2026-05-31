import { useEffect, useState, useCallback, useRef } from 'react';
import { Compass, TrendingUp, Users, Hash, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const myUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export default function Explore() {
  const addToast = useToast();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [addedIds, setAddedIds] = useState(new Set());
  const sentinel = useRef(null);

  const load = useCallback(async (reset = false) => {
    const off = reset ? 0 : offset;
    if (!reset && loadingMore) return;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const [postsRes, trendingRes, suggestionsRes] = await Promise.all([
        api.get(`/posts/explore?offset=${off}`),
        api.get('/posts/trending').catch(() => ({ data: [] })),
        reset ? api.get('/friends/suggestions').catch(() => ({ data: [] })) : Promise.resolve({ data: null }),
      ]);
      const newPosts = postsRes.data;
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 20);
      setOffset(off + 20);
      if (trendingRes.data) setTrending(trendingRes.data);
      if (suggestionsRes.data) setSuggestions(suggestionsRes.data.slice(0, 5));
    } catch { addToast('Failed to load explore.', 'error'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [offset, loadingMore, addToast]);

  useEffect(() => { load(true); }, []);

  useEffect(() => {
    if (!sentinel.current || !hasMore) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !loadingMore && hasMore) load(); }, { rootMargin: '200px' });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, load]);

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleReact = (postId, type) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const prev2 = p.my_reaction;
      const newType = prev2 === type ? null : type;
      const delta = prev2 === type ? -1 : prev2 ? 0 : 1;
      return { ...p, my_reaction: newType, reactions_count: (p.reactions_count || 0) + delta };
    }));
    api.post(`/posts/${postId}/react`, { type }).catch(() => {});
  };

  const handleAddFriend = async (id) => {
    try {
      await api.post(`/friends/request/${id}`);
      setAddedIds(prev => new Set([...prev, id]));
    } catch { addToast('Failed to send request.', 'error'); }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
              <Compass size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Explore</h1>
              <p className="text-xs text-gray-400">Discover popular posts from everyone</p>
            </div>
          </div>
          <button onClick={() => load(true)} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex gap-6">
          {/* Main feed */}
          <div className="flex-1 min-w-0 space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded-full" />
                      <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-4/5" />
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <Sparkles size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Nothing to explore yet</p>
                <p className="text-sm text-gray-400 mt-1">Add more friends to see their connections' posts.</p>
              </div>
            ) : (
              <>
                {posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    myId={myUser.id}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    onRepost={() => {}}
                  />
                ))}
                <div ref={sentinel} />
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">You've seen everything!</p>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">
            {/* Trending hashtags */}
            {trending.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-indigo-500" />
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trending</p>
                </div>
                <div className="space-y-1">
                  {trending.map((tag, i) => (
                    <Link key={tag} to={`/hashtag/${tag.replace('#', '')}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                      <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-4">{i + 1}</span>
                      <Hash size={13} className="text-indigo-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{tag.replace('#', '')}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* People to follow */}
            {suggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-indigo-500" />
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">People to Connect</p>
                </div>
                <div className="space-y-3">
                  {suggestions.map(u => (
                    <div key={u.id} className="flex items-center gap-2.5">
                      <Link to={`/friends/${u.id}`} className="flex-shrink-0">
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                          : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</div>
                        }
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/friends/${u.id}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate">{u.name}</Link>
                        {u.mutual_friends > 0 && <p className="text-[10px] text-gray-400">{u.mutual_friends} mutual</p>}
                      </div>
                      <button
                        onClick={() => handleAddFriend(u.id)}
                        disabled={addedIds.has(u.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${addedIds.has(u.id) ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default' : 'text-white hover:opacity-90'}`}
                        style={addedIds.has(u.id) ? {} : { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                        {addedIds.has(u.id) ? 'Sent' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
