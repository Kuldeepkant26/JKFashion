import axios from 'axios';
import { getAppState } from '../store/useAppStore.js';

/**
 * Where the API lives.
 *
 * Defaults to the relative `/api/v1`, which the Vite dev proxy forwards to the
 * backend. Keeping it relative means the API is same-origin, so the refresh
 * cookie is first-party and CORS never applies — and the same build works
 * unchanged when the API is served from the site's own domain in production.
 *
 * Set VITE_API_BASE_URL only when the API lives on a different host.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Read from the store rather than localStorage, so a token that was just
 * rotated by a refresh is picked up immediately rather than on the next reload.
 */
axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = getAppState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/** Paths that must never trigger a refresh attempt — they ARE the auth flow. */
const NO_REFRESH = ['/auth/refresh', '/auth/login'];

/**
 * Single-flight: ten screens hitting 401 at once trigger one refresh, not ten.
 * Without this, parallel refreshes race and all but one get rejected as
 * replays — which the backend treats as token theft and drops every session.
 */
let refreshing = null;

const runRefresh = async () => {
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, null, {
    withCredentials: true,
  });
  const { user, accessToken } = data.data;
  getAppState().setAuth({ user, accessToken });
  return accessToken;
};

/** Flattens the API's error envelope into something components can render. */
const toApiError = (error) => {
  const res = error.response;
  const apiError = new Error(res?.data?.message || error.message || 'Something went wrong');
  apiError.status = res?.status;
  apiError.details = res?.data?.details || [];
  // Keyed by field so a form can show each message beside its own input.
  apiError.fieldErrors = Object.fromEntries(
    (res?.data?.details || []).filter((d) => d.field).map((d) => [d.field, d.message])
  );
  return apiError;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthPath = NO_REFRESH.some((p) => original?.url?.includes(p));

    if (status === 401 && original && !original._retried && !isAuthPath) {
      original._retried = true;

      try {
        refreshing =
          refreshing ||
          runRefresh().finally(() => {
            refreshing = null;
          });
        const token = await refreshing;

        original.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(original);
      } catch {
        getAppState().logout();
        return Promise.reject(toApiError(error));
      }
    }

    return Promise.reject(toApiError(error));
  }
);

/** Unwraps the { statusCode, success, message, data } envelope. */
export const unwrap = (response) => response.data?.data;

export default axiosInstance;
