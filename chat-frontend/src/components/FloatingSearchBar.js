import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  InputBase,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Fade,
  Popper,
  ClickAwayListener,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Close,
  Image,
  Person,
  Message,
  Room,
  Public,
  Lock,
} from '@mui/icons-material';
import { messagesAPI, usersAPI, roomsAPI } from '../api';

const FloatingSearchBar = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const searchRef = useRef(null);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [imagesRes, usersRes, roomsRes] = await Promise.allSettled([
        messagesAPI.searchImages(searchQuery),
        usersAPI.searchUsers(searchQuery),
        roomsAPI.listRooms(),
      ]);

      const searchResults = [];

      // Process images
      if (imagesRes.status === 'fulfilled') {
        const images = imagesRes.value.data || [];
        images.forEach(img => {
          searchResults.push({
            type: 'image',
            id: img._id,
            title: img.file_name || 'Image',
            subtitle: `By ${img.sender}`,
            avatar: img.file_path,
            privacy: img.privacy,
            timestamp: img.timestamp,
          });
        });
      }

      // Process users
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data || [];
        users.forEach(user => {
          searchResults.push({
            type: 'user',
            id: user.username,
            title: user.username,
            subtitle: user.is_friend ? 'Friend' : 'Not a friend',
            avatar: null,
            isFriend: user.is_friend,
          });
        });
      }

      // Process rooms (filter by name)
      if (roomsRes.status === 'fulfilled') {
        const rooms = roomsRes.value.data || [];
        rooms
          .filter(room => room.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .forEach(room => {
            searchResults.push({
              type: 'room',
              id: room._id,
              title: room.name,
              subtitle: `${room.members?.length || 0} members`,
              avatar: null,
              isPrivate: room.is_private,
            });
          });
      }

      setResults(searchResults.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setAnchorEl(searchRef.current);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery('');
    setResults([]);
    setAnchorEl(null);
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'image': return <Image color="primary" />;
      case 'user': return <Person color="secondary" />;
      case 'room': return <Room color="success" />;
      default: return <Message />;
    }
  };

  const getPrivacyIcon = (privacy) => {
    return privacy === 'public' ? <Public fontSize="small" /> : <Lock fontSize="small" />;
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: 'relative' }}>
        <Paper
          ref={searchRef}
          elevation={isExpanded ? 8 : 2}
          sx={{
            position: 'relative',
            borderRadius: isExpanded ? '24px 24px 0 0' : '50px',
            background: isExpanded
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isExpanded
              ? '0 20px 40px rgba(0, 0, 0, 0.15)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: isExpanded ? '400px' : '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-1px)',
            }
          }}
          onClick={() => !isExpanded && handleFocus()}
        >
          <IconButton
            sx={{
              ml: 1,
              color: 'text.secondary',
              transition: 'all 0.2s ease',
            }}
            size="small"
          >
            <Search />
          </IconButton>

          <Fade in={isExpanded} timeout={300}>
            <InputBase
              value={query}
              onChange={handleInputChange}
              placeholder="Search images, users, rooms..."
              sx={{
                flex: 1,
                ml: 1,
                fontSize: '16px',
                '& input::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7,
                }
              }}
              autoFocus
            />
          </Fade>

          {isExpanded && (
            <Fade in={isExpanded} timeout={200}>
              <IconButton
                onClick={handleClose}
                sx={{
                  mr: 1,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' }
                }}
                size="small"
              >
                <Close />
              </IconButton>
            </Fade>
          )}

          {loading && (
            <CircularProgress
              size={20}
              sx={{ mr: 2, color: 'primary.main' }}
            />
          )}
        </Paper>

        <Popper
          open={isExpanded && results.length > 0}
          anchorEl={anchorEl}
          placement="bottom-start"
          sx={{ zIndex: 1300 }}
        >
          <Paper
            sx={{
              mt: 1,
              borderRadius: '0 0 24px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              maxWidth: '400px',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            <List sx={{ py: 1 }}>
              {results.map((result, index) => (
                <ListItem
                  key={`${result.type}-${result.id}`}
                  button
                  onClick={() => {
                    onResultClick?.(result);
                    handleClose();
                  }}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.04) 100%)',
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={result.avatar}
                      sx={{
                        bgcolor: result.type === 'image' ? 'primary.main' :
                                result.type === 'user' ? 'secondary.main' : 'success.main',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {result.type === 'image' ? <Image fontSize="small" /> :
                       result.type === 'user' ? <Person fontSize="small" /> :
                       <Room fontSize="small" />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {result.title}
                        </Typography>
                        {result.type === 'image' && getPrivacyIcon(result.privacy)}
                        {result.type === 'user' && result.isFriend && (
                          <Chip label="Friend" size="small" color="primary" variant="outlined" />
                        )}
                        {result.type === 'room' && result.isPrivate && (
                          <Lock fontSize="small" color="action" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {result.subtitle}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default FloatingSearchBar;
