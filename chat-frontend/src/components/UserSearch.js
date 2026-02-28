import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  IconButton,
  Collapse,
  Alert,
  Snackbar,
  Badge,
  Checkbox
} from '@mui/material';
import { Search, Chat, GroupAdd, Close } from '@mui/icons-material';
import { usersAPI, roomsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const UserSearch = ({ onUsersSelected }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await usersAPI.searchUsers(query);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to search users:', err);
      setUsers([]); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (targetUser, event) => {
    event.stopPropagation(); // Prevent event bubbling
    if (creatingChat) return; // Prevent multiple calls
    setCreatingChat(true);
    try {
      const res = await roomsAPI.createRoom({
        name: targetUser.username, // Show only the other user's name
        members: [user.username, targetUser.username],
        is_private: true,
      });
      navigate(`/chat/${res.data.room._id}`, { state: { room: res.data.room } });
    } catch (err) {
      console.error('Failed to create chat:', err);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleToggleUserSelection = (user) => {
    if (selectedUsers.find(u => u.username === user.username)) {
      setSelectedUsers(selectedUsers.filter(u => u.username !== user.username));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    try {
      const members = selectedUsers.map(u => u.username);
      const res = await roomsAPI.createRoom({
        name: groupName,
        members: [...members, user.username],
        admins: [user.username],
        is_group: true,
      });
      setGroupDialogOpen(false);
      setSelectedUsers([]);
      setGroupName('');
      navigate(`/chat/${res.data.room._id}`, { state: { room: res.data.room } });
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleSendRequest = async (receiver) => {
    try {
      await usersAPI.sendFriendRequest(receiver);
      // Refresh search results to update UI
      handleSearch();
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
  };

  const handleAcceptRequest = async (sender) => {
    try {
      await usersAPI.acceptFriendRequest(sender);
      // Refresh search results to update UI
      handleSearch();
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    }
  };

  const handleRejectRequest = async (sender) => {
    try {
      await usersAPI.rejectFriendRequest(sender);
      // Refresh search results to update UI
      handleSearch();
    } catch (err) {
      console.error('Failed to reject friend request:', err);
    }
  };

  const selectionMode = !!onUsersSelected;

  return (
    <Box sx={{ mb: 4 }}>
      {!selectionMode && (
        <Typography variant="h5" gutterBottom>
          Search Users
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
      </Box>

      <Collapse in={users.length > 0}>
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {users.map((u) => (
            <ListItem key={u.username} disablePadding>
              <ListItemButton onClick={() => selectionMode && handleToggleUserSelection(u)}>
                {selectionMode && (
                  <Checkbox
                    checked={selectedUsers.some(su => su.username === u.username)}
                    onChange={() => handleToggleUserSelection(u)}
                  />
                )}
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: u.status === 'online' ? '#44b700' :
                                      u.status === 'away' ? '#ff9800' :
                                      u.status === 'busy' ? '#f44336' : '#757575',
                      color: u.status === 'online' ? '#44b700' :
                             u.status === 'away' ? '#ff9800' :
                             u.status === 'busy' ? '#f44336' : '#757575',
                      boxShadow: `0 0 0 2px #fff`,
                      '&::after': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        animation: u.status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
                        border: '1px solid currentColor',
                        content: '""',
                      },
                    },
                    '@keyframes ripple': {
                      '0%': {
                        transform: 'scale(.8)',
                        opacity: 1,
                      },
                      '100%': {
                        transform: 'scale(2.4)',
                        opacity: 0,
                      },
                    },
                  }}
                >
                  <Avatar
                    src={u.profile_picture}
                    sx={{ mr: 2 }}
                  >
                    {u.username[0].toUpperCase()}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography variant="body1">{u.username}</Typography>
                  {u.custom_status && (
                    <Typography variant="body2" color="text.secondary">
                      {u.custom_status}
                    </Typography>
                  )}
                </Box>
                {!selectionMode && (
                  <>
                    {u.is_friend ? (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<Chat />}
                          onClick={(event) => handleStartChat(u, event)}
                          sx={{ mr: 1 }}
                        >
                          Chat
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<GroupAdd />}
                          onClick={() => handleToggleUserSelection(u)}
                          disabled={selectedUsers.find(su => su.username === u.username)}
                        >
                          Add to Group
                        </Button>
                      </>
                    ) : u.request_sent ? (
                      <Chip label="Request Sent" color="warning" size="small" />
                    ) : u.request_received ? (
                      <>
                        <Button
                          variant="contained"
                          onClick={() => handleAcceptRequest(u.username)}
                          sx={{ mr: 1 }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleRejectRequest(u.username)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={() => handleSendRequest(u.username)}
                      >
                        Send Request
                      </Button>
                    )}
                  </>
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      {selectedUsers.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6">Selected Users:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {selectedUsers.map((u) => (
              <Chip
                key={u.username}
                label={u.username}
                onDelete={() => handleToggleUserSelection(u)}
                deleteIcon={<Close />}
              />
            ))}
          </Box>
          {selectionMode ? (
            <Button
              variant="contained"
              onClick={() => onUsersSelected(selectedUsers)}
              sx={{ mt: 2 }}
            >
              Done
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setGroupDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Create Group
            </Button>
          )}
        </Box>
      )}

      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)}>
        <DialogTitle>Create Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSearch;
