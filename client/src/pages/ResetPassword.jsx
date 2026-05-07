import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/Toast';

export default function ResetPassword() {
  const addToast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return addToast('Invalid reset link.', 'error');
    if (!password || password.length < 6) return addToast('Password must be at least 6 characters.', 'warning');
    if (password !== confirm) return addToast('Passwords do not match.', 'warning');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      addToast('Password reset successfully!', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to reset password.', 'error');
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="bg-[#151921] rounded-2xl border border-[#21262E] p-8 text-center max-w-md">
          <h1 className="text-xl font-bold text-[#E8ECF1] mb-2">Invalid Link</h1>
          <p className="text-sm text-[#8B95A5] mb-6">This reset link is invalid or expired.</p>
          <Link to="/forgot-password"
            className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#151921] rounded-2xl border border-[#21262E] p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1F2B] border border-[#21262E] flex items-center justify-center mx-auto mb-4">
              <Lock className="text-[#6C5CE7]" size={24} />
            </div>
            <h1 className="text-xl font-bold text-[#E8ECF1]">Reset Password</h1>
            <p className="text-sm text-[#8B95A5] mt-1.5">Choose a new password for your account</p>
          </div>

          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <p className="text-sm text-[#E8ECF1] mb-6">Password has been reset. Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#E8ECF1] mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters" required minLength={6}
                    className="w-full pr-10 px-4 py-2.5 bg-[#1A1F2B] border border-[#21262E] rounded-xl text-sm text-[#E8ECF1] placeholder-[#5A6375] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] transition-all" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6375] hover:text-[#8B95A5]">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#E8ECF1] mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" required
                  className="w-full px-4 py-2.5 bg-[#1A1F2B] border border-[#21262E] rounded-xl text-sm text-[#E8ECF1] placeholder-[#5A6375] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
