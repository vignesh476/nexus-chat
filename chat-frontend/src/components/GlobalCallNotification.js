import React from 'react';
import { Box, Typography } from '@mui/material';

const GlobalCallNotification = ({ call, onAccept, onDecline }) => {
  if (!call) return null;

  return (
    <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
      <Typography>Incoming call from {call.from}</Typography>
    </Box>
  );
};

export default GlobalCallNotification;