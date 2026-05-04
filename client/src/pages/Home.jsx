import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, Users, MessageSquare, ArrowRight, Sparkles, TrendingUp, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const quotes = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Opportunities don\'t happen. You create them." — Chris Grosser',
  '"Your attitude determines your direction." — Unknown',
  '"Success is where preparation meets opportunity." — Seneca',
  '"Dream big. Work hard. Stay focused." — Unknown',
];

export default function Home() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, friends: 0, unread: 0 });
  const [friends, setFriends] = useState([]);
  const quote = quotes[new Date().getDate() % quotes.length];

  useEffect(() => {
    Promise.all([
      api.get('/resumes'),
      api.get('/jobs'),
      api.get('/friends'),
      api.get('/messages/unread/count'),
    ]).then(([r, j, f, u]) => {
      setStats({ resumes: r.data.length, jobs: j.data.length, friends: f.data.length, unread: u.data.count });
      setFriends(f.data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const cards = [
    { to: '/dashboard',  icon: TrendingUp,    label: 'Dashboard',      desc: 'View your job search overview', color: 'bg-indigo-600',  text: 'text-white' },
    { to: '/resumes',    icon: FileText,       label: 'My Resumes',     desc: `${stats.resumes} resume${stats.resumes !== 1 ? 's' : ''} created`, color: 'bg-white', text: 'text-gray-900' },
    { to: '/jobs',       icon: Briefcase,      label: 'Job Tracker',    desc: `${stats.jobs} application${stats.jobs !== 1 ? 's' : ''} tracked`, color: 'bg-white', text: 'text-gray-900' },
    { to: '/friends',    icon: Users,          label: 'Friends',        desc: `${stats.friends} connection${stats.friends !== 1 ? 's' : ''}`, color: 'bg-white', text: 'text-gray-900' },
    { to: '/messages',   icon: MessageSquare,  label: 'Messages',       desc: stats.unread > 0 ? `${stats.unread} unread message${stats.unread !== 1 ? 's' : ''}` : 'No new messages', color: 'bg-white', text: 'text-gray-900' },
    { to: '/resumes/new',icon: Sparkles,       label: 'Build Resume',   desc: 'Create a new resume with AI', color: 'bg-white', text: 'text-gray-900' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Hero */}
        <div className="bg-indigo-600 rounded-2xl p-8 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-indigo-200 text-sm font-medium mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-bold text-white mb-2">
              {getGreeting()}, {user.name?.split(' ')[0]}!
            </h1>
            <p className="text-indigo-200 text-sm max-w-sm">Ready to take your career to the next level today?</p>
          </div>
          <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10">
            <span className="text-5xl">🚀</span>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
        </div>

        {/* Quick access grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cards.map(({ to, icon: Icon, label, desc, color, text }) => (
              <Link key={to} to={to}
                className={`group rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all ${color}`}>
                <Icon size={20} className={label === 'Dashboard' ? 'text-white mb-3' : 'text-indigo-600 mb-3'} />
                <p className={`font-semibold text-sm ${text}`}>{label}</p>
                <p className={`text-xs mt-0.5 ${label === 'Dashboard' ? 'text-indigo-200' : 'text-gray-400'}`}>{desc}</p>
                <ArrowRight size={14} className={`mt-3 opacity-0 group-hover:opacity-100 transition-opacity ${label === 'Dashboard' ? 'text-white' : 'text-indigo-400'}`} />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Friends online */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Users size={15} className="text-indigo-500" />My Connections
              </h2>
              <Link to="/friends" className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-6">
                <Users size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No connections yet</p>
                <Link to="/friends" className="text-xs text-indigo-600 hover:underline mt-1 block">Find people you know</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map(f => (
                  <Link key={f.id} to={`/friends/${f.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors">
                    {f.avatar ? (
                      <img src={f.avatar} alt={f.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                        {f.name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400 truncate">{f.location || 'ResumeAI member'}</p>
                    </div>
                    <MessageSquare size={14} className="text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quote + tips */}
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Daily Inspiration</p>
              <p className="text-sm text-indigo-900 leading-relaxed italic">{quote}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={12} />Recent Activity
              </p>
              <div className="space-y-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span>You have <strong className="text-gray-700">{stats.resumes}</strong> resume{stats.resumes !== 1 ? 's' : ''} in your library</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span><strong className="text-gray-700">{stats.jobs}</strong> job application{stats.jobs !== 1 ? 's' : ''} being tracked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span><strong className="text-gray-700">{stats.friends}</strong> connection{stats.friends !== 1 ? 's' : ''} in your network</span>
                </div>
                {stats.unread > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                    <span><strong className="text-gray-700">{stats.unread}</strong> unread message{stats.unread !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
