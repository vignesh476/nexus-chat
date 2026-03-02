import React from 'react';
import { Popover, Box, Typography, ButtonBase } from '@mui/material';
import useResponsive from '../hooks/useResponsive';

const EmojiPicker = ({ onEmojiSelect, onClose, anchorEl, open }) => {
  const { isMobile } = useResponsive();
  const emojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '💯'];

  const handleEmojiClick = (emoji) => {
    onEmojiSelect({ native: emoji });
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }
      }}
    >
      <Box sx={{ 
        p: isMobile ? 1.5 : 2, 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: isMobile ? 0.5 : 1,
        maxWidth: isMobile ? 280 : 320
      }}>
        {emojis.map((emoji, index) => (
          <ButtonBase
            key={index}
            sx={{ 
              borderRadius: 2,
              p: isMobile ? 1 : 1.5,
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              minHeight: isMobile ? 40 : 48,
              minWidth: isMobile ? 40 : 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
                backgroundColor: 'action.selected',
              }
            }}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handleEmojiClick(emoji)}
            disableRipple={false}
          >
            {emoji}
          </ButtonBase>
        ))}
      </Box>
    </Popover>
  );
};

export default EmojiPicker;