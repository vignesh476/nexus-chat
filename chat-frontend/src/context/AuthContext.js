import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI, presenceAPI, usersAPI, setAuthTokenOnApiClient } from '../api';

const AuthContext = createContext();

const STORAGE_KEYS = {
  TOKEN: 'nexus_token',
  PRIVATE_KEY: 'nexus_pk',
  USER_DATA: 'nexus_user'
};

const secureStorage = {
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
      localStorage.setItem(key === STORAGE_KEYS.TOKEN ? 'token' : key, value);
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key) || localStorage.getItem(key === STORAGE_KEYS.TOKEN ? 'token' : key);
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key === STORAGE_KEYS.TOKEN ? 'token' : key);
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(secureStorage.getItem(STORAGE_KEYS.TOKEN));
  const [privateKey, setPrivateKey] = useState(secureStorage.getItem(STORAGE_KEYS.PRIVATE_KEY));
  const [presence, setPresence] = useState({ status: 'offline', custom_status: null });
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    setAuthTokenOnApiClient?.(token || null);
  }, [token]);

  const fetchPresence = useCallback(async () => {
    try {
      const response = await presenceAPI.getPresence();
      setPresence({
        status: response.data.status,
        custom_status: response.data.custom_status ?? null,
      });
    } catch (error) {
      console.error('Failed to fetch presence:', error);
    }
  }, []);

  const fetchUserProfile = useCallback(async (username = user?.username) => {
    if (!username) return;
    try {
      const response = await usersAPI.getUserProfile(username);
      setUser(prev => ({
        ...prev,
        profile_picture: response.data.profile_picture_url,
        status: response.data.status,
        custom_status: response.data.custom_status
      }));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }, [user?.username]);

  useEffect(() => {
    let mounted = true;
    const hydrateFromToken = async () => {
      const t = secureStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!t) {
        mounted && setBootstrapped(true);
        return;
      }
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        if (!payload?.exp || payload.exp * 1000 < Date.now()) {
          await safeLogout();
        } else {
          setToken(t);
          const username = payload.sub;
          setUser({ username });
          await fetchPresence();
          await fetchUserProfile(username);
        }
      } catch {
        await safeLogout();
      } finally {
        mounted && setBootstrapped(true);
      }
    };
    hydrateFromToken();
    return () => {
      mounted = false;
    };
  }, [fetchPresence, fetchUserProfile]);

  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, private_key } = response.data || {};
      if (!access_token) {
        return { success: false, error: 'Missing access token' };
      }
      secureStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      setToken(access_token);

      if (private_key) {
        secureStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, private_key);
        setPrivateKey(private_key);
      }

      const payload = JSON.parse(atob(access_token.split('.')[1]));
      const username = payload.sub;
      setUser({ username });

      await updatePresence({ status: 'online' });
      await fetchUserProfile(username);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  }, [fetchUserProfile]);

  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, privateKey: response.data?.private_key };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  }, []);

  const updatePresence = useCallback(async (presenceData) => {
    try {
      await presenceAPI.updatePresence(presenceData);
      setPresence((prev) => ({ ...prev, ...presenceData }));
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, []);

  const safeLogout = useCallback(async () => {
    try {
      if (secureStorage.getItem(STORAGE_KEYS.TOKEN)) {
        await presenceAPI.updatePresence({ status: 'offline' }).catch(() => {});
      }
    } finally {
      secureStorage.removeItem(STORAGE_KEYS.TOKEN);
      secureStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
      secureStorage.removeItem(STORAGE_KEYS.USER_DATA);
      setToken(null);
      setPrivateKey(null);
      setUser(null);
      setPresence({ status: 'offline', custom_status: null });
    }
  }, []);

  const logout = useCallback(() => {
    safeLogout();
  }, [safeLogout]);

  const updateUserProfile = useCallback((profileData) => {
    setUser(prev => ({ ...prev, ...profileData }));
  }, []);

  const value = {
    user,
    token,
    privateKey,
    presence,
    bootstrapped,
    login,
    register,
    logout,
    updatePresence,
    fetchPresence,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
