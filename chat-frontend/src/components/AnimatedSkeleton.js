import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton, Box } from '@mui/material';

const AnimatedSkeleton = ({
  variant = 'rectangular',
  width = '100%',
  height = 40,
  animationType = 'pulse',
  sx = {},
  ...props
}) => {
  const pulseVariants = {
    pulse: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    shimmer: {
      backgroundPosition: ['-200% 0', '200% 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const getSkeletonStyles = () => {
    switch (animationType) {
      case 'wave':
        return {
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          backgroundSize: '200% 100%',
          ...sx,
        };
      case 'shimmer':
        return {
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          ...sx,
        };
      default:
        return sx;
    }
  };

  return (
    <Box sx={{ overflow: 'hidden', borderRadius: 1 }}>
      <motion.div
        variants={pulseVariants}
        animate={animationType}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <Skeleton
          variant={variant}
          width={width}
          height={height}
          sx={getSkeletonStyles()}
          {...props}
        />
      </motion.div>
    </Box>
  );
};

// Pre-configured skeleton components for common use cases
export const MessageSkeleton = ({ width = '100%' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <AnimatedSkeleton
      variant="circular"
      width={40}
      height={40}
      sx={{ mr: 2 }}
    />
    <Box sx={{ flex: 1 }}>
      <AnimatedSkeleton
        variant="rectangular"
        width={width}
        height={20}
        sx={{ mb: 1 }}
      />
      <AnimatedSkeleton
        variant="rectangular"
        width={width * 0.7}
        height={16}
      />
    </Box>
  </Box>
);

export const AvatarSkeleton = ({ size = 40 }) => (
  <AnimatedSkeleton
    variant="circular"
    width={size}
    height={size}
  />
);

export const TextSkeleton = ({ lines = 3, width = '100%' }) => (
  <Box>
    {Array.from({ length: lines }).map((_, index) => (
      <AnimatedSkeleton
        key={index}
        variant="rectangular"
        width={index === lines - 1 ? width * 0.6 : width}
        height={16}
        sx={{ mb: 1 }}
      />
    ))}
  </Box>
);

export default AnimatedSkeleton;
