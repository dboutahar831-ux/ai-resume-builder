import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Heart, Repeat2, CornerDownRight, UserPlus, CheckCheck } from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import api from '../api/axios';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const META = {
  comment:  { Icon: MessageSquare,   color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30',    label: 'commented on your post' },
  reaction: { Icon: Heart,           color: 'text-rose-500 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/30',    label: 'reacted to your post' },
  repost:   { Icon: Repeat2,         color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', label: 'shared your post' },
  reply:    { Icon: CornerDownRight, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', label: 'replied to your comment' },
  mention:  { Icon: UserPlus,        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', label: 'mentioned you' },
};

function Avatar({ user }) {
  return user?.avatar
    ? <img src={user.avatar} alt={user.actor_name} className="w-10 h-10 rounded-full object-cover" />
    : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
        {user?.actor_name?.[0]?.toUpperCase() || '?'}
      </div>;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setItems(res.data);
    } catch { addToast('Failed to load notifications.', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, read: true })));
    } catch { addToast('Failed to mark as read.', 'error'); }
  };

  const unread = items.filter(n => !n.read).length;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            {unread > 0 && (
              <p className="text-sm text-gray-400 mt-0.5">{unread} unread</p>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
              <CheckCheck size={14} />Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Bell size={36} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">When someone interacts with your posts, you'll see it here.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm">
            {items.map(n => {
              const meta = META[n.type] || META.comment;
              const { Icon } = meta;
              return (
                <Link key={n.id} to={n.post_id ? '/home' : '/home'}
                  className={`flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <Avatar user={n} />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${meta.bg}`}>
                      <Icon size={10} className={meta.color} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      <span className="font-semibold">{n.actor_name}</span>{' '}
                      <span className="text-gray-500 dark:text-gray-400">{meta.label}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
