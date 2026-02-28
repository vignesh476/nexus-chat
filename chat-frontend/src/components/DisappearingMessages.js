import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { 
  Timer, 
  AutoDelete, 
  Security,
  Warning,
  Close
} from '@mui/icons-material';

const DisappearingMessageSettings = ({ open, onClose, onUpdateSettings, currentSettings }) => {
  const [enabled, setEnabled] = useState(currentSettings?.enabled || false);
  const [duration, setDuration] = useState(currentSettings?.duration || 3600); // seconds
  const [applyToExisting, setApplyToExisting] = useState(false);

  const durations = [
    { value: 30, label: '30 seconds' },
    { value: 300, label: '5 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
    { value: 86400, label: '24 hours' },
    { value: 604800, label: '7 days' },
  ];

  const handleSave = () => {
    onUpdateSettings({
      enabled,
      duration,
      applyToExisting,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <AutoDelete sx={{ mr: 1 }} />
        Disappearing Messages
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            When enabled, new messages will automatically delete after the specified time.
          </Typography>
        </Alert>

        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          }
          label="Enable Disappearing Messages"
          sx={{ mb: 3 }}
        />

        {enabled && (
          <>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Delete After</InputLabel>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                label="Delete After"
              >
                {durations.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={applyToExisting}
                  onChange={(e) => setApplyToExisting(e.target.checked)}
                />
              }
              label="Apply to existing messages"
              sx={{ mb: 2 }}
            />

            {applyToExisting && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  This will set deletion timers for all existing messages in this chat.
                </Typography>
              </Alert>
            )}
          </>
        )}
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

const DisappearingMessageTimer = ({ message, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    if (!message.disappears_at) return;

    const expiryTime = new Date(message.disappears_at).getTime();
    const createdTime = new Date(message.timestamp).getTime();
    const totalDuration = expiryTime - createdTime;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      
      setTimeLeft(remaining);
      setPercentage((remaining / totalDuration) * 100);

      if (remaining <= 0) {
        onExpire?.(message._id);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [message, onExpire]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getColor = () => {
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  if (!message.disappears_at || timeLeft <= 0) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      mt: 1,
      opacity: 0.7,
    }}>
      <Timer sx={{ fontSize: 14, color: `${getColor()}.main` }} />
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={16}
          thickness={6}
          color={getColor()}
        />
      </Box>
      <Typography variant="caption" color={`${getColor()}.main`}>
        {formatTime(timeLeft)}
      </Typography>
    </Box>
  );
};

const DisappearingMessageIndicator = ({ enabled, duration }) => {
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  if (!enabled) return null;

  return (
    <Chip
      icon={<AutoDelete />}
      label={`Auto-delete: ${formatDuration(duration)}`}
      size="small"
      color="warning"
      variant="outlined"
      sx={{ 
        mb: 1,
        '& .MuiChip-icon': {
          fontSize: 16,
        },
      }}
    />
  );
};

const useDisappearingMessages = (roomId, socket) => {
  const [settings, setSettings] = useState({ enabled: false, duration: 3600 });

  useEffect(() => {
    // Load settings from localStorage or API
    const saved = localStorage.getItem(`disappearing_${roomId}`);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, [roomId]);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`disappearing_${roomId}`, JSON.stringify(newSettings));
    
    // Notify other participants via socket
    if (socket) {
      socket.emit('disappearing_messages_updated', {
        room_id: roomId,
        settings: newSettings,
      });
    }
  };

  const createDisappearingMessage = (messageData) => {
    if (!settings.enabled) return messageData;

    const expiryTime = new Date(Date.now() + settings.duration * 1000);
    return {
      ...messageData,
      disappears_at: expiryTime.toISOString(),
      is_disappearing: true,
    };
  };

  const handleMessageExpiry = (messageId) => {
    // Remove message from local state and notify server
    if (socket) {
      socket.emit('message_expired', {
        message_id: messageId,
        room_id: roomId,
      });
    }
  };

  return {
    settings,
    updateSettings,
    createDisappearingMessage,
    handleMessageExpiry,
  };
};

export {
  DisappearingMessageSettings,
  DisappearingMessageTimer,
  DisappearingMessageIndicator,
  useDisappearingMessages,
};

export default DisappearingMessageSettings;