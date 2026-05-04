import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSignature, Plus, Pencil, Trash2, Building2, Briefcase } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const toneLabel = { professional: 'Professional', friendly: 'Friendly', creative: 'Creative' };
const toneCls = {
  professional: 'bg-indigo-50 text-indigo-700',
  friendly: 'bg-emerald-50 text-emerald-700',
  creative: 'bg-violet-50 text-violet-700',
};

export default function CoverLetters() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/cover-letters')
      .then(r => setLetters(Array.isArray(r.data) ? r.data : []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load cover letters.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this cover letter?')) return;
    await api.delete(`/cover-letters/${id}`);
    setLetters(letters.filter(l => l.id !== id));
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cover Letters</h1>
            <p className="text-sm text-gray-500 mt-1">{letters.length} letter{letters.length !== 1 ? 's' : ''} created</p>
          </div>
          <Link to="/cover-letters/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
            <Plus size={15} />New Cover Letter
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : letters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <FileSignature size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No cover letters yet</p>
            <p className="text-sm text-gray-400 mt-1">Write compelling cover letters for your applications</p>
            <Link to="/cover-letters/new" className="inline-flex items-center gap-2 mt-5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
              <Plus size={14} />Write your first letter
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {letters.map(l => (
              <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FileSignature size={18} className="text-indigo-600" />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${toneCls[l.tone] || toneCls.professional}`}>
                      {toneLabel[l.tone] || 'Professional'}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug">{l.title}</h3>
                  <div className="space-y-1 mb-3">
                    {l.company && (
                      <p className="text-xs flex items-center gap-1.5 text-gray-400">
                        <Building2 size={11} />{l.company}
                      </p>
                    )}
                    {l.job_title && (
                      <p className="text-xs flex items-center gap-1.5 text-gray-400">
                        <Briefcase size={11} />{l.job_title}
                      </p>
                    )}
                  </div>
                  {l.content && (
                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{l.content}</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-300 mb-3">{timeAgo(l.updated_at || l.created_at)}</p>
                  <div className="flex gap-1">
                    <Link to={`/cover-letters/${l.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <Pencil size={13} />Edit
                    </Link>
                    <button onClick={() => handleDelete(l.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={13} />Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
