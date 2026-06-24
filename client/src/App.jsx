import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MissionControl from './pages/Missioncontrol';
import CareerIntelligence from './pages/CareerIntelligence';
import ApplicationDossier from './pages/ApplicationDossier';
import Pipeline from './pages/Pipeline';
import Login from './pages/Login';
import Register from './pages/Register';


function PageTransition({ children }) {
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  }, [location.pathname]);

  return (
    <div ref={ref} style={{ willChange: 'opacity, transform' }}>
      {children}
    </div>
  );
}

/* ── ProtectedRoute ────────────────────────────────────────
   Wraps any page that requires a logged-in user. While the
   initial session check is still running, we show nothing
   (briefly) rather than flashing a redirect to a user who is
   actually logged in but whose session just hasn't verified yet.
─────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-caption)', color: 'var(--ink-faint)' }}>
          Verifying session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ── Inner app (needs router + auth context) ─────────────── */
function AppInner() {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show the navbar on auth pages — keeps login/register
  // feeling like a focused single-task screen, not the full app shell
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-root">
      {!hideNavbar && <Navbar />}

      <main
        style={{
          paddingTop: hideNavbar ? 0 : '56px',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <PageTransition key={location.pathname}>
          <Routes>
            {/* Public routes — accessible without logging in */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

            {/* Protected routes — every existing page now requires auth */}
            <Route path="/" element={<ProtectedRoute><MissionControl /></ProtectedRoute>} />
            <Route path="/new" element={<ProtectedRoute><CareerIntelligence /></ProtectedRoute>} />
            <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDossier /></ProtectedRoute>} />
            <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
}

/* ── Root export ──────────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;