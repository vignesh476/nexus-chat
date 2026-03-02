import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
} from '@mui/material';
import {
  ArrowBack,
  MoreVert,
  Call,
  Videocam,
  Person,
  Settings,
  Search,
  Group,
  Lock,
  Public,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { useUserProfiles } from '../context/UserProfileContext';
import useResponsive from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';

const MobileChatHeader = ({ 
  room, 
  currentUser, 
  onCall, 
  onVideoCall, 
  onViewProfile, 
  onSettings,
  onSearch 
}) => {
  const { darkMode } = useTheme();
  const { isMobile } = useResponsive();
  const { getUserProfile, userProfiles } = useUserProfiles();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Get other user profile for direct chats
  const otherUser = !room?.is_group && room?.members 
    ? room.members.find(m => m.username !== currentUser?.username)
    : null;
  
  const otherUserProfile = otherUser ? userProfiles.get(otherUser.username) : null;

  // Fetch profile when component mounts or room changes
  useEffect(() => {
    if (otherUser?.username) {
      getUserProfile(otherUser.username);
    }
  }, [otherUser?.username, getUserProfile]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBack = () => {
    navigate('/rooms');
  };

  const getOnlineStatus = () => {
    if (room?.is_group) return null;
    return otherUserProfile?.status || 'offline';
  };

  const getLastSeen = () => {
    if (room?.is_group) {
      return `${room.members?.length || 0} members`;
    }
    const status = getOnlineStatus();
    if (status === 'online') return 'Active now';
    if (status === 'away') return 'Away';
    return 'Offline';
  };

  const getAvatarUrl = () => {
    if (room?.is_group) return room.avatar_url;
    return otherUserProfile?.profile_picture_url || otherUser?.profile_picture_url;
  };

  if (!isMobile) {
    // Return desktop version
    return null; // Use existing ChatHeader component
  }

  return (
    <AppBar 
      position='fixed' 
      elevation={2}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: darkMode ? 'white' : 'black',
        borderBottom: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
        // Mobile optimizations
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        willChange: 'transform',
        // Prevent layout shifts on mobile
        minHeight: '56px',
        // Safe area handling for notched devices
        paddingTop: 'env(safe-area-inset-top)',
        // Improve touch performance
        touchAction: 'manipulation',
      }}
    >
      <Toolbar sx={{ 
        minHeight: '56px !important', 
        px: 1,
        // Mobile touch optimizations
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        // Ensure proper spacing with safe areas
        paddingLeft: 'max(8px, env(safe-area-inset-left))',
        paddingRight: 'max(8px, env(safe-area-inset-right))',
      }}>
        {/* Back Button */}
        <IconButton
          edge='start'
          onClick={handleBack}
          sx={{ 
            mr: 1,
            color: 'inherit',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <ArrowBack />
        </IconButton>

        {/* Room Avatar & Info */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1, 
            minWidth: 0,
            cursor: 'pointer'
          }}
          onClick={onViewProfile}
        >
          <Badge
            overlap='circular'
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant='dot'
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: getOnlineStatus() === 'online' ? '#10b981' : 
                                getOnlineStatus() === 'away' ? '#f59e0b' : '#6b7280',
                width: 12,
                height: 12,
                border: `2px solid ${darkMode ? '#1e293b' : '#ffffff'}`,
              },
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                mr: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontSize: '1rem',
                fontWeight: 600,
              }}
              src={getAvatarUrl()}
            >
              {room?.name?.charAt(0)?.toUpperCase() || 'R'}
            </Avatar>
          </Badge>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {room?.name || 'Chat Room'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {/* Online Status */}
              <Typography
                variant='caption'
                sx={{
                  color: getOnlineStatus() === 'online' ? '#10b981' : 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {getLastSeen()}
              </Typography>
              
              {/* Room Type Indicator */}
              {room?.is_group && (
                <Chip
                  icon={<Group />}
                  label={`${room.members?.length || 0}`}
                  size='small'
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': { fontSize: 12 },
                    backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                    color: 'primary.main',
                  }}
                />
              )}
              
              {room?.is_private && (
                <Lock sx={{ fontSize: 14, color: 'text.secondary' }} />
              )}
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Quick Call Buttons */}
          <IconButton
            onClick={() => onCall?.('audio')}
            sx={{
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'success.main',
                color: 'white',
              }
            }}
          >
            <Call fontSize='small' />
          </IconButton>
          
          <IconButton
            onClick={() => onVideoCall?.('video')}
            sx={{
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              }
            }}
          >
            <Videocam fontSize='small' />
          </IconButton>

          {/* More Options */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              color: 'inherit',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Toolbar>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 200,
            background: darkMode 
              ? 'rgba(30, 41, 59, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleMenuClose(); onSearch?.(); }}>
          <ListItemIcon>
            <Search fontSize='small' />
          </ListItemIcon>
          <ListItemText>Search Messages</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleMenuClose(); onViewProfile?.(); }}>
          <ListItemIcon>
            <Person fontSize='small' />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleMenuClose(); onSettings?.(); }}>
          <ListItemIcon>
            <Settings fontSize='small' />
          </ListItemIcon>
          <ListItemText>Chat Settings</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default MobileChatHeader;