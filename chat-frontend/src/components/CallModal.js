import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Avatar, Box, IconButton, Fade, Grid, useMediaQuery, useTheme, Snackbar, Alert } from '@mui/material';
import { Mic, MicOff, CallEnd, Call, Videocam, VideocamOff, ScreenShare, StopScreenShare, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { useUserProfiles } from '../context/UserProfileContext';

const CallModal = ({ open, callStatus, caller: remoteUser, onAnswer, onEndCall, localStream, remoteStream, onToggleAudio, onToggleVideo, onStartScreenShare, onStopScreenShare, isScreenSharing: isScreenSharingProp, callDuration }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const remoteAudioRef = useRef();
  const { getUserProfile } = useUserProfiles();
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const callerProfile = remoteUser ? getUserProfile(remoteUser) : null;
  const displayName = callerProfile ? callerProfile.display_name || remoteUser : remoteUser || 'Unknown';
  const profilePicture = callerProfile ? callerProfile.profile_picture : null;

  const prevCallStatusRef = useRef();
  useEffect(() => {
    if (callStatus !== prevCallStatusRef.current) {
      console.log('CallModal: remoteUser:', remoteUser, 'displayName:', displayName, 'callStatus:', callStatus);
      prevCallStatusRef.current = callStatus;
    }
  }, [callStatus, remoteUser, displayName]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleScreenShare = async () => {
    if (isScreenSharingProp) {
      if (onStopScreenShare) {
        await onStopScreenShare();
      }
    } else {
      if (onStartScreenShare) {
        const result = await onStartScreenShare();
        if (!result.success) {
          setError(result.error || 'Screen share failed');
        }
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAudioMuted = localStream ? !localStream.getAudioTracks()[0]?.enabled : true;
  const isVideoOff = localStream ? !localStream.getVideoTracks()[0]?.enabled : true;

  return (
    <Dialog
      open={open}
      onClose={onEndCall}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
      disableEnforceFocus
      sx={{ 
        '& .MuiDialog-paper': { 
          height: isMobile ? '100vh' : '80vh',
          width: isMobile ? '100vw' : 'auto',
          maxWidth: isMobile ? '100vw' : '90vw',
          margin: isMobile ? 0 : 'auto',
          borderRadius: isMobile ? 0 : 2,
        } 
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        {callStatus === 'ringing' ? `Incoming Call from ${remoteUser || 'Unknown'}` : callStatus === 'calling' ? `Calling ${remoteUser || 'Unknown'}` : callStatus === 'connecting' ? `Connecting to ${remoteUser || 'Unknown'}` : callStatus === 'connected' ? `Call Connected with ${remoteUser || 'Unknown'}` : 'Call'}
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {callStatus === 'connected' && (
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            <Grid item xs={12} md={remoteStream ? 6 : 12}>
              <Box
                sx={{
                  width: '100%',
                  height: remoteStream ? '300px' : '400px',
                  bgcolor: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {remoteStream && (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
                {!remoteStream && (
                  <Typography color="white" variant="h6">
                    {remoteUser} (No Video)
                  </Typography>
                )}
                {localStream && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      width: '120px',
                      height: '90px',
                      bgcolor: 'grey.800',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isVideoOff && (
                      <VideocamOff sx={{ position: 'absolute', color: 'white', fontSize: 40 }} />
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
        {(callStatus !== 'connected' || (!remoteStream && !localStream)) && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
           <Avatar
              src={profilePicture}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: callStatus === 'connected' ? 'success.main' : 'primary.main'
              }}
            >
              {remoteUser ? remoteUser.charAt(0).toUpperCase() : 'U'}
            </Avatar>

            <Typography variant="h6" gutterBottom>
              {callStatus === 'ringing' ? remoteUser : callStatus === 'connecting' ? 'Connecting' : callStatus === 'connected' ? 'Connected' : 'Calling...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {callStatus === 'connected' ? formatDuration(callDuration) : callStatus === 'ringing' ? 'Incoming call...' : callStatus === 'connecting' ? 'Establishing connection...' : 'Connecting...'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        justifyContent: 'center', 
        pb: isMobile ? 2 : 3,
        px: isMobile ? 2 : 3,
        gap: isMobile ? 1 : 2,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        {callStatus === 'connected' && (
          <>
            <IconButton
              onClick={onToggleAudio}
              sx={{
                bgcolor: isAudioMuted ? 'error.main' : 'grey.300',
                color: isAudioMuted ? 'white' : 'black',
                mr: 2,
                '&:hover': {
                  bgcolor: isAudioMuted ? 'error.dark' : 'grey.400',
                },
              }}
            >
              {isAudioMuted ? <MicOff /> : <Mic />}
            </IconButton>
            <IconButton
              onClick={onToggleVideo}
              sx={{
                bgcolor: isVideoOff ? 'error.main' : 'grey.300',
                color: isVideoOff ? 'white' : 'black',
                mr: 2,
                '&:hover': {
                  bgcolor: isVideoOff ? 'error.dark' : 'grey.400',
                },
              }}
            >
              {isVideoOff ? <VideocamOff /> : <Videocam />}
            </IconButton>
            <IconButton
              onClick={handleScreenShare}
              disabled={isMobile}
              sx={{
                bgcolor: isScreenSharingProp ? 'primary.main' : 'grey.300',
                color: isScreenSharingProp ? 'white' : 'black',
                mr: 2,
                '&:hover': {
                  bgcolor: isScreenSharingProp ? 'primary.dark' : 'grey.400',
                },
                '&:disabled': {
                  bgcolor: 'grey.200',
                  color: 'grey.400',
                },
              }}
              title={isMobile ? 'Screen share not supported on mobile' : ''}
            >
              {isScreenSharingProp ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
          </>
        )}
        {callStatus === 'ringing' && (
          <Button
            onClick={() => {
              console.log('Answer button clicked');
              onAnswer();
            }}
            variant="contained"
            color="success"
            startIcon={<Call />}
            sx={{ mr: 2, borderRadius: 28, px: 4 }}
          >
            Answer
          </Button>
        )}
        <Button
          onClick={onEndCall}
          variant="contained"
          color="error"
          startIcon={<CallEnd />}
          sx={{ borderRadius: 28, px: 4 }}
        >
          {callStatus === 'ringing' ? 'Decline' : 'End Call'}
        </Button>
      </DialogActions>
      <audio ref={remoteAudioRef} autoPlay />
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CallModal;
