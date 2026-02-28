import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { usersAPI, callsAPI } from '../api';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Call,
  CallEnd,
  CallMissed,
  Delete,
  ClearAll,
  MoreVert,
  Block,
} from '@mui/icons-material';

const NotificationsPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const { startCall } = useCall();
  const navigate = useNavigate();
  const [callHistory, setCallHistory] = useState([]);
  const [friends, setFriends] = useState([]);
  const [messageNotifications, setMessageNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clearAllDialog, setClearAllDialog] = useState({ open: false, type: '' });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchFriends();
    // Only fetch recent notifications, not full call history
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        console.log('[NotificationsPage] New message notification:', data);
        if (data.sender !== user.username) {
          setMessageNotifications(prev => [{
            id: Date.now(),
            type: 'message',
            sender: data.sender,
            content: data.content,
            room_id: data.room_id,
            timestamp: new Date(),
            read: false
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      };

      const handleCallOffer = (data) => {
        console.log('[NotificationsPage] Call offer notification:', data);
        if (data.from !== user.username) {
          setMessageNotifications(prev => [{
            id: Date.now(),
            type: 'call',
            sender: data.from,
            content: 'Incoming call',
            room_id: data.room_id,
            timestamp: new Date(),
            read: false
          }, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      };

      socket.on('message', handleNewMessage);
      socket.on('call_offer', handleCallOffer);

      return () => {
        socket.off('message', handleNewMessage);
        socket.off('call_offer', handleCallOffer);
      };
    }
  }, [socket, user.username]);

  // Removed - NotificationsPage only shows recent activity

  const fetchFriends = async () => {
    try {
      // Assuming we have an API to get friends
      // const response = await usersAPI.getFriends();
      // setFriends(response.data);
      // For now, mock data
      setFriends(['user1', 'user2', 'user3']);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const handleCall = async (username) => {
    try {
      // Find or create a room with this user
      const response = await fetch('/rooms/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  const clearAllNotifications = () => {
    setMessageNotifications([]);
    setUnreadCount(0);
    setClearAllDialog({ open: false, type: '' });
  };

  // Removed - NotificationsPage only manages notifications

  const deleteNotification = (id) => {
    setMessageNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      const wasUnread = prev.find(n => n.id === id && !n.read);
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      return updated;
    });
    setMenuAnchor(null);
  };

  // Removed - Call management moved to CallHistoryPage

  const blockUser = async (username) => {
    try {
      await usersAPI.blockUser(username);
      // Remove notifications from blocked user
      setMessageNotifications(prev => prev.filter(n => n.sender !== username));
      setMenuAnchor(null);
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const getCallIcon = (status) => {
    switch (status) {
      case 'missed':
        return <CallMissed color="error" />;
      case 'answered':
        return <Call />;
      case 'ended':
        return <CallEnd />;
      default:
        return <Call />;
    }
  };

  const getCallText = (call) => {
    const isCaller = call.caller === user.username;
    const otherUser = isCaller ? call.callee : call.caller;
    const direction = isCaller ? 'Outgoing' : 'Incoming';
    const statusText = call.status === 'missed' ? 'Missed' : call.status === 'answered' ? 'Answered' : 'Ended';
    return `${direction} call to ${otherUser} - ${statusText}`;
  };

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Notifications {unreadCount > 0 && <Chip label={unreadCount} color="primary" size="small" />}
        </Typography>

        {messageNotifications.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Recent Notifications
              </Typography>
              <Button
                startIcon={<ClearAll />}
                onClick={() => setClearAllDialog({ open: true, type: 'notifications' })}
                color="error"
                size="small"
              >
                Clear All
              </Button>
            </Box>
            <List>
              {messageNotifications.slice(0, 10).map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem sx={{ bgcolor: notification.read ? 'transparent' : 'action.hover' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={notification.type === 'message' ? 'Message' : 'Call'}
                            color={notification.type === 'message' ? 'primary' : 'secondary'}
                            size="small"
                          />
                          <Typography variant="body1">
                            {notification.type === 'message'
                              ? `New message from ${notification.sender}`
                              : `Call from ${notification.sender}`
                            }
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {notification.content} • {notification.timestamp.toLocaleString()}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setSelectedItem({ type: 'notification', data: notification });
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Recent Activity (Last 24h)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For complete call history, visit the Call History page.
          </Typography>
        </Paper>
      </Container>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {selectedItem?.type === 'notification' && [
          <MenuItem key="delete" onClick={() => deleteNotification(selectedItem.data.id)}>
            <Delete sx={{ mr: 1 }} /> Delete
          </MenuItem>,
          <MenuItem key="block" onClick={() => blockUser(selectedItem.data.sender)}>
            <Block sx={{ mr: 1 }} /> Block User
          </MenuItem>
        ]}
        {/* Call actions removed - handled in CallHistoryPage */}
      </Menu>

      {/* Clear All Dialog */}
      <Dialog open={clearAllDialog.open} onClose={() => setClearAllDialog({ open: false, type: '' })}>
        <DialogTitle>
          Clear All {clearAllDialog.type === 'notifications' ? 'Notifications' : 'Call History'}?
        </DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. Are you sure you want to clear all {clearAllDialog.type === 'notifications' ? 'notifications' : 'call history'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialog({ open: false, type: '' })}>Cancel</Button>
          <Button 
            onClick={clearAllNotifications}
            color="error"
            variant="contained"
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default NotificationsPage;
