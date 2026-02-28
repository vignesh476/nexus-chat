import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  Alert,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  Schedule,
  Person,
  Group,
  Priority,
  Add,
  Delete,
  SmartToy,
} from '@mui/icons-material';

const SmartNotificationSettings = ({ open, onClose, onUpdateSettings, currentSettings }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    smartFiltering: true,
    priorityMode: 'balanced',
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    keywords: [],
    mutedUsers: [],
    vipUsers: [],
    soundEnabled: true,
    vibrationEnabled: true,
    ...currentSettings,
  });

  const [newKeyword, setNewKeyword] = useState('');

  const priorityModes = [
    { value: 'all', label: 'All Messages' },
    { value: 'balanced', label: 'Smart Filtering' },
    { value: 'important', label: 'Important Only' },
    { value: 'mentions', label: 'Mentions Only' },
    { value: 'none', label: 'None' },
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedSettingChange = (parent, key, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSave = () => {
    onUpdateSettings(settings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <NotificationsActive sx={{ mr: 1 }} />
        Smart Notifications
      </DialogTitle>
      
      <DialogContent>
        {/* Basic Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Settings</Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              />
            }
            label="Enable Notifications"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.soundEnabled}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
              />
            }
            label="Sound Notifications"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.vibrationEnabled}
                onChange={(e) => handleSettingChange('vibrationEnabled', e.target.checked)}
              />
            }
            label="Vibration"
            sx={{ mb: 2 }}
          />
        </Box>

        {/* Smart Filtering */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 1 }} />
            Smart Filtering
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.smartFiltering}
                onChange={(e) => handleSettingChange('smartFiltering', e.target.checked)}
              />
            }
            label="Enable AI-powered notification filtering"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority Mode</InputLabel>
            <Select
              value={settings.priorityMode}
              onChange={(e) => handleSettingChange('priorityMode', e.target.value)}
              label="Priority Mode"
            >
              {priorityModes.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  {mode.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {settings.smartFiltering && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Smart filtering learns from your behavior to show only relevant notifications.
            </Alert>
          )}
        </Box>

        {/* Quiet Hours */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ mr: 1 }} />
            Quiet Hours
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.quietHours.enabled}
                onChange={(e) => handleNestedSettingChange('quietHours', 'enabled', e.target.checked)}
              />
            }
            label="Enable Quiet Hours"
            sx={{ mb: 2 }}
          />

          {settings.quietHours.enabled && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => handleNestedSettingChange('quietHours', 'start', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => handleNestedSettingChange('quietHours', 'end', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </Box>

        {/* Keywords */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Priority Keywords</Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Add keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="urgent, meeting, deadline..."
            />
            <Button onClick={addKeyword} variant="contained" startIcon={<Add />}>
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {settings.keywords.map((keyword) => (
              <Chip
                key={keyword}
                label={keyword}
                onDelete={() => removeKeyword(keyword)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

const useSmartNotifications = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    smartFiltering: true,
    priorityMode: 'balanced',
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    keywords: [],
    mutedUsers: [],
    vipUsers: [],
    soundEnabled: true,
    vibrationEnabled: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const isQuietHours = () => {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const calculatePriority = (message, room, user) => {
    let priority = NotificationPriority.NORMAL;
    
    // Check if user is mentioned
    if (message.content?.includes(`@${user.username}`)) {
      priority = NotificationPriority.HIGH;
    }
    
    // Check for priority keywords
    const hasKeyword = settings.keywords.some(keyword => 
      message.content?.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasKeyword) {
      priority = NotificationPriority.HIGH;
    }
    
    // Check if sender is VIP
    if (settings.vipUsers.includes(message.sender)) {
      priority = NotificationPriority.HIGH;
    }
    
    // Check if sender is muted
    if (settings.mutedUsers.includes(message.sender)) {
      priority = NotificationPriority.LOW;
    }
    
    // Direct messages get higher priority
    if (room.type === 'direct') {
      priority = Math.max(priority, NotificationPriority.HIGH);
    }
    
    return priority;
  };

  const shouldShowNotification = (message, room, user) => {
    if (!settings.enabled) return false;
    if (isQuietHours()) return false;
    if (settings.mutedUsers.includes(message.sender)) return false;
    
    const priority = calculatePriority(message, room, user);
    
    switch (settings.priorityMode) {
      case 'none':
        return false;
      case 'mentions':
        return message.content?.includes(`@${user.username}`);
      case 'important':
        return priority === NotificationPriority.HIGH || priority === NotificationPriority.URGENT;
      case 'balanced':
        return settings.smartFiltering ? priority >= NotificationPriority.NORMAL : true;
      case 'all':
      default:
        return true;
    }
  };

  const showNotification = (message, room, user) => {
    if (!shouldShowNotification(message, room, user)) return;
    
    const priority = calculatePriority(message, room, user);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        `${message.sender} in ${room.name}`,
        {
          body: message.content || '[Media]',
          icon: message.sender_avatar || '/default-avatar.png',
          tag: `message-${message._id}`,
          requireInteraction: priority === NotificationPriority.URGENT,
        }
      );
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto-close after delay based on priority
      const delay = priority === NotificationPriority.URGENT ? 10000 : 5000;
      setTimeout(() => notification.close(), delay);
    }
    
    // Play sound if enabled
    if (settings.soundEnabled) {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = priority === NotificationPriority.URGENT ? 1.0 : 0.5;
      audio.play().catch(() => {}); // Ignore errors
    }
    
    // Vibrate if enabled and supported
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      const pattern = priority === NotificationPriority.URGENT ? [200, 100, 200] : [100];
      navigator.vibrate(pattern);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  return {
    settings,
    updateSettings,
    showNotification,
    shouldShowNotification,
    calculatePriority,
    requestPermission,
    isQuietHours,
  };
};

export { SmartNotificationSettings, useSmartNotifications, NotificationPriority };
export default SmartNotificationSettings;