import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, Badge } from '@mui/material';

const AnimatedAvatar = ({
  src,
  alt,
  children,
  size = 40,
  online = false,
  sx = {},
  ...props
}) => {
  const pulseVariants = {
    online: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    offline: {
      scale: 1,
    },
  };

  return (
    <motion.div
      variants={pulseVariants}
      animate={online ? 'online' : 'offline'}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: online ? '#44b700' : '#757575',
            color: online ? '#44b700' : '#757575',
            boxShadow: `0 0 0 2px white`,
            '&::after': online ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              animation: 'ripple 1.2s infinite ease-in-out',
              border: '1px solid currentColor',
              content: '""',
            } : {},
          },
          '@keyframes ripple': {
            '0%': {
              transform: 'scale(.8)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(2.4)',
              opacity: 0,
            },
          },
          ...sx,
        }}
      >
        <Avatar
          src={src}
          alt={alt}
          sx={{
            width: size,
            height: size,
            ...sx,
          }}
          {...props}
        >
          {children}
        </Avatar>
      </Badge>
    </motion.div>
  );
};

