import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';


const TicTacToeGame = ({ gameState, onMove, onJoin, onStart, onEnd, currentUser, socket, roomId }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [animatingCells, setAnimatingCells] = useState(new Set());
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  useEffect(() => {
    if (gameState) {
      setBoard(gameState.board || Array(9).fill(null));
      setCurrentPlayer(gameState.current_player === 0 ? 'X' : 'O');
      setWinner(gameState.winner || null);
    }
  }, [gameState]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleJoinGame = () => {
    if (typeof onJoin === 'function') {
      onJoin();
    }
  };

  const handleLeaveGame = () => {
    if (gameState?.status === 'playing' && gameState?.players?.includes(currentUser)) {
      setShowLeaveConfirm(true);
    } else {
      if (typeof onEnd === 'function') onEnd();
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    if (typeof onEnd === 'function') onEnd();
  };

  const handleRestart = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    if (typeof onStart === 'function') onStart();
  };

  const handleClick = (index) => {
    if (board[index] || winner || !gameState?.players || gameState.players.length < 2) {
      return;
    }

    // Check if it's the current user's turn
    const isPlayerX = gameState.players.indexOf(currentUser) === 0;
    const expectedSymbol = gameState.current_player === 0 ? 'X' : 'O';
    const userSymbol = isPlayerX ? 'X' : 'O';

    if (userSymbol !== expectedSymbol) {
      return;
    }

    // Delegate move to parent for centralized socket handling
    if (typeof onMove === 'function') {
      onMove(index);
    }

    // Add animation for the clicked cell
    setAnimatingCells(prev => new Set([...prev, index]));
    setTimeout(() => {
      setAnimatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 600);
  };

  const renderSquare = (index) => {
    const isAnimating = animatingCells.has(index);
    const isWinningCell = winner && winner !== 'draw' && calculateWinner(board) === winner &&
                         [0,1,2,3,4,5,6,7,8].filter(i => {
                           const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
                           return lines.some(line => line.includes(i) && line.every(pos => board[pos] === winner));
                         }).includes(index);

    return (
      <Grid item xs={4} key={index}>
        <div>
          <Button
            variant="outlined"
            sx={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              fontWeight: 'bold',
              border: '2px solid #1976d2',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)',
                border: '2px solid #1565c0',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              },
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => handleClick(index)}
            disabled={board[index] || winner || !gameState?.players || gameState.players.length < 2}
          >
            <span
              style={{
                display: 'inline-block',
                color: board[index] === 'X' ? '#d32f2f' : '#1976d2',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {board[index]}
            </span>
          </Button>
        </div>
      </Grid>
    );
  };

  const getStatusMessage = () => {
    if (!gameState?.players || gameState.players.length < 2) {
      return "Waiting for another player to join...";
    }

    if (winner) {
      if (winner === 'draw') {
        return "🤝 Game ended in a draw!";
      }
      return `🏆 ${winner === 'X' ? gameState.players[0] : gameState.players[1]} wins!`;
    }

    const currentPlayerName = gameState.current_player === 0 ? gameState.players[0] : gameState.players[1];
    const isCurrentUser = currentPlayerName === currentUser;

    return isCurrentUser
      ? `🎯 Your turn! (${currentPlayer})`
      : `⏳ ${currentPlayerName}'s turn (${currentPlayer})`;
  };

  const canJoinGame = gameState?.status === 'waiting' && gameState?.players?.length === 1 && !gameState.players.includes(currentUser);
  const isPlayerInGame = gameState?.players?.includes(currentUser);
  const isOwner = currentUser === gameState?.owner;

  return (
    <div>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          m: 2,
          maxWidth: 400,
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
          borderRadius: 3
        }}
      >
        <div>
          <Typography
            variant="h5"
            gutterBottom
            align="center"
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}
          >
            Tic-Tac-Toe
          </Typography>
        </div>

        <div>
          <Typography
            variant="body1"
            gutterBottom
            align="center"
            sx={{
              mb: 2,
              fontWeight: 'medium',
              color: winner ? '#4caf50' : '#1976d2'
            }}
          >
            {getStatusMessage()}
          </Typography>
        </div>

        {canJoinGame && (
          <div>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleJoinGame}
                sx={{
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  fontWeight: 'bold',
                  px: 3
                }}
              >
                🎮 Join Game
              </Button>
            </Box>
          </div>
        )}

        <Grid container spacing={1} sx={{ maxWidth: 260, mx: 'auto' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => renderSquare(index))}
        </Grid>

        {gameState?.players && (
          <div>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Players: {gameState.players.join(' vs ')}
              </Typography>
              {gameState.status === 'finished' && isOwner && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button variant="contained" color="primary" onClick={handleRestart}>
                    Play Another Round
                  </Button>
                  <Button variant="outlined" color="error" onClick={() => { if (typeof onEnd === 'function') onEnd(); }}>
                    End Game
                  </Button>
                </Box>
              )}

              {/* Allow players to leave during active games */}
              {gameState.status === 'playing' && isPlayerInGame && (
                <Box sx={{ mt: 1 }}>
                  <Button variant="outlined" color="error" onClick={handleLeaveGame}>
                    Forfeit & Leave
                  </Button>
                </Box>
              )}

              {/* Allow owner to end games */}
              {gameState.status !== 'finished' && isOwner && (
                <Box sx={{ mt: 1 }}>
                  <Button variant="outlined" color="error" onClick={() => { if (typeof onEnd === 'function') onEnd(); }}>
                    End Game
                  </Button>
                </Box>
              )}
            </Box>
          </div>
        )}
      </Paper>

      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)}>
        <DialogTitle>Forfeit Game?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to forfeit and leave the game? This will end the current match.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
          <Button onClick={confirmLeave} color="error" variant="contained">
            Forfeit & Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restart Confirmation Dialog */}
      <Dialog open={showRestartConfirm} onClose={() => setShowRestartConfirm(false)}>
        <DialogTitle>Start New Game?</DialogTitle>
        <DialogContent>
          <Typography>
            This will start a new Tic-Tac-Toe game with the same players.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestartConfirm(false)}>Cancel</Button>
          <Button onClick={confirmRestart} color="primary" variant="contained">
            Start New Game
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TicTacToeGame;
