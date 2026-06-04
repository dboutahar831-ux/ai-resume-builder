import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, UserPlus, Check, Clock, Users } from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import api from '../api/axios';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 120000) return 'Active now';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Active ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Active ${h}h ago`;
  return `Active ${Math.floor(h / 24)}d ago`;
}

function isOnline(lastSeen) {
  return lastSeen && Date.now() - new Date(lastSeen).getTime() < 120000;
}

function Avatar({ user }) {
  return user?.avatar
    ? <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm" />
    : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
        {user?.name?.[0]?.toUpperCase() || '?'}
      </div>;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [actionStates, setActionStates] = useState({}); // userId -> 'loading' | 'sent' | 'accepted'
  const timerRef = useRef();
  const addToast = useToast();

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch { addToast('Search failed.', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  };

  const sendRequest = async (userId) => {
    setActionStates(p => ({ ...p, [userId]: 'loading' }));
    try {
      await api.post(`/friends/request/${userId}`);
      setActionStates(p => ({ ...p, [userId]: 'sent' }));
    } catch { addToast('Failed to send request.', 'error'); setActionStates(p => ({ ...p, [userId]: null })); }
  };

  const acceptRequest = async (userId) => {
    setActionStates(p => ({ ...p, [userId]: 'loading' }));
    try {
      await api.put(`/friends/accept/${userId}`);
      setActionStates(p => ({ ...p, [userId]: 'accepted' }));
      addToast('Friend request accepted!', 'success');
    } catch { addToast('Failed to accept request.', 'error'); setActionStates(p => ({ ...p, [userId]: null })); }
  };

  const getFriendshipLabel = (user) => {
    const state = actionStates[user.id];
    if (state === 'sent' || state === 'accepted') return { label: state === 'sent' ? 'Requested' : 'Friends', icon: <Check size={13} />, cls: 'text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-default' };
    if (state === 'loading') return { label: '…', icon: null, cls: 'text-gray-400 bg-gray-100 cursor-default' };
    if (user.friendship_status === 'accepted') return null; // already friends — show profile link only
    if (user.friendship_status === 'pending' && user.requester_id !== Number(JSON.parse(localStorage.getItem('user') || '{}').id))
      return { label: 'Accept', icon: <Check size={13} />, cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30', onClick: () => acceptRequest(user.id) };
    if (user.friendship_status === 'pending')
      return { label: 'Requested', icon: <Clock size={13} />, cls: 'text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-default' };
    return { label: 'Add Friend', icon: <UserPlus size={13} />, cls: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30', onClick: () => sendRequest(user.id) };
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Search bar */}
        <div className="relative mb-6">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            autoFocus
            placeholder="Search people by name…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 shadow-sm text-sm transition-all"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-20">
            <Users size={36} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different name</p>
          </div>
        ) : !searched ? (
          <div className="text-center py-20 text-gray-400">
            <SearchIcon size={36} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-sm">Start typing to search people</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 shadow-sm overflow-hidden">
            {results.map(user => {
              const btn = getFriendshipLabel(user);
              const online = isOnline(user.last_seen_at);
              return (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <Link to={`/friends/${user.id}`} className="relative flex-shrink-0">
                    <Avatar user={user} />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/friends/${user.id}`}
                      className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors text-sm">
                      {user.name}
                    </Link>
                    <p className={`text-xs mt-0.5 ${online ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                      {timeAgo(user.last_seen_at) || (user.location || '')}
                    </p>
                    {user.friendship_status === 'accepted' && (
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                        <Check size={10} />Friends
                      </p>
                    )}
                  </div>
                  {btn && (
                    <button
                      onClick={btn.onClick}
                      disabled={!btn.onClick}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${btn.cls}`}>
                      {btn.icon}{btn.label}
                    </button>
                  )}
                  {!btn && (
                    <Link to={`/friends/${user.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-xl transition-colors">
                      View Profile
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
