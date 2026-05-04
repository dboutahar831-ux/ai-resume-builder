import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ChevronLeft, ChevronRight, Plus, Trash2, Download, Save, Sparkles, X, Loader2, TrendingUp } from 'lucide-react';

function computeStrength(form) {
  const p = form.personal_info;
  let score = 0;
  const missing = [];
  if (p.full_name)                        score += 10; else missing.push('Add your full name');
  if (p.email)                            score += 10; else missing.push('Add an email address');
  if (p.phone)                            score += 5;  else missing.push('Add a phone number');
  if (p.location)                         score += 5;  else missing.push('Add your location');
  if (p.linkedin)                         score += 5;  else missing.push('Add your LinkedIn URL');
  if (p.summary && p.summary.length > 50) score += 15; else missing.push('Write a summary (50+ characters)');
  if (form.experience.length >= 1)        score += 15; else missing.push('Add at least one work experience');
  if (form.experience.length >= 2)        score += 5;
  if (form.experience.length >= 3)        score += 5;
  if (form.education.length >= 1)         score += 15; else missing.push('Add your education');
  if (form.skills.length >= 1)            score += 5;  else missing.push('Add at least one skill');
  if (form.skills.length >= 5)            score += 3;
  if (form.skills.length >= 10)           score += 2;
  return { score: Math.min(score, 100), missing };
}
import Layout from '../components/Layout';
import api from '../api/axios';
import { generateResumeContent } from '../utils/resumeGenerator';

const steps = ['Personal Info', 'Experience', 'Education', 'Skills'];

