import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, Eye, Heart, MessageSquare, Users, TrendingUp,
  FileText, Star, Zap, ArrowUpRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const REACTION_EMOJI = { like: '👍', heart: '❤️', laugh: '😂', sad: '😢', angry: '😡' };
const REACTION_LABEL = { like: 'Like', heart: 'Love', laugh: 'Haha', sad: 'Sad', angry: 'Angry' };

function StatCard({ icon: Icon, label, value, sub, color = 'indigo', gradient }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    rose:   'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    emerald:'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${gradient ? '' : colors[color]}`}
        style={gradient ? { background: gradient } : {}}>
        <Icon size={22} className={gradient ? 'text-white' : ''} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value?.toLocaleString?.() ?? value}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function Analytics() {
  const addToast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/me')
      .then(r => setData(r.data))
      .catch(() => addToast('Failed to load analytics.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </Layout>
  );

  if (!data) return null;

  const totalEngagement = (data.posts?.total_reactions || 0) + (data.posts?.total_comments || 0);
  const engagementRate = data.posts?.total_posts
    ? ((totalEngagement / Math.max(data.posts.total_posts, 1)) / Math.max(data.posts.total_views || 1, 1) * 100).toFixed(1)
    : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            <p className="text-xs text-gray-400">Your performance overview</p>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={FileText} label="Total Posts" value={data.posts?.total_posts || 0} color="indigo" />
          <StatCard icon={Eye} label="Total Views" value={data.posts?.total_views || 0} color="blue" />
          <StatCard icon={Heart} label="Reactions" value={data.posts?.total_reactions || 0} color="rose" />
          <StatCard icon={MessageSquare} label="Comments Received" value={data.comments_received || 0} color="purple" />
          <StatCard icon={Users} label="Profile Views" value={data.profile_views?.total || 0}
            sub={`${data.profile_views?.this_week || 0} this week`} color="emerald" />
          <StatCard icon={Zap} label="Engagement Rate"
            value={`${engagementRate}%`} sub="reactions + comments / posts" color="amber" />
        </div>

        {/* Reactions breakdown */}
        {data.reactions?.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={15} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Reaction Breakdown</h2>
            </div>
            <div className="space-y-3">
              {data.reactions.map(r => {
                const max = Math.max(...data.reactions.map(x => x.count));
                const pct = max ? Math.round((r.count / max) * 100) : 0;
                return (
                  <div key={r.type} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center flex-shrink-0">{REACTION_EMOJI[r.type]}</span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">{REACTION_LABEL[r.type]}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right flex-shrink-0">{r.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top posts */}
        {data.top_posts?.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Top Performing Posts</h2>
            </div>
            <div className="space-y-3">
              {data.top_posts.map((p, i) => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <span className="text-lg font-black text-gray-200 dark:text-gray-700 w-6 flex-shrink-0 text-center leading-tight">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug">{p.content || '(No text)'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1"><Eye size={10} />{p.views_count}</span>
                      <span className="flex items-center gap-1"><Heart size={10} />{p.reactions_count}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={10} />{p.comments_count}</span>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Profile viewers */}
        {data.profile_views?.recent_viewers?.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={15} className="text-blue-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Recent Profile Visitors</h2>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{data.profile_views.this_week} this week</span>
            </div>
            <div className="space-y-2.5">
              {data.profile_views.recent_viewers.map(v => (
                <Link key={v.id} to={`/friends/${v.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  {v.avatar
                    ? <img src={v.avatar} alt={v.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{v.name?.[0]?.toUpperCase()}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{v.name}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo(v.viewed_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Friend growth */}
        {data.friend_growth?.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} className="text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Connection Growth (6 months)</h2>
            </div>
            <div className="flex items-end gap-2 h-24">
              {data.friend_growth.map(m => {
                const max = Math.max(...data.friend_growth.map(x => x.count));
                const h = max ? Math.round((m.count / max) * 80) + 8 : 8;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{m.count}</span>
                    <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}px`, background: 'linear-gradient(to top,#2EC4B6,#6C5CE7)' }} />
                    <span className="text-[9px] text-gray-400 dark:text-gray-500">{new Date(m.month).toLocaleDateString([], { month: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
