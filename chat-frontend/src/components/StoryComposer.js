import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { createStory } from '../api/stories';

export default function StoryComposer({ open, onClose, onCreated }) {
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [privacy, setPrivacy] = useState('everyone');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const handleSubmit = async () => {
    try {
      let interactive = null;
      if (type === 'poll') {
        const cleanOpts = pollOptions.map(o => o.trim()).filter(Boolean);
        if (!pollQuestion.trim() || cleanOpts.length < 2) throw new Error('Poll requires a question and at least two options');
        interactive = { type: 'poll', payload: { question: pollQuestion.trim(), options: cleanOpts } };
      }

      const payload = { story_type: type, content, privacy, file, interactive };
      const res = await createStory(payload);
      if (onCreated) onCreated(res);
      setContent(''); setFile(null); setType('text'); setPrivacy('everyone'); setPollOptions(['', '']); setPollQuestion('');
      onClose();
    } catch (e) {
      alert(e.message || 'Failed to create story');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Story</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="type-label">Type</InputLabel>
          <Select labelId="type-label" value={type} label="Type" onChange={(e) => setType(e.target.value)}>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="video">Video</MenuItem>
            <MenuItem value="audio">Audio</MenuItem>
            <MenuItem value="gif">GIF</MenuItem>
            <MenuItem value="poll">Poll</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth label="Text / Caption" value={content} onChange={(e) => setContent(e.target.value)} sx={{ mb: 2 }} />
        {type === 'poll' ? (
          <Box sx={{ mb: 2 }}>
            <TextField fullWidth label="Poll question" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} sx={{ mb: 1 }} />
            {(pollOptions || []).map((opt, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <TextField value={opt} onChange={(e) => setPollOptions(prev => prev.map((v,i) => i===idx ? e.target.value : v))} fullWidth />
                <Button size="small" onClick={() => setPollOptions(prev => prev.filter((_,i) => i !== idx))}>Remove</Button>
              </Box>
            ))}
            <Button size="small" onClick={() => setPollOptions(prev => [...prev, ''])}>Add option</Button>
          </Box>
        ) : (
          <>
            <input type="file" accept="image/*,video/*,audio/*" onChange={(e) => setFile(e.target.files[0])} />
          </>
        )}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="privacy-label">Privacy</InputLabel>
          <Select labelId="privacy-label" value={privacy} label="Privacy" onChange={(e) => setPrivacy(e.target.value)}>
            <MenuItem value="everyone">Everyone</MenuItem>
            <MenuItem value="friends">Friends</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Post</Button>
      </DialogActions>
    </Dialog>
  );
}
