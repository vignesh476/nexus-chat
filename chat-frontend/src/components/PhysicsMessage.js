import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const PhysicsMessage = ({ message, isOwn, children }) => {
  const [isShaking, setIsShaking] = useState(false);
  const [bounceCount, setBounceCount] = useState(0);
  const messageRef = useRef();

  const handleDoubleClick = () => {
    setIsShaking(true);
    setBounceCount(prev => prev + 1);
    
    createFloatingReaction('❤️');
    
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLongPress = () => {
    createFloatingReaction('⭐');
    if (messageRef.current) {
      messageRef.current.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
      setTimeout(() => {
        if (messageRef.current) {
          messageRef.current.style.boxShadow = 'none';
        }
      }, 1000);
    }
  };

  const createFloatingReaction = (emoji) => {
    const rect = messageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const reaction = document.createElement('div');
    reaction.textContent = emoji;
    reaction.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top}px;
      font-size: 24px;
      pointer-events: none;
      z-index: 9999;
      animation: floatUp 2s ease-out forwards;
    `;

    document.body.appendChild(reaction);
    setTimeout(() => reaction.remove(), 2000);
  };

  return (
    <>
      <style>
        {`
          @keyframes floatUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
          }
          @keyframes messageShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-1deg); }
            75% { transform: translateX(5px) rotate(1deg); }
          }
          @keyframes messageBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
      <Box
        ref={messageRef}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
        sx={{
          cursor: 'pointer',
          animation: isShaking ? 'messageShake 0.5s ease-in-out' : 
                    bounceCount > 0 ? 'messageBounce 0.3s ease-in-out' : 'none',
          transformOrigin: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            filter: 'brightness(1.1)'
          },
          '&:active': {
            transform: 'scale(0.98)'
          }
        }}
      >
        {children}
        {bounceCount > 0 && (
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -10, 
              background: '#ff6b6b', 
              color: 'white', 
              borderRadius: '50%', 
              width: 20, 
              height: 20, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '10px',
              animation: 'pulse 1s infinite'
            }}
          >
            {bounceCount}
          </Typography>
        )}
      </Box>
    </>
  );
};

export default PhysicsMessage;