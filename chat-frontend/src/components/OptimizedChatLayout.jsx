import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Fade,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const OptimizedChatLayout = ({ 
  children, 
  header, 
  messageInput, 
  typingIndicator,
  onScrollToTop,
  onScrollToBottom 
}) => {
  const { darkMode } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const muiTheme = useMuiTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const messagesContainerRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Handle scroll events for scroll indicators
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearTop = scrollTop < 100;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollToTop(!isNearTop && scrollTop > 200);
    setShowScrollToBottom(!isNearBottom);
    setIsAtBottom(isNearBottom);
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      onScrollToTop?.();
    }
  }, [onScrollToTop]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      onScrollToBottom?.();
    }
  }, [onScrollToBottom]);

  // Auto-scroll to bottom when new messages arrive (if user is already at bottom)
  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [children, isAtBottom, scrollToBottom]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        // Fix for desktop spacing issues
        maxWidth: '100%',
        width: '100%',
        // Remove any default margins/padding that cause spacing issues
        m: 0,
        p: 0,
      }}
    >
      {/* Header */}
      {header && (
        <Box
          sx={{
            flexShrink: 0,
            zIndex: 10,
            position: 'relative',
          }}
        >
          {header}
        </Box>
      )}

      {/* Messages Container - Optimized for both mobile and desktop */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          // Mobile optimizations
          ...(isMobile && {
            height: 'calc(100vh - 64px - 80px)', // Header height - Input height
            WebkitOverflowScrolling: 'touch',
            // Fix iOS scroll bounce
            overscrollBehavior: 'contain',
          }),
          // Desktop optimizations
          ...(!isMobile && {
            height: 'calc(100vh - 80px - 120px)', // Header - Input with padding
            paddingBottom: '20px',
          }),
          // Scrollbar styling
          '&::-webkit-scrollbar': {
            width: isMobile ? '2px' : '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: darkMode 
              ? 'rgba(148, 163, 184, 0.3)' 
              : 'rgba(148, 163, 184, 0.4)',
            borderRadius: '3px',
            '&:hover': {
              background: darkMode 
                ? 'rgba(148, 163, 184, 0.5)' 
                : 'rgba(148, 163, 184, 0.6)',
            },
          },
          // Smooth scrolling
          scrollBehavior: 'smooth',
          // Padding adjustments
          px: isMobile ? 1 : 2,
          py: isMobile ? 1 : 2,
        }}
      >
        {children}
      </Box>

      {/* Typing Indicator */}
      {typingIndicator && (
        <Box
          sx={{
            flexShrink: 0,
            px: isMobile ? 2 : 3,
            py: 1,
            background: darkMode 
              ? 'rgba(30, 41, 59, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          }}
        >
          {typingIndicator}
        </Box>
      )}

      {/* Message Input - Fixed positioning */}
      <Box
        sx={{
          flexShrink: 0,
          position: 'relative',
          zIndex: 5,
          // Mobile: Fixed at bottom
          ...(isMobile && {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            // Ensure it's above other content
            zIndex: 1000,
          }),
          // Desktop: Relative positioning
          ...(!isMobile && {
            background: darkMode 
              ? 'rgba(30, 41, 59, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          }),
        }}
      >
        {messageInput}
      </Box>

      {/* Scroll to Top Button */}
      <Fade in={showScrollToTop}>
        <Paper
          sx={{
            position: 'fixed',
            top: isMobile ? '50%' : '40%',
            right: isMobile ? 8 : 16,
            zIndex: 1001,
            borderRadius: '50%',
            background: darkMode 
              ? 'rgba(99, 102, 241, 0.9)' 
              : 'rgba(99, 102, 241, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Tooltip title="Scroll to top" placement="left">
            <IconButton
              onClick={scrollToTop}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                color: 'white',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <KeyboardArrowUp />
            </IconButton>
          </Tooltip>
        </Paper>
      </Fade>

      {/* Scroll to Bottom Button */}
      <Fade in={showScrollToBottom}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: isMobile ? 100 : 140,
            right: isMobile ? 8 : 16,
            zIndex: 1001,
            borderRadius: '50%',
            background: darkMode 
              ? 'rgba(34, 197, 94, 0.9)' 
              : 'rgba(34, 197, 94, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          }}
        >
          <Tooltip title="Scroll to bottom" placement="left">
            <IconButton
              onClick={scrollToBottom}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                color: 'white',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <KeyboardArrowDown />
            </IconButton>
          </Tooltip>
        </Paper>
      </Fade>
    </Box>
  );
};

export default OptimizedChatLayout;