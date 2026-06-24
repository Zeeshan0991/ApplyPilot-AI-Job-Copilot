import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = [
    { path: '/', label: 'Mission Control' },
    { path: '/new', label: 'New Application' },
    { path: '/pipeline', label: 'Pipeline' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(11,12,14,0.85)',
      borderBottom: '1px solid var(--line)',
      backdropFilter: 'blur(12px)',
    }}>

      {/* Wordmark */}
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
      }}>
        <span style={{ color: 'var(--teal)', fontSize: '14px' }}>✦</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}>
          ApplyPilot
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? 'var(--ink)' : 'var(--ink-faint)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                background: isActive ? 'var(--surface-raised)' : 'transparent',
                border: isActive ? '1px solid var(--line-bright)' : '1px solid transparent',
                transition: 'all var(--duration-transition) var(--ease-standard)',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'var(--font-data)', fontSize: '11px',
          color: 'var(--ink-faint)', letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <span className="status-dot status-dot--live" style={{ background: 'var(--teal)' }} />
          {user?.name || 'System Active'}
        </div>

        <button
          onClick={handleLogout}
          className="action-secondary"
          style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;