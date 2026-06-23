import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3005/api',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

export default apiClient;
