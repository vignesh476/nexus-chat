import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const currentRoomRef = useRef(null);
  const currentUsernameRef = useRef(null);
  const profileUpdateCallbacksRef = useRef(new Set());

  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000').replace(/\/$/, '');
    console.log('Initializing socket connection to', SOCKET_URL);
    
    socketRef.current = io(SOCKET_URL, { 
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000
    });

    socketRef.current.on('connect', () => {
      console.log('[SocketContext] Socket connected:', socketRef.current.id);
      reconnectAttempts.current = 0;
      
      // Rejoin room if we were in one
      if (currentRoomRef.current && currentUsernameRef.current) {
        console.log('[SocketContext] Rejoining room:', currentRoomRef.current);
        socketRef.current.emit('join_room', {
          room_id: currentRoomRef.current,
          username: currentUsernameRef.current
        });
      }
      
      setSocket(socketRef.current);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[SocketContext] Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        socketRef.current?.connect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[SocketContext] Connection error:', error.message);
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('[SocketContext] Max reconnection attempts reached');
      }
    });

    socketRef.current.on('error', (error) => {
      console.error('[SocketContext] Socket error:', error);
    });

    // Listen for profile updates
    socketRef.current.on('profile_updated', (data) => {
      console.log('[SocketContext] Profile updated:', data);
      profileUpdateCallbacksRef.current.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[SocketContext] Error in profile update callback:', error);
        }
      });
    });
  }, []);

  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        console.log('[SocketContext] Cleaning up socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [initializeSocket]);

  // Expose methods to track current room and profile updates
  const contextValue = React.useMemo(() => {
    if (!socket) return null;
    return {
      ...socket,
      on: socket.on.bind(socket),
      off: socket.off.bind(socket),
      emit: socket.emit.bind(socket),
      setCurrentRoom: (roomId, username) => {
        currentRoomRef.current = roomId;
        currentUsernameRef.current = username;
      },
      clearCurrentRoom: () => {
        currentRoomRef.current = null;
        currentUsernameRef.current = null;
      },
      onProfileUpdate: (callback) => {
        profileUpdateCallbacksRef.current.add(callback);
        return () => profileUpdateCallbacksRef.current.delete(callback);
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
