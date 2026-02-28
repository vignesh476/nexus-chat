import React from 'react';
import { Button } from '@mui/material';

const AnimatedButton = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  sx = {},
  ...props
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: disabled ? 'none' : 'scale(1.05)',
        },
        '&:active': {
          transform: disabled ? 'none' : 'scale(0.95)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AnimatedButton;