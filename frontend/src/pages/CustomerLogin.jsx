import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(() => {
    const fromState =
      location.state?.message ||
      (location.state?.sessionExpired ? 'Your session has expired. Please log in again.' : null);
    if (fromState) return fromState;
    try {
      const stored = sessionStorage.getItem('carboniq_session_expired');
      if (stored) {
        sessionStorage.removeItem('carboniq_session_expired');
        return stored;
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleAuthExpired = (e) => {
      setSessionMessage(e.detail?.message || 'Your session has expired. Please log in again.');
    };
    window.addEventListener('carboniq-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('carboniq-auth-expired', handleAuthExpired);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSessionMessage(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Card inner glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Back link */}
        <Link
          to="/select-account"
          id="back-to-account-selection"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '1.75rem',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={14} />
          Back to account selection
        </Link>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '1rem',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
            }}
          >
            <Leaf size={26} />
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              marginBottom: '0.4rem',
              color: 'var(--text-primary)',
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Sign in to your Carbonix AI workspace.
          </p>
        </div>

        {/* Session expired alert */}
        {sessionMessage && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-review-bg)',
              border: '1px solid var(--status-review-border)',
              color: 'var(--status-review-color)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{sessionMessage}</span>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-flagged-bg)',
              border: '1px solid var(--status-flagged-border)',
              color: 'var(--status-flagged-color)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-login-email">
              Email Address
            </label>
            <input
              id="customer-login-email"
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="customer-login-password">
              Password
            </label>
            <div className="input-with-icon">
              <input
                id="customer-login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="customer-login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner"
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                  }}
                />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            id="go-to-signup"
            style={{ color: 'var(--primary-bright)', fontWeight: 600 }}
          >
            Create one
          </Link>
        </div>

        {/* Trust footer */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={13} color="var(--esg-accent)" />
          <span>Deterministic calculations. Audit-ready compliance.</span>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
