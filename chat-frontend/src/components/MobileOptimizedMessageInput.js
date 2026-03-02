import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Fab,
  Drawer,
  Typography,
  Slide,
  Paper,
  ButtonBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Send,
  Add,
  InsertEmoticon,
  Mic,
  MicOff,
  AttachFile,
  Close,
  LocationOn,
  Schedule,
  Poll,
  Brush,
  SmartToy,
  SportsEsports,
  PhotoCamera,
  Videocam,
  Stop,
  PlayArrow,
  Image,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const MobileOptimizedMessageInput = ({ 
  onSend, 
  text, 
  setText, 
  onTyping,
  replyTo,
  onCancelReply,
  onDiceRoll,
  onCoinFlip,
  onAIRequest,
  onShareLocation,
  onScheduleMessage,
  onCreatePoll,
  socket,
  user,
  room,
}) => {
  const { darkMode } = useTheme();
  const { isMobile } = useResponsive();
  const [showFeatures, setShowFeatures] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [showGifDialog, setShowGifDialog] = useState(false);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [scheduleData, setScheduleData] = useState({ message: '', time: '' });
  const [pollData, setPollData] = useState({ question: '', options: ['', ''] });
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const inputText = text || '';
  const textFieldRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  
  // Simplified keyboard detection
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const kbHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(kbHeight);
        setIsKeyboardVisible(kbHeight > 100);
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleFileUpload = useCallback((file) => {
    if (!file) return;
    
    // Validate file size (max 10MB for production)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setSnackbarMessage('File too large. Maximum size is 10MB.');
      setShowSnackbar(true);
      return;
    }
    
    setUploadProgress(0);
    
    // Convert file to base64 for reliable transmission
    const reader = new FileReader();
    reader.onload = () => {
      const base64File = reader.result;
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            
            // Send file through onSend
            onSend(`📁 ${file.name}`, {
              type: 'file',
              data: base64File,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type
            });
            
            setSnackbarMessage(`${file.name} uploaded successfully!`);
            setShowSnackbar(true);
            setUploadProgress(0);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    };
    
    reader.onerror = () => {
      setSnackbarMessage('Failed to read file');
      setShowSnackbar(true);
      setUploadProgress(0);
    };
    
    reader.readAsDataURL(file);
    console.log('File selected:', file.name, file.type, file.size);
  }, [onSend]);

  const handleVoiceToggle = useCallback(async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          throw new Error('Audio recording not supported');
        }
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
          // Don't show snackbar here - wait for user to send
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000);
        setIsRecording(true);
        setRecordingTime(0);
        
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
      } catch (error) {
        console.error('Audio recording error:', error);
        setSnackbarMessage('Microphone access denied or not supported');
        setShowSnackbar(true);
      }
    } else {
      // Stop recording but don't send - let user review
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        clearInterval(recordingIntervalRef.current);
        setIsRecording(false);
        setSnackbarMessage('Recording stopped. Tap Send to share or Cancel to discard.');
        setShowSnackbar(true);
      }
    }
  }, [isRecording]);

  // Only render on mobile devices
  if (!isMobile) {
    return null;
  }

  const featureCategories = {
    media: {
      title: 'Media & Files',
      items: [
        { icon: PhotoCamera, label: 'Camera', action: 'camera', color: '#4ECDC4' },
        { icon: Videocam, label: 'Video', action: 'video', color: '#45B7D1' },
        { icon: AttachFile, label: 'Files', action: 'attach', color: '#96CEB4' },
        { icon: Image, label: 'GIF', action: 'gif', color: '#FFEAA7' },
        { icon: Brush, label: 'Draw', action: 'draw', color: '#DDA0DD' },
      ]
    },
    communication: {
      title: 'Communication',
      items: [
        { icon: LocationOn, label: 'Location', action: 'location', color: '#00B894' },
        { icon: Poll, label: 'Poll', action: 'poll', color: '#FDCB6E' },
        { icon: Schedule, label: 'Schedule', action: 'schedule', color: '#6C5CE7' },
      ]
    },
    tools: {
      title: 'AI & Games',
      items: [
        { icon: SmartToy, label: 'AI Chat', action: 'ai', color: '#FD79A8' },
        { icon: SportsEsports, label: 'Games', action: 'games', color: '#FDCB6E' },
      ]
    }
  };

  const handleSend = () => {
    if (inputText?.trim()) {
      onSend(inputText);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (value) => {
    if (setText) setText(value);
    if (onTyping) onTyping(!!value);
  };

  const handleFeatureAction = (action) => {
    setShowFeatures(false);
    
    switch (action) {
      case 'camera':
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment';
        cameraInput.onchange = (e) => handleFileUpload(e.target.files[0]);
        cameraInput.click();
        break;
        
      case 'video':
        const videoInput = document.createElement('input');
        videoInput.type = 'file';
        videoInput.accept = 'video/*';
        videoInput.capture = 'environment';
        videoInput.onchange = (e) => handleFileUpload(e.target.files[0]);
        videoInput.click();
        break;
        
      case 'attach':
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        fileInput.onchange = (e) => handleFileUpload(e.target.files[0]);
        fileInput.click();
        break;
        
      case 'gif':
        setShowGifDialog(true);
        break;
        
      case 'draw':
        // Simple drawing implementation
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth - 40;
        canvas.height = 300;
        canvas.style.border = '2px solid #ccc';
        canvas.style.borderRadius = '8px';
        canvas.style.touchAction = 'none';
        canvas.style.background = 'white';
        
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        let drawing = false;
        const draw = (e) => {
          if (!drawing) return;
          const rect = canvas.getBoundingClientRect();
          const x = (e.clientX || e.touches[0].clientX) - rect.left;
          const y = (e.clientY || e.touches[0].clientY) - rect.top;
          ctx.lineTo(x, y);
          ctx.stroke();
        };
        
        canvas.addEventListener('mousedown', (e) => { drawing = true; ctx.beginPath(); });
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; ctx.beginPath(); });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });
        canvas.addEventListener('touchend', () => drawing = false);
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '🎨 Draw Something';
        title.style.color = 'white';
        title.style.margin = '0 0 15px 0';
        
        const buttons = document.createElement('div');
        buttons.style.marginTop = '15px';
        buttons.style.display = 'flex';
        buttons.style.gap = '10px';
        
        const sendBtn = document.createElement('button');
        sendBtn.textContent = 'Send Drawing';
        sendBtn.style.cssText = 'background:#1976d2;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:16px;';
        sendBtn.onclick = () => {
          const dataURL = canvas.toDataURL('image/png', 0.8);
          onSend('🎨 Drawing', { 
            type: 'image', 
            data: dataURL,
            fileName: 'drawing.png',
            mimeType: 'image/png'
          });
          document.body.removeChild(modal);
          setSnackbarMessage('Drawing sent!');
          setShowSnackbar(true);
        };
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = 'background:#ff9800;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:16px;';
        clearBtn.onclick = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'background:#666;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:16px;';
        cancelBtn.onclick = () => document.body.removeChild(modal);
        
        buttons.appendChild(sendBtn);
        buttons.appendChild(clearBtn);
        buttons.appendChild(cancelBtn);
        modal.appendChild(title);
        modal.appendChild(canvas);
        modal.appendChild(buttons);
        document.body.appendChild(modal);
        break;
        
      case 'location':
        if (onShareLocation && navigator.geolocation) {
          setSnackbarMessage('Getting your location...');
          setShowSnackbar(true);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              const mapsUrl = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
              // Send as clickable link
              onSend(`📍 Location: ${mapsUrl}`, {
                type: 'location',
                data: locationData,
                url: mapsUrl
              });
              setSnackbarMessage('Location shared!');
              setShowSnackbar(true);
            },
            (error) => {
              setSnackbarMessage('Unable to get location');
              setShowSnackbar(true);
            }
          );
        }
        break;
        
      case 'poll':
        setShowPollDialog(true);
        break;
        
      case 'schedule':
        setShowScheduleDialog(true);
        break;
        
      case 'ai':
        if (onAIRequest && inputText.trim()) {
          onAIRequest(inputText);
          setSnackbarMessage('AI is thinking...');
          setShowSnackbar(true);
        } else {
          setSnackbarMessage('Type a message first to ask AI');
          setShowSnackbar(true);
        }
        break;
        
      case 'games':
        setShowGameDialog(true);
        break;
        
      default:
        console.log('Feature action:', action);
    }
  };

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
              borderRadius: 2,
              background: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
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
                  color: 'text.secondary'
                }}>
                  {replyTo.content}
                </Typography>
              </Box>
              <IconButton size="small" onClick={onCancelReply}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Slide>
      )}

      {/* Main Input Area */}
      <Paper 
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: darkMode 
            ? 'rgba(30, 41, 59, 0.7)' 
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
          paddingBottom: `max(env(safe-area-inset-bottom), ${isKeyboardVisible ? '16px' : '0px'})`,
          transform: isKeyboardVisible ? `translateY(-${keyboardHeight}px)` : 'none',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 },
          minHeight: '60px',
        }}>
          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  },
                }}
              />
            </Box>
          )}

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: { xs: 0.5, sm: 1 },
            width: '100%',
            minHeight: '48px',
          }}>
            {/* Emoji Button */}
            <IconButton 
              size="medium"
              onClick={() => setShowEmojiPicker(true)}
              sx={{ 
                color: 'primary.main',
                background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                minWidth: 'unset',
                flexShrink: 0,
                '&:hover': { 
                  backgroundColor: 'primary.main', 
                  color: 'white',
                  transform: 'scale(1.1)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <InsertEmoticon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>

            {/* Text Input */}
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
              sx={{
                flex: 1,
                minWidth: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 4, sm: 6 },
                  backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.95)',
                  minHeight: { xs: '40px', sm: '48px' },
                  '& fieldset': { 
                    border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                  },
                  '&:hover fieldset': { 
                    border: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(148, 163, 184, 0.5)'}` 
                  },
                  '&.Mui-focused fieldset': { 
                    border: '2px solid',
                    borderColor: 'primary.main'
                  },
                },
                '& .MuiInputBase-input': {
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '14px', sm: '16px' },
                  color: darkMode ? '#ffffff' : '#1a202c',
                  fontWeight: 400,
                  '&::placeholder': {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(71, 85, 105, 0.8)',
                    opacity: 1,
                    fontWeight: 400
                  }
                }
              }}
            />

            {/* Voice/Send Button */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0.5,
              alignItems: 'center',
              flexShrink: 0,
            }}>
              {inputText?.trim() ? (
                <Fab
                  size="medium"
                  color="primary"
                  onClick={handleSend}
                  sx={{
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    minWidth: 'unset',
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Send sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Fab>
              ) : (
                <>
                  <Fab
                    size="medium"
                    color={isRecording ? 'error' : 'secondary'}
                    onClick={handleVoiceToggle}
                    sx={{
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      minWidth: 'unset',
                      background: isRecording 
                        ? 'linear-gradient(45deg, #ff6b6b 0%, #ee5a52 100%)'
                        : 'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)',
                      boxShadow: isRecording 
                        ? '0 4px 16px rgba(255, 107, 107, 0.4)'
                        : '0 4px 16px rgba(168, 237, 234, 0.4)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: isRecording 
                          ? '0 6px 20px rgba(255, 107, 107, 0.6)'
                          : '0 6px 20px rgba(168, 237, 234, 0.6)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {isRecording ? <MicOff sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <Mic sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                  </Fab>
                  
                  {isRecording && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={formatTime(recordingTime)}
                        size="small"
                        color="error"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          height: 20,
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 },
                          },
                        }}
                      />
                    </Box>
                  )}
                  
                  {/* Show Send button when audio is recorded */}
                  {audioBlob && !isRecording && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          if (audioBlob && audioBlob.size > 0) {
                            try {
                              // Create FormData for file upload
                              const formData = new FormData();
                              formData.append('file', audioBlob, `voice_${Date.now()}.webm`);
                              formData.append('room_id', room.id);
                              formData.append('sender', user.username);
                              formData.append('recipient', '');
                              formData.append('content', '🎤 Voice message');
                              formData.append('privacy', 'friends');
                              
                              // Upload via API
                              const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
                              const token = localStorage.getItem('token') || sessionStorage.getItem('nexus_token');
                              
                              const response = await fetch(`${API_URL}/messages/send_file`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                },
                                body: formData
                              });
                              
                              if (!response.ok) {
                                throw new Error('Upload failed');
                              }
                              
                              // Clear audio state
                              setAudioBlob(null);
                              setRecordingTime(0);
                              setSnackbarMessage('Voice message sent!');
                              setShowSnackbar(true);
                            } catch (error) {
                              console.error('Error sending audio:', error);
                              setSnackbarMessage('Failed to send voice message');
                              setShowSnackbar(true);
                            }
                          }
                        }}
                        sx={{ minWidth: 'unset', px: 1.5, py: 0.5, fontSize: '0.7rem' }}
                      >
                        Send
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          setAudioBlob(null);
                          setRecordingTime(0);
                          setSnackbarMessage('Recording discarded');
                          setShowSnackbar(true);
                        }}
                        sx={{ minWidth: 'unset', px: 1, py: 0.5, fontSize: '0.7rem' }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </>
              )}
              
              {/* Features Toggle */}
              <IconButton
                size="small"
                onClick={() => setShowFeatures(true)}
                sx={{
                  color: 'text.secondary',
                  background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(10px)',
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  minWidth: 'unset',
                  '&:hover': { 
                    color: 'primary.main',
                    background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    transform: 'rotate(45deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Add sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Features Drawer */}
      <Drawer
        anchor="bottom"
        open={showFeatures}
        onClose={() => setShowFeatures(false)}
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: '20px 20px 0 0',
            maxHeight: { xs: '80vh', sm: '70vh' },
            background: darkMode 
              ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            // Ensure proper mobile positioning
            bottom: 0,
            left: 0,
            right: 0,
            position: 'fixed',
          }
        }}
        ModalProps={{
          keepMounted: false,
          disablePortal: false,
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
          {/* Handle */}
          <Box sx={{ 
            width: 40, 
            height: 4, 
            backgroundColor: 'divider', 
            borderRadius: 2, 
            mx: 'auto', 
            mb: 3 
          }} />
          
          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
            Message Features
          </Typography>

          {/* Feature Categories */}
          {Object.entries(featureCategories).map(([key, category]) => (
            <Box key={key} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 2, 
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {category.title}
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: 'repeat(3, 1fr)', 
                  sm: 'repeat(auto-fit, minmax(80px, 1fr))' 
                }, 
                gap: { xs: 1.5, sm: 2 },
                mb: 2
              }}>
                {category.items.map((item) => (
                  <ButtonBase
                    key={item.action}
                    onClick={() => handleFeatureAction(item.action)}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 4,
                      flexDirection: 'column',
                      gap: 1,
                      background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                      border: `2px solid ${item.color}30`,
                      minHeight: { xs: 70, sm: 80 },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      // Mobile-specific touch handling
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      '&:hover': {
                        background: item.color,
                        color: 'white',
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: `0 8px 25px ${item.color}40`,
                      },
                      '&:active': {
                        transform: 'translateY(0px) scale(0.98)',
                        transition: 'all 0.1s ease',
                      },
                      // Mobile media query for better touch response
                      '@media (hover: none)': {
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none',
                        },
                        '&:active': {
                          background: item.color,
                          color: 'white',
                          transform: 'scale(0.95)',
                        }
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        bgcolor: 'transparent',
                        color: item.color,
                        '.MuiButtonBase-root:hover &': {
                          color: 'white',
                        },
                        '.MuiButtonBase-root:active &': {
                          color: 'white',
                        }
                      }}
                    >
                      <item.icon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                    }}>
                      {item.label}
                    </Typography>
                  </ButtonBase>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity="info"
          sx={{ 
            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Modern Schedule Dialog */}
      <Dialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📅 Schedule Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Message"
            value={scheduleData.message}
            onChange={(e) => setScheduleData({...scheduleData, message: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            type="time"
            label="Time"
            value={scheduleData.time}
            onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (scheduleData.message && scheduleData.time) {
                const [hours, minutes] = scheduleData.time.split(':');
                const scheduledTime = new Date();
                scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                onScheduleMessage({ message: scheduleData.message, scheduledTime });
                setScheduleData({ message: '', time: '' });
                setShowScheduleDialog(false);
              }
            }}
            variant="contained"
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Poll Dialog */}
      <Dialog open={showPollDialog} onClose={() => setShowPollDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📊 Create Poll</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Poll Question"
            value={pollData.question}
            onChange={(e) => setPollData({...pollData, question: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
          />
          {pollData.options.map((option, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...pollData.options];
                newOptions[index] = e.target.value;
                setPollData({...pollData, options: newOptions});
              }}
              sx={{ mb: 1 }}
            />
          ))}
          <Button 
            onClick={() => setPollData({...pollData, options: [...pollData.options, '']})}
            disabled={pollData.options.length >= 4}
          >
            Add Option
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPollDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              const validOptions = pollData.options.filter(opt => opt.trim());
              if (pollData.question.trim() && validOptions.length >= 2) {
                try {
                  const pollMessage = {
                    type: 'poll',
                    question: pollData.question.trim(),
                    options: validOptions,
                    votes: {},
                    createdBy: user?.username || 'Anonymous',
                    createdAt: new Date().toISOString()
                  };
                  
                  // Send poll through onSend or onCreatePoll
                  if (onCreatePoll) {
                    onCreatePoll(pollMessage);
                  } else {
                    onSend(`📊 Poll: ${pollData.question}`, pollMessage);
                  }
                  
                  setPollData({ question: '', options: ['', ''] });
                  setShowPollDialog(false);
                  setSnackbarMessage('Poll created successfully!');
                  setShowSnackbar(true);
                } catch (error) {
                  console.error('Error creating poll:', error);
                  setSnackbarMessage('Failed to create poll');
                  setShowSnackbar(true);
                }
              } else {
                setSnackbarMessage('Please add a question and at least 2 options');
                setShowSnackbar(true);
              }
            }}
            variant="contained"
          >
            Create Poll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern GIF Dialog */}
      <Dialog 
        open={showGifDialog} 
        onClose={() => setShowGifDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              maxHeight: '100vh',
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          🎬 Choose GIF
          {isMobile && (
            <IconButton onClick={() => setShowGifDialog(false)} size="small">
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {[
              { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', title: '😊 Happy' },
              { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: '🎉 Excited' },
              { url: 'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif', title: '👍 Thumbs Up' },
              { url: 'https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif', title: '😂 Laughing' },
              { url: 'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif', title: '😍 Love' },
              { url: 'https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif', title: '😭 Crying' },
              { url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', title: '😱 Shocked' },
              { url: 'https://media.giphy.com/media/3o6Zt0hNCfak3QCqsw/giphy.gif', title: '😴 Sleepy' },
              { url: 'https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif', title: '🎉 Party' },
              { url: 'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif', title: '👏 Clap' },
              { url: 'https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif', title: '🔥 Fire' },
              { url: 'https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif', title: '✨ Magic' }
            ].map((gif, index) => (
              <Grid item xs={6} sm={6} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': { 
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                    '@media (hover: none)': {
                      '&:hover': {
                        transform: 'none',
                        boxShadow: 'none',
                      },
                      '&:active': {
                        transform: 'scale(0.95)',
                      }
                    }
                  }}
                  onClick={() => {
                    onSend('', { type: 'gif', data: gif });
                    setShowGifDialog(false);
                  }}
                >
                  <CardContent sx={{ p: { xs: 0.5, sm: 1 }, textAlign: 'center' }}>
                    <img 
                      src={gif.url} 
                      alt={gif.title} 
                      style={{ 
                        width: '100%', 
                        height: isMobile ? '60px' : '80px', 
                        objectFit: 'cover', 
                        borderRadius: '8px' 
                      }} 
                    />
                    <Typography variant="caption" sx={{ 
                      mt: 0.5, 
                      display: 'block',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}>
                      {gif.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1, sm: 2 } }}>
          {!isMobile && (
            <Button onClick={() => setShowGifDialog(false)}>Cancel</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Emoji Picker Dialog */}
      <Dialog 
        open={showEmojiPicker} 
        onClose={() => setShowEmojiPicker(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              maxHeight: '100vh',
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          😊 Choose Emoji
          {isMobile && (
            <IconButton onClick={() => setShowEmojiPicker(false)} size="small">
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ 
            width: '100%',
            height: isMobile ? 'calc(100vh - 64px)' : '400px',
            '& .epr-main': {
              border: 'none',
            },
            '& .epr-search-container': {
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            },
            '& .epr-emoji-category-label': {
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(248, 250, 252, 0.95)',
            }
          }}>
            {/* Fallback simple emoji grid */}
            <Grid container spacing={1} sx={{ p: 2, maxHeight: '100%', overflowY: 'auto' }}>
              {['😊', '😂', '😍', '😎', '😉', '😘', '😜', '😁', '😌', '😏', '😒', '😔', '😢', '😭', '😱', '😡', '😴', '😵', '👍', '👎', '👌', '✌️', '👊', '✨', '🔥', '🎉', '🎆', '🎈', '❤️', '💖', '💜', '💛', '💚', '💙', '💝', '🤣', '🥰', '😇', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji, index) => (
                <Grid item xs={3} sm={2} key={index}>
                  <Button
                    fullWidth
                    onClick={() => {
                      const newText = inputText + emoji;
                      handleInputChange(newText);
                      setShowEmojiPicker(false);
                    }}
                    sx={{
                      fontSize: isMobile ? '1.5rem' : '1.8rem',
                      minWidth: 'unset',
                      aspectRatio: '1',
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {emoji}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        {!isMobile && (
          <DialogActions>
            <Button onClick={() => setShowEmojiPicker(false)}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
      <Dialog 
        open={showGameDialog} 
        onClose={() => setShowGameDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
              maxHeight: '100vh',
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          🎮 Choose Game
          {isMobile && (
            <IconButton onClick={() => setShowGameDialog(false)} size="small">
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {[
              { name: 'Dice Roll', icon: '🎲', action: () => onDiceRoll && onDiceRoll() },
              { name: 'Coin Flip', icon: '🪙', action: () => onCoinFlip && onCoinFlip() },
              { name: 'Rock Paper Scissors', icon: '✊', action: () => console.log('RPS') }
            ].map((game, index) => (
              <Grid item xs={4} sm={4} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: { xs: 80, sm: 100 },
                    '&:hover': { 
                      transform: 'scale(1.02)', 
                      bgcolor: 'primary.light',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                    '@media (hover: none)': {
                      '&:hover': {
                        transform: 'none',
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                      },
                      '&:active': {
                        bgcolor: 'primary.light',
                        transform: 'scale(0.95)',
                      }
                    }
                  }}
                  onClick={() => {
                    game.action();
                    setShowGameDialog(false);
                  }}
                >
                  <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography variant="h3" sx={{ 
                      mb: 1,
                      fontSize: { xs: '2rem', sm: '3rem' }
                    }}>
                      {game.icon}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      lineHeight: 1.2
                    }}>
                      {game.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1, sm: 2 } }}>
          {!isMobile && (
            <Button onClick={() => setShowGameDialog(false)}>Cancel</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MobileOptimizedMessageInput;