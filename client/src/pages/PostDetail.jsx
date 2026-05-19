import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import api from '../api/axios';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const myUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = () => navigate(-1);

  const handleReact = (postId, type) => {
    setPost(p => {
      if (!p) return p;
      const prev = p.my_reaction;
      const prevCount = Number(p.reactions_count);
      const newType = prev === type ? null : type;
      const newCount = prev === type ? prevCount - 1 : prev ? prevCount : prevCount + 1;
      return { ...p, my_reaction: newType, reactions_count: newCount };
    });
    api.post(`/posts/${postId}/react`, { type }).catch(() => {});
  };

  const handleRepost = async (postId, repost_text) => {
    try {
      await api.post(`/posts/${postId}/repost`, { repost_text });
    } catch {}
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Post</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          </div>
        ) : notFound ? (
          <div className="text-center py-24">
            <AlertCircle size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 dark:text-gray-400">Post not found</p>
            <p className="text-sm text-gray-400 mt-1">It may have been deleted or is not accessible.</p>
            <Link to="/home"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              Go to Feed
            </Link>
          </div>
        ) : post ? (
          <PostCard
            post={post}
            myId={myUser.id}
            onDelete={handleDelete}
            onReact={handleReact}
            onRepost={handleRepost}
            defaultShowComments
          />
        ) : null}
      </div>
    </Layout>
  );
}
