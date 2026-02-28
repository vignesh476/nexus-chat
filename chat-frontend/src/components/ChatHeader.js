import React, { useEffect } from 'react';
import { Avatar, Typography, Box, AppBar, Toolbar, Chip, Badge, IconButton, Menu, MenuItem } from '@mui/material';
import { Group, Lock, Public, MoreVert, Videocam, Phone } from '@mui/icons-material';
import { useUserProfiles } from '../context/UserProfileContext';

const ChatHeader = ({ room, currentUser, onCall, onVideoCall, onViewProfile, onSettings }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { getUserProfile } = useUserProfiles();

  if (!room) {
    return null; // Or a loading skeleton
  }

  const isGroup = room.is_group;
  let otherUser = null;
  if (!isGroup && room.members) {
    otherUser = room.members.find(m => m.username !== currentUser?.username);
  }

  const displayName = isGroup ? room.name : otherUser?.username || 'Chat';
  const otherUserProfile = otherUser ? getUserProfile(otherUser.username) : null;
const avatarUrl = isGroup ? room.avatar_url : otherUserProfile?.profile_picture_url || otherUser?.profile_picture_url;


  // Static for now, you'd fetch this from your backend
  const status = isGroup ? `${room.members?.length || 0} members` : 'Online'; 

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    onViewProfile();
    handleClose();
  }

  const handleSettings = () => {
    onSettings();
    handleClose();
  }

  return (
    <AppBar 
      position="static" 
      elevation={3} 
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: '70px', padding: '0 16px' }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: status === 'Online' ? '#4caf50' : '#757575',
              color: status === 'Online' ? '#4caf50' : '#757575',
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
            }
          }}
        >
          <Avatar
            src={avatarUrl}
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>

        <Box sx={{ flexGrow: 1, ml: 2, minWidth: 0 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.primary',
            }}
          >
            {displayName}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {status}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="primary" onClick={() => onCall('audio')}>
            <Phone />
          </IconButton>
          <IconButton color="primary" onClick={() => onCall('video')}>
            <Videocam />
          </IconButton>
          <IconButton
            id="basic-button"
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleMenu}
            color="primary"
          >
            <MoreVert />
          </IconButton>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem onClick={handleViewProfile}>View Profile</MenuItem>
            <MenuItem onClick={handleSettings}>Settings</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader;
