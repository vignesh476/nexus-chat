import { useState, useCallback, useRef, useEffect } from 'react';

export const useGameManager = () => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const timersRef = useRef(new Set());
  const intervalsRef = useRef(new Set());

  // Cleanup function
  const cleanup = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    intervalsRef.current.forEach(interval => clearInterval(interval));
    timersRef.current.clear();
    intervalsRef.current.clear();
  }, []);

  // Safe timer creation
  const createTimer = useCallback((callback, delay) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  // Safe interval creation
  const createInterval = useCallback((callback, delay) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  // Start new game (only one at a time)
  const startGame = useCallback((gameType, initialState) => {
    if (activeGame && activeGame !== gameType) {
      console.warn(`Cannot start ${gameType}, ${activeGame} is already active`);
      return false;
    }
    
    cleanup(); // Clean up any existing timers
    setActiveGame(gameType);
    setGameState(initialState);
    return true;
  }, [activeGame, cleanup]);

  // End current game
  const endGame = useCallback(() => {
    cleanup();
    setActiveGame(null);
    setGameState(null);
  }, [cleanup]);

  // Update game state
  const updateGameState = useCallback((newState) => {
    setGameState(prev => ({ ...prev, ...newState }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    activeGame,
    gameState,
    startGame,
    endGame,
    updateGameState,
    createTimer,
    createInterval,
    canStartGame: (gameType) => !activeGame || activeGame === gameType
  };
};