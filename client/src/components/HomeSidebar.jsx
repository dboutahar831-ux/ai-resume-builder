import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, MessageSquare, UserPlus, Hash } from 'lucide-react';
import ProfileCard from './ProfileCard';
import api from '../api/axios';

function Avatar({ user, size = 'sm', showDot = false, lastSeen = null }) {
  const sz = { xl: 'w-14 h-14', lg: 'w-12 h-12', md: 'w-10 h-10', sm: 'w-8 h-8' }[size];
  const dotSz = { xl: 'w-3.5 h-3.5 border-2', lg: 'w-3 h-3 border-2', md: 'w-2.5 h-2.5 border-2', sm: 'w-2 h-2 border' }[size];
  const online = showDot && lastSeen && Date.now() - new Date(lastSeen).getTime() < 120000;

  return (
    <div className="relative flex-shrink-0">
      {user?.avatar
        ? <img src={user.avatar} loading="lazy" alt={user.name} className={`${sz} rounded-full object-cover ring-2 ring-white dark:ring-[#111111]`} />
        : <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold`}>
            {user?.name?.[0] || '?'}
          </div>
      }
      {showDot && (
        <span className={`absolute bottom-0 right-0 ${dotSz} rounded-full border-white dark:border-[#111111] ${online ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      )}
    </div>
  );
}

export default function HomeSidebar({ myUser, coverImage, stats, friends, suggestions, addedIds, sendRequest }) {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api.get('/hashtags/trending').then(r => setTrending(r.data)).catch(() => {});
  }, []);

  return (
    <>
      {/* Profile Card */}
      <div>
        <ProfileCard
          profile={myUser}
          coverImage={coverImage}
          avatar={myUser.avatar}
          name={myUser.name}
          email={myUser.email}
          isOwn
        >
          <div className="pb-1">
            <Link to="/profile"
              className="px-4 py-2 text-white rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              Edit Profile
            </Link>
          </div>
        </ProfileCard>
        {/* Stat counters */}
        <div className="grid grid-cols-2 gap-1.5 px-4 pb-2 mt-3">
          {[
            { label: 'Friends', value: stats.friends, to: '/friends',  icon: Users, color: 'text-emerald-500' },
            { label: 'Unread',  value: stats.unread,  to: '/messages', icon: Bell,  color: 'text-amber-500'  },
          ].map(s => (
            <Link key={s.label} to={s.to}
              className="flex flex-col items-center py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <s.icon size={14} className={`${s.color} mb-0.5 group-hover:scale-110 transition-transform`} />
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">{s.value}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Friends online */}
      {friends.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Connections</p>
            <Link to="/friends" className="text-xs text-indigo-600 hover:underline font-medium">See all</Link>
          </div>
          <div className="space-y-1">
            {friends.map(f => (
              <Link key={f.id} to={`/friends/${f.id}`}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-[#1e1e2e] transition-colors group">
                <Avatar user={f} size="sm" showDot lastSeen={f.last_seen_at} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{f.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {f.last_seen_at && Date.now() - new Date(f.last_seen_at).getTime() < 120000 ? 'Active now' : f.location || 'Nexly'}
                  </p>
                </div>
                <Link to={`/messages?user=${f.id}`} onClick={e => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-all">
                  <MessageSquare size={12} />
                </Link>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* People you may know */}
      {suggestions.filter(u => !addedIds.has(u.id)).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">People you may know</p>
          <div className="space-y-3">
            {suggestions.filter(u => !addedIds.has(u.id)).map(user => (
              <div key={user.id} className="flex items-center gap-2.5">
                <Link to={`/friends/${user.id}`} className="flex-shrink-0">
                  <Avatar user={user} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/friends/${user.id}`}
                    className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate">
                    {user.name}
                  </Link>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.location || 'Nexly member'}</p>
                </div>
                <button onClick={() => sendRequest(user.id)}
                  className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-[#1e1e2e] px-2 py-1 rounded-lg transition-colors flex-shrink-0">
                  <UserPlus size={11} />Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {trending.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
            <Hash size={14} className="text-[#6C5CE7]" /> Trending
          </p>
          <div className="space-y-1">
            {trending.map(t => (
              <Link key={t.tag} to={`/home?tag=${t.tag}`}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                <span className="text-sm font-medium text-[#6C5CE7] group-hover:text-[#BF5AF2] transition-colors">#{t.tag}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{t.post_count} posts</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </>
  );
}
