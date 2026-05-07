import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import ResumeBuilder from './pages/ResumeBuilder';
import JobTracker from './pages/JobTracker';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Friends from './pages/Friends';
import FriendProfile from './pages/FriendProfile';
import Messages from './pages/Messages';
import CoverLetters from './pages/CoverLetters';
import CoverLetterBuilder from './pages/CoverLetterBuilder';
import PublicResume from './pages/PublicResume';
import './App.css';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

function NotFound() {
  const isLoggedIn = !!localStorage.getItem('token');
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
      <div className="text-8xl font-black text-gray-100 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-3">
        <Link to={isLoggedIn ? '/home' : '/'}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
          {isLoggedIn ? 'Go to Feed' : 'Go Home'}
        </Link>
        {isLoggedIn && (
          <Link to="/dashboard"
            className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
            Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/cv/:slug" element={<PublicResume />} />

          <Route path="/home"       element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/resumes"    element={<PrivateRoute><Resumes /></PrivateRoute>} />
          <Route path="/resumes/new"       element={<PrivateRoute><ResumeBuilder /></PrivateRoute>} />
          <Route path="/resumes/:id/edit"  element={<PrivateRoute><ResumeBuilder /></PrivateRoute>} />
          <Route path="/jobs"       element={<PrivateRoute><JobTracker /></PrivateRoute>} />
          <Route path="/cover-letters"          element={<PrivateRoute><CoverLetters /></PrivateRoute>} />
          <Route path="/cover-letters/new"      element={<PrivateRoute><CoverLetterBuilder /></PrivateRoute>} />
          <Route path="/cover-letters/:id/edit" element={<PrivateRoute><CoverLetterBuilder /></PrivateRoute>} />
          <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/settings"   element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/friends"    element={<PrivateRoute><Friends /></PrivateRoute>} />
          <Route path="/friends/:id" element={<PrivateRoute><FriendProfile /></PrivateRoute>} />
          <Route path="/messages"   element={<PrivateRoute><Messages /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
