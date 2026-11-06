import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjunta el token de sesión (JWT) a cada petición
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Si el servidor responde 401 (sin sesión, token vencido o inválido),
// borra la sesión guardada y manda al login.
// El propio login queda fuera: ahí un 401 solo significa "contraseña incorrecta".
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status;
    const url = (error.config && error.config.url) || '';
    const isLoginRequest = url.includes('/auth/login');

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
