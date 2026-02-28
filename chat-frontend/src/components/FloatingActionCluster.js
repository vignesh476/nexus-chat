import React, { useState } from 'react';
import { Fab, Box, Zoom, TextField, IconButton } from '@mui/material';
import { Add, Send, Mic, CameraAlt, Games, EmojiEmotions, AttachFile } from '@mui/icons-material';

const FloatingActionCluster = ({ onSendMessage, onSendFile, onStartGame }) => {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [showInput, setShowInput] = useState(false);

  const actions = [
    { icon: <Send />, label: 'Text', color: '#4facfe', action: () => setShowInput(true) },
    { icon: <Mic />, label: 'Voice', color: '#43e97b', action: () => {} },
    { icon: <CameraAlt />, label: 'Camera', color: '#fa709a', action: () => {} },
    { icon: <Games />, label: 'Games', color: '#667eea', action: onStartGame },
    { icon: <AttachFile />, label: 'File', color: '#f093fb', action: onSendFile },
    { icon: <EmojiEmotions />, label: 'GIF', color: '#fee140', action: () => {} },
  ];

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setShowInput(false);
      setExpanded(false);
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {showInput && (
        <Zoom in={showInput}>
          <Box sx={{ 
            position: 'absolute', 
            bottom: 80, 
            right: 0, 
            background: 'white', 
            borderRadius: '25px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            minWidth: 300
          }}>
            <TextField
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
              variant="standard"
              sx={{ flex: 1, mx: 2 }}
              InputProps={{ disableUnderline: true }}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <IconButton onClick={handleSend} sx={{ color: '#4facfe' }}>
              <Send />
            </IconButton>
          </Box>
        </Zoom>
      )}
      
      {expanded && actions.map((action, index) => (
        <Zoom key={index} in={expanded} style={{ transitionDelay: `${index * 50}ms` }}>
          <Fab
            size="small"
            sx={{
              position: 'absolute',
              bottom: 70 + (index * 60),
              right: 0,
              background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)`,
              color: 'white',
              '&:hover': { transform: 'scale(1.1)' }
            }}
            onClick={action.action}
          >
            {action.icon}
          </Fab>
        </Zoom>
      ))}
      
      <Fab
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default FloatingActionCluster;