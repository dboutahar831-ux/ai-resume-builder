import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Download, Save,
  Sparkles, X, Loader2, TrendingUp, User, Briefcase, GraduationCap,
  Wrench, Check, Globe, Phone, Mail, MapPin, ArrowLeft,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import { generateResumeContent } from '../utils/resumeGenerator';

// ─── PDF print ───────────────────────────────────────────────────────────────
function printResume(form) {
  const p = form.personal_info;
  const esc = t => (t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const expHTML = (form.experience || []).map(e => `
    <div class="item">
      <div class="row"><span class="bold">${esc(e.role)}</span><span class="date">${esc(e.start_date)}${e.end_date ? ' – '+esc(e.end_date) : ''}</span></div>
      <div class="accent">${esc(e.company)}</div>
      ${e.description ? `<div class="desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');

  const eduHTML = (form.education || []).map(e => `
    <div class="item">
      <div class="row"><span class="bold">${esc(e.degree)}${e.field ? ' in '+esc(e.field) : ''}</span><span class="date">${esc(e.start_date)}${e.end_date ? ' – '+esc(e.end_date) : ''}</span></div>
      <div class="accent">${esc(e.institution)}</div>
    </div>`).join('');

  const win = window.open('', '_blank');
  if (!win) { /* will be handled by caller */ return; }

  win.document.write(`<!DOCTYPE html><html><head>
    <title>${esc(p.full_name) || 'Resume'}</title>
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
        ${p.email    ? `<span>${esc(p.email)}</span>` : ''}
        ${p.phone    ? `<span>${esc(p.phone)}</span>` : ''}
        ${p.location ? `<span>${esc(p.location)}</span>` : ''}
        ${p.linkedin ? `<span>${esc(p.linkedin)}</span>` : ''}
        ${p.website  ? `<span>${esc(p.website)}</span>` : ''}
      </div>
    </header>
    ${p.summary ? `<div class="section"><h2>Summary</h2><p class="summary">${esc(p.summary)}</p></div>` : ''}
    ${(form.experience||[]).length ? `<div class="section"><h2>Experience</h2>${expHTML}</div>` : ''}
    ${(form.education||[]).length  ? `<div class="section"><h2>Education</h2>${eduHTML}</div>` : ''}
    ${(form.skills||[]).length     ? `<div class="section"><h2>Skills</h2><p class="skills">${(form.skills||[]).map(esc).join(' · ')}</p></div>` : ''}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ─── Strength score ───────────────────────────────────────────────────────────
function computeStrength(form) {
  const p = form.personal_info;
  let score = 0; const missing = [];
  if (p.full_name)                        score += 10; else missing.push('Add your full name');
  if (p.email)                            score += 10; else missing.push('Add an email address');
  if (p.phone)                            score += 5;  else missing.push('Add a phone number');
  if (p.location)                         score += 5;  else missing.push('Add your location');
  if (p.linkedin)                         score += 5;  else missing.push('Add your LinkedIn URL');
  if (p.summary && p.summary.length > 50) score += 15; else missing.push('Write a summary (50+ chars)');
  if ((form.experience||[]).length >= 1)  score += 15; else missing.push('Add work experience');
  if ((form.experience||[]).length >= 2)  score += 5;
  if ((form.experience||[]).length >= 3)  score += 5;
  if ((form.education||[]).length >= 1)   score += 15; else missing.push('Add your education');
  if ((form.skills||[]).length >= 1)      score += 5;  else missing.push('Add at least one skill');
  if ((form.skills||[]).length >= 5)      score += 3;
  if ((form.skills||[]).length >= 10)     score += 2;
  return { score: Math.min(score, 100), missing };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Experience', icon: Briefcase },
  { label: 'Education', icon: GraduationCap },
  { label: 'Skills', icon: Wrench },
];

const emptyForm = {
  personal_info: { full_name: '', email: '', phone: '', location: '', linkedin: '', website: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
};

const emptyAiForm = { job_title: '', years_experience: '', field: '', existing_skills: '' };

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all';

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const addToast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [aiOpen, setAiOpen] = useState(false);
  const [aiForm, setAiForm] = useState(emptyAiForm);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/resumes/${id}`)
        .then(res => {
          const d = res.data;
          setForm({
            personal_info: d.personal_info || emptyForm.personal_info,
            experience: d.experience || [],
            education: d.education || [],
            skills: d.skills || [],
          });
        })
        .catch(() => setSaveError('Failed to load resume. Please go back and try again.'));
    }
  }, [id]);

  // Personal info helpers
  const setP = (field, val) => setForm(f => ({ ...f, personal_info: { ...f.personal_info, [field]: val } }));

  // Experience helpers
  const addExp = () => setForm(f => ({ ...f, experience: [...f.experience, { company: '', role: '', start_date: '', end_date: '', description: '' }] }));
  const setExp = (i, field, val) => setForm(f => { const e = [...f.experience]; e[i] = { ...e[i], [field]: val }; return { ...f, experience: e }; });
  const removeExp = i => setForm(f => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }));

  // Education helpers
  const addEdu = () => setForm(f => ({ ...f, education: [...f.education, { institution: '', degree: '', field: '', start_date: '', end_date: '' }] }));
  const setEdu = (i, field, val) => setForm(f => { const e = [...f.education]; e[i] = { ...e[i], [field]: val }; return { ...f, education: e }; });
  const removeEdu = i => setForm(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));

  // Skills helpers
  const addSkill = () => {
    if (!skillInput.trim()) return;
    setForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
    setSkillInput('');
  };
  const removeSkill = i => setForm(f => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.personal_info.full_name) return addToast('Full name is required', 'warning');
    setSaving(true); setSaveError('');
    try {
      if (isEdit) await api.put(`/resumes/${id}`, form);
      else await api.post('/resumes', form);
      navigate('/resumes');
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const handleAiGenerate = async () => {
    if (!aiForm.job_title || !aiForm.years_experience || !aiForm.field) {
      setAiError('Job title, years of experience, and field are required.');
      return;
    }
    setAiError(''); setAiLoading(true);
    try {
      const existing_skills = aiForm.existing_skills.trim()
        ? aiForm.existing_skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      let data;
      try {
        const res = await api.post('/ai/generate-resume', {
          job_title: aiForm.job_title,
          years_experience: Number(aiForm.years_experience),
          field: aiForm.field,
          existing_skills,
        });
        data = res.data;
      } catch {
        // Fallback to local generator if API fails
        data = generateResumeContent({
          job_title: aiForm.job_title,
          years_experience: aiForm.years_experience,
          field: aiForm.field,
          existing_skills,
        });
      }
      setForm(f => ({
        ...f,
        personal_info: { ...f.personal_info, summary: data.summary },
        skills: data.skills,
        experience: f.experience.length > 0
          ? f.experience.map((exp, i) => i === 0 ? { ...exp, description: data.experience_description } : exp)
          : [{ company: '', role: aiForm.job_title, start_date: '', end_date: 'Present', description: data.experience_description }],
      }));
      setAiOpen(false);
      setAiForm(emptyAiForm);
    } catch (err) {
      setAiError('Generation failed. Please try again.');
    } finally { setAiLoading(false); }
  };

  const { score, missing } = computeStrength(form);
  const strengthLabel = score >= 85 ? 'Excellent' : score >= 60 ? 'Strong' : score >= 35 ? 'Good' : 'Needs work';
  const strengthColor = score >= 85 ? '#10b981' : score >= 60 ? '#6C5CE7' : score >= 35 ? '#f59e0b' : '#ef4444';

  // Step completion indicators
  const stepDone = [
    Boolean(form.personal_info.full_name && form.personal_info.email),
    form.experience.length > 0,
    form.education.length > 0,
    form.skills.length >= 3,
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/resumes')}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Resume' : 'New Resume'}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setAiOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              <Sparkles size={14} />Generate with AI
            </button>
            <button onClick={() => { if (!window.open('', '_blank')) { addToast('Please allow popups to export PDF.', 'warning'); return; } printResume(form); }}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              <Download size={14} />Export PDF
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
              <Save size={14} />{saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{saveError}</div>
        )}

        {/* Step tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
          {STEPS.map((s, i) => (
            <button key={s.label} onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${step === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {stepDone[i] && i !== step
                ? <Check size={13} className="text-emerald-500" />
                : <s.icon size={13} className={step === i ? 'text-indigo-500' : 'text-gray-400'} />}
              {s.label}
            </button>
          ))}
        </div>

        {/* Resume Strength */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex items-center gap-4">
          <TrendingUp size={18} style={{ color: strengthColor }} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-gray-800">Resume Strength</p>
              <span className="text-sm font-bold" style={{ color: strengthColor }}>{score}% — {strengthLabel}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${score}%`, background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />
            </div>
            {missing.length > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">Next: {missing[0]}</p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ─── Form Panel ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">

            {/* Step 0: Personal Info */}
            {step === 0 && (
              <>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />Personal Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name *</label>
                    <input className={inp} placeholder="John Doe" value={form.personal_info.full_name}
                      onChange={e => setP('full_name', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><Mail size={10} className="inline mr-1" />Email</label>
                      <input className={inp} placeholder="john@email.com" value={form.personal_info.email}
                        onChange={e => setP('email', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><Phone size={10} className="inline mr-1" />Phone</label>
                      <input className={inp} placeholder="+1 234 567 890" value={form.personal_info.phone}
                        onChange={e => setP('phone', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><MapPin size={10} className="inline mr-1" />Location</label>
                      <input className={inp} placeholder="New York, USA" value={form.personal_info.location}
                        onChange={e => setP('location', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><Globe size={10} className="inline mr-1" />LinkedIn</label>
                      <input className={inp} placeholder="linkedin.com/in/john" value={form.personal_info.linkedin}
                        onChange={e => setP('linkedin', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><Globe size={10} className="inline mr-1" />Portfolio / Website</label>
                    <input className={inp} placeholder="github.com/john or john.dev" value={form.personal_info.website || ''}
                      onChange={e => setP('website', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Professional Summary</label>
                    <textarea className={`${inp} resize-none`} rows={4}
                      placeholder="Results-driven professional with X years of experience in... Include your top strengths and value proposition."
                      value={form.personal_info.summary} onChange={e => setP('summary', e.target.value)} />
                    <p className="text-xs text-gray-300 mt-1">{form.personal_info.summary.length} chars — aim for 150–300</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Experience */}
            {step === 1 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase size={16} className="text-indigo-500" />Work Experience
                  </h2>
                  <button onClick={addExp}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 bg-indigo-50 rounded-xl transition-all">
                    <Plus size={14} />Add Position
                  </button>
                </div>
                {form.experience.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    <Briefcase size={28} className="mx-auto mb-2 text-gray-200" />
                    Click "Add Position" to add your work history
                  </div>
                )}
                {form.experience.map((exp, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Position #{i + 1}</span>
                      <button onClick={() => removeExp(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Company</label>
                        <input className={inp} placeholder="Google, Inc." value={exp.company} onChange={e => setExp(i, 'company', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Job Title</label>
                        <input className={inp} placeholder="Software Engineer" value={exp.role} onChange={e => setExp(i, 'role', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
                        <input className={inp} placeholder="Jan 2022" value={exp.start_date} onChange={e => setExp(i, 'start_date', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
                        <input className={inp} placeholder="Present" value={exp.end_date} onChange={e => setExp(i, 'end_date', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Achievements & Responsibilities</label>
                        <textarea className={`${inp} resize-none`} rows={4}
                          placeholder="• Led a team of 5 engineers to deliver X feature, improving Y by 30%&#10;• Built and optimized Z, reducing latency by 40%&#10;• Mentored 2 junior devs..."
                          value={exp.description} onChange={e => setExp(i, 'description', e.target.value)} />
                        <p className="text-xs text-gray-300 mt-1">Use bullet points (•) — start each with a strong action verb</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Step 2: Education */}
            {step === 2 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <GraduationCap size={16} className="text-indigo-500" />Education
                  </h2>
                  <button onClick={addEdu}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 bg-indigo-50 rounded-xl transition-all">
                    <Plus size={14} />Add Degree
                  </button>
                </div>
                {form.education.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    <GraduationCap size={28} className="mx-auto mb-2 text-gray-200" />
                    Click "Add Degree" to add your education
                  </div>
                )}
                {form.education.map((edu, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Degree #{i + 1}</span>
                      <button onClick={() => removeEdu(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Institution</label>
                        <input className={inp} placeholder="Massachusetts Institute of Technology" value={edu.institution} onChange={e => setEdu(i, 'institution', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Degree</label>
                        <input className={inp} placeholder="Bachelor's / Master's / PhD" value={edu.degree} onChange={e => setEdu(i, 'degree', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Field of Study</label>
                        <input className={inp} placeholder="Computer Science" value={edu.field} onChange={e => setEdu(i, 'field', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Year</label>
                        <input className={inp} placeholder="2018" value={edu.start_date} onChange={e => setEdu(i, 'start_date', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">End Year</label>
                        <input className={inp} placeholder="2022" value={edu.end_date} onChange={e => setEdu(i, 'end_date', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Step 3: Skills */}
            {step === 3 && (
              <>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Wrench size={16} className="text-indigo-500" />Skills
                </h2>
                <div className="flex gap-2">
                  <input className={`${inp} flex-1`} placeholder="e.g. JavaScript, Project Management, Figma…"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <button onClick={addSkill}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-400">Press Enter or click Add. Include both technical and soft skills.</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.skills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white"
                      style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)' }}>
                      {s}
                      <button onClick={() => removeSkill(i)} className="opacity-70 hover:opacity-100">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {form.skills.length === 0 && (
                    <p className="text-sm text-gray-400">No skills added yet — try the AI generator!</p>
                  )}
                </div>
              </>
            )}

            {/* Step navigation */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-all">
                <ChevronLeft size={16} />Previous
              </button>
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
                  Next<ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                  <Save size={15} />{saving ? 'Saving…' : 'Save Resume'}
                </button>
              )}
            </div>
          </div>

          {/* ─── Live Preview ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</p>
              <button onClick={() => { if (!window.open('', '_blank')) { addToast('Please allow popups to export PDF.', 'warning'); return; } printResume(form); }}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                <Download size={12} />Export PDF
              </button>
            </div>

            <div className="p-8 overflow-auto flex-1" style={{ fontFamily: 'Georgia, serif', fontSize: '12px' }}>
              {form.personal_info.full_name ? (
                <>
                  {/* Header */}
                  <div className="pb-3 mb-5" style={{ borderBottom: '2.5px solid #6C5CE7' }}>
                    <h1 className="text-2xl font-bold text-gray-900">{form.personal_info.full_name}</h1>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {form.personal_info.email    && <span className="flex items-center gap-1"><Mail size={10} />{form.personal_info.email}</span>}
                      {form.personal_info.phone    && <span className="flex items-center gap-1"><Phone size={10} />{form.personal_info.phone}</span>}
                      {form.personal_info.location && <span className="flex items-center gap-1"><MapPin size={10} />{form.personal_info.location}</span>}
                      {form.personal_info.linkedin && <span className="flex items-center gap-1"><Globe size={10} />{form.personal_info.linkedin}</span>}
                      {form.personal_info.website  && <span className="flex items-center gap-1"><Globe size={10} />{form.personal_info.website}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {form.personal_info.summary && (
                    <div className="mb-4">
                      <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6C5CE7', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>Summary</h2>
                      <p className="text-xs text-gray-600 leading-relaxed">{form.personal_info.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {form.experience.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6C5CE7', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>Experience</h2>
                      {form.experience.map((e, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between items-baseline">
                            <p className="font-bold text-gray-900 text-sm">{e.role}</p>
                            <p className="text-xs text-gray-400">{e.start_date}{e.end_date ? ` – ${e.end_date}` : ''}</p>
                          </div>
                          <p className="text-xs font-semibold mt-0.5" style={{ color: '#6C5CE7' }}>{e.company}</p>
                          {e.description && <div className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">{e.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {form.education.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6C5CE7', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>Education</h2>
                      {form.education.map((e, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <p className="font-bold text-gray-900 text-sm">{e.degree}{e.field ? ` in ${e.field}` : ''}</p>
                            <p className="text-xs text-gray-400">{e.start_date}{e.end_date ? ` – ${e.end_date}` : ''}</p>
                          </div>
                          <p className="text-xs font-semibold mt-0.5" style={{ color: '#6C5CE7' }}>{e.institution}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {form.skills.length > 0 && (
                    <div>
                      <h2 className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6C5CE7', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>Skills</h2>
                      <p className="text-xs text-gray-600 leading-relaxed">{form.skills.join(' · ')}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Start filling the form to see your resume preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI Modal ─────────────────────────────────────────────────────── */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !aiLoading && setAiOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7)' }}>
                    <Sparkles size={15} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">AI Resume Generator</h2>
                </div>
                <p className="text-xs text-gray-400">Powered by Groq · Fills summary, skills & experience bullets</p>
              </div>
              <button onClick={() => !aiLoading && setAiOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Job Title *</label>
                <input className={inp} placeholder="e.g. Senior Software Engineer"
                  value={aiForm.job_title} onChange={e => setAiForm(f => ({ ...f, job_title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Years of Experience *</label>
                  <input className={inp} type="number" min="0" max="40" placeholder="5"
                    value={aiForm.years_experience} onChange={e => setAiForm(f => ({ ...f, years_experience: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Field / Industry *</label>
                  <input className={inp} placeholder="Software, Finance, Marketing…"
                    value={aiForm.field} onChange={e => setAiForm(f => ({ ...f, field: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Your Skills <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
                </label>
                <input className={inp} placeholder="React, TypeScript, PostgreSQL, leadership…"
                  value={aiForm.existing_skills} onChange={e => setAiForm(f => ({ ...f, existing_skills: e.target.value }))} />
              </div>
            </div>

            {aiError && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2.5 rounded-xl border border-red-100">{aiError}</div>
            )}

            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed">
              AI will fill your <strong>Professional Summary</strong>, <strong>Skills list</strong>, and <strong>Experience bullets</strong> for the first position. You can edit everything afterwards.
            </div>

            <button onClick={handleAiGenerate} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              {aiLoading
                ? <><Loader2 size={16} className="animate-spin" />Generating your resume…</>
                : <><Sparkles size={16} />Generate Resume Content</>}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
