import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, UserPlus, Check, X, UserCheck, Clock, MapPin } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return user.avatar
    ? <img src={user.avatar} alt={user.name} className={`${sz} rounded-full object-cover flex-shrink-0`} />
    : <div className={`${sz} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold flex-shrink-0`}>{user.name?.[0]}</div>;
}

function FriendCard({ user, onAction, myId }) {
  const { friendship_status: status, requester_id } = user;
  const iAmRequester = requester_id === myId;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-all">
      <Link to={`/friends/${user.id}`}>
        <Avatar user={user} size="lg" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/friends/${user.id}`} className="font-semibold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
          {user.name}
        </Link>
        {user.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{user.location}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {!status && (
          <button onClick={() => onAction('request', user.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all">
            <UserPlus size={13} />Add
          </button>
        )}
        {status === 'pending' && iAmRequester && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg">
            <Clock size={13} />Pending
          </span>
        )}
        {status === 'pending' && !iAmRequester && (
          <>
            <button onClick={() => onAction('accept', user.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-all">
              <Check size={13} />Accept
            </button>
            <button onClick={() => onAction('reject', user.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-all">
              <X size={13} />
            </button>
          </>
        )}
        {status === 'accepted' && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">
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

  useEffect(() => { load(); }, [load]);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect with professionals and grow your network.</p>
        </div>

        {/* Search bar — always visible */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setTab('search'); }}
            placeholder="Search people by name or email..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchResults([]); setTab('friends'); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  t.key === 'requests' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
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
                <Link to={`/friends/${u.id}`}><Avatar user={u} size="lg" /></Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/friends/${u.id}`} className="font-semibold text-gray-900 text-sm hover:text-indigo-600">{u.name}</Link>
                  <p className="text-xs text-gray-400">Sent you a friend request</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('accept', u.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all">
                    <Check size={13} />Accept
                  </button>
                  <button onClick={() => handleAction('reject', u.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
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
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Users size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">No connections yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the search bar above to find people you know</p>
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
