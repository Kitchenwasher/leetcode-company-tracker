import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'leettracker_jwt_access_token_v1';
const REFRESH_TOKEN_KEY = 'leettracker_jwt_refresh_token_v1';

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setStoredAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

const USER_PROFILE_KEY = 'leettracker_user_profile_v1';

export const getStoredUserProfile = <T = any>(): T | null => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUserProfile = (user: any | null) => {
  if (user && user.id && user.id !== 'guest') {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_PROFILE_KEY);
  }
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return true;
    // 15 seconds buffer to prevent edge-case race conditions
    return Date.now() < parsed.exp * 1000 - 15000;
  } catch {
    return false;
  }
};

// API Endpoints Configuration
const formatUrl = (url?: string) => {
  if (!url) return '/api';
  return url.endsWith('/api') ? url : url.replace(/\/+$/, '') + '/api';
};

const PRIMARY_URL = formatUrl(import.meta.env.VITE_API_URL);
const FALLBACK_URL = import.meta.env.VITE_FALLBACK_API_URL
  ? formatUrl(import.meta.env.VITE_FALLBACK_API_URL)
  : '';
const TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '15000', 10);

// Circuit Breaker State
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

export const isCircuitOpen = (): boolean => {
  if (!FALLBACK_URL) return false;
  return Date.now() < circuitOpenUntil;
};

export const getActiveBaseURL = (): string => {
  if (FALLBACK_URL && isCircuitOpen()) {
    return FALLBACK_URL;
  }
  return PRIMARY_URL;
};

export const api = axios.create({
  baseURL: getActiveBaseURL(),
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HttpOnly refresh token cookie
});

// Attach access token to requests & ensure active base URL and adequate route-specific timeouts
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getActiveBaseURL();
  const token = getStoredAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Dynamic route-specific timeouts:
  // - AI solution generation: 120s (complex LLM reasoning)
  // - Auth & session operations: 25s (allows for serverless DB cold-start wake-up & bcrypt hashing)
  // - General API queries: minimum 15s (prevents 2.5s false timeout kills)
  const url = config.url || '';
  if (url.includes('/ai-solution') || (url.includes('/solution') && url.includes('regenerate=true'))) {
    config.timeout = 120000;
  } else if (url.includes('/auth/')) {
    config.timeout = 25000;
  } else {
    config.timeout = Math.max(config.timeout || 0, TIMEOUT_MS, 15000);
  }

  return config;
});

// Refresh token queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // If request succeeded on primary, reset failure counter
    if (response.config.baseURL === PRIMARY_URL) {
      consecutiveFailures = 0;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _failoverRetried?: boolean; _retry?: boolean }) | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. Latency / Network Failover: if Primary timed out or errored and Fallback is configured
    const isTimeoutOrNetwork =
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.code === 'ERR_NETWORK' ||
      (error.response && [502, 503, 504].includes(error.response.status));

    if (
      FALLBACK_URL &&
      !originalRequest._failoverRetried &&
      originalRequest.baseURL === PRIMARY_URL &&
      isTimeoutOrNetwork
    ) {
      consecutiveFailures++;
      if (consecutiveFailures >= 2) {
        circuitOpenUntil = Date.now() + 60000; // Trip circuit breaker for 60s
        console.warn(`[API Circuit Breaker] Primary API slow/unreachable. Switched to Fallback for 60s: ${FALLBACK_URL}`);
      }

      originalRequest._failoverRetried = true;
      originalRequest.baseURL = FALLBACK_URL;
      return api(originalRequest);
    }

    // 2. Token refresh interceptor on 401
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getStoredRefreshToken();
        const { data } = await axios.post(
          `${getActiveBaseURL()}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        setStoredAccessToken(newAccessToken);
        if (data.refreshToken) {
          setStoredRefreshToken(data.refreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        isRefreshing = false;
        setStoredAccessToken(null);
        setStoredRefreshToken(null);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
