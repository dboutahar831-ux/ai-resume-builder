import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, UserPlus, Check, X, UserCheck, Clock, MapPin } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return user.avatar
    ? <img src={user.avatar} alt={user.name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />
    : <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>{user.name?.[0]}</div>;
}

function isOnline(lastSeenAt) {
  return lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 120000;
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return null;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 120000) return 'Active now';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Active ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Active ${h}h ago`;
  return `Active ${Math.floor(h / 24)}d ago`;
}

function StatusDot({ lastSeenAt, size = 'sm' }) {
  const online = isOnline(lastSeenAt);
  const sz = size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  return (
    <span className={`absolute bottom-0 right-0 ${sz} rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
  );
}

function FriendCard({ user, onAction, myId }) {
  const { friendship_status: status, requester_id } = user;
  const iAmRequester = requester_id === myId;

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-md transition-all group">
      <Link to={`/friends/${user.id}`} className="relative flex-shrink-0">
        <Avatar user={user} size="lg" />
        <StatusDot lastSeenAt={user.last_seen_at} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/friends/${user.id}`} className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
          {user.name}
        </Link>
        {user.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{user.location}</p>}
        {formatLastSeen(user.last_seen_at) && (
          <p className={`text-xs mt-0.5 font-medium ${isOnline(user.last_seen_at) ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isOnline(user.last_seen_at) ? '🟢 ' : ''}{formatLastSeen(user.last_seen_at)}
          </p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {!status && (
          <button onClick={() => onAction('request', user.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-xl hover:opacity-90 transition-all" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            <UserPlus size={13} />Add
          </button>
        )}
        {status === 'pending' && iAmRequester && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-xl">
            <Clock size={13} />Pending
          </span>
        )}
        {status === 'pending' && !iAmRequester && (
          <>
            <button onClick={() => onAction('accept', user.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-all">
              <Check size={13} />Accept
            </button>
            <button onClick={() => onAction('reject', user.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-xl hover:bg-red-100 transition-all">
              <X size={13} />
            </button>
          </>
        )}
        {status === 'accepted' && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl">
            <UserCheck size={13} />Friends
          </span>
        )}
      </div>
    </div>
  );
}

export default function Friends() {
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('friends'); // friends | requests | search

  const load = useCallback(async () => {
    const [f, r] = await Promise.all([api.get('/friends'), api.get('/friends/requests')]);
    setFriends(f.data);
    setRequests(r.data);
  }, []);

  useEffect(() => {
    const init = async () => {
      try { await api.put('/auth/heartbeat'); } catch {}
      load();
    };
    init();
    const id = setInterval(async () => {
      try { await api.put('/auth/heartbeat'); } catch {}
      load();
    }, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
        setSearchResults(res.data);
      } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAction = async (type, userId) => {
    if (type === 'request') await api.post(`/friends/request/${userId}`);
    if (type === 'accept')  await api.put(`/friends/accept/${userId}`);
    if (type === 'reject')  await api.put(`/friends/reject/${userId}`);
    await load();
    if (query) {
      const res = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    }
  };

  const tabs = [
    { key: 'friends',  label: 'My Friends',   count: friends.length },
    { key: 'requests', label: 'Requests',      count: requests.length },
    { key: 'search',   label: 'Find People',   count: null },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <h1 className="text-xl font-bold">Friends & Network</h1>
            <p className="text-white/70 text-sm mt-0.5">Connect with professionals and grow your career network.</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
              <span><strong className="text-white">{friends.length}</strong> connections</span>
              {requests.length > 0 && <span><strong className="text-white">{requests.length}</strong> pending requests</span>}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setTab('search'); }}
            placeholder="Search people by name or email..."
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchResults([]); setTab('friends'); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 hover:bg-gray-100 rounded-full transition-all">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.key === 'requests' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search results */}
        {tab === 'search' && (
          <div className="space-y-2">
            {searching && (
              <div className="text-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {!searching && query && searchResults.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Users size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No users found for "{query}"</p>
              </div>
            )}
            {!searching && searchResults.map(u => (
              <FriendCard key={u.id} user={u} onAction={handleAction} myId={myId} />
            ))}
          </div>
        )}

        {/* Friend requests */}
        {tab === 'requests' && (
          <div className="space-y-2">
            {requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Users size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No pending friend requests</p>
              </div>
            ) : requests.map(u => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <Link to={`/friends/${u.id}`} className="relative flex-shrink-0">
                  <Avatar user={u} size="lg" />
                  <StatusDot lastSeenAt={u.last_seen_at} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/friends/${u.id}`} className="font-semibold text-gray-900 text-sm hover:text-indigo-600">{u.name}</Link>
                  <p className="text-xs text-gray-400">Sent you a friend request</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('accept', u.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-xl hover:opacity-90 transition-all" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                    <Check size={13} />Accept
                  </button>
                  <button onClick={() => handleAction('reject', u.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends list */}
        {tab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-indigo-400" />
                </div>
                <p className="text-gray-700 font-bold text-base">No connections yet</p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">Use the search bar above to find and connect with people in your field</p>
              </div>
            ) : friends.map(f => (
              <FriendCard key={f.id} user={{ ...f, friendship_status: 'accepted' }} onAction={handleAction} myId={myId} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
