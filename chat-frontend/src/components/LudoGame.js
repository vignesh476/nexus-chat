import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import useResponsive from '../hooks/useResponsive';

const LudoGame = ({ gameState, onRollDice, onMovePiece, onJoinGame, onLeaveGame, onEndTimeout, onTimeoutCheck, onEnd, currentUser, socket, roomId }) => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { isMobile } = useResponsive();

  if (!gameState) return null;

  const { players, current_turn, status, board, last_roll, winner, timeout_notified } = gameState;
  const currentPlayer = players[current_turn] || players[0];
  const isCurrentPlayer = currentUser === currentPlayer;
  const canJoin = status === 'waiting' && !players.includes(currentUser) && players.length < 4;
  const hasJoined = players.includes(currentUser);
  const showTimeoutPrompt = (timeout_notified || status === 'timeout_warning') && players[0] === currentUser && status !== 'playing';
  const isOwner = currentUser === gameState.owner;

  const getPlayerColor = (playerIndex) => {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    return colors[playerIndex] || '#95a5a6';
  };

  const getPieceColor = (pieceId) => {
    if (!pieceId) return 'transparent';
    const playerIndex = parseInt(pieceId.split('_')[0][1]);
    return getPlayerColor(playerIndex);
  };

  const handleMovePiece = () => {
    if (selectedPiece && last_roll && isCurrentPlayer) {
      onMovePiece(selectedPiece);
      setSelectedPiece(null);
    }
  };

  const handleLeaveGame = () => {
    if (status === 'playing' && hasJoined) {
      setShowLeaveConfirm(true);
    } else {
      onLeaveGame();
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    onLeaveGame();
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
  };

  if (status === 'finished') {
    return (
      <Paper sx={{ p: 2, m: 2, textAlign: 'center' }}>
        <Typography variant="h5" color="success.main">
          🎉 {winner} wins the game!
        </Typography>
        <Button onClick={onLeaveGame} variant="outlined" sx={{ mt: 1 }}>
          Leave Game
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        🏁 Ludo Game
      </Typography>

      {/* Game Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          Status: {status === 'waiting' ? 'Waiting for players' : status === 'playing' ? 'In progress' : status}
        </Typography>
        <Typography variant="body2">
          Players: {players.map((player, idx) => (
            <Chip
              key={player}
              label={`${player}`}
              sx={{
                mr: 1,
                backgroundColor: getPlayerColor(idx),
                color: 'white',
                fontWeight: player === currentPlayer ? 'bold' : 'normal'
              }}
              size="small"
            />
          ))}
        </Typography>
        {status === 'playing' && (
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Current turn: {currentPlayer} {isCurrentPlayer ? '(You)' : ''}
          </Typography>
        )}
        {last_roll && (
          <Typography variant="body2">
            Last roll: {last_roll}
          </Typography>
        )}
      </Box>

      {/* Join/Leave Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        {canJoin && (
          <Button
            onClick={() => {
              if (typeof onJoinGame === 'function') {
                onJoinGame();
              }
            }}
            variant="contained"
            color="primary"
          >
            Join Game
          </Button>
        )}
        {hasJoined && (
          <Button
            onClick={handleLeaveGame}
            variant="outlined"
            color="error"
            disabled={status === 'finished'}
          >
            {status === 'playing' ? 'Forfeit & Leave' : 'Leave Game'}
          </Button>
        )}

        {isOwner && status !== 'finished' && (
          <Button
            onClick={() => {
              if (typeof onEnd === 'function') onEnd();
            }}
            variant="outlined"
            color="error"
          >
            End Game
          </Button>
        )}

        {status === 'playing' && (
          <Typography variant="body2" sx={{ ml: 2, fontWeight: 'bold', color: isCurrentPlayer ? 'success.main' : 'text.secondary' }}>
            {isCurrentPlayer ? '🎯 Your Turn!' : `⏳ ${currentPlayer}'s Turn`}
          </Typography>
        )}
      </Box>

      {/* Debug Information */}
      {status === 'playing' && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Debug Info:</Typography>
          <Typography variant="caption">Selected Piece: {selectedPiece || 'None'}</Typography><br/>
          <Typography variant="caption">Your Player Index: {players.indexOf(currentUser)}</Typography><br/>
          <Typography variant="caption">Is Current Player: {isCurrentPlayer ? 'Yes' : 'No'}</Typography><br/>
          <Typography variant="caption">Last Roll: {last_roll || 'None'}</Typography><br/>
          <Typography variant="caption">Your Home Pieces: {JSON.stringify(board.homes[players.indexOf(currentUser)] || [])}</Typography>
        </Box>
      )}

      {/* Visual Ludo Board */}
      {status === 'playing' && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(15, ${isMobile ? '20px' : '25px'})`,
            gridTemplateRows: `repeat(15, ${isMobile ? '20px' : '25px'})`,
            gap: isMobile ? 0.5 : 1,
            p: isMobile ? 1 : 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            border: '2px solid #333',
            maxWidth: '100%',
            overflow: 'auto'
          }}>
            {Array.from({ length: 225 }, (_, i) => {
              const row = Math.floor(i / 15);
              const col = i % 15;
              
              // Track squares
              const isTrackSquare = (
                (row === 6 && col >= 1 && col <= 13) ||
                (row === 8 && col >= 1 && col <= 13) ||
                (col === 6 && row >= 1 && row <= 13) ||
                (col === 8 && row >= 1 && row <= 13)
              );
              
              // Home areas
              const isHomeArea = (
                (row < 6 && col < 6) || // Player 0 (Red)
                (row < 6 && col > 8) || // Player 1 (Blue)
                (row > 8 && col < 6) || // Player 3 (Yellow)
                (row > 8 && col > 8)    // Player 2 (Green)
              );
              
              // Center
              const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
              
              let backgroundColor = '#fff';
              let content = null;
              
              if (isHomeArea) {
                const playerIndex = row < 6 ? (col < 6 ? 0 : 1) : (col < 6 ? 3 : 2);
                backgroundColor = getPlayerColor(playerIndex);
              } else if (isTrackSquare) {
                backgroundColor = '#e0e0e0';
              } else if (isCenter) {
                backgroundColor = '#FFD700';
                if (row === 7 && col === 7) content = '🏆';
              }
              
              return (
                <Box
                  key={i}
                  sx={{
                    width: isMobile ? 20 : 25,
                    height: isMobile ? 20 : 25,
                    backgroundColor,
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '8px' : '10px'
                  }}
                >
                  {content}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Functional Piece Selection */}
      {status === 'playing' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Click Your Pieces to Select:</Typography>
          {players.map((player, playerIdx) => {
            const pieces = board.homes[playerIdx] || [];
            const isYourTurn = players.indexOf(currentUser) === playerIdx && isCurrentPlayer;
            
            return (
              <Box key={player} sx={{ mb: 2, p: 2, border: '2px solid', borderColor: getPlayerColor(playerIdx), borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: getPlayerColor(playerIdx) }}>
                  {player} (Player {playerIdx}) {isYourTurn ? '- YOUR TURN' : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {Array.from({ length: 4 }, (_, i) => {
                    const piece = pieces[i];
                    return (
                      <Box
                        key={i}
                        sx={{
                          width: isMobile ? 60 : 50,
                          height: isMobile ? 60 : 50,
                          borderRadius: '50%',
                          backgroundColor: piece ? getPlayerColor(playerIdx) : '#ddd',
                          border: selectedPiece === piece ? '4px solid #000' : '2px solid #333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          minWidth: '48px', // Ensure minimum touch target
                          minHeight: '48px',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          }
                        }}
                        onClick={() => {
                          console.log('Piece clicked:', piece, 'Player:', player, 'Is your turn:', isYourTurn);
                          if (piece) {
                            setSelectedPiece(piece);
                          }
                        }}
                      >
                        {piece && (
                          <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                            {piece.split('_')[1]}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Game Controls */}
      {status === 'playing' && isCurrentPlayer && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {!last_roll ? (
            <Button
              onClick={() => {
                setIsRolling(true);
                onRollDice();
                setTimeout(() => setIsRolling(false), 2000);
              }}
              variant="contained"
              color="primary"
              size="large"
              disabled={isRolling}
            >
              🎲 {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
          ) : (
            <>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Rolled: {last_roll}
              </Typography>
              {selectedPiece ? (
                <Button onClick={handleMovePiece} variant="contained" color="success" size="large">
                  Move {selectedPiece}
                </Button>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Click on your piece to select it
                </Typography>
              )}
              <Button
                onClick={() => {
                  setSelectedPiece(null);
                  onMovePiece(null);
                }}
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
              >
                Skip Turn
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveConfirm} onClose={cancelLeave}>
        <DialogTitle>Leave Game?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave the game? This will forfeit your position and you cannot rejoin.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelLeave}>Cancel</Button>
          <Button onClick={confirmLeave} color="error" variant="contained">
            Leave Game
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default LudoGame;