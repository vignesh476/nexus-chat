import React, { useState, useRef } from 'react';
import { TextField, Button, Box, IconButton, Typography, Chip } from '@mui/material';
import { AttachFile, Close } from '@mui/icons-material';
import { messagesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const MessageInput = ({ roomId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessageReady, setVoiceMessageReady] = useState(false);  // ← ADD THIS


  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'audio/mpeg', 'audio/wav', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        alert('File type not supported. Allowed types: images, videos, audio, PDFs');
        return;
      }
      setSelectedFile(file);
    }
  };
  const handleVoiceRecording = (blob) => {
  setVoiceBlob(blob);
  setVoiceMessageReady(true);  // ← ADD THIS
};

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
const handleVoiceSend = async () => {
  if (voiceBlob) {
    try {
      const formData = new FormData();
      formData.append('file', voiceBlob, 'voice_message.wav');
      formData.append('room_id', room.id);
      formData.append('sender', user.username);
      formData.append('recipient', '');

      const response = await fetch('http://localhost:8000/messages/send_file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        setVoiceBlob(null);
        setVoiceMessageReady(false);  // ← ADD THIS
        setIsRecording(false);  // ← ADD THIS
        // The message will be received via socket
      } else {
        console.error('Failed to send voice message');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  }
};

  const handleSendFile = async () => {
    if (!selectedFile || !user || !roomId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('room_id', roomId);
      formData.append('sender', user.username);
      formData.append('recipient', recipient || '');
      formData.append('content', message);

      await messagesAPI.sendFileMessage(formData);
      setMessage('');
      setRecipient('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onMessageSent && onMessageSent();
    } catch (error) {
      console.error('Failed to send file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendText = async () => {
    if (!message.trim() || !user || !roomId) return;

    try {
      await messagesAPI.sendMessage({
        room_id: roomId,
        sender: user.username,
        recipient: recipient || '',
        content: message,
      });
      setMessage('');
      setRecipient('');
      onMessageSent && onMessageSent();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSend = async () => {
    if (voiceBlob && voiceMessageReady) {  // ← ADD THIS CONDITION
    await handleVoiceSend();
    return;
  }if (media) {
    if (selectedFile) {
      handleSendFile();
    } else {
      handleSendText();
    }}else if (text.trim()) {
    onSend(text);
    setText('');
  }
  };

  const canSend = (message.trim() || selectedFile) && user && roomId && !isUploading;

  return (
    <Box sx={{ mt: 2 }}>
      {selectedFile && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`}
            onDelete={handleFileRemove}
            deleteIcon={<Close />}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
      <Box display="flex" gap={1} alignItems="flex-end">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Recipient username (optional)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && canSend && handleSend()}
          multiline
          maxRows={4}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept={allowedTypes.join(',')}
        />
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <AttachFile />
        </IconButton>
        <IconButton
  onClick={() => {
    if (voiceMessageReady) {
      handleVoiceSend();  // ← CHANGE THIS
      setVoiceMessageReady(false);
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  }}
  sx={{
    color: voiceMessageReady ? 'success.main' : isRecording ? 'error.main' : 'inherit',  // ← UPDATE THIS
    '&:hover': {
      bgcolor: voiceMessageReady ? 'success.light' : isRecording ? 'error.light' : 'grey.300',
    },
  }}
>
  {voiceMessageReady ? <Send /> : isRecording ? <Stop /> : <Mic />}  // ← UPDATE THIS
</IconButton>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={!canSend}
        >
          {isUploading ? 'Sending...' : 'Send'}
        </Button>
      </Box>
    </Box>
  );
};

export default MessageInput;
