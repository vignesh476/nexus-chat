import React, { useState, useEffect, useRef } from 'react';

import { List, ListItem, ListItemText, Typography, Box, IconButton, Chip, Badge, Button, Menu, MenuItem, Popover, Tooltip } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { useMood } from '../context/MoodContext';
import { useAuth } from '../context/AuthContext';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { messagesAPI } from '../api';
import Reply from '@mui/icons-material/Reply';
// import MessageActions from './MessageActions'; // Commented out unused import

// Add CSS animations for games
const gameStyles = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  @keyframes flip {
    0% { transform: rotateY(0); }
    50% { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
  }

  @keyframes typing {
    0% { opacity: 0.25; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-4px); }
    100% { opacity: 0.25; transform: translateY(0); }
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('game-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'game-styles';
  styleSheet.textContent = gameStyles;
  document.head.appendChild(styleSheet);
}

const MessageList = React.memo(({ messages, onReply, searchQuery, onRPSPlay, onLudoJoin, onTicTacToeJoin, onTriviaJoin, onLudoEnd, onTicTacToeEnd, onTriviaEnd, onLudoSync = () => {}, onTicTacToeSync = () => {}, onTriviaSync = () => {}, aiTyping, ludoGame, ticTacToeGame, triviaGame }) => {
  const { user } = useAuth();
  const { darkMode, messageStyle, getBackgroundStyle, getFontSizeValue, getMessageBubbleStyle } = useTheme() || {
    darkMode: false,
    messageStyle: 'bubble',
    getBackgroundStyle: () => '#f5f5f5',
    getFontSizeValue: () => '16px',
    getMessageBubbleStyle: () => ({})
  };
  const { updateMood, getMoodTheme } = useMood() || { updateMood: () => {}, getMoodTheme: () => ({ background: 'transparent' }) };
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const [userPresence, setUserPresence] = useState({});
  // Prevent double-clicks when joining games
  const [joining, setJoining] = useState({});

  // Menu and emoji popover state for per-message actions
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuMessageId, setMenuMessageId] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [emojiMessageId, setEmojiMessageId] = useState(null);

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '😢'];

  const openMenu = (event, msg) => {
    event.stopPropagation();
    const anchor = (messageRefs.current && messageRefs.current[msg._id]) || event.currentTarget;
    setMenuAnchorEl(anchor);
    setMenuMessageId(msg._id);
  };
  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuMessageId(null);
  }; 

  const openEmojiPopover = (event, msg) => {
    event.stopPropagation();
    const anchor = (messageRefs.current && messageRefs.current[msg._id]) || event.currentTarget;
    setEmojiAnchorEl(anchor);
    setEmojiMessageId(msg._id);
    closeMenu();
  };
  const closeEmojiPopover = () => {
    setEmojiAnchorEl(null);
    setEmojiMessageId(null);
  }; 

  const handleAddReaction = async (messageId, emoji) => {
    await handleReaction(messageId, emoji);
    closeEmojiPopover();
  };

  const handleJoinClick = (msg, joinHandler) => {
    if (!joinHandler) return;
    const id = msg._id || msg.temp_id || '__unknown__';
    if (joining[id]) return; // already in progress
    setJoining(prev => ({ ...prev, [id]: true }));
    try {
      joinHandler();
    } catch (e) {
      console.error('Join handler error', e);
      setJoining(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  }

  // Update mood when new messages arrive
  useEffect(() => {
    if (messages?.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.content) {
        updateMood(latestMessage.content);
      }
    }
  }, [messages, updateMood]);

  // Debug: Log when messages prop changes
  useEffect(() => {
    console.log('[MessageList] Messages prop changed:', messages?.length || 0, 'messages');
  }, [messages]);

  // Auto-scroll to bottom when messages change (only when newest appended)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages?.length]);

  // Clear join-in-progress flags when messages update and we detect the current user in participants
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const toClear = [];

    messages.forEach(msg => {
      try {
        // Normalize participants to array of usernames (supports both string and object shapes)
        const participants = (msg.participants || []).map(p => (typeof p === 'string' ? p : (p && p.username) ? p.username : null)).filter(Boolean);
        if (participants.includes(user.username) && joining[msg._id]) {
          toClear.push(msg._id);
        }
      } catch (e) { /* ignore malformed msg */ }
    });

    if (toClear.length > 0) {
      setJoining(prev => {
        const next = { ...prev };
        toClear.forEach(id => { delete next[id]; });
        return next;
      });
    }

    // Also clear any join-in-progress flags if a game error message was received (e.g., game full, already joined)
    const hasGameError = messages.some(msg => typeof msg.type === 'string' && /_error$/.test(msg.type));
    if (hasGameError && Object.keys(joining).length > 0) {
      setJoining({});
    }
  }, [messages, user.username, joining]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (messages && messages.length > 0 && messagesEndRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    }
  }, []); // Empty dependency array - runs only on mount

  console.log('[MessageList] Rendering messages:', messages?.length || 0, 'messages'); // Debug log

  const getContextualBackground = (msg, isOwn) => {
    if (msg.message_type === 'game' || msg.game_type) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    if (msg.content?.includes('?')) {
      return isOwn ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    }
    if (msg.content?.includes('!')) {
      return isOwn ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
    return messageStyle === 'bubble'
      ? (isOwn ? (darkMode ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' : 'linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)')
               : (darkMode ? 'linear-gradient(135deg, #2f2f2f 0%, #3d3d3d 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)'))
      : messageStyle === 'box' ? (isOwn ? (darkMode ? '#1565c0' : '#e3f2fd') : (darkMode ? '#424242' : '#f5f5f5')) : 'transparent';
  };

  const getContextualBorderRadius = (msg, isOwn) => {
    if (msg.message_type === 'game' || msg.game_type) return '20px';
    if (msg.content?.includes('?')) return '25px 25px 5px 25px';
    if (msg.content?.includes('!')) return '5px 25px 25px 25px';
    return messageStyle === 'bubble' ? 3 : messageStyle === 'box' ? 2 : 1;
  };

  const getContextualShadow = (msg, isOwn) => {
    if (msg.message_type === 'game' || msg.game_type) return '0 8px 25px rgba(102, 126, 234, 0.3)';
    if (msg.content?.includes('!')) return '0 4px 15px rgba(250, 112, 154, 0.4)';
    return messageStyle === 'bubble' ? (isOwn ? '0 4px 14px rgba(25, 118, 210, 0.25)' : '0 4px 12px rgba(0,0,0,0.08)') : 'none';
  };

  const getMessageClusters = (messages) => {
    if (!messages?.length) return [];
    
    const clusters = [];
    let currentCluster = [];
    
    messages.forEach((msg, index) => {
      const prevMsg = messages[index - 1];
      
      const shouldStartNewCluster = !prevMsg ||
        msg.sender !== prevMsg.sender ||
        (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) > 300000 ||
        msg.message_type !== prevMsg.message_type ||
        detectTopicChange(msg, prevMsg);
      
      if (shouldStartNewCluster && currentCluster.length > 0) {
        clusters.push({
          id: `cluster-${clusters.length}`,
          messages: [...currentCluster],
          type: getClusterType(currentCluster),
          mood: getClusterMood(currentCluster)
        });
        currentCluster = [];
      }
      
      currentCluster.push(msg);
    });
    
    if (currentCluster.length > 0) {
      clusters.push({
        id: `cluster-${clusters.length}`,
        messages: currentCluster,
        type: getClusterType(currentCluster),
        mood: getClusterMood(currentCluster)
      });
    }
    
    return clusters;
  };

  const detectTopicChange = (current, previous) => {
    const gameWords = ['game', 'play', 'dice', 'coin'];
    const currentHasGame = gameWords.some(word => current.content?.toLowerCase().includes(word));
    const previousHasGame = gameWords.some(word => previous.content?.toLowerCase().includes(word));
    return currentHasGame !== previousHasGame;
  };

  const getClusterType = (messages) => {
    const gameCount = messages.filter(m => m.game_type || m.type?.includes('game')).length;
    const mediaCount = messages.filter(m => ['image', 'video', 'voice'].includes(m.message_type)).length;
    
    if (gameCount > 0) return 'game';
    if (mediaCount > messages.length / 2) return 'media';
    return 'conversation';
  };

  const getClusterMood = (messages) => {
    const text = messages.map(m => m.content || '').join(' ').toLowerCase();
    if (text.includes('😊') || text.includes('happy') || text.includes('great')) return 'positive';
    if (text.includes('😢') || text.includes('sad') || text.includes('bad')) return 'negative';
    return 'neutral';
  };

  const getClusterStyle = (cluster) => {
    const baseStyle = {
      mb: 3,
      p: 2,
      borderRadius: '20px',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: -10,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 4,
        height: '60%',
        borderRadius: 2,
      }
    };

    const styles = {
      game: {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        border: '2px solid rgba(102, 126, 234, 0.3)',
        '&::before': { ...baseStyle['&::before'], background: '#667eea' }
      },
      media: {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
        border: '2px solid rgba(79, 172, 254, 0.3)',
        '&::before': { ...baseStyle['&::before'], background: '#4facfe' }
      },
      conversation: {
        ...baseStyle,
        background: 'rgba(248, 249, 250, 0.5)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        '&::before': { ...baseStyle['&::before'], background: '#e9ecef' }
      }
    };

    return styles[cluster.type] || styles.conversation;
  };

  const getMessageContent = (msg) => {
    if (msg.message_type === 'image') {
      return (
        <Box>
          <img
            src={`http://127.0.0.1:8000/messages/download/${msg._id}`}
            alt={msg.file_name}
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              width: 'auto',
              height: 'auto',
              borderRadius: '8px',
              objectFit: 'contain',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              window.open(`http://127.0.0.1:8000/messages/download/${msg._id}`, '_blank');
            }}
          />
          {msg.content && <Typography variant="body2" sx={{ mt: 1 }}>{msg.content}</Typography>}
        </Box>
      );
    } else if (msg.message_type === 'video') {
      return (
        <Box>
          <video
            src={`http://127.0.0.1:8000/messages/download/${msg._id}`}
            controls
            style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
          />
          {msg.content && <Typography variant="body2" sx={{ mt: 1 }}>{msg.content}</Typography>}
        </Box>
      );
    } else if (msg.message_type === 'voice') {
      return (
        <Box>
          <audio
            src={`http://127.0.0.1:8000/messages/download/${msg._id}`}
            controls
            style={{ maxWidth: '250px', height: '40px' }}
            preload="metadata"
          />
          {msg.content && <Typography variant="body2" sx={{ mt: 1 }}>{msg.content}</Typography>}
        </Box>
      );
    } else if (msg.message_type === 'file') {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>{msg.content}</Typography>
          <a
            href={`http://127.0.0.1:8000/messages/download/${msg._id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            📎 {msg.file_name}
          </a>
        </Box>
      );
    } else if (msg.type === 'gif' || msg.message_type === 'gif') {
      return renderGifMessage(msg);
    } else if (msg.message_type === 'game' || msg.game_type) {
      return renderGameMessage(msg);
    } else {
      const content = msg.plain_text || msg.content;
      if (!content || content.trim() === '') {
        return null;
      }
      
      return highlightSearchTerm(content, searchQuery);
    }
  };

  const renderReactions = (reactions, isHovered = false) => {
    if (!reactions || reactions.length === 0) return null;

    // Separate user's reactions from others
    const userReactions = reactions.filter(reaction => reaction.user === user.username);
    const otherReactions = reactions.filter(reaction => reaction.user !== user.username);

    // Always show user's reactions, show others only on hover
    const reactionsToShow = isHovered ? [...userReactions, ...otherReactions] : userReactions;

    if (reactionsToShow.length === 0) return null;

    const reactionCounts = reactionsToShow.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(reactionCounts).map(([emoji, count]) => (
      <Chip key={emoji} label={`${emoji} ${count}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
    ));
  };

  const renderReactionsCompact = (reactions, isHovered = false, messageId) => {
    if (!reactions || reactions.length === 0) return null;
    const reactionCounts = reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(reactionCounts);
    const visible = entries.slice(0, 3);
    const moreCount = Math.max(0, entries.length - 3);

    return (
      <Box sx={{ position: 'absolute', right: 8, bottom: 36, display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, zIndex: 2000 }}>
        {visible.map(([emoji, count]) => (
          <Chip
            key={emoji}
            label={count > 1 ? `${emoji} ${count}` : emoji}
            size="small"
            onClick={(e) => { e.stopPropagation(); handleReaction(messageId, emoji); }}
            sx={{ cursor: 'pointer' }}
          />
        ))}
        {moreCount > 0 && (
          <Chip
            label={`+${moreCount}`}
            size="small"
            onClick={(e) => { e.stopPropagation(); openEmojiPopover(e, { _id: messageId }); }}
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>
    );
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await messagesAPI.reactToMessage(messageId, { emoji });
      // The reaction will be updated via the existing socket listener in ChatRoomPage
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messagesAPI.deleteMessage(messageId);
      // The message will be removed via the existing socket listener in ChatRoomPage
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const renderGameMessage = (message) => {
    const gameType = message.type || message.game_type;

    switch (gameType) {
      case 'dice_roll':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'primary.light',
            borderRadius: 2,
            textAlign: 'center',
            animation: 'bounce 0.5s ease-in-out'
          }}>
            <Typography variant="h4">🎲</Typography>
            <Typography variant="h6">Dice Roll</Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {message.dice_result || message.result}
            </Typography>
          </Box>
        );

      case 'coin_flip':
        const isHeads = (message.coin_result || message.result) === 'heads';
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'secondary.light',
            borderRadius: 2,
            textAlign: 'center',
            animation: 'flip 1s ease-in-out'
          }}>
            <Typography variant="h4">{isHeads ? '🪙' : '🪙'}</Typography>
            <Typography variant="h6">Coin Flip</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {message.coin_result || message.result}
            </Typography>
          </Box>
        );

      case 'rps_start':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🎮</Typography>
            <Typography variant="h6">Rock Paper Scissors</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => onRPSPlay && onRPSPlay('rock')}
                sx={{ minWidth: 80 }}
              >
                ✊ Rock
              </Button>
              <Button
                variant="contained"
                onClick={() => onRPSPlay && onRPSPlay('paper')}
                sx={{ minWidth: 80 }}
              >
                ✋ Paper
              </Button>
              <Button
                variant="contained"
                onClick={() => onRPSPlay && onRPSPlay('scissors')}
                sx={{ minWidth: 80 }}
              >
                ✌ Scissors
              </Button>
            </Box>
          </Box>
        );

      case 'rps_waiting':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'warning.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">⏳</Typography>
            <Typography variant="h6">Rock Paper Scissors</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );

      case 'rps_result':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'info.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🏆</Typography>
            <Typography variant="h6">Rock Paper Scissors Result</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
            {message.moves && (
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {Object.entries(message.moves).map(([player, move]) => (
                  <Typography key={player} variant="body2">
                    {player}: {move === 'rock' ? '✊' : move === 'paper' ? '✋' : '✌'} {move}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );

      case 'rps_play':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'secondary.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🎮</Typography>
            <Typography variant="h6">Rock Paper Scissors</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );

      case 'rps_error':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'error.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">❌</Typography>
            <Typography variant="h6">Rock Paper Scissors Error</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );

      case 'ludo_start':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'warning.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🏁</Typography>
            <Typography variant="h6">Ludo Game Started!</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                color="warning"
                onClick={() => handleJoinClick(message, onLudoJoin)}
                disabled={joining[message._id] || (ludoGame?.players?.includes(user.username)) || message.participants?.includes(user.username)}
              >
                {joining[message._id] ? 'Joining...' : ((ludoGame?.players?.includes(user.username) || message.participants?.includes(user.username)) ? 'Joined' : 'Join Game')}
              </Button>
              {message.participants && message.participants.length > 0 && !ludoGame && (
                <Button variant="outlined" color="info" onClick={() => onLudoSync && onLudoSync()}>
                  Sync Game
                </Button>
              )}
              {(message.owner === user.username || message.sender === user.username) && onLudoEnd && (
                <Button variant="outlined" color="error" onClick={() => onLudoEnd()}>
                  End Game
                </Button>
              )}
            </Box>
            {message.participants && message.participants.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Players: {message.participants.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 'ludo_join':
      case 'ludo_roll':
      case 'ludo_move':
      case 'ludo_leave':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'warning.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🏁</Typography>
            <Typography variant="h6">Ludo Game</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );

      case 'tic_tac_toe_start':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'info.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">⭕</Typography>
            <Typography variant="h6">Tic-Tac-Toe Started!</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                color="info"
                onClick={() => handleJoinClick(message, onTicTacToeJoin)}
                disabled={joining[message._id] || (ticTacToeGame?.players?.includes(user.username)) || message.participants?.includes(user.username)}
              >
                {joining[message._id] ? 'Joining...' : ((ticTacToeGame?.players?.includes(user.username) || message.participants?.includes(user.username)) ? 'Joined' : 'Join Game')}
              </Button>
              {message.participants && message.participants.length > 0 && !ticTacToeGame && (
                <Button variant="outlined" color="info" onClick={() => onTicTacToeSync && onTicTacToeSync()}>
                  Sync Game
                </Button>
              )}
              {(message.owner === user.username || message.sender === user.username) && onTicTacToeEnd && (
                <Button variant="outlined" color="error" onClick={() => onTicTacToeEnd()}>
                  End Game
                </Button>
              )}
            </Box>
          </Box>
        );

      case 'tic_tac_toe_move':
      case 'tic_tac_toe_win':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'info.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">⭕</Typography>
            <Typography variant="h6">Tic-Tac-Toe</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );

      case 'trivia_start':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'secondary.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🧠</Typography>
            <Typography variant="h6">Trivia Quiz Started!</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleJoinClick(message, onTriviaJoin)}
                disabled={joining[message._id] || (triviaGame?.participants?.includes(user.username)) || message.participants?.includes(user.username)}
              >
                {joining[message._id] ? 'Joining...' : ((triviaGame?.participants?.includes(user.username) || message.participants?.includes(user.username)) ? 'Joined' : 'Join Game')}
              </Button>
              {message.participants && message.participants.length > 0 && !triviaGame && (
                <Button variant="outlined" color="info" onClick={() => onTriviaSync && onTriviaSync()}>
                  Sync Game
                </Button>
              )}
              {(message.owner === user.username || message.sender === user.username) && onTriviaEnd && (
                <Button variant="outlined" color="error" onClick={() => onTriviaEnd()}>
                  End Game
                </Button>
              )}
            </Box>
          </Box>
        );

      case 'trivia_answer':
      case 'trivia_result':
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'secondary.light',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h4">🧠</Typography>
            <Typography variant="h6">Trivia Quiz</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );

      default:
        return (
          <Box sx={{
            p: 2,
            bgcolor: 'grey.300',
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h6">🎯 Game</Typography>
            <Typography variant="body1">
              {highlightSearchTerm(message.content, searchQuery)}
            </Typography>
          </Box>
        );
    }
  };

  const renderGifMessage = (message) => {
    const gifData = message.gif_data || message.data;
    if (!gifData || !gifData.url) {
      return (
        <Typography variant="body2" color="error">
          GIF failed to load
        </Typography>
      );
    }

    return (
      <Box sx={{ maxWidth: 300, mt: 1 }}>
        <img
          src={gifData.url}
          alt={gifData.title || 'GIF'}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 8,
            maxHeight: 200,
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <Typography variant="caption" sx={{ display: 'none', color: 'text.secondary', mt: 1 }}>
          GIF failed to load
        </Typography>
        {gifData.title && (
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
            {gifData.title}
          </Typography>
        )}
      </Box>
    );
  };

  const renderReplyPreview = (parentMessageId) => {
    if (!parentMessageId) return null;

    // Find the parent message in the current messages array
    const parentMessage = messages.find(msg => msg._id === parentMessageId);
    if (!parentMessage) return null;

    return (
      <Box
        sx={{
          borderLeft: 3,
          borderColor: 'primary.main',
          pl: 1,
          mb: 1,
          backgroundColor: darkMode ? 'grey.800' : 'grey.100',
          borderRadius: 1,
          p: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          Replying to {highlightSearchTerm(parentMessage.sender, searchQuery)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {highlightSearchTerm(parentMessage.content || 'Message', searchQuery)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      overflow: 'auto', 
      p: 2, 
      display: 'flex', 
      flexDirection: 'column', 
      scrollBehavior: 'smooth',
      background: getBackgroundStyle(),
      transition: 'background 1s ease',
      fontSize: getFontSizeValue()
    }}>
      {!messages || messages.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          No messages yet. Start chatting!
        </Typography>
      ) : (
        <List sx={{ flexGrow: 1 }}>
          {messages.map((msg, index) => {
            const isCurrentUser = msg.sender === user.username;
            return (
              <div
                key={msg._id || index}
                ref={(el) => (messageRefs.current[msg._id || index] = el)}
              >
                  <ListItem
                    sx={{
                      alignItems: 'flex-end',
                      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, alignSelf: isCurrentUser ? 'flex-end' : 'flex-start' }}>
                      {/* Avatar placeholder for alignment – can be wired to real avatars */}
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: isCurrentUser ? 'primary.light' : 'grey.400',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        display: 'inline-block'
                      }} aria-hidden />

                      <Box
                        ref={(el) => (messageRefs.current[msg._id] = el)}
                        sx={{
                          position: 'relative',
                          maxWidth: { xs: '82%', sm: '70%' },
                          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                          opacity: msg.pending ? 0.6 : 1,
                          ...getMessageBubbleStyle(isCurrentUser, msg),
                          p: messageStyle === 'minimal' ? 0.75 : 1.25,
                          mb: 1.5,
                          border: messageStyle === 'minimal' ? `1px solid ${darkMode ? '#555' : '#e0e0e0'}` : 'none',
                          '&:hover': { transform: 'translateY(-1px)', filter: 'brightness(1.1)' },
                        }}
                        onMouseEnter={() => setHoveredMessageId(msg._id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: userPresence[msg.sender]?.status === 'online' ? '#44b700' : userPresence[msg.sender]?.status === 'away' ? '#ff9800' : userPresence[msg.sender]?.status === 'busy' ? '#f44336' : '#9e9e9e',
                                color: 'transparent',
                                boxShadow: `0 0 0 2px ${darkMode ? '#121212' : '#fff'}`,
                              },
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: '600', mr: 1, color: darkMode ? '#e0e0e0' : 'text.secondary', letterSpacing: 0.2 }}>
                              {msg.sender}
                            </Typography>
                          </Badge>

                          {msg.pending && (
                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                              Sending...
                            </Typography>
                          )}

                          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {userPresence[msg.sender]?.custom_status && (
                              <Typography variant="caption" sx={{ color: darkMode ? '#bdbdbd' : 'text.secondary' }}>
                                {userPresence[msg.sender].custom_status}
                              </Typography>
                            )}

                            {hoveredMessageId === msg._id && (
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); openMenu(e, msg); }}
                                sx={{ p: 0.5, transition: 'transform 140ms ease', '&:hover': { transform: 'scale(1.1)' } }}
                                aria-label="message actions"
                                aria-controls={menuMessageId === msg._id ? 'message-menu' : undefined}
                                aria-expanded={Boolean(menuAnchorEl && menuMessageId === msg._id)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        {renderReplyPreview(msg.parent_message_id)}

                        <Typography variant="body1" sx={{ wordWrap: 'break-word', color: darkMode ? '#fafafa' : 'inherit', lineHeight: 1.45 }}>
                          {getMessageContent(msg)}
                        </Typography>

                        <Typography component="div" variant="caption" aria-label="timestamp" sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, color: darkMode ? '#bdbdbd' : 'text.secondary' }}>
                          <span>{new Date(msg.timestamp || msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.edited && <span aria-label="edited">• edited</span>}
                        </Typography>

                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.25 }}>
                          {renderReactionsCompact(msg.reactions, hoveredMessageId === msg._id, msg._id)}

                          {hoveredMessageId === msg._id && (
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEmojiPopover(e, msg); }} sx={{ mr: 0.5 }} aria-label="add reaction">
                              <EmojiEmotionsIcon fontSize="small" />
                            </IconButton>
                          )}

                          <IconButton size="small" onClick={() => onReply && onReply(msg)} sx={{ mr: 0.5 }} aria-label="reply">
                            <Reply />
                          </IconButton>
                        </Box>

                        {/* Tail "pointer" for bubbles */}
                        {messageStyle === 'bubble' && (
                          <Box sx={{
                            position: 'absolute',
                            bottom: -2,
                            [isCurrentUser ? 'right' : 'left']: 8,
                            width: 12,
                            height: 12,
                            transform: isCurrentUser ? 'rotate(45deg)' : 'rotate(45deg)',
                            bgcolor: 'transparent',
                            background: isCurrentUser
                              ? (darkMode ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' : 'linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)')
                              : (darkMode ? 'linear-gradient(135deg, #2f2f2f 0%, #3d3d3d 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)'),
                            boxShadow: isCurrentUser ? '2px 2px 6px rgba(25,118,210,0.25)' : '2px 2px 6px rgba(0,0,0,0.08)'
                          }} />
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                </div>
              );
            })}

            {/* {messages.map((msg, index) => {
              const isCurrentUser = msg.sender === user.username;
              return (
                <motion.div
                  key={msg._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ListItem
                    sx={{
                      alignItems: 'flex-start',
                      justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                        backgroundColor: messageStyle === 'bubble'
                          ? (isCurrentUser
                              ? (darkMode ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)')
                              : (darkMode ? 'linear-gradient(135deg, #424242 0%, #616161 100%)' : 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)'))
                          : messageStyle === 'box'
                          ? (isCurrentUser
                              ? (darkMode ? '#1976d2' : '#e3f2fd')
                              : (darkMode ? '#424242' : '#f5f5f5'))
                          : // minimal
                            'transparent',
                        borderRadius: messageStyle === 'bubble' ? 3 : messageStyle === 'box' ? 1 : 0,
                        p: messageStyle === 'minimal' ? 0.5 : 1,
                        mb: 1,
                        boxShadow: messageStyle === 'bubble' ? (isCurrentUser ? '0 2px 8px rgba(25, 118, 210, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)') : 'none',
                        border: messageStyle === 'minimal' ? `1px solid ${darkMode ? '#555' : '#ddd'}` : 'none',
                      }}
                      onMouseEnter={() => setHoveredMessageId(msg._id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: userPresence[msg.sender]?.status === 'online' ? '#44b700' :
                                              userPresence[msg.sender]?.status === 'away' ? '#ff9800' :
                                              userPresence[msg.sender]?.status === 'busy' ? '#f44336' : '#757575',
                              color: userPresence[msg.sender]?.status === 'online' ? '#44b700' :
                                     userPresence[msg.sender]?.status === 'away' ? '#ff9800' :
                                     userPresence[msg.sender]?.status === 'busy' ? '#f44336' : '#757575',
                              boxShadow: `0 0 0 2px ${darkMode ? '#121212' : '#fff'}`,
                              '&::after': {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                animation: userPresence[msg.sender]?.status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
                                border: '1px solid currentColor',
                                content: '""',
                              },
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
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, color: darkMode ? '#ffffff' : 'text.secondary' }}>
                            {msg.sender}
                          </Typography>
                        </Badge>
                        {userPresence[msg.sender]?.custom_status && (
                          <Typography variant="caption" sx={{ color: darkMode ? '#cccccc' : 'text.secondary' }}>
                            {userPresence[msg.sender].custom_status}
                          </Typography>
                        )}
                      </Box>
                      {renderReplyPreview(msg.parent_message_id)}
                      <Typography variant="body1" sx={{ wordWrap: 'break-word', color: darkMode ? '#ffffff' : 'inherit' }}>
                        {getMessageContent(msg)}
                      </Typography>
                      {msg.timestamp && (
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: darkMode ? '#cccccc' : 'text.secondary' }}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          flexWrap: 'wrap',
                        }}
                      >
                        {renderReactions(msg.reactions, hoveredMessageId === msg._id)}
                        {['👍', '❤️', '😂'].map((emoji) => (
                          <IconButton
                            key={emoji}
                            size="small"
                            onClick={() => handleReaction(msg._id, emoji)}
                            sx={{ mr: 0.5 }}
                          >
                            {emoji}
                          </IconButton>
                        ))}
                        <IconButton
                          size="small"
                          onClick={() => onReply && onReply(msg)}
                          sx={{ mr: 0.5 }}
                        >
                          <Reply />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                </motion.div>
              );
            })} */}
            {/* Menu & Emoji Popover for message actions */}
            <Menu 
              anchorEl={menuAnchorEl} 
              open={Boolean(menuAnchorEl && menuMessageId)} 
              onClose={closeMenu} 
              keepMounted 
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} 
              transformOrigin={{ vertical: 'top', horizontal: 'left' }} 
              id="message-menu"
            >
              <MenuItem onClick={(e) => { e.stopPropagation(); const msg = messages.find(m => m._id === menuMessageId); if (msg && onReply) onReply(msg); closeMenu(); }}>Reply</MenuItem>
              <MenuItem onClick={(e) => { e.stopPropagation(); const msg = messages.find(m => m._id === menuMessageId); if (msg) openEmojiPopover(e, msg); }}>React</MenuItem>
              {messages.find(m => m._id === menuMessageId)?.sender === user?.username && (
                <MenuItem onClick={(e) => { e.stopPropagation(); handleDeleteMessage(menuMessageId); closeMenu(); }}>
                  Delete
                </MenuItem>
              )}
              <MenuItem onClick={(e) => { e.stopPropagation(); const msg = messages.find(m => m._id === menuMessageId); if (msg && msg.content) { navigator.clipboard?.writeText(msg.content); } closeMenu(); }}>Copy</MenuItem>
            </Menu> 

            <Popover
              open={Boolean(emojiAnchorEl && emojiMessageId)}
              anchorEl={emojiAnchorEl}
              onClose={closeEmojiPopover}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              disableAutoFocus
            >
              <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
                {QUICK_EMOJIS.map((emoji) => (
                  <Tooltip key={emoji} title={emoji}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAddReaction(emojiMessageId, emoji); }}>
                      {emoji}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            </Popover>

            {/* AI typing indicator */}
            {aiTyping && (
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">AI is typing</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0,1,2].map(i => (
                      <Box key={i} sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'text.secondary',
                        opacity: 0.75,
                        animation: 'typing 1.2s infinite',
                        animationDelay: `${i * 0.12}s`
                      }} />
                    ))}
                  </Box>
                </Box>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
      )}
    </Box>
  );
});

export default MessageList;
