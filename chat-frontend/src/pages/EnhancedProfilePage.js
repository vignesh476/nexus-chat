import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { usersAPI } from '../api';
import useResponsive from '../hooks/useResponsive';
import useSettings from '../hooks/useSettings';
import ProfilePictureDialog from '../components/ProfilePictureDialog';
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
  FormControl,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Check,
  Close,
  Palette,
  PhotoCamera,
  Settings,
  Notifications,
  Security,
  Storage,
  Backup,
  Download,
  Delete,
  Edit,
  Save,
  Accessibility,
  ExpandMore,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const { username } = useParams();
  const isOwnProfile = !username || username === user?.username;
  const { isMobile } = useResponsive();
  
  const { darkMode, messageStyle, primaryColor, accentColor, fontSize, toggleDarkMode, updateMessageStyle, updatePrimaryColor, updateAccentColor, updateFontSize } = useTheme() || {};
  
  const [status, setStatus] = useState(user?.status || '');
  const [publicKey, setPublicKey] = useState(user?.publicKey || '');
  const [friendRequests, setFriendRequests] = useState({ sent_requests: [], received_requests: [] });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Enhanced Settings States
  const {
    settings,
    error: settingsError,
    updateNestedSetting,
  } = useSettings({
    notifications: {
      new_messages: true,
      friend_requests: true,
      mentions: true,
      group_messages: true,
      calls: true,
      sound_enabled: true,
      vibration_enabled: true,
      desktop_notifications: true,
      email_notifications: false,
      push_notifications: true,
    },
    privacy: {
      profile_visibility: 'public',
      last_seen: 'everyone',
      read_receipts: true,
      typing_indicators: true,
      online_status: true,
      profile_picture_visibility: 'public',
      allow_friend_requests: true,
      block_unknown_users: false,
    },
    chat: {
      auto_download_media: 'wifi',
      media_quality: 'high',
      backup_frequency: 'weekly',
      message_history: 'forever',
      enter_to_send: true,
      show_timestamps: true,
      group_notifications: true,
      message_preview: true,
    },
    accessibility: {
      high_contrast: false,
      large_text: false,
      reduce_motion: false,
      screen_reader: false,
      keyboard_navigation: false,
      voice_commands: false,
    }
  });

  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    messages: 0,
    media: 0,
    cache: 0,
  });

  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || null);
  const [profilePicturePrivacy, setProfilePicturePrivacy] = useState(user?.profile_privacy || 'public');
  const [profilePictureDialog, setProfilePictureDialog] = useState(false);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleProfilePictureUpdate = (newPicture) => {
    setProfilePicture(newPicture);
    showSnackbar('Profile picture updated successfully!');
  };

  const handleProfilePicturePrivacyChange = (newPrivacy) => {
    setProfilePicturePrivacy(newPrivacy);
    showSnackbar('Privacy settings updated!');
  };

  const handleClearCache = async () => {
    try {
      await usersAPI.clearCache();
      setStorageInfo(prev => ({ ...prev, cache: 0 }));
      showSnackbar('Cache cleared successfully!');
    } catch (error) {
      showSnackbar('Failed to clear cache', 'error');
    }
  };

  const handleBackupData = async () => {
    try {
      const response = await usersAPI.backupUserData();
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showSnackbar('Data backup downloaded!');
    } catch (error) {
      showSnackbar('Failed to backup data', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await usersAPI.exportUserData();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-chat-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showSnackbar('Data exported successfully!');
    } catch (error) {
      showSnackbar('Failed to export data', 'error');
    }
  };

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
      fetchFriendRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (sender) => {
    try {
      await usersAPI.rejectFriendRequest(sender);
      fetchFriendRequests();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const handleSave = async () => {
    try {
      await usersAPI.updateProfile({ status, public_key: publicKey });
      updateUserProfile({ status, public_key: publicKey });
      showSnackbar('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showSnackbar('Failed to update profile', 'error');
    }
  };

  // Load storage info from API
  useEffect(() => {
    const loadStorageInfo = async () => {
      if (isOwnProfile) {
        try {
          const response = await usersAPI.getStorageInfo();
          setStorageInfo(response.data);
        } catch (error) {
          console.error('Failed to load storage info:', error);
          // Fallback to mock data
          setStorageInfo({
            used: 245,
            total: 1000,
            messages: 120,
            media: 95,
            cache: 30,
          });
        }
      }
    };
    loadStorageInfo();
  }, [isOwnProfile]);

  // Component Sections
  function ProfileSection() {
    return (
      <Card className="profile-picture-container">
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
              <Avatar
                src={profilePicture}
                sx={{ 
                  width: isMobile ? 100 : 120, 
                  height: isMobile ? 100 : 120, 
                  mx: 'auto', 
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main'
                }}
                className={isMobile ? 'profile-avatar-mobile' : ''}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => setProfilePictureDialog(true)}
                size={isMobile ? 'medium' : 'small'}
                className="mobile-action-button"
                fullWidth={isMobile}
              >
                Change Photo
              </Button>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Username"
                value={user?.username || ''}
                disabled
                margin="normal"
              />
              <TextField
                fullWidth
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                placeholder="What's on your mind?"
              />
              <TextField
                fullWidth
                label="Bio"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                placeholder="Tell others about yourself..."
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={<Save />}
            className="mobile-action-button"
            fullWidth={isMobile}
          >
            Save Changes
          </Button>
        </CardActions>
      </Card>
    );
  }

  function NotificationsSection() {
    return (
      <Card className="settings-section">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(settings.notifications || {}).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) => updateNestedSetting('notifications', key, e.target.checked)}
                    />
                  }
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              </Grid>
            ))}
          </Grid>
          {settingsError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {settingsError}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  function PrivacySection() {
    return (
      <Card className="settings-section">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Privacy & Security Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Profile Visibility</InputLabel>
                <Select
                  value={settings.privacy?.profile_visibility || 'public'}
                  onChange={(e) => updateNestedSetting('privacy', 'profile_visibility', e.target.value)}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="friends">Friends Only</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Last Seen</InputLabel>
                <Select
                  value={settings.privacy?.last_seen || 'everyone'}
                  onChange={(e) => updateNestedSetting('privacy', 'last_seen', e.target.value)}
                >
                  <MenuItem value="everyone">Everyone</MenuItem>
                  <MenuItem value="friends">Friends Only</MenuItem>
                  <MenuItem value="nobody">Nobody</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {Object.entries(settings.privacy || {})
              .filter(([key]) => !['profile_visibility', 'last_seen'].includes(key))
              .map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => updateNestedSetting('privacy', key, e.target.checked)}
                      />
                    }
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                </Grid>
              ))
            }
          </Grid>
        </CardContent>
      </Card>
    );
  }

  function ChatSettingsSection() {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chat & Media Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Auto Download Media</InputLabel>
                <Select
                  value={settings.chat?.auto_download_media || 'wifi'}
                  onChange={(e) => updateNestedSetting('chat', 'auto_download_media', e.target.value)}
                >
                  <MenuItem value="always">Always</MenuItem>
                  <MenuItem value="wifi">Wi-Fi Only</MenuItem>
                  <MenuItem value="never">Never</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Media Quality</InputLabel>
                <Select
                  value={settings.chat?.media_quality || 'high'}
                  onChange={(e) => updateNestedSetting('chat', 'media_quality', e.target.value)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {Object.entries(settings.chat || {})
              .filter(([key]) => !['auto_download_media', 'media_quality'].includes(key))
              .map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  {typeof value === 'boolean' ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={value}
                          onChange={(e) => updateNestedSetting('chat', key, e.target.checked)}
                        />
                      }
                      label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    />
                  ) : (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</InputLabel>
                      <Select
                        value={value}
                        onChange={(e) => updateNestedSetting('chat', key, e.target.value)}
                      >
                        {key === 'backup_frequency' && (
                          <>
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                            <MenuItem value="never">Never</MenuItem>
                          </>
                        )}
                        {key === 'message_history' && (
                          <>
                            <MenuItem value="1week">1 Week</MenuItem>
                            <MenuItem value="1month">1 Month</MenuItem>
                            <MenuItem value="6months">6 Months</MenuItem>
                            <MenuItem value="forever">Forever</MenuItem>
                          </>
                        )}
                      </Select>
                    </FormControl>
                  )}
                </Grid>
              ))
            }
          </Grid>
        </CardContent>
      </Card>
    );
  }

  function AppearanceSection() {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appearance & Theme
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={darkMode || false} onChange={toggleDarkMode || (() => {})} />}
                label="Dark Mode"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Message Style</InputLabel>
                <Select
                  value={messageStyle || 'bubble'}
                  onChange={(e) => updateMessageStyle && updateMessageStyle(e.target.value)}
                >
                  <MenuItem value="bubble">Bubble</MenuItem>
                  <MenuItem value="box">Box</MenuItem>
                  <MenuItem value="minimal">Minimal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Font Size</InputLabel>
                <Select
                  value={fontSize || 'medium'}
                  onChange={(e) => updateFontSize && updateFontSize(e.target.value)}
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                  <MenuItem value="xlarge">Extra Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Primary Color</Typography>
              <TextField
                type="color"
                value={primaryColor || '#667eea'}
                onChange={(e) => updatePrimaryColor && updatePrimaryColor(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Accent Color</Typography>
              <TextField
                type="color"
                value={accentColor || '#764ba2'}
                onChange={(e) => updateAccentColor && updateAccentColor(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  function AccessibilitySection() {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Accessibility Options
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(settings.accessibility || {}).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) => updateNestedSetting('accessibility', key, e.target.checked)}
                    />
                  }
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  function StorageSection() {
    return (
      <Card className="settings-section">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Storage & Data Usage
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Storage Used: {storageInfo.used}MB / {storageInfo.total}MB
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(storageInfo.used / storageInfo.total) * 100}
              sx={{ height: isMobile ? 12 : 8, borderRadius: 4 }}
              className={isMobile ? 'storage-progress' : ''}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{storageInfo.messages}MB</Typography>
                  <Typography variant="body2" color="text.secondary">Messages</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{storageInfo.media}MB</Typography>
                  <Typography variant="body2" color="text.secondary">Media</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{storageInfo.cache}MB</Typography>
                  <Typography variant="body2" color="text.secondary">Cache</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            <Button 
              variant="outlined" 
              startIcon={<Delete />} 
              onClick={handleClearCache}
              className="mobile-action-button"
              fullWidth={isMobile}
            >
              Clear Cache
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Backup />} 
              onClick={handleBackupData}
              className="mobile-action-button"
              fullWidth={isMobile}
            >
              Backup Data
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Download />} 
              onClick={handleExportData}
              className="mobile-action-button"
              fullWidth={isMobile}
            >
              Export Data
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  function FriendsSection() {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Friend Requests
          </Typography>
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
        </CardContent>
      </Card>
    );
  }

  // Enhanced Settings Sections
  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile',
      icon: <Edit />,
      component: ProfileSection,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Notifications />,
      component: NotificationsSection,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: <Security />,
      component: PrivacySection,
    },
    {
      id: 'chat',
      title: 'Chat Settings',
      icon: <Settings />,
      component: ChatSettingsSection,
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette />,
      component: AppearanceSection,
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      icon: <Accessibility />,
      component: AccessibilitySection,
    },
    {
      id: 'storage',
      title: 'Storage & Data',
      icon: <Storage />,
      component: StorageSection,
    },
    {
      id: 'friends',
      title: 'Friends',
      icon: <Check />,
      component: FriendsSection,
    },
  ];

  return (
    <MainLayout>
      <Container maxWidth={isMobile ? 'sm' : 'lg'} sx={{ py: isMobile ? 2 : 4 }} className="page-content">
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
          {isOwnProfile ? 'Settings & Profile' : `${username}'s Profile`}
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isOwnProfile ? (
              <Box>
                {/* Mobile: Accordion Layout, Desktop: Tabs */}
                {isMobile ? (
                  <Box>
                    {settingsSections.map((section) => (
                      <Accordion key={section.id} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {section.icon}
                            <Typography variant="h6">{section.title}</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <section.component />
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                ) : (
                  <Box>
                    <Tabs
                      value={tabValue}
                      onChange={(e, newValue) => setTabValue(newValue)}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    >
                      {settingsSections.map((section, index) => (
                        <Tab
                          key={section.id}
                          icon={section.icon}
                          label={section.title}
                          iconPosition="start"
                        />
                      ))}
                    </Tabs>
                    {settingsSections.map((section, index) => (
                      <Box
                        key={section.id}
                        role="tabpanel"
                        hidden={tabValue !== index}
                      >
                        {tabValue === index && <section.component />}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              /* Public Profile View */
              <Paper elevation={2} sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={profileData?.profile_picture}
                      sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                    >
                      {username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6">{username}</Typography>
                    <Chip
                      label={profileData?.status || 'Offline'}
                      color={profileData?.status === 'online' ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="h6" gutterBottom>About</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {profileData?.status || 'No status set'}
                    </Typography>
                    <Typography variant="h6" gutterBottom>Bio</Typography>
                    <Typography variant="body1">
                      {profileData?.bio || 'No bio available'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Profile Picture Dialog */}
        <ProfilePictureDialog
          open={profilePictureDialog}
          onClose={() => setProfilePictureDialog(false)}
          currentPicture={profilePicture}
          onUpdate={handleProfilePictureUpdate}
          privacy={profilePicturePrivacy}
          onPrivacyChange={handleProfilePicturePrivacyChange}
        />
      </Container>
    </MainLayout>
  );
};

export default ProfilePage;