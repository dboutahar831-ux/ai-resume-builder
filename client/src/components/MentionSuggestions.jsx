import { useState } from 'react';
import { MapPin } from 'lucide-react';

function MiniProfileCard({ user }) {
  return (
    <div className="absolute left-0 bottom-full mb-2 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl p-3 z-50 pointer-events-none"
      style={{ animation: 'fadeInUp 0.15s ease' }}>
      <div className="flex items-center gap-2.5 mb-2">
        {user.avatar
          ? <img src={user.avatar} loading="lazy" alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
          : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
              {user.name?.[0]}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
          {user.email && <p className="text-[10px] text-gray-400 truncate">{user.email}</p>}
        </div>
      </div>
      {user.bio && <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{user.bio}</p>}
      {user.location && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
          <MapPin size={9} />{user.location}
        </div>
      )}
    </div>
  );
}

export default function MentionSuggestions({ suggestions, onSelect }) {
  const [hoveredUser, setHoveredUser] = useState(null);

  if (!suggestions.length) return null;

  return (
    <div className="absolute z-50 bottom-full mb-1 left-0 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)', animation: 'fadeInUp 0.15s ease' }}>
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mention</span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600">({suggestions.length})</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {suggestions.map(user => (
          <button
            key={user.id}
            type="button"
            onMouseDown={e => { e.preventDefault(); onSelect(user); }}
            onMouseEnter={() => setHoveredUser(user)}
            onMouseLeave={() => setHoveredUser(null)}
            className="relative flex items-center gap-2.5 w-full px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left group"
          >
            {hoveredUser?.id === user.id && <MiniProfileCard user={user} />}
            {user.avatar
              ? <img src={user.avatar} loading="lazy" alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-white" />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
                  {user.name?.[0]}
                </div>
            }
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block truncate">@{user.name}</span>
              {user.location && <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate block">{user.location}</span>}
            </div>
            {user.avatar && (
              <span className="text-[10px] text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                +mention
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
