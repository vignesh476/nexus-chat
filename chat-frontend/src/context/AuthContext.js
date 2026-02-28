import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, presenceAPI, usersAPI, setAuthTokenOnApiClient } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [privateKey, setPrivateKey] = useState(localStorage.getItem('privateKey'));
  const [presence, setPresence] = useState({ status: 'offline', custom_status: null });
  const [bootstrapped, setBootstrapped] = useState(false);

  // Sync axios Authorization header whenever token changes
  useEffect(() => {
    setAuthTokenOnApiClient?.(token || null);
  }, [token]);

  // Bootstrap from token on first load
  useEffect(() => {
    let mounted = true;
    const hydrateFromToken = async () => {
      const t = localStorage.getItem('token');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPresence = async () => {
    try {
      const response = await presenceAPI.getPresence();
      setPresence({
        status: response.data.status,
        custom_status: response.data.custom_status ?? null,
      });
    } catch (error) {
      console.error('Failed to fetch presence:', error);
    }
  };

  const fetchUserProfile = async (username = user?.username) => {
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
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, private_key } = response.data || {};
      if (!access_token) {
        return { success: false, error: 'Missing access token' };
      }
      localStorage.setItem('token', access_token);
      setToken(access_token);

      if (private_key) {
        localStorage.setItem('privateKey', private_key);
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
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, privateKey: response.data?.private_key };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const updatePresence = async (presenceData) => {
    try {
      await presenceAPI.updatePresence(presenceData);
      setPresence((prev) => ({ ...prev, ...presenceData }));
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };

  const safeLogout = async () => {
    try {
      if (localStorage.getItem('token')) {
        await presenceAPI.updatePresence({ status: 'offline' }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('privateKey');
      setToken(null);
      setPrivateKey(null);
      setUser(null);
      setPresence({ status: 'offline', custom_status: null });
    }
  };

  const logout = () => {
    safeLogout();
  };

  const updateUserProfile = (profileData) => {
    setUser(prev => ({ ...prev, ...profileData }));
  };

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
