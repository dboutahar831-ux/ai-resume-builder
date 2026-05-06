import { useEffect, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, X, ExternalLink, CalendarClock, AlertTriangle, ChevronDown, Lightbulb } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const STATUSES = ['pending', 'interview', 'offered', 'accepted', 'rejected'];

const statusStyle = {
  pending:   { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', accent: '#F59E0B' },
  interview: { badge: 'bg-blue-50 text-blue-700 border-blue-200',       accent: '#3B82F6' },
  offered:   { badge: 'bg-purple-50 text-purple-700 border-purple-200', accent: '#8B5CF6' },
  accepted:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', accent: '#10B981' },
  rejected:  { badge: 'bg-red-50 text-red-700 border-red-200',          accent: '#EF4444' },
};

const AI_TIPS = [
  { title: 'Follow Up',       body: 'Send a thank-you email within 24h of an interview — it sets you apart from most candidates.' },
  { title: 'Tailor Your CV',  body: 'Match keywords from the job description; many companies use ATS filters that scan for them.' },
  { title: 'Research First',  body: 'Study the company\'s mission and recent news before any interview or application.' },
  { title: 'Track Deadlines', body: 'Set the interview date on each card so you\'re never caught off guard.' },
];

const empty = {
  company: '', role: '', status: 'pending', location: '', url: '', notes: '',
  applied_at: new Date().toISOString().split('T')[0], interview_date: '',
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export default function JobTracker() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    api.get('/jobs').then(r => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (j) => {
    setForm({ ...j, applied_at: j.applied_at?.split('T')[0] || '', interview_date: j.interview_date?.split('T')[0] || '' });
    setEditId(j.id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, interview_date: form.interview_date || null };
    if (editId) {
      const res = await api.put(`/jobs/${editId}`, payload);
      setJobs(jobs.map(j => j.id === editId ? res.data : j));
    } else {
      const res = await api.post('/jobs', payload);
      setJobs([res.data, ...jobs]);
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this application?')) return;
    await api.delete(`/jobs/${id}`);
    setJobs(jobs.filter(j => j.id !== id));
  };

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const counts   = STATUSES.reduce((a, s) => ({ ...a, [s]: jobs.filter(j => j.status === s).length }), {});
  const upcoming = jobs.filter(j => { const d = daysUntil(j.interview_date); return d !== null && d >= 0 && d <= 1; });

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white transition-all';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Hero header */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Job Tracker</h1>
              <p className="text-white/70 text-sm mt-1">{jobs.length} application{jobs.length !== 1 ? 's' : ''} tracked</p>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm">
              <Plus size={16} />Add Job
            </button>
          </div>
        </div>

        {/* Status overview cards */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-5 gap-3">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
                className={`rounded-xl border p-3 text-center transition-all ${filter === s ? 'shadow-sm scale-[1.02]' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                style={filter === s ? { borderColor: statusStyle[s].accent, background: `${statusStyle[s].accent}18` } : {}}>
                <p className="text-xl font-bold text-gray-900">{counts[s]}</p>
                <p className="text-[10px] font-semibold capitalize mt-0.5" style={{ color: statusStyle[s].accent }}>{s}</p>
              </button>
            ))}
          </div>
        )}

        {/* Upcoming interview alerts */}
        {upcoming.map(j => {
          const d = daysUntil(j.interview_date);
          return (
            <div key={j.id} className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
              <AlertTriangle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Interview {d === 0 ? 'today' : 'tomorrow'} — {j.company}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {j.role} · {new Date(j.interview_date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === s ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={filter === s ? { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' } : {}}>
              {s === 'all' ? `All (${jobs.length})` : `${s} (${counts[s]})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6C5CE7', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
              <Briefcase size={28} className="text-white" />
            </div>
            <p className="text-gray-700 font-semibold">No applications yet</p>
            <p className="text-sm text-gray-400 mt-1">Start tracking your job applications</p>
            <button onClick={openNew}
              className="mt-4 inline-flex items-center gap-2 text-sm text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              <Plus size={14} />Add your first application
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(j => {
              const d = daysUntil(j.interview_date);
              const accent = statusStyle[j.status]?.accent || '#6C5CE7';
              return (
                <div key={j.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-0.5 w-full" style={{ background: accent }} />
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: `${accent}18`, color: accent }}>
                      {j.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{j.company}</p>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${statusStyle[j.status]?.badge}`}>
                          {j.status}
                        </span>
                        {d !== null && d >= 0 && d <= 7 && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                            <CalendarClock size={11} />
                            {d === 0 ? 'Interview today' : d === 1 ? 'Interview tomorrow' : `Interview in ${d}d`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{j.role}{j.location ? ` · ${j.location}` : ''}</p>
                      {j.notes && <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{j.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {j.url && (
                        <a href={j.url} target="_blank" rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button onClick={() => openEdit(j)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(j.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Job Search Tips */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setShowTips(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              <span className="font-semibold text-gray-900 text-sm">Job Search Tips</span>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showTips ? 'rotate-180' : ''}`} />
          </button>
          {showTips && (
            <div className="px-5 pb-5 grid sm:grid-cols-2 gap-3 border-t border-gray-50 pt-4">
              {AI_TIPS.map(tip => (
                <div key={tip.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-bold mb-1" style={{ color: '#6C5CE7' }}>{tip.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="h-1 w-full rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editId ? 'Edit Application' : 'Add Application'}</h2>
              <button onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Company *</label>
                  <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} required placeholder="Google" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Role *</label>
                  <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required placeholder="Software Engineer" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp + ' bg-white capitalize'}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Applied Date</label>
                  <input type="date" value={form.applied_at} onChange={e => setForm({ ...form, applied_at: e.target.value })} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarClock size={12} />Interview Date <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <input type="date" value={form.interview_date} onChange={e => setForm({ ...form, interview_date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Remote / City" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Job URL</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes..." className={inp + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                  {editId ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
