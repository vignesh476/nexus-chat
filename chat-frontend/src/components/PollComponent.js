import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Poll, 
  HowToVote, 
  CheckCircle, 
  RadioButtonUnchecked,
  Add,
  Remove,
  Close,
  BarChart,
  People
} from '@mui/icons-material';


const PollCreator = ({ open, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    const validOptions = options.filter(opt => opt.trim());
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll({
        question: question.trim(),
        options: validOptions,
        allow_multiple: allowMultiple,
        anonymous,
      });
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
      setAnonymous(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Poll</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Poll Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to ask?"
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Options:
        </Typography>

        {options.map((option, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              label={`Option ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Enter option ${index + 1}`}
            />
            {options.length > 2 && (
              <IconButton onClick={() => removeOption(index)} sx={{ ml: 1 }}>
                <Remove />
              </IconButton>
            )}
          </Box>
        ))}

        {options.length < 10 && (
          <Button
            startIcon={<Add />}
            onClick={addOption}
            sx={{ mb: 2 }}
          >
            Add Option
          </Button>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant={allowMultiple ? 'contained' : 'outlined'}
            onClick={() => setAllowMultiple(!allowMultiple)}
            size="small"
          >
            Multiple Choice
          </Button>
          <Button
            variant={anonymous ? 'contained' : 'outlined'}
            onClick={() => setAnonymous(!anonymous)}
            size="small"
          >
            Anonymous
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2}
        >
          Create Poll
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PollComponent = ({ poll, onVote, currentUser, socket }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    // Check if user has already voted
    const userVote = poll.votes?.find(vote => vote.user === currentUser);
    if (userVote) {
      setSelectedOptions(userVote.options || []);
      setHasVoted(true);
    }
  }, [poll, currentUser]);

  const handleOptionToggle = (optionIndex) => {
    if (hasVoted) return;

    if (poll.allow_multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(poll._id, selectedOptions);
      setHasVoted(true);
    }
  };

  const getTotalVotes = () => {
    return poll.votes?.length || 0;
  };

  const getOptionVotes = (optionIndex) => {
    return poll.votes?.filter(vote => 
      vote.options?.includes(optionIndex)
    ).length || 0;
  };

  const getOptionPercentage = (optionIndex) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((getOptionVotes(optionIndex) / total) * 100);
  };

  const getVoters = (optionIndex) => {
    if (poll.anonymous) return [];
    return poll.votes?.filter(vote => 
      vote.options?.includes(optionIndex)
    ).map(vote => vote.user) || [];
  };

  const isExpired = () => {
    if (!poll.expires_at) return false;
    return new Date() > new Date(poll.expires_at);
  };

  const canVote = !hasVoted && !isExpired();

  return (
    <div>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          m: 2,
          maxWidth: 500,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Poll sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Poll
          </Typography>
          <Chip
            label={`${getTotalVotes()} vote${getTotalVotes() !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
          />
        </Box>

        <Typography variant="body1" sx={{ mb: 3, fontWeight: 'medium' }}>
          {poll.question}
        </Typography>

        <List sx={{ mb: 2 }}>
          {poll.options?.map((option, index) => {
            const votes = getOptionVotes(index);
            const percentage = getOptionPercentage(index);
            const isSelected = selectedOptions.includes(index);
            const voters = getVoters(index);

            return (
              <div key={index}>
                  <ListItem
                    button={canVote}
                    onClick={() => handleOptionToggle(index)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      backgroundColor: isSelected ? 'primary.light' : 'background.paper',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': canVote ? {
                        backgroundColor: isSelected ? 'primary.light' : 'action.hover',
                      } : {},
                    }}
                  >
                    {(hasVoted || showResults) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${percentage}%`,
                          backgroundColor: 'primary.main',
                          opacity: 0.1,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    )}
                    
                    <ListItemIcon>
                      {poll.allow_multiple ? (
                        isSelected ? <CheckCircle color="primary" /> : <RadioButtonUnchecked />
                      ) : (
                        isSelected ? <CheckCircle color="primary" /> : <RadioButtonUnchecked />
                      )}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{option}</Typography>
                          {(hasVoted || showResults) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {votes} ({percentage}%)
                              </Typography>
                              {voters.length > 0 && (
                                <Tooltip title={voters.join(', ')}>
                                  <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                                </Tooltip>
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
              </div>
            );
          })}
        </List>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {canVote && (
            <Button
              variant="contained"
              onClick={handleVote}
              disabled={selectedOptions.length === 0}
              startIcon={<HowToVote />}
              sx={{ borderRadius: 2 }}
            >
              Vote
            </Button>
          )}
          
          {hasVoted && (
            <Button
              variant="outlined"
              onClick={() => setShowResults(!showResults)}
              startIcon={<BarChart />}
              size="small"
            >
              {showResults ? 'Hide' : 'Show'} Results
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="caption" color="text.secondary">
            By {poll.creator}
          </Typography>
        </Box>

        {isExpired() && (
          <Chip
            label="Poll Expired"
            color="error"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Paper>
    </div>
  );
};

export { PollCreator, PollComponent };
export default PollComponent;