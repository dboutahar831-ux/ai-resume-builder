import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, AlertCircle, Check, RefreshCw } from 'lucide-react';
import api from '../api/axios';

function NexlyIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="nx-verify" x1="0" y1="26" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2EC4B6"/>
          <stop offset="45%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <path d="M5 46 L5 6 L22 42 L22 6" stroke="url(#nx-verify)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 6 L51 46" stroke="url(#nx-verify)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M51 6 L30 46" stroke="url(#nx-verify)" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef([]);

  if (!email) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="mb-4 text-gray-500">No email found. Please register first.</p>
        <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Go to Register</Link>
      </div>
    </div>
  );

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setCode(pasted.split('')); inputs.current[5]?.focus(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) return setError('Please enter the full 6-digit code.');
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify', { email, code: fullCode });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-code', { email });
      setResent(true); setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <NexlyIcon className="w-8 h-8" />
          <span className="font-bold text-gray-900 text-lg">Nexly</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <Mail size={26} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Check Your Email</h1>
          <p className="text-sm text-gray-500 text-center mb-1">We sent a 6-digit code to</p>
          <p className="font-semibold text-sm text-center text-indigo-600 mb-7">{email}</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100">
              <AlertCircle size={15} className="flex-shrink-0" />{error}
            </div>
          )}
          {resent && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl mb-5 text-sm border border-emerald-100">
              <Check size={15} />Code resent successfully!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2.5 justify-center mb-6">
              {code.map((digit, i) => (
                <input key={i} ref={el => inputs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-all bg-white text-gray-900 ${digit ? 'border-indigo-500' : 'border-gray-200'}`} />
              ))}
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</>
              ) : 'Verify Email'}
            </button>
          </form>

          <button onClick={handleResend}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 mx-auto mt-5 hover:text-indigo-600 transition-all">
            <RefreshCw size={13} />Didn't receive it? Resend code
          </button>
        </div>

        <p className="text-sm text-center mt-6">
          <Link to="/register" className="font-medium text-gray-500 hover:text-indigo-600 transition-all">
            ← Back to Register
          </Link>
        </p>
      </div>
    </div>
  );
}
