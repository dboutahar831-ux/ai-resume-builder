import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Plus, Pencil, Trash2, Mail, MapPin, Share2,
  Check, Sparkles, X, ChevronRight, Lightbulb, Target,
  Zap, Copy, Download, Briefcase, GraduationCap,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import api from '../api/axios';

// ─── Quick PDF from list ──────────────────────────────────────────────────────
function printResume(r) {
  const p = r.personal_info || {};
  const esc = t => (t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const expHTML = (r.experience || []).map(e => `
    <div class="item">
      <div class="row"><span class="bold">${esc(e.role)}</span><span class="date">${esc(e.start_date)}${e.end_date?' – '+esc(e.end_date):''}</span></div>
      <div class="accent">${esc(e.company)}</div>
      ${e.description?`<div class="desc">${esc(e.description)}</div>`:''}
    </div>`).join('');

  const eduHTML = (r.education || []).map(e => `
    <div class="item">
      <div class="row"><span class="bold">${esc(e.degree)}${e.field?' in '+esc(e.field):''}</span><span class="date">${esc(e.start_date)}${e.end_date?' – '+esc(e.end_date):''}</span></div>
      <div class="accent">${esc(e.institution)}</div>
    </div>`).join('');

  const win = window.open('', '_blank');
  if (!win) { /* will be handled by caller */ return; }
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${esc(p.full_name)||'Resume'}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:44px 56px;font-size:11px;line-height:1.5}
      @page{margin:.5in}
      header{padding-bottom:12px;margin-bottom:20px;border-bottom:2.5px solid #6C5CE7}
      h1{font-size:26px;font-weight:700;letter-spacing:-.3px}
      .contact{display:flex;flex-wrap:wrap;gap:14px;margin-top:6px;font-size:10px;color:#555}
      .section{margin-bottom:16px}
      h2{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#6C5CE7;padding-bottom:4px;margin-bottom:10px;border-bottom:1px solid #e5e7eb}
      .summary{font-size:11px;color:#333;line-height:1.75}
      .item{margin-bottom:13px}
      .row{display:flex;justify-content:space-between;align-items:baseline}
      .bold{font-size:12px;font-weight:700}
      .date{font-size:10px;color:#777}
      .accent{font-size:11px;color:#6C5CE7;font-weight:600;margin-top:2px}
      .desc{font-size:10.5px;color:#444;margin-top:6px;line-height:1.75;white-space:pre-wrap}
      .skills{font-size:11px;color:#333;line-height:1.9}
    </style>
  </head><body>
    <header>
      <h1>${esc(p.full_name)}</h1>
      <div class="contact">
        ${p.email?`<span>${esc(p.email)}</span>`:''}
        ${p.phone?`<span>${esc(p.phone)}</span>`:''}
        ${p.location?`<span>${esc(p.location)}</span>`:''}
        ${p.linkedin?`<span>${esc(p.linkedin)}</span>`:''}
        ${p.website?`<span>${esc(p.website)}</span>`:''}
      </div>
    </header>
    ${p.summary?`<div class="section"><h2>Summary</h2><p class="summary">${esc(p.summary)}</p></div>`:''}
    ${(r.experience||[]).length?`<div class="section"><h2>Experience</h2>${expHTML}</div>`:''}
    ${(r.education||[]).length?`<div class="section"><h2>Education</h2>${eduHTML}</div>`:''}
    ${(r.skills||[]).length?`<div class="section"><h2>Skills</h2><p class="skills">${(r.skills||[]).map(esc).join(' · ')}</p></div>`:''}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

const AI_TIPS = [
  { icon: Target,   title: 'Tailor for each job',    body: 'Customize keywords to match the job description — ATS systems scan for exact matches.',            color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { icon: Zap,      title: 'Quantify achievements',  body: 'Replace vague duties with numbers: "Increased sales by 32%" beats "Responsible for sales".',       color: 'text-amber-500',  bg: 'bg-amber-50' },
  { icon: Lightbulb,title: 'Keep it one page',       body: 'Unless you have 10+ years of experience, a single-page resume performs better with recruiters.',   color: 'text-emerald-500',bg: 'bg-emerald-50' },
  { icon: FileText, title: 'Use action verbs',       body: 'Start each bullet with strong verbs: Led, Built, Launched, Optimized, Delivered, Architected.',    color: 'text-purple-500', bg: 'bg-purple-50' },
];

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [aiMode, setAiMode] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    api.get('/resumes').then(r => setResumes(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return;
    await api.delete(`/resumes/${id}`);
    setResumes(prev => prev.filter(r => r.id !== id));
  };

  const handleShare = (r) => {
    if (!r.public_slug) return;
    const url = `${window.location.origin}/cv/${r.public_slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(r.id);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const handleDuplicate = async (id) => {
    setDuplicating(id);
    try {
      const res = await api.post(`/resumes/${id}/duplicate`);
      setResumes(prev => [res.data, ...prev]);
    } catch { addToast('Failed to duplicate.', 'error'); }
    finally { setDuplicating(null); }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} created</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAiMode(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                aiMode
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
              }`}
              style={aiMode ? { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' } : {}}>
              <Sparkles size={14} />
              AI Tips
              <span className={`w-7 h-4 rounded-full transition-all relative flex-shrink-0 ${aiMode ? 'bg-white/30' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${aiMode ? 'left-3.5 bg-white' : 'left-0.5 bg-white'}`} />
              </span>
            </button>
            <Link to="/resumes/new"
              className="inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              <Plus size={14} />New Resume
            </Link>
          </div>
        </div>

        {/* AI Tips Panel */}
        {aiMode && (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5"
            style={{ animation: 'fadeIn .2s ease' }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900 flex items-center gap-2"><Sparkles size={15} className="text-indigo-500" />Resume Tips</p>
                <p className="text-xs text-gray-500 mt-0.5">Advice to help your resume stand out</p>
              </div>
              <button onClick={() => setAiMode(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60"><X size={14} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {AI_TIPS.map((tip, i) => (
                <div key={i} className="bg-white rounded-xl p-3.5 border border-white/80 shadow-sm flex gap-3">
                  <div className={`w-8 h-8 rounded-lg ${tip.bg} flex items-center justify-center flex-shrink-0`}>
                    <tip.icon size={14} className={tip.color} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{tip.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/resumes/new"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              <Sparkles size={13} />Create AI Resume<ChevronRight size={13} />
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
              <Sparkles size={26} className="text-white" />
            </div>
            <p className="font-semibold text-gray-700 text-lg">No resumes yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Build a professional, AI-powered resume in minutes</p>
            <Link to="/resumes/new"
              className="inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              <Plus size={14} />Create your first resume
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map(r => {
              const p = r.personal_info || {};
              const expCount = (r.experience || []).length;
              const eduCount = (r.education || []).length;
              const skillCount = (r.skills || []).length;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all flex flex-col overflow-hidden">
                  {/* Gradient accent bar */}
                  <div className="h-1" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                      <FileText size={18} className="text-indigo-600" />
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-gray-900 text-base mb-1">{p.full_name}</h3>

                    {/* Contact */}
                    <div className="space-y-1 mb-3">
                      {p.email    && <p className="text-xs flex items-center gap-1.5 text-gray-400"><Mail size={10} />{p.email}</p>}
                      {p.location && <p className="text-xs flex items-center gap-1.5 text-gray-400"><MapPin size={10} />{p.location}</p>}
                    </div>

                    {/* Skills preview */}
                    {skillCount > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(r.skills || []).slice(0, 3).map((s, i) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{s}</span>
                        ))}
                        {skillCount > 3 && <span className="text-xs text-gray-400">+{skillCount - 3}</span>}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-300 mt-auto pb-3">
                      {expCount > 0 && <span className="flex items-center gap-1"><Briefcase size={10} />{expCount} position{expCount > 1 ? 's' : ''}</span>}
                      {eduCount > 0 && <span className="flex items-center gap-1"><GraduationCap size={10} />{eduCount} degree{eduCount > 1 ? 's' : ''}</span>}
                      {r.updated_at && <span className="ml-auto">{timeAgo(r.updated_at)}</span>}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 grid grid-cols-5 gap-1">
                      <Link to={`/resumes/${r.id}/edit`}
                        className="flex items-center justify-center gap-1 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all col-span-2">
                        <Pencil size={12} />Edit
                      </Link>
                      <button onClick={() => handleDuplicate(r.id)} disabled={duplicating === r.id}
                        className="flex items-center justify-center py-2 text-xs font-semibold text-gray-400 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-40">
                        {duplicating === r.id ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Copy size={12} />}
                      </button>
                      <button onClick={() => { if (!window.open('', '_blank')) { addToast('Please allow popups to export PDF.', 'warning'); return; } printResume(r); }}
                        className="flex items-center justify-center py-2 text-xs font-semibold text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                        <Download size={12} />
                      </button>
                      <button onClick={() => handleDelete(r.id)}
                        className="flex items-center justify-center py-2 text-xs font-semibold text-red-400 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={12} />
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
