import axios from 'axios';

// La URL base apunta a nuestro proxy de Next.js que redirige al backend
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de REQUEST: adjunta JWT automáticamente ─────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor de RESPONSE: si el token expiró, redirige al login ──────────
// En estos endpoints un 401 significa "credenciales inválidas", no sesión vencida
const LOGIN_URLS = ['/auth/login', '/auth/change-expired-password'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !LOGIN_URLS.includes(error.config?.url)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
