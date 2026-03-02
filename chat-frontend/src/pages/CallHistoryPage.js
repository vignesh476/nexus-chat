import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { useCall } from '../context/CallContext';
import Navigation from '../components/Navigation';
import useResponsive from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Phone,
  PhoneCallback,
  PhoneMissed,
  Videocam,
  AccessTime,
  Delete,
  ClearAll,
  MoreVert,
  Block,
  Menu as MenuIcon,
} from '@mui/icons-material';

const CallHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserProfile } = useUserProfiles();
  const { startCall } = useCall();
  const { darkMode } = useTheme();
  const { isMobile } = useResponsive();
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCallHistory();
    }
  }, [user]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/calls/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCallHistory(data);
      } else {
        setError('Failed to load call history');
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getCallIcon = (status) => {
    switch (status) {
      case 'missed':
        return <PhoneMissed color="error" />;
      case 'answered':
        return <PhoneCallback color="success" />;
      case 'ended':
        return <Phone color="primary" />;
      default:
        return <Phone />;
    }
  };

  const getCallTypeIcon = (isVideo) => {
    return isVideo ? <Videocam /> : <Phone />;
  };

  const handleCallUser = async (username) => {
    try {
      // Find or create a room with this user
      const response = await fetch('http://localhost:8000/rooms/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getToken()}`
        },
        body: JSON.stringify({ other_user: username })
      });
      const { room_id } = await response.json();
      
      // Start the call
      startCall(username, room_id, false);
      
      // Navigate to the chat room
      navigate(`/chat/${room_id}`);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const clearAllHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/calls/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        setCallHistory([]);
        setClearAllDialog(false);
      }
    } catch (error) {
      console.error('Failed to clear call history:', error);
    }
  };

  const deleteCall = async (callId) => {
    try {
      const response = await fetch(`http://localhost:8000/calls/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        setCallHistory(prev => prev.filter(c => c._id !== callId));
        setMenuAnchor(null);
      }
    } catch (error) {
      console.error('Failed to delete call:', error);
    }
  };

  const blockUser = async (username) => {
    try {
      const response = await fetch('http://localhost:8000/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username })
      });
      if (response.ok) {
        // Remove calls from blocked user
        setCallHistory(prev => prev.filter(c => 
          c.caller !== username && c.callee !== username
        ));
        setMenuAnchor(null);
      }
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const getOtherUser = (call) => {
    return call.caller === user.username ? call.callee : call.caller;
  };

  const getCallDirection = (call) => {
    return call.caller === user.username ? 'Outgoing' : 'Incoming';
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Navigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          pt: isMobile ? 7 : 0,
          pb: isMobile ? 10 : 0,
        }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Navigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          pt: isMobile ? 7 : 0,
          pb: isMobile ? 10 : 0,
        }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      <Navigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      {/* Mobile Header */}
      {isMobile && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Call History
          </Typography>
          {callHistory.length > 0 && (
            <IconButton
              onClick={() => setClearAllDialog(true)}
              sx={{ color: 'error.main' }}
            >
              <ClearAll />
            </IconButton>
          )}
        </Box>
      )}
      
      <Box sx={{ 
        flexGrow: 1, 
        p: isMobile ? 2 : 3, 
        pt: isMobile ? 9 : 3,
        pb: isMobile ? 12 : 3,
        overflow: 'auto',
        maxHeight: '100vh',
      }}>
        {/* Desktop Header */}
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">
              Call History
            </Typography>
            {callHistory.length > 0 && (
              <Button
                startIcon={<ClearAll />}
                onClick={() => setClearAllDialog(true)}
                color="error"
                variant="outlined"
              >
                Clear All
              </Button>
            )}
          </Box>
        )}

        {callHistory.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No call history yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your call history will appear here
            </Typography>
          </Paper>
        ) : (
          <Paper>
            <List>
              {callHistory.map((call, index) => {
                const otherUser = getOtherUser(call);
                const userProfile = getUserProfile(otherUser);
                const displayName = userProfile ? userProfile.display_name || otherUser : otherUser;

                return (
                  <React.Fragment key={call._id || index}>
                    <ListItem
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {displayName}
                            </Typography>
                            <Chip
                              size="small"
                              label={getCallDirection(call)}
                              color={call.caller === user.username ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatTimestamp(call.timestamp)}
                            </Typography>
                            {call.duration && (
                              <>
                                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDuration(call.duration)}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCallIcon(call.status)}
                        <Tooltip title="Call back">
                          <IconButton 
                            color="primary"
                            onClick={() => handleCallUser(otherUser)}
                          >
                            <Phone />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            setSelectedCall(call);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < callHistory.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => deleteCall(selectedCall?._id)}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
        <MenuItem onClick={() => blockUser(getOtherUser(selectedCall))}>
          <Block sx={{ mr: 1 }} /> Block User
        </MenuItem>
      </Menu>

      {/* Clear All Dialog */}
      <Dialog open={clearAllDialog} onClose={() => setClearAllDialog(false)}>
        <DialogTitle>Clear All Call History?</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. Are you sure you want to clear all call history?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialog(false)}>Cancel</Button>
          <Button onClick={clearAllHistory} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CallHistoryPage;
