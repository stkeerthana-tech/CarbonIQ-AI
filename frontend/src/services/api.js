/**
 * Centralized API service for Carboniq AI
 * Communicates exclusively with the Flask backend REST API.
 * Never connects directly to SQLite or CSV.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api';

/**
 * Helper to retrieve stored auth token
 */
export function getAuthToken() {
  try {
    return localStorage.getItem('carboniq_token');
  } catch (e) {
    return null;
  }
}

/**
 * Base request handler with authentication headers and consistent error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Automatic 401 Unauthorized / Expired session handling
      const isAuthError = response.status === 401 || (response.status === 422 && typeof data?.msg === 'string' && data.msg.toLowerCase().includes('token'));
      if (isAuthError && !endpoint.includes('/auth/login')) {
        try {
          localStorage.removeItem('carboniq_token');
          localStorage.removeItem('carboniq_user');
          sessionStorage.setItem('carboniq_session_expired', 'Your session has expired. Please log in again.');
        } catch (e) {}
        window.dispatchEvent(
          new CustomEvent('carboniq-auth-expired', {
            detail: { message: 'Your session has expired. Please log in again.' },
          })
        );
      }

      const errorMessage = data?.error || data?.message || data?.msg || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    // Network or server unreachable error
    const netError = new Error('Unable to connect to Carboniq AI backend. Please verify the backend is running.');
    netError.status = 0;
    throw netError;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request('/auth/me'),
  },

  // Activities
  activities: {
    list: (companyId) => {
      const query = companyId ? `?company_id=${companyId}` : '';
      return request(`/activities${query}`);
    },
    getById: (id) => request(`/activities/${id}`),
    create: (activityData) =>
      request('/activities', {
        method: 'POST',
        body: JSON.stringify(activityData),
      }),
    getSupported: () => request('/activities/supported'),
  },

  // Emissions (Deterministic on-demand calculation preview)
  emissions: {
    calculate: (data) =>
      request('/emissions/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Dashboard Aggregation
  dashboard: {
    get: (companyId) => request(`/dashboard/${companyId}`),
  },

  // Companies
  companies: {
    list: () => request('/companies'),
    getById: (id) => request(`/companies/${id}`),
    create: (data) =>
      request('/companies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // System Health
  health: {
    check: () => request('/health'),
  },

  // AI Insights (Lyzr agent — reasoning only, never recalculates numbers)
  ai: {
    getInsight: (companyId, context) =>
      request('/ai/insights', {
        method: 'POST',
        body: JSON.stringify({ company_id: companyId, context }),
      }),
  },
};

export default api;
