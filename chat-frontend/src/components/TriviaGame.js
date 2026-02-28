import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, RadioGroup, FormControlLabel, Radio, FormControl, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';


const TriviaGame = ({ gameState, onAnswer, onStartNext, onEnd, currentUser, socket, roomId }) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Reset local answer state when question changes or when status resets
  useEffect(() => {
    if (gameState) {
      setSelectedAnswer('');
      setHasAnswered(false);
    }
  }, [gameState?.current_question?.question, gameState?.status]);

  if (!gameState) return null;

  // Defensive: normalize shape (some messages may use "participants" or omit players)
  const players = Array.isArray(gameState.players)
    ? gameState.players
    : Array.isArray(gameState.participants)
    ? gameState.participants
    : [];

  const {
    current_question = null,
    status = 'waiting',
    scores = {},
    current_turn = 0,
    winner = null,
  } = gameState;

  if (!Array.isArray(players) || players.length === 0) {
    // Data isn't shaped as expected — log for debugging but avoid crashing the UI
    console.warn('TriviaGame: players missing or malformed in gameState', gameState);
  }

  const currentPlayer = players[current_turn] ?? null;
  const isCurrentPlayer = currentUser === currentPlayer;
  const playerScore = scores ? (scores[currentUser] ?? 0) : 0;
  const isOwner = currentUser === gameState.owner;
  const isParticipant = players.includes(currentUser);

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || hasAnswered) return;
    setHasAnswered(true);
    // Pass question to parent so payload contains question + answer
    if (typeof onAnswer === 'function') {
      onAnswer(selectedAnswer, gameState.current_question?.question || null);
    }
  };

  const handleNextQuestion = () => {
    if (typeof onStartNext === 'function') {
      onStartNext();
    }
  };

  const handleLeaveGame = () => {
    if (status === 'question_active' || status === 'waiting_answers') {
      setShowLeaveConfirm(true);
    } else {
      if (typeof onEnd === 'function') onEnd();
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    if (typeof onEnd === 'function') onEnd();
  };

  const handleEndGame = () => {
    setShowEndConfirm(true);
  };

  const confirmEndGame = () => {
    setShowEndConfirm(false);
    if (typeof onEnd === 'function') onEnd();
  };

  if (status === 'finished') {
    const sortedPlayers = Object.entries(scores || {}).sort(([,a], [,b]) => b - a);
    return (
      <Paper sx={{ p: 2, m: 2, textAlign: 'center' }}>
        <Typography variant="h5" color="success.main">
          🎉 Trivia Game Complete!
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Final Scores:
        </Typography>
        {sortedPlayers.map(([player, score], index) => (
          <Typography key={player} variant="body1" sx={{ mt: 1 }}>
            {index + 1}. {player}: {score} points
          </Typography>
        ))}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextQuestion}
          >
            Play Another Round
          </Button>
          {currentUser === gameState.owner && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleEndGame}
            >
              End Game
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  if (!current_question) {
    const isOwner = currentUser === gameState.owner;
    return (
      <Paper sx={{ p: 2, m: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          🧠 Trivia Quiz
        </Typography>
        <Typography variant="body1">
          Waiting for the next question...
        </Typography>
        {(isCurrentPlayer || isOwner) && (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleNextQuestion}
          >
            Start Next Question
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <>
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        🧠 Trivia Quiz
      </Typography>

      {/* Game Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          Players: {players.length ? players.join(', ') : 'No players yet'}
        </Typography>
        <Typography variant="body2">
          Your Score: {playerScore} points
        </Typography>
        {status === 'waiting_answers' && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Waiting for all players to answer...
          </Typography>
        )}
      </Box>

      {/* Question */}
      <div>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          {current_question?.question ?? 'Question not available'}
        </Typography>
      </div>

      {/* Answer Options */}
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <RadioGroup
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          disabled={hasAnswered || status === 'waiting_answers'}
        >
          {(Array.isArray(current_question?.options) ? current_question.options : []).map((option, index) => (
            <div
              key={index}
            >
              <FormControlLabel
                value={option}
                control={<Radio />}
                label={option}
                sx={{
                  mb: 1,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '1rem',
                  },
                }}
              />
            </div>
          ))}
        </RadioGroup>
      </FormControl>

      {/* Submit Button */}
      {!hasAnswered && status !== 'waiting_answers' && (
        <Box sx={{ textAlign: 'center' }}>
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              size="large"
            >
              Submit Answer
            </Button>
          </div>
          {/* Owner control to skip question */}
          {currentUser === gameState.owner && status === 'question_active' && (
            <Button
              variant="outlined"
              color="warning"
              sx={{ ml: 2 }}
              onClick={() => {
                if (typeof onStartNext === 'function') onStartNext(true);
              }}
            >
              Skip Question
            </Button>
          )}
        </Box>
      )}

      {/* Answer Feedback */}
      {hasAnswered && status === 'waiting_answers' && (
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
          Answer submitted! Waiting for other players...
        </Typography>
      )}

      {/* Question Results */}
      {status === 'showing_results' && current_question?.correct_answer && (
        <div>
          <Paper sx={{ p: 2, mt: 2, backgroundColor: '#e8f5e8', border: '2px solid #4caf50' }}>
            <Typography variant="h6" color="success.main">
              ✅ Correct Answer: {current_question.correct_answer}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">Results:</Typography>
              {players.map(p => {
                const ans = (gameState.answers && gameState.answers[p]) || '-';
                const correct = ans === current_question.correct_answer;
                const score = (gameState.scores && gameState.scores[p]) || 0;
                return (
                  <Typography key={p} variant="body2" sx={{ mt: 0.5 }}>
                    {p}: {ans} {ans !== '-' && (correct ? '✅' : '❌')} — {score} points
                  </Typography>
                );
              })}
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {currentUser === gameState.owner && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      if (typeof onStartNext === 'function') onStartNext();
                    }}
                  >
                    Next Question
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleEndGame}
                  >
                    End Game
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </div>
      )}
    </Paper>

    {/* Leave Confirmation Dialog */}
    <Dialog open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)}>
      <DialogTitle>Leave Trivia Game?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to leave the trivia game? You will lose your current progress.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
        <Button onClick={confirmLeave} color="error" variant="contained">
          Leave Game
        </Button>
      </DialogActions>
    </Dialog>

    {/* End Game Confirmation Dialog */}
    <Dialog open={showEndConfirm} onClose={() => setShowEndConfirm(false)}>
      <DialogTitle>End Trivia Game?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to end the trivia game for all players?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowEndConfirm(false)}>Cancel</Button>
        <Button onClick={confirmEndGame} color="error" variant="contained">
          End Game
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
  
};

export default TriviaGame;
