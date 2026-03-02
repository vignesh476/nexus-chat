import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, Box, IconButton, Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { interactStory, deleteStory } from '../api/stories';

export default function StoryViewer({ open, onClose, stories = [], startIndex = 0, socket }) {
  const [index, setIndex] = useState(startIndex);
  const [localStory, setLocalStory] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const localUser = localStorage.getItem('username') || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : '');

  const STORY_DURATION = 5000; // 5 seconds per story

  // Define navigation functions first
  const next = () => {
    setIndex((i) => Math.min(i+1, stories.length-1));
    setProgress(0);
  };
  
  const prev = () => {
    setIndex((i) => Math.max(i-1, 0));
    setProgress(0);
  };

  useEffect(() => { setIndex(startIndex); setProgress(0); }, [startIndex]);

  // keep a local mutable copy for optimistic UI updates (votes etc.)
  useEffect(() => {
    setLocalStory(stories && stories[index] ? stories[index] : null);
    setProgress(0);
  }, [stories, index]);

  useEffect(() => {
    if (open && localStory) {
      // mark as viewed
      interactStory(localStory._id, 'view').catch(() => {});
    }
  }, [open, index, localStory]);

  // Progress timer
  useEffect(() => {
    if (open && !isPaused && stories.length > 0) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (index < stories.length - 1) {
              next();
            } else {
              setTimeout(() => onClose(), 0); // Defer to avoid setState during render
            }
            return 0;
          }
          return prev + (100 / (STORY_DURATION / 100));
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, isPaused, index, stories.length, onClose]);

  if (!stories || stories.length === 0) {
    return (
      <Dialog fullScreen open={open} onClose={onClose}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'black', position: 'relative' }}>
          <IconButton 
            sx={{ 
              position: 'absolute', 
              left: 16, 
              top: 16, 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
            }} 
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>No stories available</Typography>
          <Button 
            variant="contained" 
            onClick={onClose}
            sx={{ 
              mt: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Go Back
          </Button>
        </Box>
      </Dialog>
    );
  }

  const s = localStory || stories[index];

  if (!s) {
    return (
      <Dialog fullScreen open={open} onClose={onClose}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'black' }}>
          <Typography variant="h4" sx={{ color: 'white' }}>Loading story...</Typography>
        </Box>
      </Dialog>
    );
  }

  const vote = async (option) => {
    if (!s) return;
    try {
      await interactStory(s._id, 'vote', { option });
      // optimistic update: insert current user into votes array for option
      const updated = { ...s };
      const payload = updated.interactive && updated.interactive.payload ? { ...updated.interactive.payload } : {};
      const votes = payload.votes ? { ...payload.votes } : {};
      votes[option] = Array.from(new Set([...(votes[option] || []), localUser]));
      payload.votes = votes;
      updated.interactive = { ...updated.interactive, payload };
      setLocalStory(updated);
    } catch (e) {
      console.warn('Vote failed', e);
    }
  };

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      // Left third - go to previous
      prev();
    } else if (x > (2 * width) / 3) {
      // Right third - go to next
      next();
    } else {
      // Middle third - pause/play
      setIsPaused(!isPaused);
    }
  };

  const handleDelete = async () => {
    if (!s || s.username !== localUser) return;
    try {
      await deleteStory(s._id);
      if (socket) {
        socket.emit('story_deleted', { storyId: s._id });
      }
      // Move to next story or close if this was the last one
      if (stories.length > 1) {
        if (index >= stories.length - 1) {
          prev();
        } else {
          next();
        }
      } else {
        onClose();
      }
    } catch (e) {
      console.warn('Failed to delete story', e);
    }
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Box sx={{ position: 'relative', height: '100%' }}>
        {/* Progress Bars */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2000, display: 'flex', gap: 1, p: 1 }}>
          {stories.map((_, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 3,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 1.5,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  backgroundColor: 'white',
                  width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                  transition: i === index ? 'width 0.1s linear' : 'none'
                }}
              />
            </Box>
          ))}
        </Box>

        <IconButton 
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: 16, 
            zIndex: 2000, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
          }} 
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        {s && s.username === localUser && (
          <IconButton 
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: 16, 
              zIndex: 2000, 
              backgroundColor: 'rgba(255,0,0,0.5)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,0,0,0.7)' }
            }} 
            onClick={handleDelete}
          >
            <DeleteIcon />
          </IconButton>
        )}
        <IconButton 
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: '50%', 
            zIndex: 2000, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            display: index > 0 ? 'flex' : 'none'
          }} 
          onClick={prev}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
        <IconButton 
          sx={{ 
            position: 'absolute', 
            right: 16, 
            top: '50%', 
            zIndex: 2000, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            display: index < stories.length - 1 ? 'flex' : 'none'
          }} 
          onClick={next}
        >
          <ArrowForwardIosIcon />
        </IconButton>

        <DialogContent 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            bgcolor: 'black',
            cursor: 'pointer',
            userSelect: 'none',
            position: 'relative'
          }}
          onClick={handleTap}
        >
          <Box sx={{ maxWidth: '100%', maxHeight: '100%', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {s.story_type === 'text' && (
              <Typography variant="h3" sx={{ color: 'white', textAlign: 'center', p: 2 }}>{s.content}</Typography>
            )}
            {s.story_type === 'image' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
                <img 
                  src={`http://localhost:8000/${s.file_path?.replace(/\\/g, '/')}`}
                  alt={s.content || 'Story image'} 
                  style={{ 
                    maxWidth: '90%', 
                    maxHeight: '80vh', 
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }} 
                  onLoad={() => console.log('Image loaded successfully:', s.file_path)}
                  onError={(e) => {
                    console.error('Image failed to load:', s.file_path);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Typography sx={{ display: 'none', color: 'white', mt: 2 }}>Failed to load image</Typography>
                {s.content && <Typography variant="h6" sx={{ mt: 2, color: 'white', textAlign: 'center' }}>{s.content}</Typography>}
              </Box>
            )}
            {s.story_type === 'video' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
                <video 
                  controls 
                  autoPlay
                  muted
                  src={`http://localhost:8000/${s.file_path?.replace(/\\/g, '/')}`}
                  style={{ 
                    maxWidth: '90%', 
                    maxHeight: '80vh',
                    borderRadius: '8px'
                  }}
                  onLoadStart={() => console.log('Video loading started:', s.file_path)}
                  onCanPlay={() => console.log('Video can play:', s.file_path)}
                  onError={(e) => {
                    console.error('Video failed to load:', s.file_path);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Typography sx={{ display: 'none', color: 'white', mt: 2 }}>Failed to load video</Typography>
                {s.content && <Typography variant="h6" sx={{ mt: 2, color: 'white', textAlign: 'center' }}>{s.content}</Typography>}
              </Box>
            )}
            {s.story_type === 'audio' && (
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <audio 
                  controls 
                  src={`http://localhost:8000/${s.file_path?.replace(/\\/g, '/')}`}
                  style={{ width: '100%', maxWidth: '400px' }}
                  onError={(e) => console.error('Audio failed to load:', s.file_path)}
                />
                {s.content && <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>{s.content}</Typography>}
              </Box>
            )}
            {s.interactive && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">Interactive: {s.interactive.type}</Typography>
                {s.interactive.type === 'poll' ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="h6">{s.interactive.payload?.question || 'Poll'}</Typography>
                    {(s.interactive.payload?.options || []).map((opt) => {
                      const votes = s.interactive.payload?.votes || {};
                      const count = (votes[opt] && votes[opt].length) || 0;
                      const user = localUser;
                      const hasVoted = Object.values(votes).some(arr => arr && arr.includes(user));
                      return (
                        <Box key={opt} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                          <Typography sx={{ flex: 1 }}>{opt}</Typography>
                          <Typography variant="caption">{count} votes</Typography>
                          <Button size="small" disabled={hasVoted} onClick={() => vote(opt)}>Vote</Button>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Button size="small" onClick={() => interactStory(s._id, 'reply', { text: 'Nice!' })}>Reply</Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          
          {/* Debug Info Panel */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 16, 
              left: 16, 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              color: 'white', 
              p: 1, 
              borderRadius: 1,
              fontSize: '0.7rem',
              maxWidth: '300px'
            }}>
              <Typography variant="caption" sx={{ display: 'block' }}>Debug Info:</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Type: {s?.story_type}</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>File Path: {s?.file_path}</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Full URL: {s?.file_path ? `http://localhost:8000${s.file_path}` : 'N/A'}</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>Content: {s?.content}</Typography>
            </Box>
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
}
