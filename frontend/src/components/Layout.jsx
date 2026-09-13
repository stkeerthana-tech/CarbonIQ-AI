import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function Layout() {
  const { isAuthenticated, loading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyContextLoading, setCompanyContextLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState(() => {
    try {
      const saved = localStorage.getItem('carboniq_active_company');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchedUserRef = React.useRef(null);

  // Load companies
  useEffect(() => {
    if (!isAuthenticated) {
      fetchedUserRef.current = null;
      setCompanyContextLoading(false);
      return;
    }

    if (fetchedUserRef.current === user?.id && companies.length > 0) {
      return;
    }

    let isMounted = true;
    setCompanyContextLoading(true);
    async function loadCompanies() {
      try {
        const res = await api.companies.list();
        if (!isMounted) return;

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCompanies(res.data);
          fetchedUserRef.current = user?.id;

          // Re-verify current active company exists in authorized companies list
          const found = activeCompany ? res.data.find((c) => String(c.id) === String(activeCompany.id)) : null;
          const targetCompany = found || res.data[0];

          setActiveCompany(targetCompany);
          localStorage.setItem('carboniq_active_company', JSON.stringify(targetCompany));
        } else if (user?.role === 'admin') {
          // If no company exists yet, create default organization for admin
          const created = await api.companies.create({
            company_name: 'Carboniq Enterprise Ltd',
            industry: 'Technology & Logistics',
            location: 'India',
          });
          if (created.success && created.data && isMounted) {
            setCompanies([created.data]);
            setActiveCompany(created.data);
            localStorage.setItem('carboniq_active_company', JSON.stringify(created.data));
            fetchedUserRef.current = user?.id;
          }
        } else {
          setCompanies([]);
          setActiveCompany(null);
          localStorage.removeItem('carboniq_active_company');
          fetchedUserRef.current = user?.id;
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        if (isMounted) setCompanyContextLoading(false);
      }
    }

    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const handleSelectCompany = (company) => {
    setActiveCompany(company);
    localStorage.setItem('carboniq_active_company', JSON.stringify(company));
    window.dispatchEvent(new CustomEvent('carboniq-company-changed', { detail: company }));
  };

  if (loading || companyContextLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          activeCompany={activeCompany}
          companies={companies}
          onSelectCompany={handleSelectCompany}
        />

        <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet context={{ activeCompany, companies, onSelectCompany: handleSelectCompany }} />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-container {
            transform: translateX(0) !important;
          }
          .main-content-wrapper {
            margin-left: 260px;
          }
          .mobile-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
