import { useEffect, useState, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import api from '../api/axios';

export default function BookmarksPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const myUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/bookmarks');
      setPosts(res.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id) => setPosts(p => p.filter(post => post.id !== id));
  const handleUpdate = (id, data) => setPosts(p => p.map(post => post.id === id ? { ...post, ...data } : post));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
            <Bookmark size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Saved Posts</h1>
            {!loading && (
              <p className="text-xs text-gray-400">{posts.length} saved post{posts.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <Bookmark size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="font-semibold text-gray-600 dark:text-gray-400">No saved posts yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap the bookmark icon on any post to save it here.</p>
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
      </div>
    </Layout>
  );
}
