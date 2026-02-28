import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { Schedule } from '@mui/icons-material';

const ScheduleMessageDialog = ({ open, onClose, onSchedule, initialMessage = '' }) => {
  const [message, setMessage] = useState(initialMessage);
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSchedule = () => {
    if (!message.trim() || !scheduledTime) return;
    
    onSchedule({
      id: Date.now().toString(),
      message: message.trim(),
      scheduledTime: new Date(scheduledTime).toISOString(),
      created: new Date().toISOString(),
      status: 'pending',
    });

    setMessage('');
    setScheduledTime('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <Schedule sx={{ mr: 1 }} />
        Schedule Message
      </DialogTitle>
      
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          type="datetime-local"
          label="Schedule for"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSchedule}
          variant="contained"
          disabled={!message.trim() || !scheduledTime}
          startIcon={<Schedule />}
        >
          Schedule Message
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleMessageDialog;