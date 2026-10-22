const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = null;
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('autopay_token');
    }
    return this.token;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('autopay_token', token);
    }
  }

  setRefreshToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autopay_refresh_token', token);
    }
  }

  clearTokens() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('autopay_token');
      localStorage.removeItem('autopay_refresh_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Token expired — try refresh
        if (response.status === 401 && typeof window !== 'undefined') {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            config.headers.Authorization = `Bearer ${this.getToken()}`;
            const retry = await fetch(url, config);
            return await retry.json();
          }
          // Refresh failed — logout
          this.clearTokens();
          window.location.href = '/login';
          return;
        }

        throw {
          status: response.status,
          code: data.code || 'ERROR',
          message: data.message || 'Something went wrong',
          errors: data.errors || [],
        };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      };
    }
  }

  async refreshAccessToken() {
    try {
      const refreshToken = localStorage.getItem('autopay_refresh_token');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setToken(data.data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  // ---- Auth ----
  signup(body) {
    return this.request('/auth/signup', { method: 'POST', body });
  }

  login(body) {
    return this.request('/auth/login', { method: 'POST', body });
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // ---- Wallet ----
  getBalance() {
    return this.request('/wallet/balance');
  }

  fundWallet(body) {
    return this.request('/wallet/fund', { method: 'POST', body });
  }

  // ---- Payments ----
  buyAirtime(body) {
    return this.request('/payments/airtime', { method: 'POST', body });
  }

  buyData(body) {
    return this.request('/payments/data', { method: 'POST', body });
  }

  payElectricity(body) {
    return this.request('/payments/electricity', { method: 'POST', body });
  }

  transferFunds(body) {
    return this.request('/payments/transfer', { method: 'POST', body });
  }

  getHistory(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/payments/history${qs ? `?${qs}` : ''}`);
  }

  queryStatus(reference) {
    return this.request(`/payments/status/${reference}`);
  }

  // ---- Billers ----
  getSupportedServices() {
    return this.request('/billers/supported');
  }

  // ---- AutoPay ----
  getAutopayRules() {
    return this.request('/autopay/rules');
  }

  createAutopayRule(body) {
    return this.request('/autopay/rules', { method: 'POST', body });
  }

  updateAutopayRule(id, body) {
    return this.request(`/autopay/rules/${id}`, { method: 'PUT', body });
  }

  deleteAutopayRule(id) {
    return this.request(`/autopay/rules/${id}`, { method: 'DELETE' });
  }

  // ---- PayBack AI Copilot ----
  getPaybackDisputes() {
    return this.request('/payback/disputes');
  }

  getPaybackDossier(id) {
    return this.request(`/payback/disputes/${id}`);
  }

  simulatePaybackDispute(body) {
    return this.request('/payback/disputes/simulate', { method: 'POST', body });
  }

  triggerPayLaterRescue(body) {
    return this.request('/payback/recovery/rescue', { method: 'POST', body });
  }
}

const api = new ApiClient();
export default api;
