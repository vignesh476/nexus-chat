import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Typography,
  Chip,
  Box,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AdminPanelSettings,
  Delete,
  PersonAdd,
  ExitToApp,
} from '@mui/icons-material';
import { roomsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import UserSearch from './UserSearch';

const GroupSettingsModal = ({ open, onClose, room, onRoomUpdate }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (room) {
      setMembers(room.members);
      setAdmins(room.admins || []);
    }
  }, [room]);

  const handlePromoteAdmin = async (username) => {
    try {
      await roomsAPI.promoteAdmin(room._id, username);
      setAdmins([...admins, username]);
      onRoomUpdate(); // Notify parent component of the update
      setSnackbar({ open: true, message: `${username} has been promoted to admin.`, severity: 'success' });
    } catch (error) {
      console.error('Failed to promote admin:', error);
      setSnackbar({ open: true, message: 'Failed to promote admin.', severity: 'error' });
    }
  };

  const handleRemoveMember = async (username) => {
    try {
      await roomsAPI.removeMember(room._id, username);
      setMembers(members.filter(m => m !== username));
      onRoomUpdate();
      setSnackbar({ open: true, message: `${username} has been removed from the group.`, severity: 'success' });
    } catch (error) {
      console.error('Failed to remove member:', error);
      setSnackbar({ open: true, message: 'Failed to remove member.', severity: 'error' });
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await roomsAPI.leaveGroup(room._id);
      onClose(); // Close the modal
      // Optionally, navigate away from the chat room
      window.location.href = '/rooms';
    } catch (error) {
      console.error('Failed to leave group:', error);
      setSnackbar({ open: true, message: 'Failed to leave group.', severity: 'error' });
    }
  };

  const handleAddMembers = async (selectedUsers) => {
    try {
      for (const selectedUser of selectedUsers) {
        await roomsAPI.addMember(room._id, selectedUser.username);
      }
      const newMembers = selectedUsers.map(u => u.username);
      setMembers([...members, ...newMembers]);
      onRoomUpdate();
      setShowAddMember(false);
      setSnackbar({ open: true, message: 'Members added successfully.', severity: 'success' });
    } catch (error) {
      console.error('Failed to add members:', error);
      setSnackbar({ open: true, message: 'Failed to add members.', severity: 'error' });
    }
  };

  const isUserAdmin = admins.includes(user.username);
  const isUserCreator = room?.creator === user.username;

  if (!room) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Group Settings
            <Chip label={room.name} />
          </Box>
        </DialogTitle>
        <DialogContent>
          {showAddMember ? (
            <UserSearch onUsersSelected={handleAddMembers} />
          ) : (
            <List>
              {members.map((member) => (
                <ListItem key={member}>
                  <ListItemAvatar>
                    <Avatar>{member.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={member} />
                  {admins.includes(member) && (
                    <Chip
                      icon={<AdminPanelSettings />}
                      label={room.creator === member ? 'Creator' : 'Admin'}
                      size="small"
                      color="primary"
                    />
                  )}
                  {isUserAdmin && member !== user.username && (
                    <>
                      {!admins.includes(member) && (
                        <IconButton
                          edge="end"
                          aria-label="promote"
                          onClick={() => handlePromoteAdmin(member)}
                          title="Promote to Admin"
                        >
                          <AdminPanelSettings />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveMember(member)}
                        title="Remove Member"
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          {isUserAdmin && (
            <Button
              startIcon={<PersonAdd />}
              onClick={() => setShowAddMember(!showAddMember)}
            >
              {showAddMember ? 'Back to Members' : 'Add Members'}
            </Button>
          )}
          {!isUserCreator && (
            <Button
              startIcon={<ExitToApp />}
              color="error"
              onClick={handleLeaveGroup}
            >
              Leave Group
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GroupSettingsModal;
