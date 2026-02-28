import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Backdrop, Fade } from '@mui/material';

const AnimatedModal = ({
  open,
  onClose,
  children,
  backdropColor = 'rgba(0, 0, 0, 0.5)',
  animationType = 'scale',
  ...props
}) => {
  const modalVariants = {
    scale: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      },
      exit: {
        scale: 0.8,
        opacity: 0,
        transition: { duration: 0.2 }
      }
    },
    slideUp: {
      hidden: { y: '100vh', opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      },
      exit: {
        y: '100vh',
        opacity: 0,
        transition: { duration: 0.3 }
      }
    },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
      exit: { opacity: 0, transition: { duration: 0.3 } }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <AnimatePresence>
      {open && (
        <Modal
          open={open}
          onClose={onClose}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: backdropColor,
              },
            },
          }}
          {...props}
        >
          <motion.div
            variants={modalVariants[animationType]}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
            }}
          >
            {children}
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
