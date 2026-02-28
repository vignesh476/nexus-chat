import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import { Search, Group, Person, Send } from '@mui/icons-material';
import { roomsAPI, messagesAPI } from '../api';

const MessageForward = ({ open, onClose, message, onForward }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRooms();
    }
  }, [open]);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.listRooms();
      setRooms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleRoomToggle = (roomId) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleForward = async () => {
    if (selectedRooms.length === 0) return;
    
    setLoading(true);
    try {
      await messagesAPI.forwardMessage(message._id, selectedRooms);
      onForward?.(selectedRooms);
      onClose();
      setSelectedRooms([]);
    } catch (error) {
      console.error('Failed to forward message:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.members?.some(member => member.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMessagePreview = () => {
    if (message?.content) return message.content;
    if (message?.file_url) return `[${message.file_type || 'File'}]`;
    if (message?.type === 'gif') return '[GIF]';
    return '[Message]';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Forward Message</DialogTitle>
      <DialogContent>
        {/* Message Preview */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          mb: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="caption" color="text.secondary">
            From: {message?.sender}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {getMessagePreview()}
          </Typography>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Selected Rooms */}
        {selectedRooms.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected ({selectedRooms.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedRooms.map(roomId => {
                const room = rooms.find(r => r.id === roomId);
                return (
                  <Chip
                    key={roomId}
                    label={room?.name || 'Unknown'}
                    onDelete={() => handleRoomToggle(roomId)}
                    size="small"
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Room List */}
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredRooms.map((room) => (
            <ListItem
              key={room.id}
              button
              onClick={() => handleRoomToggle(room.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Checkbox
                checked={selectedRooms.includes(room.id)}
                onChange={() => handleRoomToggle(room.id)}
                sx={{ mr: 1 }}
              />
              <ListItemAvatar>
                <Avatar>
                  {room.type === 'group' ? <Group /> : <Person />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={room.name}
                secondary={
                  room.type === 'group' 
                    ? `${room.members?.length || 0} members`
                    : 'Direct message'
                }
              />
            </ListItem>
          ))}
          {filteredRooms.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {searchQuery ? 'No chats found' : 'No chats available'}
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleForward}
          disabled={selectedRooms.length === 0 || loading}
          variant="contained"
          startIcon={<Send />}
        >
          Forward to {selectedRooms.length} chat{selectedRooms.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageForward;