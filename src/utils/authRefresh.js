// Keeps the access token (localStorage 'authToken') continuously fresh via the
// httpOnly refresh-token cookie, so the many per-page isTokenExpired/handleAutoLogout
// checks never see an expired token during active use. A short-lived access token
// (30m) plus a long-lived refresh token is the standard SPA auth pattern; this file
// is the one place that knows how to renew the access token, so none of the existing
// page components needed to change.
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API;
const REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 minutes before the access token actually expires
const POLL_INTERVAL_MS = 60 * 1000; // when logged out (or refresh fails), check again in a minute

let refreshTimer = null;
let isRefreshing = false;
let interceptorInstalled = false;

const decodeExpiryMs = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const refreshAccessToken = async () => {
  if (isRefreshing) return null;
  isRefreshing = true;
  try {
    const { data } = await axios.post(
      `${API_BASE}/poc/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    if (data?.token) {
      localStorage.setItem('authToken', data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  } finally {
    isRefreshing = false;
  }
};

const scheduleNext = (delayMs) => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(tick, Math.max(delayMs, 0));
};

const tick = async () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    scheduleNext(POLL_INTERVAL_MS);
    return;
  }

  const expMs = decodeExpiryMs(token);
  if (!expMs) {
    scheduleNext(POLL_INTERVAL_MS);
    return;
  }

  const refreshAt = expMs - REFRESH_BUFFER_MS;
  const now = Date.now();

  if (now >= refreshAt) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const newExpMs = decodeExpiryMs(newToken);
      const nextDelay = newExpMs
        ? Math.max(newExpMs - REFRESH_BUFFER_MS - Date.now(), POLL_INTERVAL_MS)
        : POLL_INTERVAL_MS;
      scheduleNext(nextDelay);
    } else {
      // Refresh token itself is missing/expired/invalid — nothing more to do here.
      // The existing per-page token-expiry checks will log the user out on next action.
      scheduleNext(POLL_INTERVAL_MS);
    }
  } else {
    scheduleNext(refreshAt - now);
  }
};

export const startAuthRefreshLoop = () => {
  tick();
};

// Safety net for edge cases the proactive loop can miss (laptop sleep, clock drift):
// if any request still comes back 401, try one silent refresh and retry it once.
export const installAuthRefreshInterceptor = () => {
  if (interceptorInstalled) return;
  interceptorInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const isAuthRoute = originalRequest?.url?.includes('/poc/api/auth/');

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retried &&
        !isAuthRoute
      ) {
        originalRequest._retried = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );
};
