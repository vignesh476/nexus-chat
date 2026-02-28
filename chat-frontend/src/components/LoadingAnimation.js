import React from 'react';
import Lottie from 'lottie-react';
import { Box } from '@mui/material';

// Simple loading animation data (inline to avoid external file dependency)
const loadingAnimationData = {
  "v": "5.7.4",
  "fr": 60,
  "ip": 0,
  "op": 60,
  "w": 200,
  "h": 200,
  "nm": "Loading",
  "ddd": 0,
  "assets": [],
  "layers": [{
    "ddd": 0,
    "ind": 1,
    "ty": 4,
    "nm": "Circle",
    "sr": 1,
    "ks": {
      "o": {"a": 0, "k": 100},
      "r": {"a": 1, "k": [{"t": 0, "s": [0], "e": [360]}, {"t": 60}]},
      "p": {"a": 0, "k": [100, 100, 0]},
      "a": {"a": 0, "k": [0, 0, 0]},
      "s": {"a": 0, "k": [100, 100, 100]}
    },
    "ao": 0,
    "shapes": [{
      "ty": "gr",
      "it": [{
        "d": 1,
        "ty": "el",
        "s": {"a": 0, "k": [80, 80]},
        "p": {"a": 0, "k": [0, 0]},
        "nm": "Ellipse"
      }, {
        "ty": "st",
        "c": {"a": 0, "k": [0.2, 0.6, 1, 1]},
        "o": {"a": 0, "k": 100},
        "w": {"a": 0, "k": 8},
        "lc": 2,
        "lj": 1,
        "nm": "Stroke"
      }, {
        "ty": "tr",
        "p": {"a": 0, "k": [0, 0]},
        "a": {"a": 0, "k": [0, 0]},
        "s": {"a": 0, "k": [100, 100]},
        "r": {"a": 0, "k": 0},
        "o": {"a": 0, "k": 100}
      }],
      "nm": "Circle",
      "bm": 0
    }],
    "ip": 0,
    "op": 60,
    "st": 0,
    "bm": 0
  }]
};

/**
 * Loading animation component using Lottie
 * @param {number} size - Size of the animation (default: 200)
 * @param {string} message - Optional loading message
 */
export const LoadingAnimation = ({ size = 200, message = '' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Lottie
        animationData={loadingAnimationData}
        loop={true}
        style={{ width: size, height: size }}
      />
      {message && (
        <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          {message}
        </Box>
      )}
    </Box>
  );
};

/**
 * Full-screen loading overlay
 */
export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: 4,
          boxShadow: 24,
        }}
      >
        <LoadingAnimation size={150} message={message} />
      </Box>
    </Box>
  );
};

export default LoadingAnimation;
