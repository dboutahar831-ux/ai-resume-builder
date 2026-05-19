import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import './App.css';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Friends = lazy(() => import('./pages/Friends'));
const FriendProfile = lazy(() => import('./pages/FriendProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search = lazy(() => import('./pages/Search'));
const PublicResume = lazy(() => import('./pages/PublicResume'));
const Admin = lazy(() => import('./pages/Admin'));

function Loader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#6C5CE7] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

function NotFound() {
  const isLoggedIn = !!localStorage.getItem('token');
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center text-center px-6">
      <div className="text-8xl font-black text-gray-200 dark:text-gray-800 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-3">
        <Link to={isLoggedIn ? '/home' : '/'}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }}>
          {isLoggedIn ? 'Go to Feed' : 'Go Home'}
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cv/:slug" element={<PublicResume />} />

            <Route path="/home"                    element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/profile"                 element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/settings"                element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/friends"                 element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/friends/:id"             element={<PrivateRoute><FriendProfile /></PrivateRoute>} />
            <Route path="/messages"                element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="/notifications"           element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/search"                  element={<PrivateRoute><Search /></PrivateRoute>} />
            <Route path="/admin"                   element={<PrivateRoute><Admin /></PrivateRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
