import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { usersAPI } from '../api';
import useResponsive from '../hooks/useResponsive';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Avatar,
  Typography,
  Switch,
  FormControlLabel,
  Badge,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import {
  Chat,
  Person,
  Logout,
  Brightness4,
  Brightness7,
  Notifications,
  Phone,
  Settings,
  Menu,
} from '@mui/icons-material';
import StoriesBar from '../components/StoriesBar';
import CollectionsIcon from '@mui/icons-material/Collections';
import { useSocket } from '../context/SocketContext';
import StoryViewer from '../components/StoryViewer';
import { getStories } from '../api/stories';
import Dialog from '@mui/material/Dialog';

const drawerWidth = 280;

const Navigation = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, presence } = useAuth();
  const socket = useSocket();
  const { darkMode, toggleDarkMode } = useTheme();
  const { isMobile, isSmallMobile } = useResponsive();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [openStoriesDialog, setOpenStoriesDialog] = useState(false);
  const [storiesDialog, setStoriesDialog] = useState([]);
  const [activeItem, setActiveItem] = useState('');

  // Set active item based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/rooms' || path === '/') {
      setActiveItem('rooms');
    } else if (path === '/notifications') {
      setActiveItem('notifications');
    } else if (path === '/profile') {
      setActiveItem('profile');
    } else if (path === '/calls') {
      setActiveItem('calls');
    } else if (path.startsWith('/chat/')) {
      setActiveItem('rooms'); // Chat pages belong to rooms
    } else {
      setActiveItem(''); // No active item for other pages
    }
  }, [location.pathname]);

  // Hide bottom navigation on chat pages
  const isChatPage = location.pathname.startsWith('/chat/');
  const shouldShowBottomNav = isMobile && !isChatPage;

  useEffect(() => {
    if (user) {
      fetchPendingRequestsCount();
    }
  }, [user]);

  const fetchPendingRequestsCount = async () => {
    try {
      const response = await usersAPI.getFriendRequests();
      setPendingRequestsCount(response.data.received_requests.length);
    } catch (error) {
      console.error('Failed to fetch pending requests count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path, itemKey) => {
    setActiveItem(itemKey);
    navigate(path);
    // Close mobile drawer after navigation
    if (isMobile && setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const menuItems = [
    { key: 'rooms', label: 'Chats', icon: Chat, path: '/rooms', badge: null },
    { key: 'notifications', label: 'Notifications', icon: Notifications, path: '/notifications', badge: null },
    { key: 'profile', label: 'Profile', icon: Person, path: '/profile', badge: pendingRequestsCount },
    { key: 'calls', label: 'Calls', icon: Phone, path: '/calls', badge: null },
    { key: 'stories', label: 'Stories', icon: CollectionsIcon, path: null, badge: null },
  ];

  // Desktop Navigation Content
  const drawerContent = (
    <>
      {/* User Profile Section */}
      <Box sx={{ 
        p: isMobile ? 2 : 3, 
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
        borderRadius: '0 0 24px 24px',
        mb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: presence?.status === 'online' ? '#10b981' :
                                presence?.status === 'away' ? '#f59e0b' :
                                presence?.status === 'busy' ? '#ef4444' : '#6b7280',
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `3px solid ${darkMode ? '#0f172a' : '#ffffff'}`,
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: isMobile ? 48 : 56, 
                height: isMobile ? 48 : 56,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                fontWeight: 600,
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
              }} 
              src={user?.profile_picture}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ 
              fontWeight: 600,
              background: darkMode 
                ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {user?.username}
            </Typography>
            {presence?.custom_status && (
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                mt: 0.5,
              }}>
                {presence.custom_status}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ px: 2 }}>
        <List sx={{ py: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.key} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  if (item.key === 'stories') {
                    getStories().then(res => {
                      setStoriesDialog(res || []);
                      setOpenStoriesDialog(true);
                    }).catch(e => {
                      console.warn('Failed to load stories:', e);
                      setOpenStoriesDialog(true);
                    });
                  } else {
                    handleNavigation(item.path, item.key);
                  }
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: activeItem === item.key 
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'transparent',
                  color: activeItem === item.key ? 'white' : 'text.primary',
                  '&:hover': {
                    background: activeItem === item.key 
                      ? 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)'
                      : darkMode 
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'rgba(99, 102, 241, 0.05)',
                    transform: 'translateX(4px)',
                    boxShadow: activeItem === item.key 
                      ? '0 8px 25px rgba(99, 102, 241, 0.4)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit',
                  minWidth: 40,
                }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      <item.icon />
                    </Badge>
                  ) : (
                    <item.icon />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: activeItem === item.key ? 600 : 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Stories Section - Only on desktop */}
      {!isMobile && (
        <Box sx={{ px: 2, py: 1 }}>
          <StoriesBar socket={socket} />
        </Box>
      )}

      <StoryViewer 
        open={openStoriesDialog} 
        onClose={() => setOpenStoriesDialog(false)} 
        stories={storiesDialog} 
        startIndex={0} 
        socket={socket} 
      />

      {/* Bottom Section */}
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Theme Toggle */}
      {!isMobile && (
        <Box sx={{ 
          p: 2, 
          mx: 2,
          mb: 2,
          background: darkMode 
            ? 'rgba(30, 41, 59, 0.5)'
            : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#6366f1',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#6366f1',
                    },
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {darkMode ? <Brightness4 /> : <Brightness7 />}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {darkMode ? 'Dark' : 'Light'} Mode
                </Typography>
              </Box>
            }
          />
        </Box>
      )}

      {/* Logout Button */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 3,
            py: 1.5,
            px: 2,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          />
        </ListItemButton>
      </Box>
    </>
  );

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar - Show on non-chat pages and hide when drawer is open */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            color: darkMode ? 'white' : 'black',
            display: (isChatPage || mobileOpen) ? 'none' : 'block',
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen && setMobileOpen(true)}
              sx={{ mr: 2, color: 'inherit' }}
            >
              <Menu />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: presence?.status === 'online' ? '#10b981' : '#6b7280',
                    width: 12,
                    height: 12,
                  },
                }}
              >
                <Avatar 
                  sx={{ width: 32, height: 32, mr: 2 }} 
                  src={user?.profile_picture}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {user?.username}
              </Typography>
            </Box>
            <IconButton onClick={toggleDarkMode} sx={{ color: 'inherit' }}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen && setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: isSmallMobile ? '85vw' : '320px',
              maxWidth: '320px',
              background: darkMode 
                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Mobile Bottom Navigation - Hidden on chat pages */}
        {shouldShowBottomNav && (
          <BottomNavigation
            value={activeItem}
            onChange={(event, newValue) => {
              const item = menuItems.find(item => item.key === newValue);
              if (item) {
                if (item.key === 'stories') {
                  getStories().then(res => {
                    setStoriesDialog(res || []);
                    setOpenStoriesDialog(true);
                  }).catch(e => {
                    console.warn('Failed to load stories:', e);
                    setOpenStoriesDialog(true);
                  });
                } else {
                  handleNavigation(item.path, item.key);
                }
              }
            }}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000, // Lower than message input (1002)
              background: darkMode 
                ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
              '& .MuiBottomNavigationAction-root': {
                color: darkMode ? '#94a3b8' : '#64748b',
                '&.Mui-selected': {
                  color: '#6366f1',
                },
              },
            }}
          >
            {menuItems.slice(0, 4).map((item) => (
              <BottomNavigationAction
                key={item.key}
                label={item.label}
                value={item.key}
                icon={
                  item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      <item.icon />
                    </Badge>
                  ) : (
                    <item.icon />
                  )
                }
              />
            ))}
          </BottomNavigation>
        )}

        <StoryViewer 
          open={openStoriesDialog} 
          onClose={() => setOpenStoriesDialog(false)} 
          stories={storiesDialog} 
          startIndex={0} 
          socket={socket} 
        />
      </>
    );
  }



  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: darkMode 
            ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          boxShadow: darkMode 
            ? '4px 0 24px rgba(0, 0, 0, 0.3)'
            : '4px 0 24px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );

  
};

export default Navigation;