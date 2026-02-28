import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUserProfiles } from '../context/UserProfileContext';
import { useCall } from '../context/CallContext';
import { useTheme } from '../context/ThemeContext';
import { messagesAPI, roomsAPI } from '../api';
import MainLayout from '../layouts/MainLayout';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Snackbar,
  Alert
} from '@mui/material';

import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import LudoGame from '../components/LudoGame';
import TicTacToeGame from '../components/TicTacToeGame';
import TriviaGame from '../components/TriviaGame';
import ChatHeader from '../components/ChatHeader';
import CallModal from '../components/CallModal';

const ChatRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const { loadUserProfiles } = useUserProfiles();
  const { getBackgroundStyle, darkMode } = useTheme() || {};
  const callContext = useCall();
  const { startCall, isInCall, callStatus, caller, callee, remoteUser, answerCall, endCall, toggleAudio, toggleVideo, localStream, remoteStream } = callContext;
  const callDuration = callContext.callDuration || 0;
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const aiTimeoutRef = useRef(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [error, setError] = useState(null);
  const [ludoGame, setLudoGame] = useState(null);
  const [ticTacToeGame, setTicTacToeGame] = useState(null);
  const [triviaGame, setTriviaGame] = useState(null);
  const [room, setRoom] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const joinedRef = useRef(false);
  const [gameActionDebounce, setGameActionDebounce] = useState({});
  const [replyTo, setReplyTo] = useState(null);

  const debounceGameAction = (actionKey, action, delay = 1000) => {
    if (gameActionDebounce[actionKey]) return;
    setGameActionDebounce(prev => ({ ...prev, [actionKey]: true }));
    action();
    setTimeout(() => {
      setGameActionDebounce(prev => {
        const { [actionKey]: _, ...rest } = prev;
        return rest;
      });
    }, delay);
  };

  const handleCall = (callType) => {
    console.log(`Initiating ${callType} call in room ${roomId}`);
    if (room && room.members) {
      // For direct messages, find the other user
      const otherUser = room.members.find(m => m.username !== user?.username);
      if (otherUser) {
        startCall(otherUser.username, roomId, callType === 'video');
      } else {
        console.error('Cannot start call: no other user in room');
      }
    } else {
      console.error('Cannot start call: room not loaded');
    }
  };

  const handleViewProfile = () => {
    if (room && room.members && room.members.length > 0) {
      // For group chats, show first member that's not current user
      // For direct chats, show the other user
      const otherUser = room.members.find(m => m.username !== user?.username);
      if (otherUser && otherUser.username) {
        console.log('Navigating to profile:', otherUser.username);
        navigate(`/profile/${otherUser.username}`);
      } else if (room.members[0] && room.members[0].username) {
        // Fallback to first member if find fails
        console.log('Navigating to profile (fallback):', room.members[0].username);
        navigate(`/profile/${room.members[0].username}`);
      }
    } else {
      // If no room members, try to get room name as username for direct messages
      console.log('No room members found, room data:', room);
    }
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // Load room info
  useEffect(() => {
    let mounted = true;
    const loadRoom = async () => {
      try {
        const { data } = await roomsAPI.getRoom(roomId);
        console.log('Loaded room data:', data);
        if (mounted) {
          // Normalize room: ensure is_group flag and standardized members shape
          const normalized = { ...data };
          normalized.is_group = normalized.is_group || (Array.isArray(normalized.members) && normalized.members.length > 2);
          // If name looks like a single member username but room is group, prefer the provided name or fallback to joined member names
          if (normalized.is_group && normalized.name && Array.isArray(normalized.members)) {
            const memberUsernames = normalized.members.map(m => (typeof m === 'string' ? m : m.username));
            if (memberUsernames.includes(normalized.name) && normalized.name && normalized.name !== (normalized.display_name || '')) {
              // name collides with a username; try to build a better group label
              normalized.name = data.name || memberUsernames.slice(0,3).join(', ');
            }
          }

          setRoom(normalized);

          // Load user profiles for all room members
          if (normalized.members && Array.isArray(normalized.members)) {
            const usernames = normalized.members.map(member =>
              typeof member === 'string' ? member : member.username
            ).filter(Boolean);
            loadUserProfiles(usernames);
          }
        }
      } catch (e) {
        console.error('Failed to load room:', e);
        setError('Failed to load room details. Please try again later.');
      }
    };
    if (roomId) {
      loadRoom();
    }
    return () => {
      mounted = false;
    };
  }, [roomId]); // Remove loadUserProfiles from dependencies

  // Load initial messages with pagination
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await messagesAPI.getMessages(roomId, { limit: 50, offset: 0 });
        if (!mounted) return;
        const msgs = Array.isArray(data) ? data : [];
        msgs.sort((a,b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0));
        setMessages(msgs);
        setMessageOffset(msgs.length);
        setHasMoreMessages(msgs.length === 50);
        setShouldScrollToBottom(true);

        // Rebuild game states
        try {
          let foundLudo = false, foundTic = false, foundTrivia = false;
          for (let i = msgs.length - 1; i >= 0; i--) {
            const m = msgs[i];
            if ((m.type === 'ludo_end' || m.type === 'ludo_win') && !foundLudo) {
              setLudoGame(null);
              foundLudo = true;
            }
            if ((m.type === 'tic_tac_toe_end' || m.type === 'tic_tac_toe_win' || m.type === 'tic_tac_toe_draw') && !foundTic) {
              setTicTacToeGame(null);
              foundTic = true;
            }
            if (m.type === 'trivia_end' && !foundTrivia) {
              setTriviaGame(null);
              foundTrivia = true;
            }
            if (!foundLudo && (m.game_type === 'ludo' || m.type?.startsWith('ludo')) && m.game_state) {
              setLudoGame(m.game_state);
              foundLudo = true;
            }
            if (!foundTic && (m.game_type === 'tic_tac_toe' || m.type?.startsWith('tic_tac_toe')) && m.game_state) {
              setTicTacToeGame(m.game_state);
              foundTic = true;
            }
            if (!foundTrivia && (m.game_type === 'trivia' || m.type?.startsWith('trivia')) && m.game_state) {
              setTriviaGame(m.game_state);
              foundTrivia = true;
            }
            if (foundLudo && foundTic && foundTrivia) break;
          }
        } catch (e) {
          console.warn('Failed to rebuild game state from messages:', e);
        }
      } catch (e) {
        console.error('Failed to load messages:', e);
        setError('Failed to load messages. Please try again later.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (roomId) load();
    return () => { mounted = false; };
  }, [roomId]);

  // Load older messages when scrolling to top
  const loadOlderMessages = async () => {
    if (loadingOlderMessages || !hasMoreMessages) return;
    setLoadingOlderMessages(true);
    try {
      const { data } = await messagesAPI.getMessages(roomId, { limit: 50, offset: messageOffset });
      const olderMsgs = Array.isArray(data) ? data : [];
      if (olderMsgs.length > 0) {
        olderMsgs.sort((a,b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0));
        setMessages(prev => [...olderMsgs, ...prev]);
        setMessageOffset(prev => prev + olderMsgs.length);
        setHasMoreMessages(olderMsgs.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (e) {
      console.error('Failed to load older messages:', e);
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  // Smart scroll management
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  // Handle scroll events for loading older messages
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
    
    // Load older messages when near top
    if (scrollTop < 100 && hasMoreMessages && !loadingOlderMessages) {
      loadOlderMessages();
    }
    
    // Auto-scroll new messages only if user is at bottom
    if (isAtBottom) {
      setShouldScrollToBottom(true);
    }
  };

  // Join room and bind socket events
  useEffect(() => {
    if (!socket || !roomId) return;
    if (joinedRef.current) return;
    joinedRef.current = true;

    socket.emit('join_room', { room_id: roomId, username: user?.username });

    const onMessage = (m) => {
      if (m?.room_id !== roomId) return;

      console.log('[ChatRoomPage] Received message:', m);

      // FIX: Use callback form to access current state and avoid duplicates
      setMessages((prevMessages) => {
        // Check if message already exists
        if (m._id && prevMessages.some(existing => existing._id === m._id)) {
          console.log('[ChatRoomPage] Duplicate message ignored:', m._id);
          return prevMessages;
        }

        // show snack for game errors so users get immediate feedback when join/end fails
        if (typeof m.type === 'string' && /_error$/.test(m.type) && m.content) {
          setSnack({ open: true, message: m.content, severity: 'error' });
        }

        // Centralized game state updates (run for both optimistic replacements and normal messages)
        if (m.message_type === 'game') {
          // Ludo messages
          if (m.type?.startsWith('ludo')) {
            if (m.game_state) {
              setLudoGame(m.game_state);
              if (pendingEndRef.current && pendingEndRef.current.game_type === 'ludo') pendingEndRef.current = null;
            } else if (m.type === 'ludo_end' || m.type === 'ludo_win') {
              setLudoGame(null);
            } else if (m.type === 'ludo_error') {
              if (pendingEndRef.current && pendingEndRef.current.game_type === 'ludo') {
                setLudoGame(pendingEndRef.current.prev);
                pendingEndRef.current = null;
              }
            }
          }

          // Tic-Tac-Toe messages
          if (m.game_type === 'tic_tac_toe' || m.type?.startsWith('tic_tac_toe')) {
            if (m.game_state) {
              setTicTacToeGame(m.game_state);
              if (pendingEndRef.current && pendingEndRef.current.game_type === 'tic_tac_toe') pendingEndRef.current = null;
            } else if (m.type === 'tic_tac_toe_win' || m.type === 'tic_tac_toe_end') {
              setTicTacToeGame(null);
            } else if (m.type === 'tic_tac_toe_error') {
              if (pendingEndRef.current && pendingEndRef.current.game_type === 'tic_tac_toe') {
                setTicTacToeGame(pendingEndRef.current.prev);
                pendingEndRef.current = null;
              }
            }
          }

          // Trivia messages
          if (m.game_type === 'trivia' || m.type?.startsWith('trivia')) {
            if (m.game_state && typeof m.game_state === 'object') {
              setTriviaGame(m.game_state);
              if (pendingEndRef.current && pendingEndRef.current.game_type === 'trivia') pendingEndRef.current = null;
            } else if (m.type === 'trivia_end') {
              setTriviaGame(null);
            } else if (m.type === 'trivia_error') {
              if (pendingEndRef.current && pendingEndRef.current.game_type === 'trivia') {
                setTriviaGame(pendingEndRef.current.prev);
                pendingEndRef.current = null;
              }
            }
          }
        }

        // Handle optimistic replacement when server returns a message with a temp_id
        if (m.temp_id) {
          let found = false;
          const updated = prevMessages.map(msg => {
            if (msg._id === m.temp_id || msg.temp_id === m.temp_id) {
              found = true;
              return { ...msg, ...m, _id: m._id, temp_id: undefined };
            }
            if (msg._id === m._id) {
              found = true;
              return { ...msg, ...m };
            }
            return msg;
          });
          if (found) return updated;
          if (prevMessages.some(msg => msg._id === m._id)) {
            return prevMessages.map(msg => msg._id === m._id ? { ...msg, ...m } : msg);
          }
          return [...prevMessages, m];
        }

        // Normal message: append immediately and scroll if at bottom
        console.log('[ChatRoomPage] Adding new message to state');
        setShouldScrollToBottom(true);
        return [...prevMessages, m];
      });

      if (m?.sender === 'AI') {
        setAiTyping(false);
        if (aiTimeoutRef.current) { clearTimeout(aiTimeoutRef.current); aiTimeoutRef.current = null; }
      }
    }; 

    const onGameStateUpdate = (data) => {
      if (data.room_id !== roomId) return;
      if (data.game_type === 'ludo' && data.game_state) {
        setLudoGame(data.game_state);
      }
    };

    const onMessageUpdate = (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m))
      );
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    const onTyping = (data) => {
      if (data.roomId !== roomId) return;
      setTypingUsers((prev) => {
        const existingUser = prev.find(u => u.id === data.user.id);
        if (existingUser) return prev;
        const newTypingUsers = [...prev, data.user];
        setTimeout(() => {
          setTypingUsers((currentUsers) => currentUsers.filter((u) => u.id !== data.user.id));
        }, 3000);
        return newTypingUsers;
      });
    };

    socket.on('message', onMessage);
    socket.on('message_update', onMessageUpdate);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('typing', onTyping);

    // Clear reply if the message we were replying to gets deleted
    const onMessageDeletedClearReply = ({ messageId }) => {
      setReplyTo(current => current && current._id === messageId ? null : current);
    };
    socket.on('message_deleted', onMessageDeletedClearReply);

    return () => {
      socket.emit('leave_room', { room_id: roomId });
      socket.off('message', onMessage);
      socket.off('message_update', onMessageUpdate);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('typing', onTyping);
      socket.off('game_state_update', onGameStateUpdate);
      socket.off('message_deleted', onMessageDeletedClearReply);
      joinedRef.current = false;
    };
  }, [socket, roomId]);

  // Register service worker and subscribe for web-push notifications (if supported)
  useEffect(() => {
    const registerPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const swReg = await navigator.serviceWorker.register('/sw.js');
        const vapidRes = await fetch('/users/vapid_public');
        const json = await vapidRes.json();
        const vapidPublic = json?.vapid_public;
        if (!vapidPublic) return;

        const toUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const sub = await swReg.pushManager.getSubscription() || await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8Array(vapidPublic),
        });

        // Send subscription object to backend
        await fetch('/users/register_push_subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ subscription: { type: 'webpush', subscription: sub } })
        });
      } catch (e) {
        console.warn('Push registration failed:', e);
      }
    };
    registerPush();
  }, [roomId]);

  const handleSend = (text, extraData) => {
    if (!text?.trim() && !extraData) return;

    const messageData = {
      room_id: roomId,
      sender: user?.username,
    };

    if (extraData && extraData.type === 'gif') {
      // Handle GIF messages
      messageData.type = 'gif';
      messageData.gif_data = extraData.data;
      messageData.content = extraData.data.title || 'GIF';
    } else {
      // Handle regular text messages
      messageData.content = text;
    }

    // Include reply information when replying to a message
    if (replyTo && replyTo._id) {
      messageData.parent_message_id = replyTo._id;
    }

    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', messageData);

    // Clear reply after sending
    if (replyTo) setReplyTo(null);
  };

  const handleTyping = (isTyping) => {
    socket.emit('typing', { room_id: roomId, user: user, isTyping: isTyping });
  }

  const handleDiceRoll = () => {
    debounceGameAction('dice_roll', () => {
      const tempId = uuidv4();
      const optimisticMessage = {
        _id: tempId,
        temp_id: tempId,
        room_id: roomId,
        sender: user?.username,
        type: 'dice_roll',
        message_type: 'game',
        result: Math.floor(Math.random() * 6) + 1,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMessage]);
      if (!socket) { console.error('Socket not initialized or not available'); return; }
      socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'dice_roll', temp_id: tempId });
    });
  };

  const handleCoinFlip = () => {
    debounceGameAction('coin_flip', () => {
      const tempId = uuidv4();
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const optimisticMessage = {
        _id: tempId,
        temp_id: tempId,
        room_id: roomId,
        sender: user?.username,
        type: 'coin_flip',
        message_type: 'game',
        result: result,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMessage]);
      if (!socket) { console.error('Socket not initialized or not available'); return; }
      socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'coin_flip', temp_id: tempId });
    });
  };

  const handleAIRequest = (content) => {
    if (!socket) { console.error('Socket not initialized for AI request'); return; }
    setAiTyping(true);
    if (aiTimeoutRef.current) { clearTimeout(aiTimeoutRef.current); }
    aiTimeoutRef.current = setTimeout(() => { setAiTyping(false); aiTimeoutRef.current = null; }, 30000);
    socket.emit('ai_message', { room_id: roomId, content });
  };

  const handleShareLocation = (locationData) => {
    if (!socket) { console.error('Socket not initialized for location sharing'); return; }
    const messageData = {
      room_id: roomId,
      sender: user?.username,
      type: 'location',
      message_type: 'location',
      location_data: locationData,
      content: `📍 Shared location: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
    };
    socket.emit('send_message', messageData);
  };

  const handleScheduleMessage = (scheduleData) => {
    if (!socket) { console.error('Socket not initialized for scheduled message'); return; }
    const messageData = {
      room_id: roomId,
      sender: user?.username,
      type: 'scheduled',
      message_type: 'scheduled',
      content: scheduleData.message,
      scheduled_time: scheduleData.scheduledTime,
    };
    socket.emit('send_message', messageData);
  }; 

  const handleRPSPlay = (choice) => {
    console.log('Sending rps_play event:', { room_id: roomId, sender: user?.username, type: 'rps_play', choice });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'rps_play', choice });
  };

  const handleRPSStart = () => {
    console.log('Sending rps_start event:', { room_id: roomId, sender: user?.username, type: 'rps_start' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'rps_start' });
  };

  const handleTriviaAnswer = (answer, question = null) => {
    console.log('Sending trivia_answer event:', { room_id: roomId, sender: user?.username, type: 'trivia_answer', answer, question });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'trivia_answer', answer, question, game_type: 'trivia' });
  };

  const handleTriviaStart = (force = false) => {
    console.log('Sending trivia_start event:', { room_id: roomId, sender: user?.username, type: 'trivia_start', game_type: 'trivia', force });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'trivia_start', game_type: 'trivia', force });
  };

  const handleTriviaJoin = () => {
    console.log('Sending trivia_join event:', { room_id: roomId, sender: user?.username, type: 'trivia_join', game_type: 'trivia' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    if (triviaGame && triviaGame.participants && triviaGame.participants.includes(user?.username)) {
      console.log('Already in trivia game, skipping join');
      return;
    }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'trivia_join', game_type: 'trivia' });
  };

  const handleTicTacToeJoin = () => {
    console.log('Sending tic_tac_toe_join event:', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_join', game_type: 'tic_tac_toe' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    if (ticTacToeGame && ticTacToeGame.players && ticTacToeGame.players.includes(user?.username)) {
      console.log('Already in Tic-Tac-Toe game, skipping join');
      return;
    }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_join', game_type: 'tic_tac_toe' });
  };

  const handleTicTacToeStart = () => {
    console.log('Sending tic_tac_toe_start event:', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_start', game_type: 'tic_tac_toe' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_start', game_type: 'tic_tac_toe' });
  };

  const handleTicTacToeMove = (position) => {
    console.log('Sending tic_tac_toe_move event:', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_move', position, game_type: 'tic_tac_toe' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_move', position, game_type: 'tic_tac_toe' });
  };

  const handleLudoJoinGame = () => {
    console.log('Sending ludo_join event:', { room_id: roomId, sender: user?.username, type: 'ludo_join', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    // Add a guard to disable double-join
    if (ludoGame && ludoGame.players && ludoGame.players.includes(user?.username)) {
      console.log('User already in ludo game, skipping join');
      return;
    }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_join', game_type: 'ludo' });
  };

  const handleLudoRollDice = () => {
    console.log('Sending ludo_roll event:', { room_id: roomId, sender: user?.username, type: 'ludo_roll', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_roll', game_type: 'ludo' });
  };

  const handleLudoMovePiece = (pieceId) => {
    console.log('Sending ludo_move event:', { room_id: roomId, sender: user?.username, type: 'ludo_move', piece_id: pieceId, game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_move', piece_id: pieceId, game_type: 'ludo' });
  };

  const handleLudoLeaveGame = () => {
    console.log('Sending ludo_leave event:', { room_id: roomId, sender: user?.username, type: 'ludo_leave', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_leave', game_type: 'ludo' });
  };

  const handleLudoEndTimeout = () => {
    console.log('Sending ludo_end_timeout event:', { room_id: roomId, sender: user?.username, type: 'ludo_end_timeout', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_end_timeout', game_type: 'ludo' });
  };

  const pendingEndRef = useRef(null);

  const handleLudoEnd = () => {
    console.log('Sending ludo_end event:', { room_id: roomId, sender: user?.username, type: 'ludo_end', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    // Store previous state in case server rejects the end
    pendingEndRef.current = { game_type: 'ludo', prev: ludoGame };
    // Optimistically clear UI so the game doesn't block chat while waiting for server confirmation
    setLudoGame(null);
    // Also remove lingering ludo_start messages in this room (optimistic)
    setMessages(prev => prev.filter(msg => !(msg.type === 'ludo_start' && msg.room_id === roomId)));
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_end', game_type: 'ludo' });
    // Clear pending after 7s to avoid stale state
    setTimeout(() => { if (pendingEndRef.current && pendingEndRef.current.game_type === 'ludo') pendingEndRef.current = null; }, 7000);
  };

  const handleTriviaEnd = () => {
    console.log('Sending trivia_end event:', { room_id: roomId, sender: user?.username, type: 'trivia_end', game_type: 'trivia' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    // Store pending
    pendingEndRef.current = { game_type: 'trivia', prev: triviaGame };
    setTriviaGame(null);
    setMessages(prev => prev.filter(msg => !(msg.type === 'trivia_start' && msg.room_id === roomId)));
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'trivia_end', game_type: 'trivia' });
    setTimeout(() => { if (pendingEndRef.current && pendingEndRef.current.game_type === 'trivia') pendingEndRef.current = null; }, 7000);
  };

  const handleTriviaSync = () => {
    console.log('Sending trivia_sync event:', { room_id: roomId, sender: user?.username, type: 'trivia_sync', game_type: 'trivia' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'trivia_sync', game_type: 'trivia' });
  };

  const handleTicTacToeSync = () => {
    console.log('Sending tic_tac_toe_sync event:', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_sync', game_type: 'tic_tac_toe' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_sync', game_type: 'tic_tac_toe' });
  };

  const handleLudoSync = () => {
    console.log('Sending ludo_sync event:', { room_id: roomId, sender: user?.username, type: 'ludo_sync', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_sync', game_type: 'ludo' });
  };

  const handleTicTacToeEnd = () => {
    console.log('Sending tic_tac_toe_end event:', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_end', game_type: 'tic_tac_toe' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    pendingEndRef.current = { game_type: 'tic_tac_toe', prev: ticTacToeGame };
    setTicTacToeGame(null);
    setMessages(prev => prev.filter(msg => !(msg.type === 'tic_tac_toe_start' && msg.room_id === roomId)));
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'tic_tac_toe_end', game_type: 'tic_tac_toe' });
    setTimeout(() => { if (pendingEndRef.current && pendingEndRef.current.game_type === 'tic_tac_toe') pendingEndRef.current = null; }, 7000);
  };

  const handleLudoTimeoutCheck = () => {
    console.log('Sending ludo_timeout_check event:', { room_id: roomId, sender: user?.username, type: 'ludo_timeout_check', game_type: 'ludo' });
    if (!socket) { console.error('Socket not initialized or not available'); return; }
    socket.emit('send_message', { room_id: roomId, sender: user?.username, type: 'ludo_timeout_check', game_type: 'ludo' });
  };

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: darkMode 
              ? 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <ChatHeader
          room={room}
          currentUser={user}
          onCall={handleCall}
          onVideoCall={(callType) => handleCall(callType)}
          onViewProfile={handleViewProfile}
          onSettings={handleSettings}
        />

        <Box
          ref={messagesContainerRef}
          onScroll={handleScroll}
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: darkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.4)',
              borderRadius: '3px',
              '&:hover': {
                background: darkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(148, 163, 184, 0.6)',
              },
            },
          }}
        >
          {loadingOlderMessages && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={20} />
            </Box>
          )}

          <MessageList
            messages={messages}
            currentUser={user}
            onReply={(msg) => setReplyTo(msg)}
            onRPSPlay={handleRPSPlay}
            onLudoJoin={handleLudoJoinGame}
            onTicTacToeJoin={handleTicTacToeJoin}
            onTriviaJoin={handleTriviaJoin}
            onLudoEnd={handleLudoEnd}
            onTicTacToeEnd={handleTicTacToeEnd}
            onTriviaEnd={handleTriviaEnd}
            onLudoSync={handleLudoSync}
            onTicTacToeSync={handleTicTacToeSync}
            onTriviaSync={handleTriviaSync}
            ludoGame={ludoGame}
            ticTacToeGame={ticTacToeGame}
            triviaGame={triviaGame}
          />
          <div ref={messagesEndRef} />
          {ludoGame && (
            <LudoGame
              gameState={ludoGame}
              onRollDice={handleLudoRollDice}
              onMovePiece={handleLudoMovePiece}
              onJoinGame={handleLudoJoinGame}
              onLeaveGame={handleLudoLeaveGame}
              onEndTimeout={handleLudoEndTimeout}
              onTimeoutCheck={handleLudoTimeoutCheck}
              onEnd={handleLudoEnd}
              currentUser={user?.username}
              socket={socket}
              roomId={roomId}
            />
          )}

          {ticTacToeGame && (
            <TicTacToeGame
              gameState={ticTacToeGame}
              onMove={handleTicTacToeMove}
              onJoin={handleTicTacToeJoin}
              onStart={handleTicTacToeStart}
              onEnd={handleTicTacToeEnd}
              currentUser={user?.username}
              socket={socket}
              roomId={roomId}
            />
          )}

          {triviaGame && (
            <TriviaGame
              gameState={triviaGame}
              onAnswer={handleTriviaAnswer}
              onStartNext={handleTriviaStart}
              onEnd={handleTriviaEnd}
              currentUser={user?.username}
              socket={socket}
              roomId={roomId}
            />
          )}
        </Box>

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            background: darkMode 
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'}`,
            transition: 'all 0.3s ease',
          }}
        >
          {typingUsers.length > 0 && (
            <Box sx={{ 
              px: 3, 
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                alignItems: 'center'
              }}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'typing 1.4s infinite ease-in-out',
                      animationDelay: `${i * 0.2}s`,
                      '@keyframes typing': {
                        '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                        '30%': { transform: 'translateY(-8px)', opacity: 1 },
                      },
                    }}
                  />
                ))}
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </Typography>
            </Box>
          )}
          <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ open: false, message: '', severity: 'info' })}>
            <Alert severity={snack.severity} onClose={() => setSnack({ open: false, message: '', severity: 'info' })}>{snack.message}</Alert>
          </Snackbar>
          <MessageInput
            onSend={handleSend}
            onTyping={handleTyping}
            socket={socket}
            user={user}
            room={{ id: roomId }}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onDiceRoll={handleDiceRoll}
            onCoinFlip={handleCoinFlip}
            onRPSPlay={handleRPSPlay}
            onRPSStart={handleRPSStart}
            onTriviaAnswer={handleTriviaAnswer}
            onAIRequest={handleAIRequest}
            onShareLocation={handleShareLocation}
            onScheduleMessage={handleScheduleMessage}
            aiTyping={aiTyping}
          />
        </Box>
      </Box>

      {/* Settings Modal */}
      <Dialog open={showSettings} onClose={handleCloseSettings} maxWidth="sm" fullWidth>
        <DialogTitle>Room Settings</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText
                primary="Room Name"
                secondary={room?.name || 'Loading...'}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Room Type"
                secondary={room?.is_group ? 'Group Chat' : 'Direct Message'}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Members"
                secondary={room?.members ? `${room.members.length} members` : 'Loading...'}
              />
            </ListItem>
            {room?.members && (
              <List>
                {room.members.map((m) => (
                  <ListItem key={m.username} secondaryAction={
                    (room?.admins?.includes(user.username) || room?.created_by === user.username) ? (
                      <Box>
                        <Button size="small" onClick={async () => {
                          try {
                            await fetch(`/rooms/${roomId}/mute_user?target_user=${m.username}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                            const { data } = await roomsAPI.getRoom(roomId);
                            setRoom(data);
                            setSnack({ open: true, message: `${m.username} muted`, severity: 'success' });
                          } catch (e) { setSnack({ open: true, message: `Failed to mute ${m.username}`, severity: 'error' }); }
                        }}>Mute</Button>
                        <Button size="small" color="error" onClick={async () => {
                          try {
                            await fetch(`/rooms/${roomId}/kick_user?target_user=${m.username}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                            const { data } = await roomsAPI.getRoom(roomId);
                            setRoom(data);
                            setSnack({ open: true, message: `${m.username} kicked`, severity: 'success' });
                          } catch (e) { setSnack({ open: true, message: `Failed to kick ${m.username}`, severity: 'error' }); }
                        }}>Kick</Button>
                      </Box>
                    ) : null
                  }>
                    <ListItemText
                      primary={m.username}
                      secondary={m.status}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Divider />
            <ListItem>
              <ListItemText
                primary="Room ID"
                secondary={roomId}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Call Modal */}
      <CallModal
        open={isInCall}
        callStatus={callStatus}
        caller={remoteUser}
        onAnswer={callStatus === 'ringing' ? answerCall : null}
        onEndCall={endCall}
        localStream={localStream}
        remoteStream={remoteStream}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        callDuration={callDuration}
      />
    </MainLayout>
  );
};

export default ChatRoomPage;