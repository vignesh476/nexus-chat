import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../api';
import { useAuth } from './AuthContext';

const UserProfileContext = createContext();

export const useUserProfiles = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfiles must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const [userProfiles, setUserProfiles] = useState(new Map());
  const [loadingProfiles, setLoadingProfiles] = useState(new Set());
  const { user } = useAuth();

  // Get user profile from cache or fetch if not available
  const getUserProfile = useCallback(async (username) => {
    if (!username) return null;

    // Check if already in cache
    if (userProfiles.has(username)) {
      return userProfiles.get(username);
    }

    // Check if currently loading
    if (loadingProfiles.has(username)) {
      return null;
    }

    // Start loading
    setLoadingProfiles(prev => new Set(prev).add(username));

    try {
            // For current user, we might have the data from auth context
      if (username === user?.username) {
        const profileData = {
          username: user.username,
          profile_picture_url: user.profile_picture,
          status: user.status
        };
        setUserProfiles(prev => new Map(prev).set(username, profileData));
        return profileData;
      }

      // Fetch from API
      try {
        const response = await usersAPI.getUserProfile(username);
        const profileData = {
          username,
          profile_picture_url: response.data.profile_picture_url,
          status: response.data.status
        };
        setUserProfiles(prev => new Map(prev).set(username, profileData));
        return profileData;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Return basic data on error
        const profileData = {
          username,
          profile_picture_url: null,
          status: null
        };
        setUserProfiles(prev => new Map(prev).set(username, profileData));
        return profileData;
      }

    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    } finally {
      setLoadingProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    }
  }, [userProfiles, loadingProfiles, user]);

  // Update user profile in cache
  const updateUserProfile = useCallback((username, profileData) => {
    setUserProfiles(prev => new Map(prev).set(username, profileData));
  }, []);

  // Clear cache (useful when logging out)
  const clearProfiles = useCallback(() => {
    setUserProfiles(new Map());
    setLoadingProfiles(new Set());
  }, []);

  // Batch load profiles for multiple users
  const loadUserProfiles = useCallback(async (usernames) => {
    const profilesToLoad = usernames.filter(username =>
      !userProfiles.has(username) && !loadingProfiles.has(username)
    );

    if (profilesToLoad.length === 0) return;

    // Mark as loading
    setLoadingProfiles(prev => new Set([...prev, ...profilesToLoad]));

    try {
      // In a real implementation, you'd have a batch endpoint
      // For now, we'll simulate loading
      const newProfiles = new Map();

      for (const username of profilesToLoad) {
        if (username === user?.username) {
          newProfiles.set(username, {
            username: user.username,
            profile_picture_url: user.profile_picture,
            status: user.status
          });
        } else {
          // Default profile data
          newProfiles.set(username, {
            username,
            profile_picture_url: null,
            status: null
          });
        }
      }

      setUserProfiles(prev => new Map([...prev, ...newProfiles]));
    } catch (error) {
      console.error('Failed to load user profiles:', error);
    } finally {
      setLoadingProfiles(prev => {
        const newSet = new Set(prev);
        profilesToLoad.forEach(username => newSet.delete(username));
        return newSet;
      });
    }
  }, [userProfiles, loadingProfiles, user]);

  // Listen for profile updates via socket (to be implemented)
  useEffect(() => {
    // TODO: Listen for profile picture updates via socket
    // This will allow real-time updates across all components
  }, []);

  const value = {
    userProfiles,
    getUserProfile,
    updateUserProfile,
    loadUserProfiles,
    clearProfiles,
    isLoadingProfile: (username) => loadingProfiles.has(username)
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
