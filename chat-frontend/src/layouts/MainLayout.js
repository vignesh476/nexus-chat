import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Navigation from '../components/Navigation';
import { useTheme } from '../context/ThemeContext';
import { modernTheme, darkModernTheme } from '../styles/modernTheme';
import useResponsive from '../hooks/useResponsive';

const MainLayout = ({ children }) => {
  const { darkMode } = useTheme() || {};
  const { isMobile } = useResponsive();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = darkMode ? darkModernTheme : modernTheme;
  
  // Check if current page is a chat page
  const isChatPage = location.pathname.startsWith('/chat/');
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <Navigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            padding: 0, 
            overflow: isMobile ? 'auto' : 'hidden',
            position: 'relative',
            marginTop: isMobile ? '56px' : 0,
            marginBottom: isMobile && !isChatPage ? '56px' : 0,
            height: isMobile 
              ? (isChatPage ? 'calc(100vh - 56px)' : 'calc(100vh - 112px)')
              : '100vh',
            // Enable scrolling for non-chat pages
            overflowY: isChatPage ? 'hidden' : 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout;