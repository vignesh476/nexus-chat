import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Box, Typography, Paper, AppBar, Toolbar, Avatar, Badge, Chip } from "@mui/material";
import { Group, Lock, Public } from "@mui/icons-material";
import { useTheme } from '../context/ThemeContext';
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatRoom({ user, token, room }) {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [aiTyping, setAiTyping] = useState(false);
  const aiTimeoutRef = useRef(null);

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  useEffect(() => {
    // This component is not being used - socket management moved to SocketContext
    // Keeping this as a placeholder for potential future use
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [room.id]);

  const handleSendMessage = (content, specialData = null) => {
    console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
    // Placeholder - actual implementation in ChatRoomPage
  }; 

  const handleDiceRoll = () => {
    console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
  };

const handleLudoJoin = (gameMessage) => {
  console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
};

const handleAIRequest = (content) => {
  console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
};

  const handleCoinFlip = () => {
    console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
  };

  const handleRPSPlay = (choice) => {
    console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
  };

  const handleRPSStart = () => {
    console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
  };

  const handleTriviaAnswer = (answer) => {
    console.warn('[ChatRoom] This component is deprecated. Use ChatRoomPage instead.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: darkMode
            ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
      {/* Enhanced Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AppBar position="static" elevation={2} sx={{ bgcolor: 'primary.main' }}>
          <Toolbar sx={{ minHeight: '70px' }}>
            {/* Room Avatar */}
            <Avatar
              sx={{
                width: 48,
                height: 48,
                mr: 2,
                bgcolor: 'primary.dark',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              {room.name.charAt(0).toUpperCase()}
            </Avatar>

            {/* Room Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {room.name}
              </Typography>

              {/* Room Details */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Group />}
                  label={`${room.members?.length || 0} members`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: '24px',
                    fontSize: '0.75rem',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />

                <Chip
                  icon={room.is_private ? <Lock /> : <Public />}
                  label={room.is_private ? 'Private' : 'Public'}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: '24px',
                    fontSize: '0.75rem',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />

                {/* Online Status Indicator */}
                <Badge
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#4caf50',
                      color: '#4caf50',
                      boxShadow: `0 0 0 2px white`,
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                    Active
                  </Typography>
                </Badge>
              </Box>
            </Box>

            {/* Room Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Additional action buttons can be added here */}
            </Box>
          </Toolbar>
        </AppBar>
      </motion.div>

      {/* Messages Area - with bottom padding for fixed input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pb: '120px', // Add padding at bottom to prevent messages from being hidden behind fixed input
          }}
        >
          <MessageList messages={messages} onLudoJoin={handleLudoJoin} aiTyping={aiTyping} />
        </Box>
      </motion.div>

      {/* Message Input - Fixed at bottom of viewport */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
        }}
      >
        <MessageInput
          socket={null}
          user={user}
          room={room}
          onSend={handleSendMessage}
          onDiceRoll={handleDiceRoll}
          onCoinFlip={handleCoinFlip}
          onRPSPlay={handleRPSPlay}
          onRPSStart={handleRPSStart}
          onTriviaAnswer={handleTriviaAnswer}
          onAIRequest={handleAIRequest}
          aiTyping={aiTyping}
        />
      </Paper>
      </Box>
    </motion.div>
  );
}
