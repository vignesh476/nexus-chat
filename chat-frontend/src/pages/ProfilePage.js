import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { usersAPI } from '../api';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel as MuiFormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Check,
  Close,
  Palette,
  PhotoCamera,
  Public,
  Lock,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ProfilePage = () => {
  const { user, presence, updatePresence, updateUserProfile } = useAuth();
  const { username } = useParams();
  const isOwnProfile = !username || username === user?.username;
  
  console.log('ProfilePage Debug:', { username, userUsername: user?.username, isOwnProfile });
  
  const { darkMode, messageStyle, chatBackground, primaryColor, accentColor, fontSize, borderRadius, animationsEnabled, toggleDarkMode, updateMessageStyle, updateChatBackground, updatePrimaryColor, updateAccentColor, updateFontSize, updateBorderRadius } = useTheme() || {};
  
  const [status, setStatus] = useState(user?.status || '');
  const [publicKey, setPublicKey] = useState(user?.publicKey || '');
  const [presenceStatus, setPresenceStatus] = useState(presence?.status || 'online');
  const [customStatus, setCustomStatus] = useState(presence?.custom_status || '');
  const [friendRequests, setFriendRequests] = useState({ sent_requests: [], received_requests: [] });
  const [notificationPreferences, setNotificationPreferences] = useState({ new_messages: true, friend_requests: true, mentions: true });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState(null);

  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || null);
  const [profilePicturePrivacy, setProfilePicturePrivacy] = useState(user?.profile_privacy || 'public');
  const [profilePictureDialog, setProfilePictureDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOwnProfile) {
      fetchFriendRequests();
      setLoading(false);
    } else {
      fetchUserProfile(username);
    }
  }, [username, isOwnProfile]);

  const fetchUserProfile = async (targetUsername) => {
    try {
      setLoading(true);
      const response = await usersAPI.getUserProfile(targetUsername);
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setProfileData({ error: 'Profile not found or unavailable' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await usersAPI.getFriendRequests();
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const handleAcceptFriendRequest = async (sender) => {
    try {
      await usersAPI.acceptFriendRequest(sender);
      fetchFriendRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (sender) => {
    try {
      await usersAPI.rejectFriendRequest(sender);
      fetchFriendRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const handleSave = async () => {
    try {
      await usersAPI.updateProfile({ status, public_key: publicKey });
      updateUserProfile({ status, public_key: publicKey });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isOwnProfile ? 'My Profile' : `${username}'s Profile`}
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Profile Display Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={isOwnProfile ? profilePicture : profileData?.profile_picture}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  >
                    {(isOwnProfile ? user?.username : username)?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6">{isOwnProfile ? user?.username : username}</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  {isOwnProfile ? (
                    <>
                      <TextField
                        fullWidth
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        margin="normal"
                        multiline
                        rows={2}
                      />
                      <TextField
                        fullWidth
                        label="Public Key"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        margin="normal"
                        multiline
                        rows={4}
                      />
                      <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom>Status</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {profileData?.status || 'No status set'}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Only show customization sections for own profile */}
            {isOwnProfile && (
              <>
                {/* Presence Settings */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>Presence Settings</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Status"
                        value={presenceStatus}
                        onChange={(e) => setPresenceStatus(e.target.value)}
                        SelectProps={{ native: true }}
                        margin="normal"
                      >
                        <option value="online">Online</option>
                        <option value="away">Away</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Custom Status"
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value)}
                        margin="normal"
                        placeholder="What's on your mind?"
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        await updatePresence({ status: presenceStatus, custom_status: customStatus });
                      } catch (error) {
                        console.error('Failed to update presence:', error);
                      }
                    }}
                    sx={{ mt: 2 }}
                  >
                    Update Presence
                  </Button>
                </Paper>

                {/* Notification Preferences */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>Notification Preferences</Typography>
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={notificationPreferences.new_messages} />}
                      label="New Messages"
                    />
                    <FormControlLabel
                      control={<Switch checked={notificationPreferences.friend_requests} />}
                      label="Friend Requests"
                    />
                    <FormControlLabel
                      control={<Switch checked={notificationPreferences.mentions} />}
                      label="Mentions"
                    />
                  </Box>
                </Paper>

                {/* Chat Customization */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Palette sx={{ mr: 1 }} />
                    Chat Customization
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Message Style"
                        value={messageStyle || 'bubble'}
                        onChange={(e) => updateMessageStyle && updateMessageStyle(e.target.value)}
                        SelectProps={{ native: true }}
                        margin="normal"
                      >
                        <option value="bubble">Bubble (Modern)</option>
                        <option value="box">Box (Classic)</option>
                        <option value="minimal">Minimal</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Chat Background"
                        value={chatBackground || 'default'}
                        onChange={(e) => updateChatBackground && updateChatBackground(e.target.value)}
                        SelectProps={{ native: true }}
                        margin="normal"
                      >
                        <option value="default">Default</option>
                        <option value="gradient">Gradient</option>
                        <option value="dark">Dark Pattern</option>
                        <option value="colorful">Colorful</option>
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Friend Requests */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>Friend Requests</Typography>
                  <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label={`Received (${friendRequests.received_requests?.length || 0})`} />
                    <Tab label={`Sent (${friendRequests.sent_requests?.length || 0})`} />
                  </Tabs>
                  <Box sx={{ mt: 2 }}>
                    {tabValue === 0 && (
                      <List>
                        {friendRequests.received_requests?.length === 0 ? (
                          <Typography>No received friend requests</Typography>
                        ) : (
                          friendRequests.received_requests?.map((sender) => (
                            <ListItem key={sender}>
                              <ListItemText primary={sender} />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  color="success" 
                                  onClick={() => handleAcceptFriendRequest(sender)}
                                  sx={{ mr: 1 }}
                                >
                                  <Check />
                                </IconButton>
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleRejectFriendRequest(sender)}
                                >
                                  <Close />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))
                        )}
                      </List>
                    )}
                    {tabValue === 1 && (
                      <List>
                        {friendRequests.sent_requests?.length === 0 ? (
                          <Typography>No sent friend requests</Typography>
                        ) : (
                          friendRequests.sent_requests?.map((receiver) => (
                            <ListItem key={receiver}>
                              <ListItemText primary={receiver} />
                              <Chip label="Pending" color="warning" size="small" />
                            </ListItem>
                          ))
                        )}
                      </List>
                    )}
                  </Box>
                </Paper>

                {/* Advanced Customization */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Palette sx={{ mr: 1 }} />
                    Advanced Customization
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Personalize your chat experience with colors, styles, and animations.
                  </Typography>
                  
                  {/* Theme Toggle */}
                  <FormControlLabel
                    control={<Switch checked={darkMode || false} onChange={toggleDarkMode || (() => {})} />}
                    label="Dark Mode"
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Animations Toggle */}
                  <FormControlLabel
                    control={<Switch checked={animationsEnabled !== false} onChange={(e) => {
                      localStorage.setItem('animationsEnabled', e.target.checked);
                      window.location.reload();
                    }} />}
                    label="Enable Animations"
                    sx={{ mb: 2 }}
                  />
                  
                  <Grid container spacing={3}>
                    {/* Colors */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Colors</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Primary Color</Typography>
                        <TextField
                          type="color"
                          value={primaryColor || '#667eea'}
                          onChange={(e) => updatePrimaryColor && updatePrimaryColor(e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Accent Color</Typography>
                        <TextField
                          type="color"
                          value={accentColor || '#764ba2'}
                          onChange={(e) => updateAccentColor && updateAccentColor(e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    {/* Typography */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Typography & Layout</Typography>
                      <TextField
                        select
                        fullWidth
                        label="Font Size"
                        value={fontSize || 'medium'}
                        onChange={(e) => updateFontSize && updateFontSize(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        sx={{ mb: 2 }}
                      >
                        <option value="small">Small (14px)</option>
                        <option value="medium">Medium (16px)</option>
                        <option value="large">Large (18px)</option>
                        <option value="xlarge">Extra Large (20px)</option>
                      </TextField>
                      
                      <TextField
                        select
                        fullWidth
                        label="Border Radius"
                        value={borderRadius || 'medium'}
                        onChange={(e) => updateBorderRadius && updateBorderRadius(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                      >
                        <option value="none">None (0px)</option>
                        <option value="small">Small (8px)</option>
                        <option value="medium">Medium (16px)</option>
                        <option value="large">Large (24px)</option>
                        <option value="round">Round (50px)</option>
                      </TextField>
                    </Grid>
                    
                    {/* Preview */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>Live Preview</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        See how your messages will appear:
                      </Typography>
                      
                      {/* Your message preview */}
                      <Box sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${primaryColor || '#667eea'} 0%, ${accentColor || '#764ba2'} 100%)`,
                        borderRadius: (borderRadius === 'none' ? 0 : borderRadius === 'small' ? 1 : borderRadius === 'large' ? 3 : borderRadius === 'round' ? 6 : 2),
                        color: 'white',
                        mb: 2,
                        fontSize: (fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px'),
                        maxWidth: '70%',
                        ml: 'auto',
                        textAlign: 'right'
                      }}>
                        Your messages will look like this! 🎨
                      </Box>
                      
                      {/* Received message preview */}
                      <Box sx={{ 
                        p: 2, 
                        background: darkMode ? '#2f2f2f' : '#ffffff',
                        borderRadius: (borderRadius === 'none' ? 0 : borderRadius === 'small' ? 1 : borderRadius === 'large' ? 3 : borderRadius === 'round' ? 6 : 2),
                        color: darkMode ? 'white' : 'black',
                        border: `1px solid ${darkMode ? '#555' : '#e0e0e0'}`,
                        fontSize: (fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px'),
                        maxWidth: '70%',
                        mb: 2
                      }}>
                        Received messages will look like this! 💬
                      </Box>
                      
                      {/* Special message types */}
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Special Message Types:</Typography>
                      <Box sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`,
                        borderRadius: '25px 25px 5px 25px',
                        color: 'white',
                        mb: 1,
                        fontSize: (fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px'),
                        maxWidth: '70%',
                        ml: 'auto',
                        textAlign: 'right'
                      }}>
                        Questions get special styling? ❓
                      </Box>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`,
                        borderRadius: (borderRadius === 'none' ? 0 : borderRadius === 'small' ? 1 : borderRadius === 'large' ? 3 : borderRadius === 'round' ? 6 : 2),
                        color: 'white',
                        mb: 1,
                        fontSize: (fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px'),
                        maxWidth: '70%',
                        ml: 'auto',
                        textAlign: 'right',
                        animation: animationsEnabled !== false ? 'pulse 2s infinite' : 'none'
                      }}>
                        Exclamations get animations! ⚡
                      </Box>
                      
                      <Box sx={{ 
                        p: 2, 
                        background: `linear-gradient(135deg, ${primaryColor || '#667eea'} 0%, ${accentColor || '#764ba2'} 100%)`,
                        borderRadius: (borderRadius === 'none' ? 0 : borderRadius === 'small' ? 1 : borderRadius === 'large' ? 3 : borderRadius === 'round' ? 6 : 2),
                        color: 'white',
                        fontSize: (fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px'),
                        maxWidth: '70%',
                        ml: 'auto',
                        textAlign: 'right',
                        transform: 'scale(1.02)',
                        boxShadow: `0 8px 25px ${primaryColor || '#667eea'}50`
                      }}>
                        🎮 Game messages get enhanced styling! 🎲
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}

            {/* Public view for other users */}
            {!isOwnProfile && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>About {username}</Typography>
                <Typography variant="body1">
                  {profileData?.status || 'No status set'}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Container>
    </MainLayout>
  );
};

export default ProfilePage;