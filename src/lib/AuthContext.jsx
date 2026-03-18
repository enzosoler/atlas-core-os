import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

// Auth state machine: 'loading' | 'authenticated' | 'unauthenticated' | 'error'
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
};

const AUTH_CHECK_TIMEOUT = 5000; // 5s max for auth check
const CROSS_TAB_CHANNEL = 'atlas_auth_channel';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  
  const broadcastChannelRef = useRef(null);
  const timeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastRevalidateRef = useRef(0); // throttle timestamp

  // ─────────────────────────────────────────────────────────────────
  // Initialize BroadcastChannel for cross-tab auth sync
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      broadcastChannelRef.current = new BroadcastChannel(CROSS_TAB_CHANNEL);
      broadcastChannelRef.current.onmessage = handleCrossTabMessage;
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to storage events');
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      } else {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Listen to visibility/focus changes to revalidate session
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitializedRef.current) {
        // Tab came into focus, revalidate session
        revalidateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', revalidateSession);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', revalidateSession);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Initial auth check on mount
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      checkAppState();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Cross-tab message handler
  // ─────────────────────────────────────────────────────────────────
  const handleCrossTabMessage = (event) => {
    if (event.data.type === 'LOGOUT') {
      // Another tab logged out
      clearAuthState();
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      window.location.href = '/Landing';
    } else if (event.data.type === 'LOGIN') {
      // Another tab logged in, revalidate
      revalidateSession();
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Storage fallback for cross-tab sync (for browsers without BroadcastChannel)
  // ─────────────────────────────────────────────────────────────────
  const handleStorageChange = (e) => {
    if (e.key === 'atlas_auth_logout') {
      clearAuthState();
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
      window.location.href = '/Landing';
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Clear all auth-related state and caches
  // ─────────────────────────────────────────────────────────────────
  const clearAuthState = () => {
    // Clear React state
    setUser(null);
    setAuthError(null);

    // Clear query cache
    try {
      const queryClient = window.__queryClient;
      if (queryClient) {
        queryClient.removeQueries();
      }
    } catch (e) {
      console.log('Query cache clear skipped');
    }

    // Clear localStorage
    localStorage.removeItem('atlas_locale');
    localStorage.removeItem('atlas_region');
    localStorage.removeItem('pending_plan');

    // Clear sessionStorage
    sessionStorage.clear();
  };

  // ─────────────────────────────────────────────────────────────────
  // Check app public settings (always needed)
  // ─────────────────────────────────────────────────────────────────
  const checkAppState = async () => {
    setAuthState(AUTH_STATES.LOADING);
    setAuthError(null);

    // Safety timeout
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), AUTH_CHECK_TIMEOUT)
    );

    try {
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true,
      });

      await Promise.race([
        appClient.get(`/prod/public-settings/by-id/${appParams.appId}`).then((settings) => {
          setAppPublicSettings(settings);
        }),
        timeout,
      ]);

      // If we have a token, check user auth; otherwise, unauthenticated
      if (appParams.token) {
        await checkUserAuth();
      } else {
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      }
    } catch (error) {
      console.error('App state check failed:', error);
      handleAuthError(error);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Validate user authentication (call base44.auth.me())
  // ─────────────────────────────────────────────────────────────────
  const checkUserAuth = async () => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('User auth check timeout')), AUTH_CHECK_TIMEOUT)
    );

    try {
      const currentUser = await Promise.race([base44.auth.me(), timeout]);

      setUser(currentUser);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      setAuthError(null);
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Session expired or invalid',
        });
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Revalidate session (e.g., on tab focus)
  // ─────────────────────────────────────────────────────────────────
  const revalidateSession = async () => {
    if (authState === AUTH_STATES.LOADING) return; // Already checking
    if (!appParams.token) return; // No token, nothing to revalidate

    // Throttle: no more than once every 30s
    const now = Date.now();
    if (now - lastRevalidateRef.current < 30_000) return;
    lastRevalidateRef.current = now;

    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      setAuthError(null);
    } catch (error) {
      // Session invalid
      clearAuthState();
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Handle auth errors with proper state transition
  // ─────────────────────────────────────────────────────────────────
  const handleAuthError = (error) => {
    const errorType = error.status === 403 && error.data?.extra_data?.reason
      ? error.data.extra_data.reason
      : error.status === 401 || error.status === 403
        ? 'auth_required'
        : 'unknown';

    setAuthError({
      type: errorType,
      message: error.message || 'Authentication error',
    });

    if (errorType === 'auth_required' || errorType === 'user_not_registered') {
      setAuthState(AUTH_STATES.ERROR);
    } else {
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Logout with cross-tab synchronization
  // ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    // Broadcast logout to other tabs
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
      } else {
        localStorage.setItem('atlas_auth_logout', Date.now().toString());
      }
    } catch (e) {
      console.log('Cross-tab logout notification failed');
    }

    // Clear local state
    clearAuthState();
    setAuthState(AUTH_STATES.UNAUTHENTICATED);

    // Call base44 logout (handles token cleanup)
    try {
      await base44.auth.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }

    // Hard redirect to landing
    window.location.href = '/Landing';
  };

  // ─────────────────────────────────────────────────────────────────
  // Redirect to login
  // ─────────────────────────────────────────────────────────────────
  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // ─────────────────────────────────────────────────────────────────
  // Provide convenience booleans
  // ─────────────────────────────────────────────────────────────────
  const isLoadingAuth = authState === AUTH_STATES.LOADING;
  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authState,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        revalidateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};