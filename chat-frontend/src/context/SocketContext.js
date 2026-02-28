import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!socketRef.current) {
      const SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000').replace(/\/$/, '');
      console.log('Initializing socket connection to', SOCKET_URL);
      socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socketRef.current.on('connect', () => {
        console.log('[SocketContext] Socket connected successfully:', socketRef.current.id);
        setSocket(socketRef.current);
      });
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
      socketRef.current.on('connect_timeout', () => {
        console.error('Socket connection timeout');
      });
    }

    return () => {
      if (socketRef.current) {
        console.log('[SocketContext] Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
