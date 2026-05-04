import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Save, Download, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal and polished' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'creative', label: 'Creative', desc: 'Bold and distinctive' },
];

function generateTemplate({ job_title, company, recipient, tone, user_name, user_email }) {
  const greeting = recipient ? `Dear ${recipient},` : 'Dear Hiring Manager,';
  const name = user_name || '[Your Name]';
  const email = user_email ? `\n${user_email}` : '';

  const openers = {
    professional: `I am writing to express my strong interest in the ${job_title || '[Position]'} position at ${company || '[Company]'}. With a track record of delivering results and a commitment to excellence, I am confident I would be a valuable addition to your team.`,
    friendly: `I was excited to come across the ${job_title || '[Position]'} opening at ${company || '[Company]'}! I've long admired your work and would love the chance to contribute my skills to your team.`,
    creative: `When I discovered the ${job_title || '[Position]'} opportunity at ${company || '[Company]'}, I knew immediately that I had to apply. My passion for innovation and proven ability to think outside the box align perfectly with what you're looking for.`,
  };

  const middles = {
    professional: `Throughout my career, I have consistently demonstrated the ability to [key achievement]. My experience in [relevant area] has equipped me with the technical and interpersonal skills needed to excel in this role. I am particularly drawn to ${company || 'your organization'} because of [company attribute — culture, mission, product].`,
    friendly: `I bring [X years] of hands-on experience in [field], and I genuinely love what I do. I've had the chance to [key achievement], which taught me a great deal about [relevant skill]. What really excites me about ${company || 'your team'} is [specific thing you admire].`,
    creative: `My background in [field] has given me a unique lens through which I approach problems — one that blends [skill A] with [skill B] in ways that drive measurable impact. A highlight of my career was [key achievement], which I'd love to build on at ${company || 'your organization'}.`,
  };

  const closings = {
    professional: `I would welcome the opportunity to discuss how my experience and skills align with your needs. Thank you for considering my application — I look forward to the possibility of contributing to ${company || 'your team'}.`,
    friendly: `I'd love to chat more about how I can bring value to the team. Thanks so much for your time — I'm genuinely excited about this opportunity!`,
    creative: `I would love the chance to show you what I can bring to the table. Thank you for taking the time to consider my application.`,
  };

  const t = tone || 'professional';

  return `${greeting}

${openers[t]}

${middles[t]}

${closings[t]}

Sincerely,
${name}${email}`;
}

export default function CoverLetterBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const printRef = useRef();

  const myUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [form, setForm] = useState({
    title: '',
    job_title: '',
    company: '',
    recipient: '',
    tone: 'professional',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: form.title || 'Cover Letter' });

  useEffect(() => {
    if (isEdit) {
      api.get(`/cover-letters/${id}`).then(r => setForm(r.data));
    }
  }, [id]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const content = generateTemplate({
        job_title: form.job_title,
        company: form.company,
        recipient: form.recipient,
        tone: form.tone,
        user_name: myUser.name,
        user_email: myUser.email,
      });
      setForm(f => ({ ...f, content }));
      setGenerating(false);
    }, 800);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Please enter a title for this cover letter'); return; }
    setSaving(true);
    setSaveError('');
    try {
      if (isEdit) await api.put(`/cover-letters/${id}`, form);
      else await api.post('/cover-letters', form);
      navigate('/cover-letters');
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/cover-letters')} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Cover Letter' : 'New Cover Letter'}</h1>
              <p className="text-gray-500 text-sm mt-0.5">Fill in the details, then generate or write your letter</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-60">
              {generating ? <><RefreshCw size={14} className="animate-spin" />Generating...</> : <><Sparkles size={14} />Generate with AI</>}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              <Download size={14} />Export PDF
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
              <Save size={14} />{saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {saveError}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Details</h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Document Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Cover Letter – Google SWE" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Job Title</label>
                  <input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                    placeholder="Software Engineer" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Company</label>
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Google" className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Recipient Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                  placeholder="Jane Smith / Hiring Manager" className={inp} />
              </div>
            </div>

            {/* Tone selector */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Tone</h2>
              <div className="grid grid-cols-3 gap-3">
                {TONES.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.tone === t.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-sm font-semibold ${form.tone === t.value ? 'text-indigo-700' : 'text-gray-800'}`}>{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Content editor */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Letter Content</h2>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50">
                  {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {generating ? 'Generating...' : 'Re-generate'}
                </button>
              </div>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={18}
                placeholder="Click 'Generate with AI' to create your letter, or write directly here..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none leading-relaxed font-mono"
              />
            </div>
          </div>

          {/* Right: Preview */}
          <div className="sticky top-6 self-start">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Preview</p>
                <span className="text-xs text-gray-400">{form.content.length} chars</span>
              </div>
              <div ref={printRef} className="p-8">
                {/* Print header */}
                <div className="mb-6 pb-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">{myUser.name || 'Your Name'}</h2>
                  <p className="text-sm text-gray-500">{myUser.email || ''}</p>
                </div>

                {(form.company || form.job_title) && (
                  <div className="mb-5">
                    {form.company && <p className="text-sm font-semibold text-gray-900">{form.company}</p>}
                    {form.job_title && <p className="text-sm text-gray-500">Re: {form.job_title} Position</p>}
                  </div>
                )}

                {form.content ? (
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{form.content}</div>
                ) : (
                  <div className="text-sm text-gray-300 italic text-center py-12">
                    Your letter preview will appear here
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
