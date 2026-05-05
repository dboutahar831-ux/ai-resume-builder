import { useEffect, useRef, useState } from 'react';
import {
  Save, Check, AlertCircle, Camera, User, Mail, Phone,
  MapPin, Link2, Calendar, Pencil, X, Image as ImageIcon,
  FileText, Briefcase, Users, MessageSquare, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { t } = useApp();
  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState({ resumes: 0, jobs: 0, friends: 0, messages: 0 });
  const [form, setForm]       = useState({ name:'', age:'', phone:'', location:'', linkedin:'', avatar:'', bio:'', cover_image:'' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const fileRef  = useRef();
  const coverRef = useRef();

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setUser(res.data);
      setForm({
        name: res.data.name || '', age: res.data.age || '',
        phone: res.data.phone || '', location: res.data.location || '',
        linkedin: res.data.linkedin || '', avatar: res.data.avatar || '',
        bio: res.data.bio || '', cover_image: res.data.cover_image || '',
      });
    });
    Promise.all([
      api.get('/resumes'), api.get('/jobs'),
      api.get('/friends'), api.get('/messages/unread/count'),
    ]).then(([r, j, f, m]) =>
      setStats({ resumes: r.data.length, jobs: j.data.length, friends: f.data.length, messages: m.data.count })
    ).catch(() => {});
  }, []);

  const readFile = (file, maxMb, key) => {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) return setError(`File must be under ${maxMb}MB.`);
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, [key]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/auth/profile', form);
      const updated = res.data;
      setUser(u => ({ ...u, ...updated }));
      setForm(f => ({ ...f, ...updated, age: updated.age||'', phone: updated.phone||'', location: updated.location||'', linkedin: updated.linkedin||'', cover_image: updated.cover_image||'' }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user')||'{}'), ...updated }));
      setSuccess('Profile updated!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) setForm({ name: user.name||'', age: user.age||'', phone: user.phone||'', location: user.location||'', linkedin: user.linkedin||'', avatar: user.avatar||'', bio: user.bio||'', cover_image: user.cover_image||'' });
    setEditing(false); setError('');
  };

  const inp = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all';

  if (!user) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const statCards = [
    { label: 'Resumes', value: stats.resumes, to: '/resumes',  icon: FileText,      color: 'text-indigo-500', bg: 'bg-indigo-50'  },
    { label: 'Jobs',    value: stats.jobs,    to: '/jobs',     icon: Briefcase,     color: 'text-sky-500',    bg: 'bg-sky-50'     },
    { label: 'Friends', value: stats.friends, to: '/friends',  icon: Users,         color: 'text-emerald-500',bg: 'bg-emerald-50' },
    { label: 'Unread',  value: stats.messages,to: '/messages', icon: MessageSquare, color: 'text-amber-500',  bg: 'bg-amber-50'   },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">

        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl text-sm border border-emerald-100 shadow-sm">
            <Check size={15} className="flex-shrink-0" />{success}
          </div>
        )}

        {/* ── Hero card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Cover photo */}
          <div className="relative h-52 group">
            {form.cover_image
              ? <img src={form.cover_image} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
            }
            {/* Subtle dark overlay at bottom so avatar reads */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

            {/* Cover edit buttons */}
            <div className={`absolute top-3 right-3 flex gap-2 transition-all ${editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button onClick={() => coverRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium rounded-xl backdrop-blur-md transition-all">
                <ImageIcon size={12} />
                {form.cover_image ? 'Change Cover' : 'Add Cover'}
              </button>
              {form.cover_image && (
                <button onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-black/50 hover:bg-red-600/80 text-white text-xs rounded-xl backdrop-blur-md transition-all">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Profile body */}
          <div className="px-8 pb-8">
            {/* Avatar + action row */}
            <div className="flex items-end justify-between -mt-16 mb-5">
              {/* Avatar */}
              <div className="relative">
                {form.avatar
                  ? <img src={form.avatar} alt="avatar"
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl" />
                  : <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-400 to-indigo-700 border-4 border-white shadow-xl flex items-center justify-center">
                      <span className="text-5xl font-bold text-white select-none">{form.name?.[0]?.toUpperCase()}</span>
                    </div>
                }
                {/* Camera button always visible on hover */}
                <button onClick={() => { if (!editing) setEditing(true); setTimeout(() => fileRef.current?.click(), 50); }}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105">
                  <Camera size={15} className="text-white" />
                </button>
              </div>

              {/* Edit / Save buttons */}
              <div className="flex gap-2 mb-1">
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5">
                    <Pencil size={14} />Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                      <X size={14} />Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200 disabled:opacity-60">
                      {saving
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                        : <><Save size={14} />Save Changes</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name + meta */}
            {!editing ? (
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{user.name}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.bio && <p className="text-sm text-gray-600 leading-relaxed max-w-lg pt-1">{user.bio}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {user.location && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={13} className="text-gray-400" />{user.location}
                    </span>
                  )}
                  {user.linkedin && (
                    <a href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                      <Link2 size={13} />LinkedIn
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={13} />Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  {user.age && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <User size={13} />Age {user.age}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Edit form inline */
              <div className="space-y-4 mt-2">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                    <AlertCircle size={14} />{error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.fullName}</label>
                    <input className={inp} value={form.name} placeholder="Your full name"
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.age}</label>
                    <input className={inp} type="number" min="10" max="100" placeholder="Age"
                      value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.email}</label>
                  <input className={inp + ' opacity-50 cursor-not-allowed bg-gray-50'} value={user.email} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.phone}</label>
                    <input className={inp} placeholder="Phone number"
                      value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.location}</label>
                    <input className={inp} placeholder="City, Country"
                      value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t.linkedin}</label>
                  <input className={inp} placeholder="linkedin.com/in/yourprofile"
                    value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Bio</label>
                  <textarea className={inp + ' resize-none'} rows={3}
                    placeholder="Tell people a bit about yourself..."
                    value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <input ref={fileRef}  type="file" accept="image/*" className="hidden" onChange={e => { readFile(e.target.files[0], 2, 'avatar');  e.target.value=''; }} />
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { readFile(e.target.files[0], 5, 'cover_image'); e.target.value=''; }} />
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(s => (
            <Link key={s.label} to={s.to}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Account info card (view mode only) ── */}
        {!editing && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Shield size={15} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Account Information</p>
                <p className="text-xs text-gray-400">Your personal details</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { icon: User,     label: 'Full Name',    value: user.name },
                { icon: Mail,     label: 'Email',        value: user.email },
                { icon: Calendar, label: 'Age',          value: user.age ? `${user.age} years old` : null },
                { icon: Phone,    label: 'Phone',        value: user.phone },
                { icon: MapPin,   label: 'Location',     value: user.location },
                { icon: Link2,    label: 'LinkedIn',     value: user.linkedin },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    {value
                      ? <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                      : <p className="text-sm text-gray-300">Not set</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
