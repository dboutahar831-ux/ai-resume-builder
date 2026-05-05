import { useEffect, useRef, useState } from 'react';
import { Save, Check, AlertCircle, Camera, User, Mail, Phone, MapPin, Link2, Calendar, Pencil, X } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useApp } from '../context/AppContext';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 font-medium">{value || <span className="text-gray-300 font-normal">—</span>}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { t } = useApp();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', phone: '', location: '', linkedin: '', avatar: '', bio: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setUser(res.data);
      setForm({
        name: res.data.name || '',
        age: res.data.age || '',
        phone: res.data.phone || '',
        location: res.data.location || '',
        linkedin: res.data.linkedin || '',
        avatar: res.data.avatar || '',
        bio: res.data.bio || '',
      });
    });
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError('Image must be smaller than 2MB.');
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, avatar: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/auth/profile', form);
      const updated = res.data;
      setUser(u => ({ ...u, ...updated }));
      setForm(f => ({ ...f, ...updated, age: updated.age || '', phone: updated.phone || '', location: updated.location || '', linkedin: updated.linkedin || '' }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...updated }));
      setSuccess('Profile updated successfully.');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) setForm({ name: user.name || '', age: user.age || '', phone: user.phone || '', location: user.location || '', linkedin: user.linkedin || '', avatar: user.avatar || '', bio: user.bio || '' });
    setEditing(false); setError('');
  };

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  if (!user) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.profile}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t.memberSince} {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
              <Pencil size={14} />{t.edit}
            </button>
          )}
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100">
            <Check size={14} />{success}
          </div>
        )}

        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm">
                  <span className="text-3xl font-bold text-white select-none">{form.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              {editing && (
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-700 transition-all">
                  <Camera size={13} className="text-white" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.bio && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{user.bio}</p>}
              {user.location && <p className="text-xs text-gray-400 mt-1">📍 {user.location}</p>}
              {user.linkedin && (
                <a href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline mt-1 block truncate">
                  🔗 {user.linkedin}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">{t.account} Information</h2>
            <p className="text-xs text-gray-400 mb-4">Your personal details and contact information.</p>
            <InfoRow icon={User}     label={t.fullName}  value={user.name} />
            <InfoRow icon={Mail}     label={t.email}     value={user.email} />
            <InfoRow icon={Calendar} label={t.age}       value={user.age} />
            <InfoRow icon={Phone}    label={t.phone}     value={user.phone} />
            <InfoRow icon={MapPin}   label={t.location}  value={user.location} />
            <InfoRow icon={Link2}    label={t.linkedin}  value={user.linkedin} />
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Edit Your Information</h2>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-sm border border-red-100">
                <AlertCircle size={14} />{error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fullName}</label>
                <input className={inp} value={form.name}
                  placeholder="Enter your full name"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.age}</label>
                <input className={inp} type="number" min="10" max="100"
                  placeholder="Enter your age"
                  value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.email}</label>
              <input className={inp + ' opacity-50 cursor-not-allowed bg-gray-50'} value={user.email} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.phone}</label>
                <input className={inp}
                  placeholder="Enter your phone number"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.location}</label>
                <input className={inp}
                  placeholder="City, Country"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.linkedin}</label>
              <input className={inp}
                placeholder="linkedin.com/in/yourprofile"
                value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea className={inp + ' resize-none'} rows={3}
                placeholder="Tell people a bit about yourself..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                <X size={14} />{t.cancel}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.loading}</>
                ) : (
                  <><Save size={14} />{t.saveChanges}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
