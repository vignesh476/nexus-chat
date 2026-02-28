import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Avatar, Box, IconButton, Fade, Grid } from '@mui/material';
import { Mic, MicOff, CallEnd, Call, Videocam, VideocamOff, ScreenShare, StopScreenShare } from '@mui/icons-material';
import { useUserProfiles } from '../context/UserProfileContext';

const CallModal = ({ open, callStatus, caller: remoteUser, onAnswer, onEndCall, localStream, remoteStream, onToggleAudio, onToggleVideo, callDuration }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const remoteAudioRef = useRef();
  const { getUserProfile } = useUserProfiles();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

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
    if (localVideoRef.current && (screenStream || localStream)) {
      localVideoRef.current.srcObject = screenStream || localStream;
    }
  }, [localStream, screenStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
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
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
      disableEnforceFocus
      sx={{ '& .MuiDialog-paper': { height: '80vh' } }}
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
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
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
              sx={{
                bgcolor: isScreenSharing ? 'primary.main' : 'grey.300',
                color: isScreenSharing ? 'white' : 'black',
                mr: 2,
                '&:hover': {
                  bgcolor: isScreenSharing ? 'primary.dark' : 'grey.400',
                },
              }}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
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
    </Dialog>
  );
};

export default CallModal;
