import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSignature, Plus, Pencil, Trash2, Building2,
  Briefcase, Copy, Download, Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import api from '../api/axios';

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const TONE_META = {
  professional: { label: 'Professional', emoji: '🎯', cls: 'bg-indigo-50 text-indigo-700' },
  friendly:     { label: 'Friendly',     emoji: '🤝', cls: 'bg-emerald-50 text-emerald-700' },
  creative:     { label: 'Creative',     emoji: '✨', cls: 'bg-violet-50 text-violet-700' },
  enthusiastic: { label: 'Enthusiastic', emoji: '🔥', cls: 'bg-orange-50 text-orange-600' },
  concise:      { label: 'Concise',      emoji: '⚡', cls: 'bg-sky-50 text-sky-700' },
};

function printLetter(letter) {
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `<!DOCTYPE html><html><head>
    <title>${letter.title || 'Cover Letter'}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Georgia,serif;color:#111;padding:60px;line-height:1.6}
      @page{margin:.75in}
      .hdr{border-bottom:2px solid #6C5CE7;padding-bottom:14px;margin-bottom:26px}
      .name{font-size:20px;font-weight:bold}
      .meta{font-size:12px;color:#666;margin-top:4px}
      .date{margin-bottom:14px;font-size:13px;color:#444}
      .recip{font-size:13px;color:#444;margin-bottom:18px}
      .subj{font-size:13px;font-weight:600;margin-bottom:18px}
      .body{font-size:13px;line-height:1.9;white-space:pre-wrap}
    </style>
  </head><body>
    <div class="hdr">
      <div class="name">${myUser.name || 'Your Name'}</div>
      <div class="meta">${myUser.email || ''}</div>
    </div>
    <div class="date">${today}</div>
    ${letter.recipient || letter.company ? `<div class="recip">${letter.recipient ? `<strong>${letter.recipient}</strong><br>` : ''}${letter.company || ''}</div>` : ''}
    ${letter.job_title ? `<div class="subj">Re: Application for ${letter.job_title} Position</div>` : ''}
    <div class="body">${(letter.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) { /* will be handled by caller */ return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

export default function CoverLetters() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duplicating, setDuplicating] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    api.get('/cover-letters')
      .then(r => setLetters(Array.isArray(r.data) ? r.data : []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load cover letters.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this cover letter?')) return;
    await api.delete(`/cover-letters/${id}`);
    setLetters(prev => prev.filter(l => l.id !== id));
  };

  const handleDuplicate = async (id) => {
    setDuplicating(id);
    try {
      const res = await api.post(`/cover-letters/${id}/duplicate`);
      setLetters(prev => [res.data, ...prev]);
    } catch {
      addToast('Failed to duplicate.', 'error');
    } finally { setDuplicating(null); }
  };

  const wordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cover Letters</h1>
            <p className="text-sm text-gray-500 mt-1">{letters.length} letter{letters.length !== 1 ? 's' : ''} created</p>
          </div>
          <Link to="/cover-letters/new"
            className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            <Plus size={15} />New Cover Letter
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : letters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
              <Sparkles size={26} className="text-white" />
            </div>
            <p className="font-semibold text-gray-700 text-lg">No cover letters yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Write compelling, AI-powered cover letters for your applications</p>
            <Link to="/cover-letters/new"
              className="inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              <Plus size={14} />Write your first letter
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {letters.map(l => {
              const tone = TONE_META[l.tone] || TONE_META.professional;
              const wc = wordCount(l.content);
              return (
                <div key={l.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all flex flex-col overflow-hidden">
                  {/* Gradient accent bar */}
                  <div className="h-1" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <FileSignature size={18} className="text-indigo-600" />
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tone.cls}`}>
                        {tone.emoji} {tone.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-sm mb-2 leading-snug">{l.title}</h3>

                    {/* Company / Role */}
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

                    {/* Preview snippet */}
                    {l.content && (
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-3">{l.content}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <span className="text-xs text-gray-300">{timeAgo(l.updated_at || l.created_at)}</span>
                      {wc > 0 && (
                        <span className="text-xs text-gray-300 border-l border-gray-100 pl-3">{wc} words</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-1">
                      <Link to={`/cover-letters/${l.id}/edit`}
                        className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Pencil size={12} />Edit
                      </Link>
                      <button onClick={() => handleDuplicate(l.id)} disabled={duplicating === l.id}
                        className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50">
                        <Copy size={12} />{duplicating === l.id ? '…' : 'Copy'}
                      </button>
                      <button onClick={() => { if (!window.open('', '_blank')) { addToast('Please allow popups to export PDF.', 'warning'); return; } printLetter(l); }} disabled={!l.content}
                        className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-40">
                        <Download size={12} />PDF
                      </button>
                      <button onClick={() => handleDelete(l.id)}
                        className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-red-400 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={12} />Del
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
