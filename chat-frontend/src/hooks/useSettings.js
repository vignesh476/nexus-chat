import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { usersAPI } from '../api';

export const useSettings = (initialSettings = {}) => {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  
  const debouncedSettings = useDebounce(settings, 1000); // 1 second delay

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateNestedSetting = useCallback((section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  }, []);

  const saveSettings = useCallback(async (settingsToSave = settings) => {
    setLoading(true);
    setError(null);
    
    try {
      // Save different sections to appropriate endpoints
      const promises = [];
      
      if (settingsToSave.notifications) {
        promises.push(usersAPI.updateNotificationSettings(settingsToSave.notifications));
      }
      
      if (settingsToSave.privacy) {
        promises.push(usersAPI.updatePrivacySettings(settingsToSave.privacy));
      }
      
      if (settingsToSave.chat) {
        promises.push(usersAPI.updateChatSettings(settingsToSave.chat));
      }
      
      if (settingsToSave.accessibility) {
        promises.push(usersAPI.updateAccessibilitySettings(settingsToSave.accessibility));
      }
      
      // For other settings, use general update
      const otherSettings = { ...settingsToSave };
      delete otherSettings.notifications;
      delete otherSettings.privacy;
      delete otherSettings.chat;
      delete otherSettings.accessibility;
      
      if (Object.keys(otherSettings).length > 0) {
        promises.push(usersAPI.updateSettings(otherSettings));
      }
      
      await Promise.all(promises);
      setLastSaved(new Date());
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Auto-save when settings change (debounced)
  useEffect(() => {
    if (Object.keys(debouncedSettings).length > 0 && lastSaved) {
      saveSettings(debouncedSettings).catch(console.error);
    }
  }, [debouncedSettings, saveSettings, lastSaved]);

  return {
    settings,
    loading,
    error,
    lastSaved,
    updateSetting,
    updateNestedSetting,
    saveSettings
  };
};

export default useSettings;