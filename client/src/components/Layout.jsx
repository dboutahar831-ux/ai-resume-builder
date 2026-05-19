import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home, Users, MessageSquare, Search,
  Menu, X, User, Settings, Bell, UserPlus, ChevronRight,
  Heart, Repeat2, CornerDownRight, LogOut, Moon, Sun,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../api/axios';
import { getSocket } from '../services/socket';

function NexlyIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="nx-g" x1="0" y1="26" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2EC4B6"/>
          <stop offset="45%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <path d="M5 46 L5 6 L22 42 L22 6" stroke="url(#nx-g)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 6 L51 46" stroke="url(#nx-g)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M51 6 L30 46" stroke="url(#nx-g)" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

function DarkToggle({ dark, setDark }) {
  return (
    <button
      onClick={() => setDark(d => !d)}
      aria-label="Toggle dark mode"
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        dark ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
        dark ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'
      }`}>
        {dark
          ? <Moon size={11} className="text-indigo-600" />
          : <Sun size={11} className="text-amber-500" />
        }
      </span>
    </button>
  );
}

const NOTIF_META = {
  msg:      { bg: 'bg-indigo-50 dark:bg-indigo-900/40',  Icon: MessageSquare,   color: 'text-indigo-600 dark:text-indigo-400'  },
  friend:   { bg: 'bg-emerald-50 dark:bg-emerald-900/40', Icon: UserPlus,        color: 'text-emerald-600 dark:text-emerald-400' },
  comment:  { bg: 'bg-blue-50 dark:bg-blue-900/40',    Icon: MessageSquare,   color: 'text-blue-600 dark:text-blue-400'    },
  reaction: { bg: 'bg-rose-50 dark:bg-rose-900/40',    Icon: Heart,           color: 'text-rose-500 dark:text-rose-400'    },
  repost:   { bg: 'bg-purple-50 dark:bg-purple-900/40',  Icon: Repeat2,         color: 'text-purple-600 dark:text-purple-400'  },
  reply:    { bg: 'bg-indigo-50 dark:bg-indigo-900/40',  Icon: CornerDownRight, color: 'text-indigo-600 dark:text-indigo-400'  },
  mention:  { bg: 'bg-violet-50 dark:bg-violet-900/40',  Icon: UserPlus,        color: 'text-violet-600 dark:text-violet-400'  },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function NotificationBell({ items, count, onMarkRead, onClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => {
      if (!o) onMarkRead?.();
      return !o;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none shadow-sm animate-[badge-bounce_0.4s_ease]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#2A2A2A] rounded-2xl shadow-xl dark:shadow-2xl z-50 overflow-hidden"
          style={{ animation: 'fadeInDown 0.15s ease' }}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2A2A2A] flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</p>
            {count > 0 && (
              <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">{count} new</span>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell size={24} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-400 dark:text-gray-500">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-[#2A2A2A] max-h-80 overflow-y-auto">
              {items.map((item, i) => {
                const meta = NOTIF_META[item.icon] || NOTIF_META.msg;
                const { Icon } = meta;
                return (
                  <Link key={i} to={item.link} onClick={() => { setOpen(false); onClose?.(); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!item.read ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${meta.bg}`}>
                      <Icon size={13} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed">{item.text}</p>
                      {item.time && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.time}</p>}
                    </div>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />}
                  </Link>
                );
              })}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-gray-50 dark:border-[#2A2A2A]">
            <button onClick={() => { onMarkRead?.(); setOpen(false); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline w-full text-center">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [pendingReqs, setPendingReqs] = useState(0);
  const { t, dark, setDark } = useApp();
  const navigate = useNavigate();
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const loadNotifications = useCallback(async () => {
    try {
      const [msgs, reqs, postNotifs] = await Promise.all([
        api.get('/messages/unread/count'),
        api.get('/friends/requests'),
        api.get('/notifications').catch(() => ({ data: [] })),
      ]);
      const msgCount = msgs.data.count || 0;
      const reqCount = reqs.data.length || 0;
      setUnreadMsgs(msgCount);
      setPendingReqs(reqCount);

      const notifications = [];
      if (msgCount > 0)
        notifications.push({ type: 'messages', text: `${msgCount} unread message${msgCount > 1 ? 's' : ''}`, link: '/messages', icon: 'msg', read: false });
      reqs.data.forEach(r =>
        notifications.push({ type: 'request', text: `${r.name} sent you a friend request`, link: '/friends', icon: 'friend', read: false })
      );
      const typeText = {
        comment: 'commented on your post',
        reaction: 'reacted to your post',
        repost: 'shared your post',
        reply: 'replied to your comment',
        mention: 'mentioned you in a post',
      };
      postNotifs.data.forEach(n => {
        const label = typeText[n.type] || 'interacted with your post';
        notifications.push({ type: n.type, text: `${n.actor_name} ${label}`, link: '/home', icon: n.type, read: n.read, time: timeAgo(n.created_at) });
      });

      setNotifItems(notifications);
    } catch {}
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = getSocket();
    const typeText = {
      comment: 'commented on your post',
      reaction: 'reacted to your post',
      repost: 'shared your post',
      reply: 'replied to your comment',
      mention: 'mentioned you in a post',
    };
    const handleNotif = (n) => {
      const label = typeText[n.type] || 'interacted with your post';
      setNotifItems(prev => [{
        type: n.type,
        text: `${n.actor_name} ${label}`,
        link: '/home',
        icon: n.type,
        read: false,
        time: 'Just now',
      }, ...prev]);
    };
    const handleNewMsg = () => {
      setUnreadMsgs(c => c + 1);
    };
    const handleFriendRequest = (user) => {
      setPendingReqs(c => c + 1);
      setNotifItems(prev => [{
        type: 'request',
        text: `${user.name} sent you a friend request`,
        link: '/friends',
        icon: 'friend',
        read: false,
        time: 'Just now',
      }, ...prev]);
    };
    const handleFriendAccepted = (user) => {
      setNotifItems(prev => [{
        type: 'request',
        text: `${user.name} accepted your friend request`,
        link: `/friends/${user.id}`,
        icon: 'friend',
        read: false,
        time: 'Just now',
      }, ...prev]);
    };
    socket.on('notification:new', handleNotif);
    socket.on('message:new', handleNewMsg);
    socket.on('friend:request', handleFriendRequest);
    socket.on('friend:accepted', handleFriendAccepted);
    return () => {
      socket.off('notification:new', handleNotif);
      socket.off('message:new', handleNewMsg);
      socket.off('friend:request', handleFriendRequest);
      socket.off('friend:accepted', handleFriendAccepted);
    };
  }, []);

  const notifCount = notifItems.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    api.put('/notifications/read-all').catch(() => {});
    setNotifItems(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const links = [
    { to: '/home',          icon: Home,          label: 'Home' },
    { to: '/friends',       icon: Users,         label: 'Friends',       badge: pendingReqs },
    { to: '/messages',      icon: MessageSquare, label: 'Messages',      badge: unreadMsgs },
    { to: '/notifications', icon: Bell,          label: 'Notifications', badge: notifCount },
    { to: '/search',        icon: Search,        label: 'Search' },
  ];

  const bottomLinks = [
    { to: '/profile',  icon: User,     label: t.profile },
    { to: '/settings', icon: Settings, label: t.settings },
  ];

  const activeStyle = { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' };

  return (
    <div className="flex h-screen bg-gray-50/80 dark:bg-[#0A0A0A]">
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-[#111111] border-r border-gray-100 dark:border-[#2A2A2A] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo section */}
        <div className="px-5 py-5 border-b border-gray-100 dark:border-[#2A2A2A] flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <NexlyIcon className="w-8 h-8" />
            <span className="font-bold text-gray-900 dark:text-gray-100 tracking-tight text-base">Nexly</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell items={notifItems} count={notifCount} onMarkRead={markAllRead} onClose={() => setOpen(false)} />
            <button onClick={() => setOpen(false)} className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 pb-3">Main</p>
          {links.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              style={({ isActive }) => isActive ? activeStyle : {}}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-[#E8ECF8]'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : ''} />
                  <span className="flex-1">{label}</span>
                  {badge > 0
                    ? <span className={`w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold leading-none flex-shrink-0 shadow-sm ${isActive ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    : <ChevronRight size={13} className={`flex-shrink-0 ${isActive ? 'text-white/50' : 'text-gray-300 dark:text-gray-500'}`} />
                  }
                </>
              )}
            </NavLink>
          ))}

        </nav>

        {/* Account section */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-[#2A2A2A] space-y-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 pb-2">Account</p>
          {bottomLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              style={({ isActive }) => isActive ? activeStyle : {}}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-[#E8ECF8]'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : ''} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Dark mode toggle row */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-3">
              {dark
                ? <Moon size={17} className="text-indigo-400" />
                : <Sun size={17} className="text-amber-500" />
              }
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {dark ? 'Dark mode' : 'Light mode'}
              </span>
            </div>
            <DarkToggle dark={dark} setDark={setDark} />
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-1">
            <LogOut size={17} />
            <span>{t.logout || 'Logout'}</span>
          </button>

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-3 mt-3 rounded-xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2A2A2A] shadow-sm">
            {user.avatar ? (
              <img src={user.avatar} loading="lazy" alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-[#252D3D] shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none shadow-sm">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-[#2A2A2A] px-4 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition-all">
            <Menu size={19} />
          </button>
          <Link to="/home" className="flex items-center gap-2 flex-1">
            <NexlyIcon className="w-6 h-6" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Nexly</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all">
              {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>
            <NotificationBell items={notifItems} count={notifCount} onMarkRead={markAllRead} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-[#111111] border-t border-gray-100 dark:border-[#2A2A2A] flex items-center justify-around px-2 py-2 shadow-lg">
        {[
          { to: '/home',     icon: Home,         label: 'Home'    },
          { to: '/friends',  icon: Users,         label: 'Friends', badge: pendingReqs },
          { to: '/messages', icon: MessageSquare, label: 'Messages',badge: unreadMsgs  },
          { to: '/profile',  icon: User,          label: 'Profile' },
          { to: '/settings', icon: Settings,      label: 'More'    },
        ].map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${isActive ? '' : 'text-gray-400 dark:text-gray-500'}`
            }>
            {({ isActive }) => (
              <>
                <Icon size={20} style={isActive ? { color: '#6C5CE7' } : {}} />
                <span className="text-[10px] font-medium" style={isActive ? { color: '#6C5CE7' } : {}}>{label}</span>
                {badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
