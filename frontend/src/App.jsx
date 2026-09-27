import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Role Guard Component
function RoleGuard({ allowedRoles, children, fallback = '/dashboard' }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const role = user?.role || 'company_user';
  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}

// Auth / Onboarding pages
import SplashScreen from './pages/SplashScreen';
import AccountSelection from './pages/AccountSelection';
import CustomerLogin from './pages/CustomerLogin';
import StaffLogin from './pages/StaffLogin';
import Register from './pages/Register';

// Authenticated pages
import Dashboard from './pages/Dashboard';
import AddActivity from './pages/AddActivity';
import ActivityHistory from './pages/ActivityHistory';
import EmissionDetails from './pages/EmissionDetails';
import AuditTrail from './pages/AuditTrail';
import ReviewRecords from './pages/ReviewRecords';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CoraAssistant from './pages/CoraAssistant';
import CalculatePreview from './pages/CalculatePreview';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Splash / Onboarding ──────────────────────────────────── */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/select-account" element={<AccountSelection />} />

            {/* ── Public Auth Routes ───────────────────────────────────── */}
            {/* Company user login */}
            <Route path="/login/customer" element={<CustomerLogin />} />
            {/* Staff (Auditor / Administrator) login */}
            <Route path="/login/staff" element={<StaffLogin />} />
            {/* Public company user signup */}
            <Route path="/signup" element={<Register />} />
            {/* Legacy /login — redirect to account selection */}
            <Route path="/login" element={<Navigate to="/select-account" replace />} />
            {/* Legacy /register — redirect to signup */}
            <Route path="/register" element={<Navigate to="/signup" replace />} />

            {/* ── Authenticated Application Routes ─────────────────────── */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/activities/new"
                element={
                  <RoleGuard allowedRoles={['admin', 'auditor']}>
                    <AddActivity />
                  </RoleGuard>
                }
              />
              <Route path="/activities" element={<ActivityHistory />} />
              <Route path="/emissions/calculate" element={<CalculatePreview />} />
              <Route path="/emissions/:id" element={<EmissionDetails />} />
              <Route path="/cora" element={<CoraAssistant />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route
                path="/reviews"
                element={
                  <RoleGuard allowedRoles={['admin', 'auditor']}>
                    <ReviewRecords />
                  </RoleGuard>
                }
              />
              <Route path="/company" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />

              {/* Admin routes — backend RBAC enforces actual access */}
              <Route
                path="/admin/users"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <div style={{ padding: '2rem' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>User Management</h2>
                    </div>
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <div style={{ padding: '2rem' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Company Management</h2>
                    </div>
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <div style={{ padding: '2rem' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Role Management</h2>
                    </div>
                  </RoleGuard>
                }
              />
            </Route>

            {/* ── Fallback ─────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
