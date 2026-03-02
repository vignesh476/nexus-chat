import React, { useState, useCallback } from 'react';
import {
  IconButton,
  Popover,
  Box,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { Add, Casino, SportsSoccer, MonetizationOn, Psychology, SportsEsports, Flag } from '@mui/icons-material';

const GamesMenu = ({
  socket,
  user,
  room,
  onDiceRoll,
  onCoinFlip,
  onRPSPlay,
  onRPSStart,
  onTriviaAnswer
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGameAction = (action) => {
    handleClose();
    action();
  };

  // Event handlers to prevent arrow functions in JSX
  const handleRPSStart = useCallback(() => onRPSStart(), [onRPSStart]);
  const handleDiceRoll = useCallback(() => onDiceRoll(), [onDiceRoll]);
  const handleCoinFlip = useCallback(() => onCoinFlip(), [onCoinFlip]);
  const handleTriviaStart = useCallback(() => {
    if (socket) {
      socket.emit('send_message', {
        room_id: room.id,
        sender: user.username,
        type: 'trivia_start',
        content: 'Starting Trivia Quiz',
        game_type: 'trivia'
      });
    }
  }, [socket, room, user]);
  const handleTicTacToeStart = useCallback(() => {
    if (socket) {
      socket.emit('send_message', {
        room_id: room.id,
        sender: user.username,
        type: 'tic_tac_toe_start',
        content: 'Starting Tic-Tac-Toe game',
        game_type: 'tic_tac_toe'
      });
    }
  }, [socket, room, user]);
  const handleLudoStart = useCallback(() => {
    if (socket) {
      socket.emit('send_message', {
        room_id: room.id,
        sender: user.username,
        type: 'ludo_start',
        content: 'Starting Ludo game',
        game_type: 'ludo'
      });
    }
  }, [socket, room, user]);

  const games = [
    {
      id: 'rps',
      title: 'Rock Paper Scissors',
      icon: '✊✋✌',
      action: handleRPSStart,
      color: '#4CAF50',
    },
    {
      id: 'dice',
      title: 'Roll Dice',
      icon: '🎲',
      action: handleDiceRoll,
      color: '#FF9800',
    },
    {
      id: 'coin',
      title: 'Flip Coin',
      icon: '🪙',
      action: handleCoinFlip,
      color: '#9C27B0',
    },
    {
      id: 'trivia',
      title: 'Trivia Quiz',
      icon: '🧠',
      action: handleTriviaStart,
      color: '#2196F3',
    },
    {
      id: 'tictactoe',
      title: 'Tic-Tac-Toe',
      icon: '⭕',
      action: handleTicTacToeStart,
      color: '#FF5722',
    },
    {
      id: 'ludo',
      title: 'Ludo',
      icon: '🏁',
      action: handleLudoStart,
      color: '#607D8B',
    },
  ];

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Games">
        <IconButton
          onClick={handleClick}
          sx={{
            color: open ? 'primary.main' : 'inherit',
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            },
          }}
        >
          <Add />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: isMobile ? 280 : 320,
            maxWidth: isMobile ? 320 : 400,
          },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
          🎮 Choose a Game
        </Typography>

        <Grid container spacing={1}>
          {games.map((game) => (
            <Grid item xs={isMobile ? 6 : 4} key={game.id}>
              <Tooltip title={game.title}>
                <Box
                  onClick={() => handleGameAction(game.action)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: game.color + '20',
                      transform: 'scale(1.05)',
                      boxShadow: 2,
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      mb: 0.5,
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))',
                    }}
                  >
                    {game.icon}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      fontWeight: 'medium',
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                    }}
                  >
                    {game.title}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          ))}
        </Grid>

        <Typography
          variant="caption"
          sx={{
            mt: 2,
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          Tap a game to start playing!
        </Typography>
      </Popover>
    </>
  );
};

export default GamesMenu;
