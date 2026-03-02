import React from 'react';
import { Box } from '@mui/material';
import { AccessTime, Done, DoneAll } from '@mui/icons-material';

const MessageStatus = ({ status, timestamp }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <AccessTime sx={{ fontSize: 14, opacity: 0.6 }} />;
      case 'sent':
        return <Done sx={{ fontSize: 14, opacity: 0.6 }} />;
      case 'delivered':
        return <DoneAll sx={{ fontSize: 14, opacity: 0.6 }} />;
      case 'read':
        return <DoneAll sx={{ fontSize: 14, color: '#0084ff' }} />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 0.5,
        mt: 0.5,
        fontSize: '12px',
        fontWeight: 500,
        opacity: 0.85,
      }}
    >
      <span>{formatTime(timestamp)}</span>
      {getStatusIcon()}
    </Box>
  );
};

export default MessageStatus;
