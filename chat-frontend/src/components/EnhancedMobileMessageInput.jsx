import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Fab,
  Drawer,
  Typography,
  Paper,
  ButtonBase,
  Collapse,
  Chip,
  Avatar,
  Divider,
  Grid,
  Slide,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Send,
  Add,
  InsertEmoticon,
  Mic,
  AttachFile,
  Close,
  Gif,
  LocationOn,
  Schedule,
  Search,
  Poll,
  Brush,
  SmartToy,
  SportsEsports,
  ExpandMore,
  ExpandLess,
  CameraAlt,
  VideoCall,
  MusicNote,
  Description,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const EnhancedMobileMessageInput = ({ 
  onSend, 
  text, 
  setText, 
  onTyping,
  replyTo,
  onCancelReply,
  onEmojiClick,
  onAttachFile,
  onVoiceRecord,
  onFeatureAction,
  isRecording = false,
  disabled = false,
}) => {
  const { darkMode } = useTheme();
  const { isMobile } = useResponsive();
  const muiTheme = useMuiTheme();
  const [showFeatures, setShowFeatures] = useState(false);
  const [inputText, setInputText] = useState(text || '');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const textFieldRef = useRef(null);

  // Organized feature categories with better UX
  const featureCategories = useMemo(() => ({
    quick: {
      title: 'Quick Actions',
      color: '#6366f1',
      items: [
        { icon: InsertEmoticon, label: 'Emoji', action: 'emoji', color: '#f59e0b' },
        { icon: AttachFile, label: 'File', action: 'attach', color: '#10b981' },
        { icon: CameraAlt, label: 'Camera', action: 'camera', color: '#ef4444' },
        { icon: Mic, label: 'Voice', action: 'voice', color: '#8b5cf6' },
      ]
    },
    media: {
      title: 'Media & Content',
      color: '#ec4899',
      items: [
        { icon: Gif, label: 'GIF', action: 'gif', color: '#06b6d4' },
        { icon: Brush, label: 'Draw', action: 'draw', color: '#84cc16' },
        { icon: VideoCall, label: 'Video', action: 'video', color: '#f97316' },
        { icon: MusicNote, label: 'Audio', action: 'audio', color: '#a855f7' },
      ]
    },
    interactive: {
      title: 'Interactive',
      color: '#10b981',
      items: [
        { icon: LocationOn, label: 'Location', action: 'location', color: '#ef4444' },
        { icon: Poll, label: 'Poll', action: 'poll', color: '#3b82f6' },
        { icon: Schedule, label: 'Schedule', action: 'schedule', color: '#f59e0b' },
        { icon: SportsEsports, label: 'Games', action: 'games', color: '#8b5cf6' },
      ]
    },
    tools: {
      title: 'Tools & AI',
      color: '#f59e0b',
      items: [
        { icon: Search, label: 'Search', action: 'search', color: '#6b7280' },
        { icon: SmartToy, label: 'AI Chat', action: 'ai', color: '#6366f1' },
        { icon: Description, label: 'Templates', action: 'templates', color: '#10b981' },
      ]
    }
  }), []);

  const handleSend = useCallback(() => {
    if (inputText?.trim() && !disabled) {
      onSend(inputText);
      setInputText('');
      if (setText) setText('');
    }
  }, [inputText, onSend, setText, disabled]);

  const handleInputChange = useCallback((value) => {
    setInputText(value);
    if (setText) setText(value);
    if (onTyping) onTyping(!!value);
  }, [setText, onTyping]);

  const handleFeatureAction = useCallback((action) => {
    setShowFeatures(false);
    if (onFeatureAction) {
      onFeatureAction(action);
    }
  }, [onFeatureAction]);

  const toggleCategory = useCallback((categoryKey) => {
    setExpandedCategory(prev => prev === categoryKey ? null : categoryKey);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Reply Preview */}
      {replyTo && (
        <Slide direction="up" in={!!replyTo}>
          <Paper 
            elevation={2}
            sx={{
              mx: 2,
              mb: 1,
              p: 2,
              borderRadius: 3,
              background: darkMode 
                ? 'rgba(30, 41, 59, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  Replying to {replyTo.sender}
                </Typography>
                <Typography variant="body2" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  mt: 0.5
                }}>
                  {replyTo.content}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={onCancelReply}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: 'white',
                  }
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Slide>
      )}

      {/* Main Input Area - Fixed at bottom */}
      <Paper 
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: darkMode 
            ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          borderRadius: '20px 20px 0 0',
          // Ensure proper spacing and no overlap
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
            {/* Quick Emoji Button */}
            <IconButton 
              size="large"
              onClick={() => onEmojiClick?.()}
              disabled={disabled}
              sx={{ 
                color: 'primary.main',
                background: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                '&:hover': { 
                  backgroundColor: 'primary.main', 
                  color: 'white',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <InsertEmoticon />
            </IconButton>

            {/* Text Input - Optimized */}
            <TextField
              ref={textFieldRef}
              fullWidth
              multiline
              maxRows={4}
              value={inputText || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              variant="outlined"
              disabled={disabled}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  backgroundColor: darkMode 
                    ? 'rgba(15, 23, 42, 0.6)' 
                    : 'rgba(248, 250, 252, 0.9)',
                  fontSize: '16px', // Prevent zoom on iOS
                  minHeight: '48px',
                  '& fieldset': { 
                    border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
                  },
                  '&:hover fieldset': { 
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': { 
                    border: '2px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  px: 2,
                  color: darkMode ? '#f1f5f9' : 'inherit',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: darkMode ? '#94a3b8' : 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              {/* Send/Voice Button */}
              {inputText?.trim() ? (
                <Fab
                  size="medium"
                  color="primary"
                  onClick={handleSend}
                  disabled={disabled}
                  sx={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send />
                </Fab>
              ) : (
                <Fab
                  size="medium"
                  color={isRecording ? 'error' : 'secondary'}
                  onClick={() => onVoiceRecord?.()}
                  disabled={disabled}
                  sx={{
                    width: 48,
                    height: 48,
                    boxShadow: isRecording 
                      ? '0 4px 12px rgba(239, 68, 68, 0.4)'
                      : '0 4px 12px rgba(156, 163, 175, 0.4)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Mic />
                </Fab>
              )}
              
              {/* More Features Button */}
              <IconButton
                size="small"
                onClick={() => setShowFeatures(true)}
                disabled={disabled}
                sx={{
                  color: 'text.secondary',
                  background: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.05)',
                  '&:hover': { 
                    color: 'primary.main',
                    background: 'primary.main',
                    color: 'white',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Features Drawer */}
      <Drawer
        anchor="bottom"
        open={showFeatures}
        onClose={() => setShowFeatures(false)}
        PaperProps={{
          sx: {
            borderRadius: '20px 20px 0 0',
            maxHeight: '75vh',
            background: darkMode 
              ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            // Safe area for mobile devices
            paddingBottom: 'env(safe-area-inset-bottom)',
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Handle */}
          <Box sx={{ 
            width: 40, 
            height: 4, 
            backgroundColor: 'divider', 
            borderRadius: 2, 
            mx: 'auto', 
            mb: 3 
          }} />
          
          <Typography variant="h6" sx={{ 
            mb: 3, 
            textAlign: 'center', 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Message Features
          </Typography>

          {/* Feature Categories */}
          {Object.entries(featureCategories).map(([categoryKey, category]) => (
            <Box key={categoryKey} sx={{ mb: 2 }}>
              {/* Category Header */}
              <ButtonBase
                onClick={() => toggleCategory(categoryKey)}
                sx={{
                  width: '100%',
                  p: 2,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`,
                  border: `1px solid ${category.color}30`,
                  mb: 1,
                  justifyContent: 'space-between',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${category.color}25 0%, ${category.color}15 100%)`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}CC 100%)`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                      {category.items.length}
                    </Typography>
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {category.title}
                  </Typography>
                </Box>
                {expandedCategory === categoryKey ? <ExpandLess /> : <ExpandMore />}
              </ButtonBase>

              {/* Category Items */}
              <Collapse in={expandedCategory === categoryKey}>
                <Grid container spacing={1.5} sx={{ px: 1 }}>
                  {category.items.map((item) => (
                    <Grid item xs={6} sm={4} md={3} key={item.action}>
                      <ButtonBase
                        onClick={() => handleFeatureAction(item.action)}
                        sx={{
                          width: '100%',
                          p: 2,
                          borderRadius: 3,
                          flexDirection: 'column',
                          gap: 1,
                          background: darkMode 
                            ? `${item.color}15` 
                            : `${item.color}08`,
                          border: `1px solid ${item.color}30`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: item.color,
                            color: 'white',
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${item.color}40`,
                          }
                        }}
                      >
                        <item.icon sx={{ fontSize: 28, color: item.color }} />
                        <Typography variant="caption" sx={{ 
                          fontWeight: 500,
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}>
                          {item.label}
                        </Typography>
                      </ButtonBase>
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
              
              {categoryKey !== 'tools' && <Divider sx={{ mt: 2, opacity: 0.3 }} />}
            </Box>
          ))}
        </Box>
      </Drawer>
    </>
  );
};

export default EnhancedMobileMessageInput;