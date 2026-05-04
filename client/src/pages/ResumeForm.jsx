import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

const empty = {
  personal_info: { full_name: '', email: '', phone: '', location: '', summary: '' },
  experience: [],
  education: [],
  skills: [],
};

export default function ResumeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/resumes/${id}`).then((res) => {
        setForm({
          personal_info: res.data.personal_info,
          experience: res.data.experience,
          education: res.data.education,
          skills: res.data.skills,
        });
      });
    }
  }, [id]);

  const setPersonal = (field, value) =>
    setForm({ ...form, personal_info: { ...form.personal_info, [field]: value } });

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    setSkillInput('');
  };

  const removeSkill = (i) =>
    setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) });

  const addExperience = () =>
    setForm({ ...form, experience: [...form.experience, { company: '', role: '', start_date: '', end_date: '', description: '' }] });

  const setExp = (i, field, value) => {
    const updated = [...form.experience];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, experience: updated });
  };

  const removeExp = (i) =>
    setForm({ ...form, experience: form.experience.filter((_, idx) => idx !== i) });

  const addEducation = () =>
    setForm({ ...form, education: [...form.education, { institution: '', degree: '', field: '', start_date: '', end_date: '' }] });

  const setEdu = (i, field, value) => {
    const updated = [...form.education];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, education: updated });
  };

  const removeEdu = (i) =>
    setForm({ ...form, education: form.education.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) {
        await api.put(`/resumes/${id}`, form);
      } else {
        await api.post('/resumes', form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save resume');
    }
  };

  return (
    <div className="form-page">
      <h1>{isEdit ? 'Edit Resume' : 'New Resume'}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>

        <section>
          <h2>Personal Info</h2>
          <input placeholder="Full Name" value={form.personal_info.full_name} onChange={(e) => setPersonal('full_name', e.target.value)} required />
          <input placeholder="Email" value={form.personal_info.email} onChange={(e) => setPersonal('email', e.target.value)} />
          <input placeholder="Phone" value={form.personal_info.phone} onChange={(e) => setPersonal('phone', e.target.value)} />
          <input placeholder="Location" value={form.personal_info.location} onChange={(e) => setPersonal('location', e.target.value)} />
          <textarea placeholder="Professional Summary" value={form.personal_info.summary} onChange={(e) => setPersonal('summary', e.target.value)} rows={3} />
        </section>

        <section>
          <h2>Experience</h2>
          {form.experience.map((exp, i) => (
            <div key={i} className="sub-form">
              <input placeholder="Company" value={exp.company} onChange={(e) => setExp(i, 'company', e.target.value)} />
              <input placeholder="Role" value={exp.role} onChange={(e) => setExp(i, 'role', e.target.value)} />
              <input placeholder="Start Date (e.g. 2022-01)" value={exp.start_date} onChange={(e) => setExp(i, 'start_date', e.target.value)} />
              <input placeholder="End Date (or Present)" value={exp.end_date} onChange={(e) => setExp(i, 'end_date', e.target.value)} />
              <textarea placeholder="Description" value={exp.description} onChange={(e) => setExp(i, 'description', e.target.value)} rows={2} />
              <button type="button" onClick={() => removeExp(i)} className="btn-danger">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addExperience} className="btn-secondary">+ Add Experience</button>
        </section>

        <section>
          <h2>Education</h2>
          {form.education.map((edu, i) => (
            <div key={i} className="sub-form">
              <input placeholder="Institution" value={edu.institution} onChange={(e) => setEdu(i, 'institution', e.target.value)} />
              <input placeholder="Degree" value={edu.degree} onChange={(e) => setEdu(i, 'degree', e.target.value)} />
              <input placeholder="Field of Study" value={edu.field} onChange={(e) => setEdu(i, 'field', e.target.value)} />
              <input placeholder="Start Date" value={edu.start_date} onChange={(e) => setEdu(i, 'start_date', e.target.value)} />
              <input placeholder="End Date" value={edu.end_date} onChange={(e) => setEdu(i, 'end_date', e.target.value)} />
              <button type="button" onClick={() => removeEdu(i)} className="btn-danger">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addEducation} className="btn-secondary">+ Add Education</button>
        </section>

        <section>
          <h2>Skills</h2>
          <div className="skill-input">
            <input placeholder="Add a skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
          </div>
          <div className="skills-list">
            {form.skills.map((s, i) => (
              <span key={i} className="skill-tag">{s} <button type="button" onClick={() => removeSkill(i)}>×</button></span>
            ))}
          </div>
        </section>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{isEdit ? 'Save Changes' : 'Create Resume'}</button>
        </div>

      </form>
    </div>
  );
}
