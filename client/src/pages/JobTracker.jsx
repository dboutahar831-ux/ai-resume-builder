import { useEffect, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, X, ExternalLink, CalendarClock, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const STATUSES = ['pending', 'interview', 'offered', 'accepted', 'rejected'];

const statusStyle = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  interview: 'bg-blue-50 text-blue-700 border-blue-200',
  offered:   'bg-purple-50 text-purple-700 border-purple-200',
  accepted:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
};

const empty = { company: '', role: '', status: 'pending', location: '', url: '', notes: '', applied_at: new Date().toISOString().split('T')[0], interview_date: '' };

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

  useEffect(() => {
    api.get('/jobs').then(r => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  const openNew = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (j) => {
    setForm({
      ...j,
      applied_at: j.applied_at?.split('T')[0] || '',
      interview_date: j.interview_date?.split('T')[0] || '',
    });
    setEditId(j.id);
    setShowForm(true);
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
  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  // Upcoming interviews (today or tomorrow)
  const upcoming = jobs.filter(j => {
    const d = daysUntil(j.interview_date);
    return d !== null && d >= 0 && d <= 1;
  });

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Tracker</h1>
            <p className="text-gray-500 mt-1">{jobs.length} application{jobs.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            <Plus size={16} />Add Job
          </button>
        </div>

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
                <p className="text-xs text-blue-600 mt-0.5">{j.role} · {new Date(j.interview_date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          );
        })}

        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${filter === s ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              style={filter === s ? { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' } : {}}>
              {s === 'all' ? `All (${jobs.length})` : `${s} (${jobs.filter(j => j.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No applications yet</p>
            <p className="text-sm text-gray-400 mt-1">Start tracking your job applications</p>
            <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
              <Plus size={14} />Add your first application
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(j => {
              const d = daysUntil(j.interview_date);
              return (
                <div key={j.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                    {j.company[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{j.company}</p>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${statusStyle[j.status]}`}>{j.status}</span>
                      {d !== null && d >= 0 && d <= 7 && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                          <CalendarClock size={11} />
                          {d === 0 ? 'Interview today' : d === 1 ? 'Interview tomorrow' : `Interview in ${d}d`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{j.role}{j.location ? ` · ${j.location}` : ''}</p>
                    {j.notes && <p className="text-xs text-gray-400 mt-1 truncate">{j.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {j.url && (
                      <a href={j.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button onClick={() => openEdit(j)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(j.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editId ? 'Edit Application' : 'Add Application'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company *</label>
                  <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} required placeholder="Google" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                  <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required placeholder="Software Engineer" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp + ' bg-white capitalize'}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Applied Date</label>
                  <input type="date" value={form.applied_at} onChange={e => setForm({ ...form, applied_at: e.target.value })} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><CalendarClock size={14} />Interview Date <span className="text-gray-400 font-normal">(optional)</span></span>
                </label>
                <input type="date" value={form.interview_date} onChange={e => setForm({ ...form, interview_date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Remote / City" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job URL</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes..." className={inp + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
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
