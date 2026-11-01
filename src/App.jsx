import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DSA from './pages/DSA';
import Core from './pages/Core';
import Aptitude from './pages/Aptitude';
import Jobs from './pages/Jobs';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import Chat from './pages/Chat';
import Navbar from './components/Navbar';
import { ProfileProvider } from './context/ProfileContext';
import {
  clearStoredAuthToken,
  fetchProfile,
  getStoredAuthToken,
  setStoredAuthToken,
} from './lib/api';

const ProtectedRoute = ({ isReady, isLoggedIn, children }) => {
  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const AppContent = ({ authState, onAuthSuccess, onLogout }) => {
  const location = useLocation();
  const isAuthPage = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <div className="min-h-screen text-[#ffffff] bg-gradient-to-b from-[#09090f] to-[#050508]">
      {authState.user && !isAuthPage ? <Navbar user={authState.user} onLogout={onLogout} /> : null}
      <main className={authState.user && !isAuthPage ? 'pt-16' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onAuthSuccess={onAuthSuccess} />} />
          <Route path="/signup" element={<Signup onAuthSuccess={onAuthSuccess} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dsa"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <DSA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/core"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <Core />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aptitude"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <Aptitude />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analyzer"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <ResumeAnalyzer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analyzer/results"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <ResumeAnalyzer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute isReady={authState.isReady} isLoggedIn={Boolean(authState.user)}>
                <Chat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  const [authState, setAuthState] = useState({
    isReady: false,
    user: null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredAuthToken();

      if (!token) {
        setAuthState({ isReady: true, user: null });
        return;
      }

      try {
        const data = await fetchProfile(token);
        setAuthState({ isReady: true, user: data.user });
      } catch (error) {
        clearStoredAuthToken();
        setAuthState({ isReady: true, user: null });
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthState({ isReady: true, user: null });
    };

    window.addEventListener('prepbuddy:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('prepbuddy:auth-expired', handleAuthExpired);
  }, []);

  const handleAuthSuccess = ({ token, user }) => {
    setStoredAuthToken(token);
    setAuthState({ isReady: true, user });
  };

  const handleLogout = () => {
    clearStoredAuthToken();
    setAuthState({ isReady: true, user: null });
  };

  return (
    <Router>
      <ProfileProvider initialUser={authState.user}>
        <AppContent authState={authState} onAuthSuccess={handleAuthSuccess} onLogout={handleLogout} />
      </ProfileProvider>
    </Router>
  );
}

export default App;
