import axios from 'axios';

// The JWT is kept in sessionStorage (cleared when the tab closes) under this key.
export const TOKEN_KEY = 'bb_token';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5236/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Attach the bearer token (if we have one) to every outgoing request so the protected API
// endpoints accept it.
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Attach a readable failure reason so the UI can tell "server error" from "server unreachable".
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 means the token is missing/expired - drop it and send the user back to login.
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    if (error.response) {
      const body = error.response.data;
      error.friendlyMessage = `Server error ${error.response.status}: ` +
        (typeof body === 'string' ? body : JSON.stringify(body));
    } else if (error.request) {
      error.friendlyMessage =
        `No response from API at ${API.defaults.baseURL}. ` +
        `Is the backend running (dotnet run) and is MySQL up?`;
    } else {
      error.friendlyMessage = error.message;
    }
    console.error('[API ERROR]', error.friendlyMessage, error);
    return Promise.reject(error);
  }
);

export default API;