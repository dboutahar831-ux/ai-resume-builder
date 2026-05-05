import { Link } from 'react-router-dom';
import { Briefcase, Sparkles, Shield, Zap, BarChart3, Users, CheckCircle, ArrowRight, Rss } from 'lucide-react';

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
  { icon: Sparkles, title: 'AI-Powered Resume Builder', desc: 'Generate professional resume content instantly with AI tailored to your field and target role.' },
  { icon: Users, title: 'Career Network', desc: 'Connect with professionals, follow peers, and grow your career community.' },
  { icon: Rss, title: 'Career Feed', desc: 'Share milestones, posts, and updates with your professional network.' },
  { icon: Briefcase, title: 'Job Tracker', desc: 'Track all your applications in one place with status updates and notes.' },
  { icon: BarChart3, title: 'Progress Insights', desc: 'Visualize your job search and see which applications are moving forward.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and stored securely. Your privacy is our priority.' },
  { icon: Zap, title: 'Fast PDF Export', desc: 'Export your resume as a clean, print-ready PDF in one click.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NexlyIcon className="w-8 h-8" />
            <span className="font-bold text-gray-900 text-lg">Nexly</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
              Log in
            </Link>
            <Link to="/register"
              className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-indigo-100">
          <Sparkles size={13} />Your Career, Connected
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          The social platform<br />
          <span className="bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">built for your career.</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Build AI-powered resumes, track your job applications, connect with professionals, and share your career journey — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Join Nexly Free <ArrowRight size={18} />
          </Link>
          <Link to="/login"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-50 transition-all">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-bold text-gray-900">Everything you need to grow your career</h2>
            <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">One platform to build, connect, and land the job you deserve.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl font-bold text-gray-900">Get started in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up free and build your professional profile. No credit card, no catch.' },
              { step: '02', title: 'Build & Connect', desc: 'Use AI to craft your resume, then grow your network by connecting with professionals in your field.' },
              { step: '03', title: 'Track & Land the Job', desc: 'Manage all your applications, export your PDF resume, and apply with confidence.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-7xl font-bold text-indigo-50 mb-4 leading-none">{step}</div>
                <h3 className="font-semibold text-xl text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to take the next step?</h2>
          <p className="text-indigo-200 text-lg mb-10">Join Nexly and build the career you've always wanted. It's completely free.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl text-base font-semibold hover:bg-indigo-50 transition-all">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-2 text-indigo-200 text-sm">
              <CheckCircle size={16} />No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <NexlyIcon className="w-6 h-6" />
            <span className="font-semibold text-gray-600">Nexly</span>
          </div>
          <span>© 2026 Nexly. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
