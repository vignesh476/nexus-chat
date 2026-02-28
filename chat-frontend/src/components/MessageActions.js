import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Popover, Typography } from '@mui/material';
import { Reply, Delete, EmojiEmotions } from '@mui/icons-material';

const MessageActions = ({ message, isOwnMessage, onReply, onDelete, onReact, anchorEl, onClose }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const handleEmojiClick = (emoji) => {
    onReact(message._id, emoji);
    onClose();
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Reply">
          <IconButton size="small" onClick={() => { onReply(message); onClose(); }}>
            <Reply />
          </IconButton>
        </Tooltip>

        <Tooltip title="React">
          <IconButton size="small" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <EmojiEmotions />
          </IconButton>
        </Tooltip>

        {isOwnMessage && (
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => { onDelete(message._id); onClose(); }}>
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {showEmojiPicker && (
        <Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {quickEmojis.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => handleEmojiClick(emoji)}
              sx={{ fontSize: '1.2rem' }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      )}
    </Popover>
  );
};

export default MessageActions;
