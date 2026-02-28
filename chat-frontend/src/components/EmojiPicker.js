import React from 'react';
import { Popover, Box, Typography } from '@mui/material';

const EmojiPicker = ({ onEmojiSelect, onClose, anchorEl, open }) => {
  const emojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '💯'];

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
        {emojis.map((emoji, index) => (
          <Typography
            key={index}
            sx={{ cursor: 'pointer', fontSize: '1.5rem', textAlign: 'center', p: 1 }}
            onClick={() => onEmojiSelect({ native: emoji })}
          >
            {emoji}
          </Typography>
        ))}
      </Box>
    </Popover>
  );
};

export default EmojiPicker;