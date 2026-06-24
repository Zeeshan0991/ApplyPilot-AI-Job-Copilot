import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="login-card" style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ marginBottom: '24px' }}>
          <span style={{ color: 'var(--teal)', fontSize: '20px' }}>✦</span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            fontWeight: 600, color: 'var(--ink)', marginTop: '12px',
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-faint)', marginTop: '4px' }}>
            Log in to your mission control.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block', fontSize: 'var(--text-micro)', color: 'var(--ink-faint)',
              fontFamily: 'var(--font-data)', letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="field"
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 'var(--text-micro)', color: 'var(--ink-faint)',
              fontFamily: 'var(--font-data)', letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="field"
            />
          </div>

          {error && (
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="action-primary"
            style={{ padding: '12px', borderRadius: '8px', marginTop: '6px' }}
          >
            {loading ? 'Logging in...' : 'Log In →'}
          </button>
        </form>

        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--ink-faint)', marginTop: '20px', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--teal)', textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;