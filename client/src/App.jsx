import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