const emptyForm = {
  personal_info: { full_name: '', email: '', phone: '', location: '', linkedin: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
};

const emptyAiForm = { job_title: '', years_experience: '', field: '', existing_skills: '' };

export default function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const printRef = useRef();

  const [aiOpen, setAiOpen] = useState(false);
  const [aiForm, setAiForm] = useState(emptyAiForm);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: form.personal_info.full_name || 'Resume' });

  useEffect(() => {
    if (isEdit) {
      api.get(`/resumes/${id}`).then(res => {
        setForm({ personal_info: res.data.personal_info, experience: res.data.experience, education: res.data.education, skills: res.data.skills });
      });
    }
  }, [id]);

  const setP = (field, val) => setForm(f => ({ ...f, personal_info: { ...f.personal_info, [field]: val } }));

  const addExp = () => setForm(f => ({ ...f, experience: [...f.experience, { company: '', role: '', start_date: '', end_date: '', description: '' }] }));
  const setExp = (i, field, val) => setForm(f => { const e = [...f.experience]; e[i] = { ...e[i], [field]: val }; return { ...f, experience: e }; });
  const removeExp = (i) => setForm(f => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }));

  const addEdu = () => setForm(f => ({ ...f, education: [...f.education, { institution: '', degree: '', field: '', start_date: '', end_date: '' }] }));
  const setEdu = (i, field, val) => setForm(f => { const e = [...f.education]; e[i] = { ...e[i], [field]: val }; return { ...f, education: e }; });
  const removeEdu = (i) => setForm(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
    setSkillInput('');
  };
  const removeSkill = (i) => setForm(f => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.personal_info.full_name) return alert('Full name is required');
    setSaving(true);
    try {
      if (isEdit) await api.put(`/resumes/${id}`, form);
      else await api.post('/resumes', form);
      navigate('/resumes');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = () => {
    if (!aiForm.job_title || !aiForm.years_experience || !aiForm.field) {
      setAiError('Job title, years of experience, and field are required.');
      return;
    }
    setAiError('');
    setAiLoading(true);

    setTimeout(() => {
      try {
        const existing_skills = aiForm.existing_skills.trim()
          ? aiForm.existing_skills.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        const data = generateResumeContent({
          job_title: aiForm.job_title,
          years_experience: aiForm.years_experience,
          field: aiForm.field,
          existing_skills,
        });

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
      } finally {
        setAiLoading(false);
      }
    }, 1200);
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
  const aiInputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Resume' : 'New Resume'}</h1>
            <p className="text-gray-500 mt-1 text-sm">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAiOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
              <Sparkles size={15} />Generate with AI
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              <Download size={15} />Export PDF
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
              <Save size={15} />{saving ? 'Saving...' : 'Save Resume'}
            </button>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {steps.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${step === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Resume strength score */}
        {(() => {
          const { score, missing } = computeStrength(form);
          const color = score >= 85 ? 'emerald' : score >= 60 ? 'indigo' : score >= 35 ? 'yellow' : 'red';
          const label = score >= 85 ? 'Excellent' : score >= 60 ? 'Strong' : score >= 35 ? 'Good' : 'Needs work';
          const barCls = { emerald: 'bg-emerald-500', indigo: 'bg-indigo-500', yellow: 'bg-yellow-400', red: 'bg-red-400' };
          const textCls = { emerald: 'text-emerald-600', indigo: 'text-indigo-600', yellow: 'text-yellow-600', red: 'text-red-500' };
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-5">
              <TrendingUp size={18} className={textCls[color]} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-800">Resume Strength</p>
                  <span className={`text-sm font-bold ${textCls[color]}`}>{score}% — {label}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barCls[color]}`} style={{ width: `${score}%` }} />
                </div>
                {missing.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">Next: {missing[0]}</p>
                )}
              </div>
            </div>
          );
        })()}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">

            {step === 0 && (
              <>
                <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                    <input className={inputCls} placeholder="John Doe" value={form.personal_info.full_name} onChange={e => setP('full_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input className={inputCls} placeholder="john@email.com" value={form.personal_info.email} onChange={e => setP('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input className={inputCls} placeholder="+1 234 567 890" value={form.personal_info.phone} onChange={e => setP('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <input className={inputCls} placeholder="New York, USA" value={form.personal_info.location} onChange={e => setP('location', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label>
                    <input className={inputCls} placeholder="linkedin.com/in/john" value={form.personal_info.linkedin} onChange={e => setP('linkedin', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Professional Summary</label>
                    <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Brief professional summary..." value={form.personal_info.summary} onChange={e => setP('summary', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">Work Experience</h2>
                  <button onClick={addExp} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    <Plus size={15} />Add
                  </button>
                </div>
                {form.experience.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    Click "Add" to add work experience
                  </div>
                )}
                {form.experience.map((exp, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-400">Experience #{i + 1}</span>
                      <button onClick={() => removeExp(i)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Company</label><input className={inputCls} placeholder="Google" value={exp.company} onChange={e => setExp(i, 'company', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Role</label><input className={inputCls} placeholder="Software Engineer" value={exp.role} onChange={e => setExp(i, 'role', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label><input className={inputCls} placeholder="2022-01" value={exp.start_date} onChange={e => setExp(i, 'start_date', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">End Date</label><input className={inputCls} placeholder="Present" value={exp.end_date} onChange={e => setExp(i, 'end_date', e.target.value)} /></div>
                      <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Description</label><textarea className={`${inputCls} resize-none`} rows={3} value={exp.description} onChange={e => setExp(i, 'description', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">Education</h2>
                  <button onClick={addEdu} className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium"><Plus size={15} />Add</button>
                </div>
                {form.education.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    Click "Add" to add education
                  </div>
                )}
                {form.education.map((edu, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-400">Education #{i + 1}</span>
                      <button onClick={() => removeEdu(i)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Institution</label><input className={inputCls} placeholder="MIT" value={edu.institution} onChange={e => setEdu(i, 'institution', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Degree</label><input className={inputCls} placeholder="Bachelor's" value={edu.degree} onChange={e => setEdu(i, 'degree', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Field</label><input className={inputCls} placeholder="Computer Science" value={edu.field} onChange={e => setEdu(i, 'field', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Start</label><input className={inputCls} placeholder="2018" value={edu.start_date} onChange={e => setEdu(i, 'start_date', e.target.value)} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">End</label><input className={inputCls} placeholder="2022" value={edu.end_date} onChange={e => setEdu(i, 'end_date', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-semibold text-gray-900 mb-4">Skills</h2>
                <div className="flex gap-2">
                  <input className={`${inputCls} flex-1`} placeholder="e.g. JavaScript" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <button onClick={addSkill} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.skills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {s}
                      <button onClick={() => removeSkill(i)} className="text-indigo-400 hover:text-indigo-700">×</button>
                    </span>
                  ))}
                  {form.skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet</p>}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-all">
                <ChevronLeft size={16} />Previous
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
                  Next<ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60">
                  <Save size={15} />{saving ? 'Saving...' : 'Save Resume'}
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Live Preview</p>
            </div>
            <div ref={printRef} id="print-resume" className="p-8 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
              {form.personal_info.full_name ? (
                <>
                  <div className="border-b-2 border-gray-900 pb-3 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{form.personal_info.full_name}</h1>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-600">
                      {form.personal_info.email && <span>{form.personal_info.email}</span>}
                      {form.personal_info.phone && <span>· {form.personal_info.phone}</span>}
                      {form.personal_info.location && <span>· {form.personal_info.location}</span>}
                      {form.personal_info.linkedin && <span>· {form.personal_info.linkedin}</span>}
                    </div>
                  </div>
                  {form.personal_info.summary && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5">Summary</h2>
                      <p className="text-gray-700 text-xs leading-relaxed">{form.personal_info.summary}</p>
                    </div>
                  )}
                  {form.experience.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Experience</h2>
                      {form.experience.map((e, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between items-baseline">
                            <p className="font-bold text-gray-900 text-sm">{e.role}</p>
                            <p className="text-xs text-gray-500">{e.start_date}{e.end_date ? ` – ${e.end_date}` : ''}</p>
                          </div>
                          <p className="text-indigo-600 text-xs font-medium">{e.company}</p>
                          {e.description && (
                            <div className="text-gray-600 text-xs mt-1 leading-relaxed whitespace-pre-line">{e.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {form.education.length > 0 && (
                    <div className="mb-4">
                      <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Education</h2>
                      {form.education.map((e, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <p className="font-bold text-gray-900 text-sm">{e.degree}{e.field ? ` in ${e.field}` : ''}</p>
                            <p className="text-xs text-gray-500">{e.start_date}{e.end_date ? ` – ${e.end_date}` : ''}</p>
                          </div>
                          <p className="text-indigo-600 text-xs font-medium">{e.institution}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.skills.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Skills</h2>
                      <p className="text-gray-700 text-xs">{form.skills.join(' · ')}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                  <p className="text-sm">Start filling the form to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Generate Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !aiLoading && setAiOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Generate with AI</h2>
                </div>
                <p className="text-xs text-gray-500">Claude will write your summary, skills, and experience bullets</p>
              </div>
              <button onClick={() => !aiLoading && setAiOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Job Title *</label>
                <input className={aiInputCls} placeholder="e.g. Senior Software Engineer"
                  value={aiForm.job_title} onChange={e => setAiForm(f => ({ ...f, job_title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Years of Experience *</label>
                  <input className={aiInputCls} type="number" min="0" max="40" placeholder="5"
                    value={aiForm.years_experience} onChange={e => setAiForm(f => ({ ...f, years_experience: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Field / Industry *</label>
                  <input className={aiInputCls} placeholder="e.g. Software, Finance"
                    value={aiForm.field} onChange={e => setAiForm(f => ({ ...f, field: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Existing Skills <span className="text-gray-400 font-normal">(optional, comma-separated)</span></label>
                <input className={aiInputCls} placeholder="React, Node.js, PostgreSQL"
                  value={aiForm.existing_skills} onChange={e => setAiForm(f => ({ ...f, existing_skills: e.target.value }))} />
              </div>
            </div>

            {aiError && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2.5 rounded-xl border border-red-100">
                {aiError}
              </div>
            )}

            <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-700 leading-relaxed">
              AI will fill in your <strong>Professional Summary</strong>, <strong>Skills</strong>, and <strong>Experience Description</strong>. You can edit anything afterwards.
            </div>

            <button onClick={handleAiGenerate} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-60">
              {aiLoading ? (
                <><Loader2 size={16} className="animate-spin" />Generating...</>
              ) : (
                <><Sparkles size={16} />Generate Resume Content</>
              )}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
