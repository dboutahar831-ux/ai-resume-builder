import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const addToast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return addToast('Please enter your email.', 'warning');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
      addToast('Reset link sent if email is registered.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to send reset email.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#151921] rounded-2xl border border-[#21262E] p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1F2B] border border-[#21262E] flex items-center justify-center mx-auto mb-4">
              <Mail className="text-[#6C5CE7]" size={24} />
            </div>
            <h1 className="text-xl font-bold text-[#E8ECF1]">Forgot Password</h1>
            <p className="text-sm text-[#8B95A5] mt-1.5">Enter your email to receive a reset link</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 border border-emerald-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <p className="text-sm text-[#E8ECF1] mb-6">Check your email for the reset link.</p>
              <Link to="/login"
                className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#E8ECF1] mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-2.5 bg-[#1A1F2B] border border-[#21262E] rounded-xl text-sm text-[#E8ECF1] placeholder-[#5A6375] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 focus:border-[#6C5CE7] transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-[#6C5CE7] hover:text-[#BF5AF2] transition-colors inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
