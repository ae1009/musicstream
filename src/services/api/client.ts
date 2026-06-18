import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // Requerido por ngrok para saltarse la página de advertencia del browser
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (__DEV__) {
      console.warn('[API Error]', err.config?.url, err.message);
    }
    return Promise.reject(err);
  }
);

export default apiClient;
