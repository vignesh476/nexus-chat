import React, { useState } from 'react';
import { Box, Paper, Typography, LinearProgress, IconButton } from '@mui/material';
import { AudioRecorder } from 'react-audio-voice-recorder';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

const VoiceRecorder = ({ onRecordingComplete, onStop }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [stopRecordingFn, setStopRecordingFn] = useState(null);

  const handleRecordingStart = () => {
    setIsRecording(true);
    // Start timer
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setIntervalId(interval);
  };

  const handleRecordingComplete = (blob) => {
    const url = URL.createObjectURL(blob);
    onRecordingComplete(blob);
    setIsRecording(false);
    setRecordingTime(0);
    setStopRecordingFn(null);  // Reset
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const handleStop = () => {
    if (stopRecordingFn && isRecording) {
      stopRecordingFn();
    } else {
      setIsRecording(false);
      setRecordingTime(0);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      onStop();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300,
        p: 3,
        zIndex: 1400,
        boxShadow: 4,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Voice Recorder</Typography>
        <IconButton size="small" onClick={handleStop}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" color={isRecording ? 'error.main' : 'text.secondary'}>
          {isRecording ? <MicIcon sx={{ fontSize: '3rem' }} /> : <StopIcon sx={{ fontSize: '3rem' }} />}
        </Typography>
        <Typography variant="h6" sx={{ mt: 1 }}>
          {formatTime(recordingTime)}
        </Typography>
      </Box>

      {isRecording && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="indeterminate"
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'error.main',
              },
            }}
          />
        </Box>
      )}

      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        onRecordingStart={handleRecordingStart}
        render={({ startRecording, stopRecording, isRecording: recorderIsRecording }) => {
          // Capture the stopRecording function when it becomes available
          if (!stopRecordingFn && stopRecording) {
            setStopRecordingFn(() => stopRecording);
          }

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {!recorderIsRecording ? (
                <IconButton
                  onClick={startRecording}
                  sx={{
                    backgroundColor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                    width: 60,
                    height: 60,
                  }}
                >
                  <MicIcon sx={{ fontSize: '2rem' }} />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => {
                    if (stopRecording) {
                      stopRecording();
                    }
                  }}
                  sx={{
                    backgroundColor: 'success.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'success.dark',
                    },
                    width: 60,
                    height: 60,
                  }}
                >
                  <StopIcon sx={{ fontSize: '2rem' }} />
                </IconButton>
              )}
            </Box>
          );
        }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
        {isRecording ? 'Recording... Tap stop when finished' : 'Tap the mic to start recording'}
      </Typography>
    </Paper>
  );
};

export default VoiceRecorder;
