import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import UserSearch from '../components/UserSearch';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Container,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Fab,
  Checkbox,
  FormControlLabel,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import { Delete, PersonAdd, VolumeOff, VolumeUp, GroupAdd } from '@mui/icons-material';

const RoomListPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, room: null });
  const [addMemberDialog, setAddMemberDialog] = useState({ open: false, room: null });
  const [memberToAdd, setMemberToAdd] = useState('');
  const [mutedRooms, setMutedRooms] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [createGroupDialog, setCreateGroupDialog] = useState({ open: false });
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [manageMembersDialog, setManageMembersDialog] = useState({ open: false, room: null });
  const [memberManagement, setMemberManagement] = useState({ add: [], remove: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await roomsAPI.listRooms();
        setRooms(res.data);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setError('Failed to load rooms. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await usersAPI.getFriends();
      setFriends(res.data.friends);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const handleRoomClick = (room) => {
    navigate(`/chat/${room._id}`, { state: { room } });
  };

  const handleDeleteRoom = async () => {
    try {
      await roomsAPI.deleteRoom(deleteDialog.room._id);
      setRooms(rooms.filter(r => r._id !== deleteDialog.room._id));
      setSnackbar({ open: true, message: 'Room deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to delete room:', err);
      setSnackbar({ open: true, message: 'Failed to delete room', severity: 'error' });
    }
    setDeleteDialog({ open: false, room: null });
  };

  const handleAddMember = async () => {
    if (!memberToAdd.trim()) return;
    try {
      await roomsAPI.addMember(addMemberDialog.room._id, memberToAdd);
      setSnackbar({ open: true, message: 'Member added successfully', severity: 'success' });
      // Refresh rooms
      const res = await roomsAPI.listRooms();
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to add member:', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to add member', severity: 'error' });
    }
    setAddMemberDialog({ open: false, room: null });
    setMemberToAdd('');
  };

  const handleToggleMute = async (roomId) => {
    try {
      if (mutedRooms.includes(roomId)) {
        await usersAPI.unmuteRoom(roomId);
        setMutedRooms(mutedRooms.filter(id => id !== roomId));
        setSnackbar({ open: true, message: 'Room unmuted', severity: 'success' });
      } else {
        await usersAPI.muteRoom(roomId);
        setMutedRooms([...mutedRooms, roomId]);
        setSnackbar({ open: true, message: 'Room muted', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      setSnackbar({ open: true, message: 'Failed to toggle mute', severity: 'error' });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    try {
      await roomsAPI.createRoom({
        name: groupName,
        members: [...selectedMembers, user.username],
        admins: [user.username],
        is_group: true
      });
      setSnackbar({ open: true, message: 'Group created successfully', severity: 'success' });
      const roomsRes = await roomsAPI.listRooms();
      setRooms(roomsRes.data);
      setGroupName('');
      setSelectedMembers([]);
      setCreateGroupDialog({ open: false });
    } catch (err) {
      console.error('Failed to create group:', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to create group', severity: 'error' });
    }
  };

  const handleMemberToggle = (username) => {
    setSelectedMembers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const handleManageMembers = (room) => {
    setManageMembersDialog({ open: true, room });
    setMemberManagement({ add: [], remove: [] });
  };

  const handleMemberManagementToggle = (username, action) => {
    setMemberManagement(prev => ({
      ...prev,
      [action]: prev[action].includes(username)
        ? prev[action].filter(u => u !== username)
        : [...prev[action], username]
    }));
  };

  const handleSaveMemberChanges = async () => {
    const room = manageMembersDialog.room;
    try {
      // Add members
      for (const username of memberManagement.add) {
        await roomsAPI.addMember(room._id, username);
      }
      // Remove members
      for (const username of memberManagement.remove) {
        await roomsAPI.removeMember(room._id, username);
      }
      setSnackbar({ open: true, message: 'Member changes saved successfully', severity: 'success' });
      // Refresh rooms
      const res = await roomsAPI.listRooms();
      setRooms(res.data);
      setManageMembersDialog({ open: false, room: null });
    } catch (err) {
      console.error('Failed to save member changes:', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to save member changes', severity: 'error' });
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rooms
        </Typography>

        <UserSearch />

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Paper elevation={2} sx={{ mt: 4 }}>
          {loading ? (
            <Typography sx={{ p: 2 }}>Loading rooms...</Typography>
          ) : (
            <List>
              {rooms.map((room) => (
                <ListItem key={room._id} disablePadding>
                  <ListItemButton onClick={() => handleRoomClick(room)}>
                    <ListItemText
                      primary={room.name}
                      secondary={`${room.members.length} members`}
                    />
                    <Chip
                      label={room.is_group ? 'Group' : 'Private'}
                      color={room.is_group ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {room.is_group && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddMemberDialog({ open: true, room });
                        }}
                        size="small"
                      >
                        <PersonAdd />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute(room._id);
                      }}
                      size="small"
                      color="secondary"
                    >
                      {mutedRooms.includes(room._id) ? <VolumeUp /> : <VolumeOff />}
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog({ open: true, room });
                      }}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Delete Room Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, room: null })}>
          <DialogTitle>Delete Room</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deleteDialog.room?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, room: null })}>Cancel</Button>
            <Button onClick={handleDeleteRoom} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialog.open} onClose={() => setAddMemberDialog({ open: false, room: null })}>
          <DialogTitle>Add Member to {addMemberDialog.room?.name}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Friend Username"
              fullWidth
              variant="outlined"
              value={memberToAdd}
              onChange={(e) => setMemberToAdd(e.target.value)}
              helperText="Only friends can be added to groups"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddMemberDialog({ open: false, room: null })}>Cancel</Button>
            <Button onClick={handleAddMember} variant="contained">
              Add Member
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Creating Groups */}
        <Fab
          color="primary"
          aria-label="create group"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setCreateGroupDialog({ open: true })}
        >
          <GroupAdd />
        </Fab>

        {/* Create Group Dialog */}
        <Dialog open={createGroupDialog.open} onClose={() => setCreateGroupDialog({ open: false })} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Group Name"
              fullWidth
              variant="outlined"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Select Members
            </Typography>
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {friends.map((username) => (
                <ListItem key={username}>
                  <ListItemAvatar>
                    <Avatar>{username.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={username} />
                  <Checkbox
                    checked={selectedMembers.includes(username)}
                    onChange={() => handleMemberToggle(username)}
                  />
                </ListItem>
              ))}
            </List>
            {selectedMembers.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateGroupDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={handleCreateGroup}
              variant="contained"
              disabled={!groupName.trim() || selectedMembers.length === 0}
            >
              Create Group
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manage Members Dialog */}
        <Dialog open={manageMembersDialog.open} onClose={() => setManageMembersDialog({ open: false, room: null })} maxWidth="sm" fullWidth>
          <DialogTitle>Manage Members - {manageMembersDialog.room?.name}</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Current Members
            </Typography>
            <List dense>
              {manageMembersDialog.room?.members.map((member) => (
                <ListItem key={member}>
                  <ListItemAvatar>
                    <Avatar>{member.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={member} />
                  {member !== user.username && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={memberManagement.remove.includes(member)}
                          onChange={() => handleMemberManagementToggle(member, 'remove')}
                          color="error"
                        />
                      }
                      label="Remove"
                    />
                  )}
                  {member === user.username && (
                    <Chip label="Creator" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Add New Members
            </Typography>
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {friends
                .filter(username => !manageMembersDialog.room?.members.includes(username))
                .map((username) => (
                  <ListItem key={username}>
                    <ListItemAvatar>
                      <Avatar>{username.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={username} />
                    <Checkbox
                      checked={memberManagement.add.includes(username)}
                      onChange={() => handleMemberManagementToggle(username, 'add')}
                      color="primary"
                    />
                  </ListItem>
                ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManageMembersDialog({ open: false, room: null })}>Cancel</Button>
            <Button
              onClick={handleSaveMemberChanges}
              variant="contained"
              disabled={memberManagement.add.length === 0 && memberManagement.remove.length === 0}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </MainLayout>
  );
};

export default RoomListPage;
