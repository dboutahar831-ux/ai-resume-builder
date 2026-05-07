import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Moon, Sun, Check, Lock, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Trash2, TriangleAlert, Radio, LogOut, CheckCheck, ShieldOff, UserX, ShieldAlert } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import api from '../api/axios';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
];

export default function Settings() {
  const { lang, setLang, dark, setDark, t } = useApp();
  const navigate = useNavigate();
  const logout = () => { localStorage.clear(); navigate('/login'); };
  const [showOnline, setShowOnline] = useState(true);
  const [savingOnline, setSavingOnline] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [savingReceipts, setSavingReceipts] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setShowOnline(res.data.show_online_status !== false);
      setShowReadReceipts(res.data.show_read_receipts !== false);
    }).catch(() => {});
  }, []);

  const toggleOnlineStatus = async (val) => {
    setSavingOnline(true);
    try {
      const profile = await api.get('/auth/profile');
      await api.put('/auth/profile', { ...profile.data, show_online_status: val });
      setShowOnline(val);
    } catch {} finally { setSavingOnline(false); }
  };

  const toggleReadReceipts = async (val) => {
    setSavingReceipts(true);
    try {
      const profile = await api.get('/auth/profile');
      await api.put('/auth/profile', { ...profile.data, show_read_receipts: val });
      setShowReadReceipts(val);
    } catch {} finally { setSavingReceipts(false); }
  };

  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess('');
    if (!pwForm.current_password || !pwForm.new_password)
      return setPwError('Please fill in all fields.');
    if (pwForm.new_password.length < 6)
      return setPwError('New password must be at least 6 characters.');
    if (pwForm.new_password !== pwForm.confirm_password)
      return setPwError('New passwords do not match.');
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwSuccess('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPw(false);
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    } finally { setPwSaving(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirm !== 'DELETE') return setDeleteError('Please type DELETE to confirm.');
    if (!deletePassword) return setDeleteError('Password is required.');
    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      localStorage.clear();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account.');
    } finally { setDeleting(false); }
  };

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const loadBlocked = async () => {
    setBlockedLoading(true);
    try {
      const res = await api.get('/friends/blocked');
      setBlockedUsers(res.data);
    } catch {} finally { setBlockedLoading(false); }
  };

  const handleUnblock = async (userId) => {
    await api.post(`/friends/unblock/${userId}`);
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const inp = 'w-full pr-10 pl-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-gray-200';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#6C5CE7,#BF5AF2)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <h1 className="text-xl font-bold">{t.settings}</h1>
            <p className="text-white/70 text-sm mt-0.5">Manage your preferences and account security.</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm border border-emerald-100">
            <Check size={14} />{pwSuccess}
          </div>
        )}

        {/* Language */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900">{t.language}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Choose the language for the interface.</p>
          <div className="grid grid-cols-3 gap-3">
            {languages.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  lang === l.code
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                <span className="text-xl">{l.flag}</span>
                <span>{l.label}</span>
                {lang === l.code && <Check size={13} className="ml-auto text-indigo-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Online Status Privacy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Radio size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900">Online Status</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Control who can see when you're active.</p>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">Show active status</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {showOnline ? 'Friends can see when you\'re online' : 'Your online status is hidden from everyone'}
              </p>
            </div>
            <button
              onClick={() => toggleOnlineStatus(!showOnline)}
              disabled={savingOnline}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 disabled:opacity-50
                ${showOnline ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${showOnline ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Read Receipts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <CheckCheck size={16} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900">Read Receipts</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Control whether others can see when you've read their messages.</p>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">Show read receipts</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {showReadReceipts ? 'Others can see when you\'ve read their messages' : 'Read receipts are hidden — others won\'t see "Seen"'}
              </p>
            </div>
            <button
              onClick={() => toggleReadReceipts(!showReadReceipts)}
              disabled={savingReceipts}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 disabled:opacity-50
                ${showReadReceipts ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${showReadReceipts ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            {dark ? <Moon size={16} className="text-gray-400" /> : <Sun size={16} className="text-gray-400" />}
            <h3 className="font-semibold text-gray-900">{t.theme}</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Switch between light and dark appearance.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setDark(false)}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                !dark ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              <Sun size={20} />
              <div className="text-left">
                <p className="font-medium">{t.lightMode}</p>
                <p className="text-xs opacity-60 mt-0.5">Clean & bright</p>
              </div>
              {!dark && <Check size={14} className="ml-auto text-indigo-600" />}
            </button>
            <button onClick={() => setDark(true)}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                dark ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              <Moon size={20} />
              <div className="text-left">
                <p className="font-medium">{t.darkMode}</p>
                <p className="text-xs opacity-60 mt-0.5">Easy on the eyes</p>
              </div>
              {dark && <Check size={14} className="ml-auto text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">{t.changePassword}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your account password.</p>
              </div>
            </div>
            <button onClick={() => { setShowPw(s => !s); setPwError(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                showPw ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'text-white border-transparent hover:opacity-90'
              }`}
              style={!showPw ? { background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' } : {}}>
              {showPw ? <><ChevronUp size={14} />Cancel</> : <><ChevronDown size={14} />{t.changePassword}</>}
            </button>
          </div>

          {showPw && (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
              {pwError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={14} />{pwError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.currentPassword}</label>
                <div className="relative">
                  <input className={inp} type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} />
                  <button type="button" onClick={() => setShowCurrent(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.newPassword}</label>
                <div className="relative">
                  <input className={inp} type={showNew ? 'text' : 'password'}
                    placeholder="Enter your new password (min. 6 chars)"
                    value={pwForm.new_password}
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input className={inp + ' pr-3'} type="password"
                  placeholder="Re-enter your new password"
                  value={pwForm.confirm_password}
                  onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} />
              </div>
              <button onClick={handlePasswordChange} disabled={pwSaving}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                {pwSaving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.loading}</>
                ) : (
                  <><Lock size={14} />{t.changePassword}</>
                )}
              </button>
            </div>
          )}
        </div>
        {/* Blocked Users */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ShieldOff size={16} className="text-red-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Blocked Users</h3>
            </div>
            <button onClick={() => { if (!blockedLoading) loadBlocked(); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" style={{ color: '#6C5CE7' }}>
              {blockedLoading ? 'Loading...' : `View (${blockedUsers.length})`}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Users you've blocked cannot contact you or interact with your posts.</p>

          {blockedUsers.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {blockedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <Link to={`/friends/${u.id}`} className="flex-shrink-0">
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-900" />
                      : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {u.name?.[0]}
                        </div>
                    }
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/friends/${u.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors block truncate">
                      {u.name}
                    </Link>
                    {u.bio && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.bio}</p>}
                  </div>
                  <button onClick={() => handleUnblock(u.id)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <ShieldAlert size={11} />Unblock
                  </button>
                </div>
              ))}
            </div>
          )}

          {blockedUsers.length === 0 && !blockedLoading && (
            <div className="flex items-center gap-2 px-3 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
              <UserX size={14} />
              <p className="text-xs">No blocked users</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogOut size={16} className="text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">{t.logout}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sign out of your account.</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">
              <LogOut size={14} />{t.logout}
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 size={16} className="text-red-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Delete Account</h3>
                <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all data.</p>
              </div>
            </div>
            <button onClick={() => { setShowDelete(s => !s); setDeleteError(''); setDeletePassword(''); setDeleteConfirm(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                showDelete ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
              }`}>
              {showDelete ? <><ChevronUp size={14} />Cancel</> : <><Trash2 size={14} />Delete Account</>}
            </button>
          </div>

          {showDelete && (
            <div className="mt-5 pt-5 border-t border-red-100 space-y-4">
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <TriangleAlert size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  This action is <strong>irreversible</strong>. All your resumes, job applications, messages, and connections will be permanently deleted.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={14} />{deleteError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your password</label>
                <input type="password" className={inp.replace('focus:ring-indigo-500', 'focus:ring-red-500') + ' pr-3'}
                  placeholder="Enter your password to confirm"
                  value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type <strong className="text-red-600">DELETE</strong> to confirm
                </label>
                <input type="text" className={inp.replace('focus:ring-indigo-500', 'focus:ring-red-500') + ' pr-3'}
                  placeholder="DELETE"
                  value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
              </div>

              <button onClick={handleDeleteAccount} disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-60">
                {deleting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                  : <><Trash2 size={14} />Permanently Delete Account</>
                }
              </button>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
