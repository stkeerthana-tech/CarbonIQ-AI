import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Wait for auth check, then decide where to go
    if (loading) return;

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/select-account', { replace: true });
        }
      }, 500); // fade duration
    }, 1300); // splash display duration

    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, navigate]);

  return (
    <div
      className={`splash-screen${fadeOut ? ' fade-out' : ''}`}
      aria-label="Carbonix AI loading"
      role="status"
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 40% 30%, rgba(124, 58, 237, 0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Central atmospheric orb */}
      <div
        style={{
          position: 'relative',
          marginBottom: '2.5rem',
          animation: 'orbFloat 4s ease-in-out infinite',
        }}
      >
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 35%, rgba(139, 92, 246, 0.55) 0%, rgba(99, 51, 210, 0.35) 40%, rgba(59, 130, 246, 0.15) 70%, transparent 100%)',
            boxShadow:
              '0 0 60px rgba(124, 58, 237, 0.4), 0 0 120px rgba(124, 58, 237, 0.15), inset 0 0 40px rgba(139, 92, 246, 0.2)',
            animation: 'pulseGlow 3s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Inner core */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 40% 40%, #a78bfa 0%, #7c3aed 50%, #4c1d95 100%)',
              boxShadow: '0 0 30px rgba(167, 139, 250, 0.6)',
            }}
          />
          {/* ESG accent ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.08)',
            }}
          />
        </div>
      </div>

      {/* Product name */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            lineHeight: 1.1,
          }}
        >
          Carbonix{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI
          </span>
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
            marginBottom: '2.5rem',
          }}
        >
          Autonomous Carbon Intelligence &amp; ESG Compliance
        </p>

        {/* Loading dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--primary-bright)',
                  opacity: 0.7,
                  animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
        }}
      >
        <span
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--esg-accent)', display: 'inline-block' }}
        />
        Audit-ready &middot; Deterministic &middot; ESG Compliant
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;
