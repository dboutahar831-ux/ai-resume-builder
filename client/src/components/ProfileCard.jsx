import { Link } from 'react-router-dom';
import { MapPin, Link2, Calendar, UserCheck, MessageSquare, Star } from 'lucide-react';

const GRADIENT_PALETTES = [
  ['#2EC4B6','#6C5CE7','#BF5AF2'],
  ['#FF6B6B','#EE5A24','#F0932B'],
  ['#00B894','#00CEC9','#55EFC4'],
  ['#6C5CE7','#A29BFE','#FD79A8'],
  ['#0984E3','#74B9FF','#81ECEC'],
  ['#E17055','#FDCB6E','#FAB1A0'],
  ['#636E72','#B2BEC3','#DFE6E9'],
  ['#2D3436','#0984E3','#00CEC9'],
];

function getGradientColors(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
}

function isOnline(lastSeen) {
  return lastSeen && Date.now() - new Date(lastSeen).getTime() < 120000;
}

function AvailabilityBadge({ status }) {
  if (!status || status === 'all') return null;
  const isOpen = status === 'open_to_work';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium text-[10px] px-2 py-0.5 ${
      isOpen
        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {isOpen ? 'Open to Work' : 'Not Looking'}
    </span>
  );
}

function Avatar({ src, name, size = 'w-16 h-16', ring = false, allSeen = false, onClick }) {
  const [c1, c2] = getGradientColors(name);
  const ringClass = ring
    ? allSeen
      ? 'p-[2px] bg-gray-300 dark:bg-gray-600 rounded-full'
      : 'p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full'
    : '';

  return (
    <div className={`${ringClass} cursor-pointer`} onClick={onClick}>
      <div className={ring ? 'p-0.5 bg-white dark:bg-gray-900 rounded-full' : ''}>
        {src ? (
          <img src={src} alt={name} className={`${size} rounded-full object-cover ring-2 ring-white dark:ring-gray-900`} />
        ) : (
          <div className={`${size} rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900`}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
            <span className="text-white font-bold text-lg select-none">{name?.[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OnlineDot({ lastSeen, className = '' }) {
  const online = isOnline(lastSeen);
  return (
    <span className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${online ? 'bg-emerald-500' : 'bg-gray-400'} ${className}`} />
  );
}

function LastSeenLabel({ lastSeen }) {
  const online = isOnline(lastSeen);
  if (!lastSeen) return null;
  const diff = Date.now() - new Date(lastSeen).getTime();
  const label = online ? 'Active now'
    : diff < 3600000 ? `Active ${Math.floor(diff / 60000)}m ago`
    : diff < 86400000 ? `Active ${Math.floor(diff / 3600000)}h ago`
    : `Active ${Math.floor(diff / 86400000)}d ago`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${
      online ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
             : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {label}
    </span>
  );
}

export default function ProfileCard({
  profile,
  coverImage,
  avatar,
  name,
  bio,
  email,
  location,
  linkedin,
  skills = [],
  availabilityStatus,
  lastSeen,
  createdAt,
  isOwn,
  isFriend,
  friendshipStatus,
  requesterId,
  myId,
  online,
  avatarOnClick,
  children,
  onMessage,
  onAddFriend,
  onAccept,
  onReject,
  onUnfriend,
  actionLoading,
}) {
  const [c1, c2, c3] = getGradientColors(name);
  const iAmRequester = requesterId === myId;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-visible transition-all duration-200">
      {/* Cover */}
      <div className="relative h-52 rounded-t-3xl overflow-hidden">
        {coverImage
          ? <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})` }} />
        }
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Body */}
      <div className="px-6 sm:px-8 pb-6">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-14 mb-4">
          <div className="relative">
            <Avatar src={avatar} name={name} size="w-28 h-28 text-2xl" onClick={avatarOnClick} />
            {!isOwn && lastSeen && <OnlineDot lastSeen={lastSeen} className="absolute -bottom-0.5 -right-0.5" />}
          </div>

          {/* Action buttons */}
          {children ? children : (
            <div className="flex gap-2 pb-1">
              {isOwn && (
                <Link to="/profile"
                  className="px-4 py-2 text-white rounded-2xl text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
                  style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                  Edit Profile
                </Link>
              )}
              {!isOwn && isFriend && (
                <>
                  <button onClick={onMessage}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all">
                    <MessageSquare size={15} />Message
                  </button>
                  <button onClick={onUnfriend} disabled={actionLoading}
                    className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-xl transition-all disabled:opacity-60">
                    <UserCheck size={15} className="block sm:hidden" />
                    <span className="hidden sm:inline">Connected</span>
                  </button>
                </>
              )}
              {!isOwn && !friendshipStatus && (
                <button onClick={onAddFriend} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60">
                  + Connect
                </button>
              )}
              {!isOwn && friendshipStatus === 'pending' && iAmRequester && (
                <span className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-xl cursor-default">
                  Request Sent
                </span>
              )}
              {!isOwn && friendshipStatus === 'pending' && !iAmRequester && (
                <>
                  <button onClick={onAccept} disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-60">
                    Accept
                  </button>
                  <button onClick={onReject} disabled={actionLoading}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-60">
                    Decline
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{name}</h1>
          <AvailabilityBadge status={availabilityStatus} />
          {!isOwn && isFriend && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800">
              <UserCheck size={10} />Connected
            </span>
          )}
        </div>

        {email && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{email}</p>}

        {/* Last seen */}
        {!isOwn && lastSeen && <div className="mb-2"><LastSeenLabel lastSeen={lastSeen} /></div>}

        {/* Bio */}
        {bio && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mb-3">{bio}</p>}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {location && <span className="flex items-center gap-1.5"><MapPin size={12} />{location}</span>}
          {linkedin && (
            <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-indigo-600 hover:underline">
              <Link2 size={12} />LinkedIn
            </a>
          )}
          {createdAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />Member since {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skills.map(skill => (
              <span key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border"
                style={{
                  background: 'linear-gradient(135deg, rgba(46,196,182,0.08), rgba(108,92,231,0.08))',
                  borderColor: 'rgba(108,92,231,0.2)',
                  color: '#6C5CE7',
                }}>
                <Star size={9} className="opacity-60" />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
