import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Settings, ArrowRight, Leaf } from 'lucide-react';

const ROLE_CARDS = [
  {
    id: 'company',
    icon: Building2,
    title: 'Company User',
    description: 'Track and manage your organization\'s carbon activity.',
    action: 'Sign in as Company User',
    route: '/login/customer',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.15)',
    borderActive: 'rgba(139, 92, 246, 0.45)',
  },
  {
    id: 'auditor',
    icon: ShieldCheck,
    title: 'Auditor',
    description: 'Review carbon records, evidence and flagged activities.',
    action: 'Sign in as Auditor',
    route: '/login/staff',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.12)',
    borderActive: 'rgba(59, 130, 246, 0.45)',
  },
  {
    id: 'admin',
    icon: Settings,
    title: 'Administrator',
    description: 'Manage organizations, users and system access.',
    action: 'Sign in as Administrator',
    route: '/login/staff',
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.1)',
    borderActive: 'rgba(251, 146, 60, 0.4)',
  },
];

export function AccountSelection() {
  const navigate = useNavigate();

  return (
    <div className="auth-bg" style={{ alignItems: 'flex-start', overflowY: 'auto' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '3rem 1.5rem 4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand header */}
        <div
          className="animate-fade-in"
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
              boxShadow: '0 4px 24px rgba(124, 58, 237, 0.35)',
              marginBottom: '1.25rem',
            }}
          >
            <Leaf size={28} color="#fff" />
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--primary-bright)',
              marginBottom: '0.75rem',
            }}
          >
            Carbonix AI
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
              lineHeight: 1.15,
            }}
          >
            Welcome to Carbonix AI
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
            Choose how you want to access the platform.
          </p>
        </div>

        {/* Role cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            width: '100%',
          }}
        >
          {ROLE_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                id={`role-card-${card.id}`}
                className={`role-card animate-fade-in-up delay-${idx + 1}`}
                onClick={() => navigate(card.route)}
                tabIndex={0}
                type="button"
                aria-label={`${card.title}: ${card.description}`}
              >
                {/* Card glow background */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${card.glowColor} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${card.glowColor}`,
                    border: `1px solid ${card.accentColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.accentColor,
                  }}
                >
                  <Icon size={22} />
                </div>

                {/* Content */}
                <div>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.35rem',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {card.title}
                  </div>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                {/* CTA */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: card.accentColor,
                    marginTop: 'auto',
                    paddingTop: '0.5rem',
                    borderTop: `1px solid ${card.accentColor}18`,
                  }}
                >
                  <span>{card.action}</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div
          className="animate-fade-in delay-5"
          style={{
            marginTop: '2.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <Leaf size={14} color="var(--esg-accent)" />
          <span>
            Your role and permissions are governed by the backend. Selecting a card only opens the appropriate login page.
          </span>
        </div>
      </div>
    </div>
  );
}

export default AccountSelection;
