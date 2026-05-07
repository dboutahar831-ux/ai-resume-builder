import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, FileText, MessageSquare, Briefcase, Hash, Trash2, Crown, ArrowLeft, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-20 flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  );
}

export default function Admin() {
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/recent-activity'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setActivity(activityRes.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-admin`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !u.is_admin } : u));
    } catch {}
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user and all their data?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {}
  };

  if (!myUser.is_admin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-900/30 border border-rose-700 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-rose-400" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-sm text-gray-500 mb-6">You don't have permission to access this page.</p>
          <Link to="/home" className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            <ArrowLeft size={14} /> Back to Feed
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700 flex items-center justify-center">
              <Shield className="text-amber-400" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Site management &amp; overview</p>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['overview', 'users', 'activity'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                tab === t ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              style={tab === t ? { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' } : {}}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.users} color="text-blue-400" />
            <StatCard icon={FileText} label="Posts" value={stats.posts} color="text-indigo-400" />
            <StatCard icon={FileText} label="Resumes" value={stats.resumes} color="text-emerald-400" />
            <StatCard icon={Briefcase} label="Jobs Tracked" value={stats.jobs} color="text-amber-400" />
            <StatCard icon={MessageSquare} label="Messages" value={stats.messages} color="text-violet-400" />
            <StatCard icon={Hash} label="Groups" value={stats.groups} color="text-rose-400" />
          </div>
        )}

        {tab === 'overview' && activity && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Posts</h2>
              <div className="space-y-2">
                {(activity.posts || []).slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-start gap-2 text-sm">
                    <span className="text-[#6C5CE7] font-medium shrink-0">{p.user_name}:</span>
                    <p className="text-gray-500 truncate">{(p.content || '').slice(0, 80)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">New Users</h2>
              <div className="space-y-2">
                {(activity.users || []).map(u => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 font-medium">{u.name}</span>
                    <span className="text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-semibold">User</th>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-center px-5 py-3 font-semibold">Verified</th>
                    <th className="text-center px-5 py-3 font-semibold">Admin</th>
                    <th className="text-center px-5 py-3 font-semibold">Posts</th>
                    <th className="text-center px-5 py-3 font-semibold">Resumes</th>
                    <th className="text-center px-5 py-3 font-semibold">Joined</th>
                    <th className="text-right px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-100 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {u.avatar
                            ? <img src={u.avatar} loading="lazy" alt="" className="w-7 h-7 rounded-full object-cover" />
                            : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#BF5AF2] flex items-center justify-center text-white font-bold text-xs">{u.name?.[0]}</div>
                          }
                          <span className="text-gray-900 font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3 text-center">
                        {u.verified
                          ? <span className="text-emerald-400 text-xs font-semibold">✓</span>
                          : <span className="text-rose-400 text-xs font-semibold">✗</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-center">
                        {u.is_admin
                          ? <Crown size={14} className="text-amber-400 inline" />
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-center text-gray-500">{u.post_count}</td>
                      <td className="px-5 py-3 text-center text-gray-500">{u.resume_count}</td>
                      <td className="px-5 py-3 text-center text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleAdmin(u.id)}
                            className="p-1.5 text-amber-500 hover:bg-amber-900/20 rounded-lg transition-all"
                            title={u.is_admin ? 'Remove admin' : 'Make admin'}>
                            <Crown size={13} />
                          </button>
                          <button onClick={() => deleteUser(u.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-900/20 rounded-lg transition-all"
                            title="Delete user">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'activity' && activity && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {activity.posts.map(p => (
                <div key={p.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-[#6C5CE7] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{p.user_name}</span>
                      <span className="text-gray-500"> posted </span>
                      <span className="text-gray-500">{(p.content || '').slice(0, 100)}{(p.content || '').length > 100 ? '…' : ''}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
