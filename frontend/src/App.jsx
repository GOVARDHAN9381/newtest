import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Interviews from './pages/Interviews';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import History from './pages/History';
import LiveInterview from './pages/LiveInterview';
import InterviewResult from './pages/InterviewResult';
import ResumeAnalysis from './pages/ResumeAnalysis';
import Challenges from './pages/Challenges';
import ScannerExample from './pages/ScannerExample';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: '🏠 Dashboard' },
  { path: '/interviews', label: '🎙️ Interviews' },
  { path: '/courses', label: '📚 Courses' },
  { path: '/history', label: '📊 History' },
  { path: '/resume', label: '📄 Resume Analysis' },
  { path: '/scanner', label: '📷 QR Scanner' },
  { path: '/challenges', label: '💻 Coding Challenges' },
];

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const noSidebarRoutes = ['/', '/login', '/signup'];
  if (noSidebarRoutes.some(r => location.pathname === r)) return null;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  };

  return (
    <>
      <div className="mobile-top-bar">
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>Interviu AI</h2>
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} color="var(--text-primary)" /> : <Menu size={28} color="var(--text-primary)" />}
        </button>
      </div>

      {isOpen && <div className="mobile-overlay" onClick={() => setIsOpen(false)} />}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h2 className="gradient-text sidebar-brand" style={{ marginBottom: '2rem', paddingLeft: '1rem' }}>Interviu AI</h2>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
          className="btn-secondary"
          style={{
            border: 'none',
            textAlign: 'left',
            background: location.pathname === item.path ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: location.pathname === item.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: location.pathname === item.path ? 600 : 400,
            borderLeft: location.pathname === item.path ? '3px solid var(--accent-primary)' : '3px solid transparent',
            borderRadius: '0 8px 8px 0',
            transition: 'all 0.2s'
          }}
        >
          {item.label}
        </Link>
      ))}
      <div style={{ flex: 1 }} />
      <button
        onClick={handleLogout}
        style={{
          background: 'transparent',
          border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--danger)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          transition: 'all 0.2s'
        }}
      >
        🚪 Logout
      </button>
      </div>
    </>
  );
}

function AppContent() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const noSidebarRoutes = ['/', '/login', '/signup'];
  const hasSidebar = !noSidebarRoutes.some(r => location.pathname === r);

  return (
    <div className="page-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main
        className={hasSidebar ? 'main-content' : ''}
        style={{ flex: 1, ...(hasSidebar ? {} : { margin: 0, padding: 0 }) }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/interview/live" element={<ProtectedRoute><LiveInterview /></ProtectedRoute>} />
          <Route path="/interview/result/:id" element={<ProtectedRoute><InterviewResult /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><ScannerExample /></ProtectedRoute>} />
          <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const basename = import.meta.env.DEV ? '/' : '/newtest';
  return (
    <BrowserRouter basename={basename}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
