import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { sanitizeInput } from '../utils/security';
import config from '../config';
import ErrorBoundary from './ErrorBoundary';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Button,
} from '@mui/material';
import { Send, AttachFile, Close, InsertEmoticon, Gif, Mic, Stop, Lock, Public, Brush, SmartToy, Search, Forward, Schedule, Translate, Reply, LocationOn, Poll } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import AnimatedButton from './AnimatedButton';
import GamesMenu from './GamesMenu';
import MessageSearch from './MessageSearch';
import MessageForward from './MessageForward';
import { PollCreator } from './PollComponent';
import LocationPicker from './LocationSharing';
import ScheduleMessageDialog from './ScheduledMessages';
import MessageTemplates, { QuickTemplates } from './MessageTemplates';
import MessageTranslation, { TranslationButton, useTranslation } from './MessageTranslation';

const EmojiPicker = React.lazy(() => import('./EmojiPicker'));
const GifPicker = React.lazy(() => import('./GifPicker'));
const VoiceRecorder = React.lazy(() => import('./VoiceRecorder'));
const DrawingPad = React.lazy(() => import('./DrawingPad'));


export default function MessageInput({ onSend = () => {}, socket, user, room, onTyping, replyTo, onCancelReply, onDiceRoll, onCoinFlip, onRPSPlay, onRPSStart, onTriviaAnswer, onAIRequest, aiTyping = false, onCreatePoll, onShareLocation, onScheduleMessage, onForwardMessage }) {
  const { darkMode, getFontSizeValue } = useTheme() || {};
  const { settings: translationSettings, updateSettings: updateTranslationSettings } = useTranslation();
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [media, setMedia] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showDrawingPad, setShowDrawingPad] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessageReady, setVoiceMessageReady] = useState(false);
  const [imagePrivacy, setImagePrivacy] = useState('friends'); // 'public' or 'friends'
  
  // New feature states
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showMessageForward, setShowMessageForward] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const gifButtonRef = useRef(null);
  const templatesButtonRef = useRef(null);

  const handleSend = async () => {
    if (voiceBlob && voiceMessageReady) {
      await handleVoiceSend();
      return;
    }

    if (media) {
      // Send file via API
      try {
        const formData = new FormData();
        formData.append('file', media.file);
        formData.append('room_id', room.id);
        formData.append('sender', user.username);
        formData.append('recipient', '');
        formData.append('content', text);
        if (media.type === 'image') {
          formData.append('privacy', imagePrivacy);
        }
        // Include parent_message_id when this is a reply
        if (replyTo && replyTo._id) {
          formData.append('parent_message_id', replyTo._id);
        }

        const response = await fetch(`${config.API_URL}/messages/send_file`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (response.ok) {
          setText('');
          setMedia(null);
          // Clear reply if present
          if (replyTo && onCancelReply) onCancelReply();
          // The message will be received via socket
        } else {
          console.error('Failed to send file');
        }
      } catch (error) {
        console.error('Error sending file:', error);
        alert(`File upload failed: ${error.message}`);
      }
    } else if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = useCallback((e) => {
    const sanitizedValue = sanitizeInput(e.target.value);
    setText(sanitizedValue);
    
    if (!isTyping && sanitizedValue) {
      setIsTyping(true);
      if (onTyping) onTyping(true);
    } else if (isTyping && !sanitizedValue) {
      setIsTyping(false);
      if (onTyping) onTyping(false);
    }
  }, [isTyping, onTyping]);

  const validateFile = (file) => {
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    const allowed = ['image/', 'video/', 'audio/', 'application/pdf', 'text/plain'];
    const okType = allowed.some(t => file.type.startsWith(t) || file.name.endsWith('.doc') || file.name.endsWith('.docx'));
    if (!okType) {
      alert('Unsupported file type');
      return false;
    }
    if (file.size > MAX_SIZE) {
      alert('File too large (max 25MB)');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      const reader = new FileReader();
      reader.onload = () => {
        setMedia({
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
          url: reader.result,
          name: file.name,
          file: file,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (!validateFile(file)) return;
      const reader = new FileReader();
      reader.onload = () => {
        setMedia({
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
          url: reader.result,
          name: file.name,
          file: file,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeMedia = () => {
    setMedia(null);
  };

  // Handle ESC key to remove media
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && media) {
        removeMedia();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [media]);

  // Handle click outside to remove media
  const handleClickOutside = useCallback((e) => {
    if (media && dropZoneRef.current && !dropZoneRef.current.contains(e.target)) {
      // Check if click is on the media preview itself or its controls
      const mediaPreview = dropZoneRef.current.querySelector('[data-media-preview]');
      if (mediaPreview && !mediaPreview.contains(e.target)) {
        removeMedia();
      }
    }
  }, [media]);

  useEffect(() => {
    if (media) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [media, handleClickOutside]);

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gif) => {
    // Send GIF as a special message type
    onSend('', { type: 'gif', data: gif });
    setShowGifPicker(false);
  };

  const handleDrawingSave = async (drawingBlob) => {
    // Send drawing as image file
    try {
      const formData = new FormData();
      formData.append('file', drawingBlob, 'drawing.png');
      formData.append('room_id', room.id);
      formData.append('sender', user.username);
      formData.append('recipient', '');
      formData.append('content', text);
      formData.append('privacy', imagePrivacy);

      const response = await fetch('http://localhost:8000/messages/send_file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        setText('');
        setShowDrawingPad(false);
        // The message will be received via socket
      } else {
        // Try to get error details from response
        let errorMessage = 'Failed to send drawing';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Failed to send drawing:', errorMessage);
        alert(`Drawing upload failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error sending drawing:', error);
      alert(`Drawing upload failed: ${error.message}`);
    }
  };

  const handleVoiceRecording = (blob) => {
    setVoiceBlob(blob);
    setVoiceMessageReady(true);
  };

  const handleVoiceSend = async () => {
    if (voiceBlob) {
      // Send voice message via API
      try {
        const formData = new FormData();
        // Ensure file has correct mime type and extension to satisfy backend checks
        const mime = voiceBlob.type || 'audio/webm';
        const ext = mime.split('/')[1] ? mime.split('/')[1].split(';')[0] : 'webm';
        const voiceFile = new File([voiceBlob], `voice_message.${ext}`, { type: mime });
        formData.append('file', voiceFile);
        formData.append('room_id', room.id);
        formData.append('sender', user.username);
        formData.append('recipient', '');

        const response = await fetch(`${config.API_URL}/messages/send_file`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (response.ok) {
          setVoiceBlob(null);
          setVoiceMessageReady(false);
          setIsRecording(false);
          // The message will be received via socket
        } else {
          // Try to get error details from response
          let errorMessage = 'Failed to send voice message';
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          console.error('Failed to send voice message:', errorMessage);
          alert(`Voice upload failed: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error sending voice message:', error);
        alert(`Voice upload failed: ${error.message}`);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // New feature handlers
  const handleCreatePoll = (pollData) => {
    if (onCreatePoll) {
      onCreatePoll(pollData);
    }
  };

  const handleShareLocation = (locationData) => {
    if (onShareLocation) {
      onShareLocation(locationData);
    }
  };

  const handleScheduleMessage = (scheduleData) => {
    if (onScheduleMessage) {
      onScheduleMessage({ ...scheduleData, message: text });
      setText('');
    }
  };

  const handleSelectTemplate = (templateText) => {
    setText(templateText);
  };

  const handleMessageSelect = (message) => {
    // Scroll to message or highlight it
    console.log('Selected message:', message);
  };

  return (
    <Box
      ref={dropZoneRef}
      sx={{
        p: 3,
        border: isDragOver ? '2px dashed' : 'none',
        borderColor: isDragOver ? 'primary.main' : 'transparent',
        borderRadius: 3,
        backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {replyTo && (
        <Box sx={{ 
          mb: 2,
          p: 2,
          background: darkMode 
            ? 'rgba(30, 41, 59, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          display: 'flex', 
          alignItems: 'center',
          animation: 'fadeInUp 0.3s ease-out',
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ 
              fontWeight: 600, 
              color: 'primary.main',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Replying to {replyTo.sender}
            </Typography>
            <Typography variant="body2" sx={{ 
              mt: 0.5,
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {replyTo.content || '[message]'}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={onCancelReply}
            sx={{
              ml: 1,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}
      {media && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {media.type === 'image' && (
              <img src={media.url} alt="preview" style={{ maxWidth: 60, maxHeight: 60, borderRadius: 4 }} />
            )}
            {media.type === 'video' && (
              <video src={media.url} style={{ maxWidth: 60, maxHeight: 60, borderRadius: 4 }} />
            )}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{media.name}</Typography>
              <Typography variant="caption" color="text.secondary">{formatFileSize(media.size)}</Typography>
            </Box>
            <IconButton size="small" onClick={removeMedia}>
              <Close />
            </IconButton>
          </Paper>
          {media.type === 'image' && (
            <Paper sx={{ p: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>Privacy:</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={imagePrivacy === 'friends' ? 'contained' : 'outlined'}
                  onClick={() => setImagePrivacy('friends')}
                  startIcon={<Lock />}
                >
                  Friends
                </Button>
                <Button
                  size="small"
                  variant={imagePrivacy === 'public' ? 'contained' : 'outlined'}
                  onClick={() => setImagePrivacy('public')}
                  startIcon={<Public />}
                >
                  Public
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Reply preview when replying to a message */}
      {replyTo && (
        <Paper sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'background.paper' }} elevation={1}>
          <Box sx={{ overflow: 'hidden', mr: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{replyTo.sender}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.content || replyTo.plain_text || '[message]'}</Typography>
          </Box>
          <Box>
            <Button size="small" onClick={(e) => { e.stopPropagation(); if (onCancelReply) onCancelReply(); }}>Cancel</Button>
          </Box>
        </Paper>
      )}

      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={6}
        value={text}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={isDragOver ? "Drop files here..." : "Type a message..."}
        variant="outlined"
        helperText={`${text.length}/1000`}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: darkMode 
              ? 'rgba(30, 41, 59, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            color: darkMode ? '#f1f5f9' : 'inherit',
            fontSize: getFontSizeValue ? getFontSizeValue() : '16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              backgroundColor: darkMode 
                ? 'rgba(30, 41, 59, 0.9)'
                : 'rgba(255, 255, 255, 0.95)',
              transform: 'translateY(-1px)',
              boxShadow: darkMode 
                ? '0 8px 25px rgba(0, 0, 0, 0.3)'
                : '0 8px 25px rgba(0, 0, 0, 0.1)',
            },
            '&.Mui-focused': {
              backgroundColor: darkMode 
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255, 255, 255, 1)',
              border: '2px solid',
              borderColor: 'primary.main',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
              transform: 'translateY(-2px)',
            },
          },
          '& .MuiInputBase-input': {
            color: darkMode ? '#f1f5f9' : 'inherit',
            padding: '16px 20px',
          },
          '& .MuiInputBase-input::placeholder': {
            color: darkMode ? '#94a3b8' : 'rgba(0, 0, 0, 0.6)',
            opacity: 1,
          },
          '& .MuiInputAdornment-root': {
            marginRight: '8px',
          },
        }}
        FormHelperTextProps={{
          sx: { 
            textAlign: 'right', 
            marginRight: 0,
            color: darkMode ? '#aaa' : 'text.secondary'
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AnimatedButton
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <InsertEmoticon />
                </AnimatedButton>
                <AnimatedButton
                  ref={gifButtonRef}
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'secondary.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Gif />
                </AnimatedButton>
                <IconButton
                  onClick={() => setShowDrawingPad(true)}
                  title="Draw"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'success.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Brush />
                </IconButton>
                <IconButton
                  ref={templatesButtonRef}
                  onClick={() => setShowQuickTemplates(true)}
                  title="Quick Templates"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'info.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Reply />
                </IconButton>
                <IconButton
                  onClick={() => setShowMessageSearch(true)}
                  title="Search Messages"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'warning.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Search />
                </IconButton>
                <IconButton
                  onClick={() => setShowPollCreator(true)}
                  title="Create Poll"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Poll />
                </IconButton>
                <IconButton
                  onClick={() => setShowLocationPicker(true)}
                  title="Share Location"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <LocationOn />
                </IconButton>
                <IconButton
                  onClick={() => setShowScheduleDialog(true)}
                  title="Schedule Message"
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'secondary.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Schedule />
                </IconButton>
                <TranslationButton
                  onOpenSettings={() => setShowTranslationSettings(true)}
                  settings={translationSettings}
                />
                <IconButton
                  onClick={() => {
                    if (voiceMessageReady) {
                      handleVoiceSend();
                      setVoiceMessageReady(false);
                      setIsRecording(false);
                    } else {
                      setIsRecording(true);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    color: voiceMessageReady ? 'success.main' : isRecording ? 'error.main' : 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: voiceMessageReady ? 'success.main' : isRecording ? 'error.main' : 'warning.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {voiceMessageReady ? <Send /> : isRecording ? <Stop /> : <Mic />}
                </IconButton>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <IconButton 
                  onClick={() => fileInputRef.current.click()}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'info.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <AttachFile />
                </IconButton>
                <IconButton
                  onClick={() => {
                    if (onAIRequest && text.trim() && !aiTyping) {
                      onAIRequest(text);
                    }
                  }}
                  title={aiTyping ? "AI is processing..." : "Ask AI"}
                  disabled={!text.trim() || aiTyping}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover:not(:disabled)': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <SmartToy />
                </IconButton>
                <GamesMenu
                  socket={socket}
                  user={user}
                  room={room}
                  onDiceRoll={onDiceRoll}
                  onCoinFlip={onCoinFlip}
                  onRPSPlay={onRPSPlay}
                  onRPSStart={onRPSStart}
                  onTriviaAnswer={onTriviaAnswer}
                />
                <IconButton 
                  onClick={handleSend} 
                  disabled={!text.trim() && !media && !voiceMessageReady}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    ml: 1,
                    transition: 'all 0.2s ease',
                    '&:hover:not(:disabled)': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    },
                    '&:disabled': {
                      background: 'rgba(148, 163, 184, 0.3)',
                      color: 'rgba(148, 163, 184, 0.6)',
                    },
                  }}
                >
                  <Send />
                </IconButton>
              </Box>
            </InputAdornment>
          ),
        }}
      />
      {aiTyping && (
        <LinearProgress sx={{ mt: 1 }} />
      )}

      {isTyping && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Typing...
          </Typography>
          <Box sx={{ display: 'flex', ml: 1 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'text.secondary',
                  animation: 'typing 1.4s infinite ease-in-out',
                  animationDelay: `${i * 0.2}s`,
                  mr: 0.5,
                  '@keyframes typing': {
                    '0%, 60%, 100%': { transform: 'translateY(0)' },
                    '30%': { transform: 'translateY(-10px)' },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <React.Suspense fallback={null}>
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
            anchorEl={emojiButtonRef.current}
            open={showEmojiPicker}
          />
        </React.Suspense>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <React.Suspense fallback={null}>
          <GifPicker
            onGifSelect={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
            anchorEl={gifButtonRef.current}
            open={showGifPicker}
          />
        </React.Suspense>
      )}

      {/* Drawing Pad */}
      <React.Suspense fallback={null}>
        <DrawingPad
          open={showDrawingPad}
          onClose={() => setShowDrawingPad(false)}
          onSave={handleDrawingSave}
          socket={socket}
          room={room}
          user={user}
        />
      </React.Suspense>

      {/* Voice Recorder */}
      {isRecording && (
        <React.Suspense fallback={null}>
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            onStop={() => {
              setIsRecording(false);
              setVoiceMessageReady(false);
            }}
          />
        </React.Suspense>
      )}

      {/* New Feature Dialogs */}
      <MessageSearch
        open={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        roomId={room?.id}
        onMessageSelect={handleMessageSelect}
      />

      <MessageForward
        open={showMessageForward}
        onClose={() => setShowMessageForward(false)}
        message={messageToForward}
        onForward={onForwardMessage}
      />

      <PollCreator
        open={showPollCreator}
        onClose={() => setShowPollCreator(false)}
        onCreatePoll={handleCreatePoll}
      />

      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onShareLocation={handleShareLocation}
      />

      <ScheduleMessageDialog
        open={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        onSchedule={handleScheduleMessage}
        initialMessage={text}
      />

      <MessageTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <QuickTemplates
        anchorEl={templatesButtonRef.current}
        open={showQuickTemplates}
        onClose={() => setShowQuickTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <MessageTranslation
        open={showTranslationSettings}
        onClose={() => setShowTranslationSettings(false)}
        settings={translationSettings}
        onUpdateSettings={updateTranslationSettings}
      />
    </Box>
  );
}


