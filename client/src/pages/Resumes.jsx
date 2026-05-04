import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Pencil, Trash2, Mail, MapPin, Share2, Check } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.get('/resumes').then(r => setResumes(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return;
    await api.delete(`/resumes/${id}`);
    setResumes(resumes.filter(r => r.id !== id));
  };

  const handleShare = (r) => {
    if (!r.public_slug) return;
    const url = `${window.location.origin}/cv/${r.public_slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(r.id);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-sm text-gray-500 mt-1">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} created</p>
          </div>
          <Link to="/resumes/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
            <Plus size={15} />New Resume
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No resumes yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first professional resume</p>
            <Link to="/resumes/new" className="inline-flex items-center gap-2 mt-5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
              <Plus size={14} />Create resume
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                    <FileText size={18} className="text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{r.personal_info?.full_name}</h3>
                  <div className="space-y-1 mb-4">
                    {r.personal_info?.email && (
                      <p className="text-xs flex items-center gap-1.5 text-gray-400">
                        <Mail size={11} />{r.personal_info.email}
                      </p>
                    )}
                    {r.personal_info?.location && (
                      <p className="text-xs flex items-center gap-1.5 text-gray-400">
                        <MapPin size={11} />{r.personal_info.location}
                      </p>
                    )}
                  </div>
                  {r.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {r.skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{s}</span>
                      ))}
                      {r.skills.length > 3 && <span className="text-xs text-gray-400">+{r.skills.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 pt-3 border-t border-gray-100">
                  <Link to={`/resumes/${r.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <Pencil size={13} />Edit
                  </Link>
                  <button onClick={() => handleShare(r)}
                    title="Copy shareable link"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-all ${copied === r.id ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {copied === r.id ? <><Check size={13} />Copied!</> : <><Share2 size={13} />Share</>}
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={13} />Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
