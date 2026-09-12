import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddActivity from './pages/AddActivity';
import ActivityHistory from './pages/ActivityHistory';
import EmissionDetails from './pages/EmissionDetails';
import AuditTrail from './pages/AuditTrail';
import ReviewRecords from './pages/ReviewRecords';
import CompanyProfile from './pages/CompanyProfile';
import CalculatePreview from './pages/CalculatePreview';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Application Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/activities/new" element={<AddActivity />} />
            <Route path="/activities" element={<ActivityHistory />} />
            <Route path="/emissions/calculate" element={<CalculatePreview />} />
            <Route path="/emissions/:id" element={<EmissionDetails />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/reviews" element={<ReviewRecords />} />
            <Route path="/company" element={<CompanyProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
