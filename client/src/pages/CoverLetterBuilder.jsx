import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  Save, Download, Sparkles, ArrowLeft, RefreshCw, Copy, Check,
  ChevronDown, ChevronUp, User, Building2, Briefcase, Globe,
  FileText, Lightbulb, Star, Clock,
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const TONES = [
  { value: 'professional', label: 'Professional', emoji: '🎯', desc: 'Formal & polished' },
  { value: 'friendly',     label: 'Friendly',     emoji: '🤝', desc: 'Warm & approachable' },
  { value: 'creative',     label: 'Creative',     emoji: '✨', desc: 'Bold & distinctive' },
  { value: 'enthusiastic', label: 'Enthusiastic', emoji: '🔥', desc: 'Passionate & energetic' },
  { value: 'concise',      label: 'Concise',      emoji: '⚡', desc: 'Short & impactful' },
];

const LANGUAGES = [
  { value: 'en', label: 'English',  flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'ar', label: 'العربية',  flag: '🇲🇦' },
];

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-indigo-500" />
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-4">{children}</div>}
    </div>
  );
}

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all';
const ta  = `${inp} resize-none leading-relaxed`;

export default function CoverLetterBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const printRef = useRef();
  const myUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [form, setForm] = useState({
    title: '', job_title: '', company: '', recipient: '',
    tone: 'professional', content: '',
  });
  const [extra, setExtra] = useState({
    background: '', skills: '', why_this_job: '', years_experience: '', language: 'en',
  });
  const [saving, setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [copied, setCopied]         = useState(false);
  const [wordCount, setWordCount]   = useState(0);
  const [aiError, setAiError]       = useState('');

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEx = (k, v) => setExtra(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isEdit) api.get(`/cover-letters/${id}`).then(r => setForm(r.data));
  }, [id]);

  useEffect(() => {
    const words = form.content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [form.content]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: form.title || 'Cover Letter',
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setAiError('');
    try {
      const res = await api.post('/ai/cover-letter', {
        job_title: form.job_title,
        company: form.company,
        recipient: form.recipient,
        tone: form.tone,
        language: extra.language,
        background: extra.background,
        skills: extra.skills,
        why_this_job: extra.why_this_job,
        years_experience: extra.years_experience,
      });
      set('content', res.data.content);
      if (!form.title && form.job_title && form.company)
        set('title', `${form.job_title} — ${form.company}`);
    } catch (err) {
      setAiError(err.response?.data?.error || 'Generation failed. Please try again.');
      setTimeout(() => setAiError(''), 5000);
    } finally { setGenerating(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Please enter a title.'); return; }
    setSaving(true); setSaveError('');
    try {
      if (isEdit) await api.put(`/cover-letters/${id}`, form);
      else await api.post('/cover-letters', form);
      navigate('/cover-letters');
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(form.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout>
      <style>{`
        @media print {
          .print-letter { font-family: 'Georgia', serif !important; color: #111 !important; }
          .print-letter * { color: #111 !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/cover-letters')}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Cover Letter' : 'New Cover Letter'}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Fill in the details then generate with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              {generating
                ? <><RefreshCw size={14} className="animate-spin" />Generating...</>
                : <><Sparkles size={14} />Generate with AI</>}
            </button>
            <button onClick={handleCopy} disabled={!form.content}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40">
              {copied ? <><Check size={14} className="text-emerald-500" />Copied!</> : <><Copy size={14} />Copy</>}
            </button>
            <button onClick={handlePrint} disabled={!form.content}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40">
              <Download size={14} />Export PDF
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
              <Save size={14} />{saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {(saveError || aiError) && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {saveError || aiError}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-5">

          {/* Left: Form — 2 cols */}
          <div className="lg:col-span-2 space-y-4">

            {/* Basic info */}
            <Section title="Job Details" icon={Briefcase}>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Document Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Cover Letter – Google SWE" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Job Title</label>
                  <input value={form.job_title} onChange={e => set('job_title', e.target.value)}
                    placeholder="Software Engineer" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Company</label>
                  <input value={form.company} onChange={e => set('company', e.target.value)}
                    placeholder="Google" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Recipient</label>
                  <input value={form.recipient} onChange={e => set('recipient', e.target.value)}
                    placeholder="Hiring Manager" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Years of Experience</label>
                  <input type="number" min="0" max="50" value={extra.years_experience}
                    onChange={e => setEx('years_experience', e.target.value)}
                    placeholder="3" className={inp} />
                </div>
              </div>
            </Section>

            {/* About you */}
            <Section title="About You" icon={User} defaultOpen={false}>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Your Background</label>
                <textarea value={extra.background} onChange={e => setEx('background', e.target.value)}
                  rows={3} placeholder="Briefly describe your experience, education, and main achievements..."
                  className={ta} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Key Skills to Highlight</label>
                <input value={extra.skills} onChange={e => setEx('skills', e.target.value)}
                  placeholder="React, Node.js, leadership, project management..." className={inp} />
              </div>
            </Section>

            {/* Motivation */}
            <Section title="Your Motivation" icon={Lightbulb} defaultOpen={false}>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Why this company / role?</label>
                <textarea value={extra.why_this_job} onChange={e => setEx('why_this_job', e.target.value)}
                  rows={3} placeholder="What draws you to this specific company or role? What excites you about it?"
                  className={ta} />
              </div>
            </Section>

            {/* Tone */}
            <Section title="Tone & Style" icon={Star}>
              <div className="grid grid-cols-1 gap-2">
                {TONES.map(t => (
                  <button key={t.value} onClick={() => set('tone', t.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      form.tone === t.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <span className="text-xl">{t.emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${form.tone === t.value ? 'text-indigo-700' : 'text-gray-800'}`}>{t.label}</p>
                      <p className="text-xs text-gray-400">{t.desc}</p>
                    </div>
                    {form.tone === t.value && <Check size={14} className="text-indigo-600 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </Section>

            {/* Language */}
            <Section title="Language" icon={Globe} defaultOpen={false}>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map(l => (
                  <button key={l.value} onClick={() => setEx('language', l.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      extra.language === l.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <span className="text-2xl">{l.flag}</span>
                    <span className={`text-xs font-medium ${extra.language === l.value ? 'text-indigo-700' : 'text-gray-600'}`}>{l.label}</span>
                  </button>
                ))}
              </div>
            </Section>

          </div>

          {/* Right: Editor + Preview — 3 cols */}
          <div className="lg:col-span-3 space-y-4">

            {/* Editor */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Letter Content</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} />{wordCount} words
                  </span>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                    {generating ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    Re-generate
                  </button>
                </div>
              </div>
              <div className="p-4">
                {!form.content && !generating && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
                      <Sparkles size={22} className="text-white" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">Ready to generate</p>
                    <p className="text-xs text-gray-400 mb-4">Fill in job details then click Generate with AI</p>
                    <button onClick={handleGenerate}
                      className="px-5 py-2 text-white text-sm font-semibold rounded-xl"
                      style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                      <Sparkles size={13} className="inline mr-1.5" />Generate Now
                    </button>
                  </div>
                )}
                {generating && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"
                      style={{ borderWidth: '3px' }} />
                    <p className="text-sm text-gray-500">Crafting your letter...</p>
                  </div>
                )}
                {form.content && !generating && (
                  <textarea
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    rows={22}
                    className="w-full text-sm text-gray-800 leading-relaxed outline-none resize-none bg-transparent"
                  />
                )}
              </div>
            </div>

            {/* Preview (printable) */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Print Preview</span>
                <button onClick={handlePrint} disabled={!form.content}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40">
                  <Download size={12} />Export PDF
                </button>
              </div>
              <div ref={printRef} className="print-letter p-10 bg-white min-h-[400px]"
                style={{ fontFamily: 'Georgia, serif' }}>
                {/* Letter Header */}
                <div className="mb-8 pb-6" style={{ borderBottom: '2px solid #6C5CE7' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>{myUser.name || 'Your Name'}</h2>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                    {myUser.email && <span>{myUser.email}</span>}
                    {myUser.location && <span> · {myUser.location}</span>}
                  </div>
                </div>

                {/* Date + Company */}
                <div style={{ marginBottom: '24px', fontSize: '13px', color: '#444' }}>
                  <p style={{ margin: '0 0 12px 0' }}>{today}</p>
                  {form.recipient && <p style={{ margin: '0 0 2px 0', fontWeight: '600' }}>{form.recipient}</p>}
                  {form.company && <p style={{ margin: 0 }}>{form.company}</p>}
                </div>

                {/* Subject line */}
                {form.job_title && (
                  <p style={{ marginBottom: '20px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>
                    Re: Application for {form.job_title} Position
                  </p>
                )}

                {/* Body */}
                {form.content ? (
                  <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#222', whiteSpace: 'pre-wrap' }}>
                    {form.content}
                  </div>
                ) : (
                  <p style={{ color: '#bbb', fontStyle: 'italic', textAlign: 'center', paddingTop: '48px', fontSize: '13px' }}>
                    Generate your letter to see the preview
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
