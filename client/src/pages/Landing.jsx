import { Link } from 'react-router-dom';
import { Briefcase, Sparkles, Shield, Zap, BarChart3, Users, CheckCircle, ArrowRight, Rss, Star, TrendingUp, FileText, MessageSquare, Globe } from 'lucide-react';

function NexlyIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="nx-land" x1="0" y1="26" x2="56" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2EC4B6"/>
          <stop offset="45%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <path d="M5 46 L5 6 L22 42 L22 6" stroke="url(#nx-land)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 6 L51 46" stroke="url(#nx-land)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M51 6 L30 46" stroke="url(#nx-land)" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

const features = [
  { icon: Sparkles, title: 'AI-Powered Resume Builder', desc: 'Generate professional resume content instantly with AI tailored to your field and target role.', color: 'from-violet-500 to-indigo-600', bg: 'bg-violet-50' },
  { icon: Users, title: 'Career Network', desc: 'Connect with professionals, follow peers, and grow your career community.', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
  { icon: Rss, title: 'Career Feed', desc: 'Share milestones, posts, and updates with your professional network.', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50' },
  { icon: Briefcase, title: 'Job Tracker', desc: 'Track all your applications in one place with status updates and notes.', color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50' },
  { icon: BarChart3, title: 'Progress Insights', desc: 'Visualize your job search and see which applications are moving forward.', color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and stored securely. Your privacy is our priority.', color: 'from-slate-500 to-gray-600', bg: 'bg-slate-50' },
  { icon: Zap, title: 'Fast PDF Export', desc: 'Export your resume as a clean, print-ready PDF in one click.', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50' },
  { icon: MessageSquare, title: 'Direct Messaging', desc: 'Chat with connections, share files and voice messages in real time.', color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50' },
  { icon: Globe, title: 'Public Resume Link', desc: 'Share your resume with a unique link — no login required for viewers.', color: 'from-teal-500 to-green-600', bg: 'bg-teal-50' },
];

const testimonials = [
  { name: 'Sarah K.', role: 'Software Engineer', text: 'Nexly helped me land 3 interviews in one week. The AI resume builder is a game changer!', avatar: 'S', color: 'from-violet-400 to-indigo-500' },
  { name: 'Mohamed A.', role: 'Product Manager', text: 'I love the job tracker. Finally a place where I can manage all my applications without spreadsheets.', avatar: 'M', color: 'from-emerald-400 to-teal-500' },
  { name: 'Leila B.', role: 'UX Designer', text: 'The career network is so useful. I connected with 20+ professionals in my first week.', avatar: 'L', color: 'from-pink-400 to-rose-500' },
];

const stats = [
  { label: 'Active Users', value: 'Growing', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Resumes Created', value: '500+', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Jobs Tracked', value: '1K+', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Interviews Landed', value: '100+', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NexlyIcon className="w-8 h-8" />
            <span className="font-bold text-gray-900 text-lg tracking-tight">Nexly</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-gray-900 transition-colors">Reviews</a>
            <Link to="/promo" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors">
              <span>🎬</span> Promo
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 hidden sm:block">
              Log in
            </Link>
            <Link to="/register"
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-sm"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-96 h-64 bg-teal-100 rounded-full blur-3xl opacity-40 pointer-events-none -translate-x-1/2" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-indigo-100 shadow-sm">
            <Sparkles size={13} className="text-indigo-500" />
            <span>Your Career, Powered by AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            The social platform<br />
            <span className="bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              built for your career.
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Build AI-powered resumes, track your job applications, connect with professionals, and share your career journey — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register"
              className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-all shadow-lg"
              style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
              Join Nexly Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-50 transition-all">
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {['Free forever', 'No credit card', 'Cancel anytime', '100% secure'].map(b => (
              <div key={b} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="text-center group">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Everything you need to grow</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">One platform to build, connect, and land the job you deserve.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, bg }) => (
              <div key={title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-gray-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Get started in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300" />
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up free and build your professional profile in minutes. No credit card, no catch.', icon: Users, color: 'from-teal-500 to-cyan-600' },
              { step: '02', title: 'Build & Connect', desc: 'Use AI to craft your perfect resume, then grow your network by connecting with professionals.', icon: Sparkles, color: 'from-indigo-500 to-violet-600' },
              { step: '03', title: 'Track & Land the Job', desc: 'Manage all your applications, export your PDF resume, and apply with confidence.', icon: TrendingUp, color: 'from-purple-500 to-pink-600' },
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="relative text-center group">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={32} className="text-white" />
                </div>
                <div className="absolute top-0 right-1/4 text-6xl font-black text-gray-50 -z-0 select-none">{step}</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3 relative z-10">{title}</h3>
                <p className="text-gray-500 leading-relaxed relative z-10">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-bold text-gray-900">Loved by professionals</h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[1,2,3,4,5].map(i => <Star key={i} size={18} className="text-amber-400 fill-amber-400" />)}
              <span className="text-sm text-gray-500 ml-2">4.9 / 5 from 1,200+ reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, avatar, color }) => (
              <div key={name}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 mx-6 mb-12">
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative px-8 py-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to take the next step?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">Join Nexly and build the career you've always wanted. It's completely free.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl text-base font-bold hover:bg-white/90 transition-all shadow-lg">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <CheckCircle size={16} className="text-white" />No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <NexlyIcon className="w-7 h-7" />
              <span className="font-bold text-gray-700 text-base">Nexly</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-gray-600 transition-colors">Features</a>
              <a href="#how" className="hover:text-gray-600 transition-colors">How It Works</a>
              <a href="#testimonials" className="hover:text-gray-600 transition-colors">Reviews</a>
              <Link to="/register" className="hover:text-gray-600 transition-colors">Sign Up</Link>
              <Link to="/login" className="hover:text-gray-600 transition-colors">Log In</Link>
              <Link to="/promo" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-medium">🎬 Promo</Link>
            </div>
            <span className="text-sm text-gray-400">© 2026 Nexly. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
