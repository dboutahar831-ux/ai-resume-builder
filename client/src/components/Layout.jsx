import { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, FileText, Briefcase, Users, MessageSquare, LogOut, Menu, X, User, Settings, Bell, UserPlus, FileSignature, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../api/axios';

function NotificationBell({ items, count, onClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLinkClick = () => { setOpen(false); onClose?.(); };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full ml-3 top-0 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {count > 0 && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">{count} new</span>}
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={20} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {items.map((item, i) => (
                <Link key={i} to={item.link} onClick={handleLinkClick}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.icon === 'msg' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                    {item.icon === 'msg'
                      ? <MessageSquare size={13} className="text-indigo-600" />
                      : <UserPlus size={13} className="text-emerald-600" />
                    }
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mt-1">{item.text}</p>
                </Link>
              ))}
            </div>
          )}
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
  const navigate = useNavigate();
  const { t } = useApp();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.clear(); navigate('/login'); };

  const loadNotifications = useCallback(async () => {
    try {
      const [msgs, reqs] = await Promise.all([
        api.get('/messages/unread/count'),
        api.get('/friends/requests'),
      ]);
      const msgCount = msgs.data.count || 0;
      const reqCount = reqs.data.length || 0;
      setUnreadMsgs(msgCount);
      setPendingReqs(reqCount);
      const notifications = [];
      if (msgCount > 0)
        notifications.push({ type: 'messages', text: `${msgCount} unread message${msgCount > 1 ? 's' : ''}`, link: '/messages', icon: 'msg' });
      reqs.data.forEach(r =>
        notifications.push({ type: 'request', text: `${r.name} sent you a friend request`, link: '/friends', icon: 'friend', id: r.id })
      );
      setNotifItems(notifications);
    } catch {}
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const notifCount = notifItems.length;

  const links = [
    { to: '/home',          icon: Home,           label: 'Home' },
    { to: '/dashboard',     icon: LayoutDashboard, label: t.dashboard },
    { to: '/resumes',       icon: FileText,        label: t.resumeBuilder },
    { to: '/cover-letters', icon: FileSignature,   label: 'Cover Letters' },
    { to: '/jobs',          icon: Briefcase,       label: t.jobTracker },
    { to: '/friends',       icon: Users,           label: 'Friends',  badge: pendingReqs },
    { to: '/messages',      icon: MessageSquare,   label: 'Messages', badge: unreadMsgs },
  ];

  const bottomLinks = [
    { to: '/profile',  icon: User,     label: t.profile },
    { to: '/settings', icon: Settings, label: t.settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50/80">
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm shadow-indigo-200">
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">ResumeAI</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <NotificationBell items={notifItems} count={notifCount} onClose={() => setOpen(false)} />
            <button onClick={() => setOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2 pt-1">Main</p>
          {links.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : ''} />
                  <span className="flex-1">{label}</span>
                  {badge > 0
                    ? <span className={`w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold leading-none flex-shrink-0 ${isActive ? 'bg-white/25 text-white' : 'bg-indigo-600 text-white'}`}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    : <ChevronRight size={13} className={`flex-shrink-0 ${isActive ? 'text-white/50' : 'text-gray-300'}`} />
                  }
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2">Account</p>
          {bottomLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-gray-50 border border-gray-100">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all mt-1">
            <LogOut size={17} />{t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all">
            <Menu size={19} />
          </button>
          <Link to="/home" className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
              <FileText size={12} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">ResumeAI</span>
          </Link>
          <NotificationBell items={notifItems} count={notifCount} />
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
