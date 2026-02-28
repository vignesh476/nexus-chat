import React, { useEffect, useState } from 'react';
import { Box, Avatar, IconButton, Dialog, Tooltip, Badge, Typography, Chip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { getStories } from '../api/stories';
import StoryViewer from './StoryViewer';
import StoryComposer from './StoryComposer';
import { styled, keyframes } from '@mui/material/styles';

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function StoriesBar({ socket }) {
  const [stories, setStories] = useState([]);
  const [openViewer, setOpenViewer] = useState(false);
  const [viewerStories, setViewerStories] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [openComposer, setOpenComposer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getStories();
        if (mounted) {
          setStories(res);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Failed to load stories', e);
        if (mounted) setLoading(false);
      }
    };
    load();

    if (!socket) return;
    const handler = (payload) => {
      if (!payload || !payload.event) return;
      if (payload.event === 'story_created') {
        setStories(prev => [payload.story, ...prev]);
      } else if (payload.event === 'story_deleted') {
        setStories(prev => prev.filter(s => s._id !== payload.story_id));
        setViewerStories(prev => prev.filter(s => s._id !== payload.story_id));
      } else if (payload.event === 'story_interaction') {
        setStories(prev => prev.map(s => s._id === payload.story._id ? payload.story : s));
        setViewerStories(prev => prev.map(s => s._id === payload.story._id ? payload.story : s));
      }
    };
    socket.on('story_event', handler);
    return () => { mounted = false; socket.off('story_event', handler); };
  }, [socket]);

  // Group stories by username
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.username]) {
      acc[story.username] = [];
    }
    acc[story.username].push(story);
    return acc;
  }, {});

  const currentUser = localStorage.getItem('username') || '';
  const userStories = Object.keys(groupedStories).map(username => ({
    username,
    stories: groupedStories[username].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    latest: groupedStories[username][0],
    isOwn: username === currentUser
  }));

  const ownStory = userStories.find(u => u.isOwn);
  const friendsStories = userStories.filter(u => !u.isOwn);

  const StyledAvatar = styled(Avatar)(({ theme, hasStory, isOwn, isNew }) => ({
    width: 64,
    height: 64,
    cursor: 'pointer',
    border: hasStory 
      ? `3px solid ${isOwn ? '#e91e63' : '#1976d2'}` 
      : '3px solid transparent',
    background: hasStory 
      ? `linear-gradient(45deg, ${isOwn ? '#e91e63, #f06292' : '#1976d2, #42a5f5'})` 
      : '#f5f5f5',
    backgroundSize: '200% 200%',
    animation: isNew ? `${gradientAnimation} 2s ease infinite` : 'none',
    padding: '3px',
    transition: 'all 0.3s ease',
    position: 'relative',
    '&:hover': {
      transform: 'scale(1.1)',
      animation: `${pulseAnimation} 0.6s ease-in-out`,
      boxShadow: `0 4px 20px ${hasStory ? (isOwn ? '#e91e6350' : '#1976d250') : '#00000020'}`
    },
    '& .MuiAvatar-img': {
      borderRadius: '50%',
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }));

  const AddStoryButton = styled(Box)(({ theme }) => ({
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: '3px dashed #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#1976d2',
      backgroundColor: '#f3f4f6',
      transform: 'scale(1.05)'
    }
  }));

  const isStoryNew = (story) => {
    const now = new Date();
    const storyTime = new Date(story.created_at);
    return (now - storyTime) < 3600000; // 1 hour
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid #e0e0e0',
        alignItems: 'center'
      }}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              animation: `${pulseAnimation} 1.5s ease-in-out infinite`
            }} />
            <Box sx={{ width: 60, height: 12, backgroundColor: '#f0f0f0', borderRadius: 1, mt: 1 }} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      gap: 2,
      p: 2,
      overflowX: 'auto',
      backgroundColor: 'background.paper',
      alignItems: 'center',
      borderBottom: '1px solid #e0e0e0',
      '&::-webkit-scrollbar': { display: 'none' },
      scrollbarWidth: 'none'
    }}>
      {/* Your Story */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
        <Tooltip title={ownStory ? "View Your Story" : "Create Your Story"} arrow>
          <Box sx={{ position: 'relative' }}>
            {ownStory ? (
              <StyledAvatar
                hasStory={true}
                isOwn={true}
                isNew={ownStory.stories.some(isStoryNew)}
                onClick={() => {
                  setViewerStories(ownStory.stories);
                  setStartIndex(0);
                  setOpenViewer(true);
                }}
              >
                {currentUser?.[0]?.toUpperCase()}
              </StyledAvatar>
            ) : (
              <AddStoryButton onClick={() => setOpenComposer(true)}>
                <AddCircleOutlineIcon sx={{ fontSize: 32, color: '#666' }} />
              </AddStoryButton>
            )}
            {ownStory && ownStory.stories.length > 1 && (
              <Chip
                label={ownStory.stories.length}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#e91e63',
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                  minWidth: 20
                }}
              />
            )}
          </Box>
        </Tooltip>
        <Typography variant="caption" sx={{ 
          mt: 0.5, 
          fontSize: '0.7rem', 
          textAlign: 'center',
          fontWeight: ownStory ? 'bold' : 'normal',
          color: ownStory ? '#e91e63' : 'text.secondary'
        }}>
          {ownStory ? 'Your Story' : 'Add Story'}
        </Typography>
      </Box>

      {/* Friends Stories */}
      {friendsStories.map((user) => {
        const hasNewStories = user.stories.some(isStoryNew);
        return (
          <Box key={user.username} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
            <Tooltip title={`${user.username} - ${user.stories.length} ${user.stories.length === 1 ? 'story' : 'stories'}${hasNewStories ? ' (New!)' : ''}`} arrow>
              <Box sx={{ position: 'relative' }}>
                <StyledAvatar
                  src={user.latest?.metadata?.thumbnail || ''}
                  hasStory={true}
                  isOwn={false}
                  isNew={hasNewStories}
                  onClick={() => { 
                    setViewerStories(user.stories); 
                    setStartIndex(0);
                    setOpenViewer(true); 
                  }}
                >
                  {user.username?.[0]?.toUpperCase()}
                </StyledAvatar>
                {user.stories.length > 1 && (
                  <Chip
                    label={user.stories.length}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      backgroundColor: '#1976d2',
                      color: 'white',
                      fontSize: '0.7rem',
                      height: 20,
                      minWidth: 20
                    }}
                  />
                )}
                {hasNewStories && (
                  <Box sx={{
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                    border: '2px solid white'
                  }} />
                )}
              </Box>
            </Tooltip>
            <Typography variant="caption" sx={{ 
              mt: 0.5, 
              fontSize: '0.7rem', 
              textAlign: 'center', 
              maxWidth: 70, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              fontWeight: hasNewStories ? 'bold' : 'normal',
              color: hasNewStories ? '#1976d2' : 'text.secondary'
            }}>
              {user.username}
            </Typography>
          </Box>
        );
      })}

      <StoryViewer 
        open={openViewer} 
        onClose={() => setOpenViewer(false)} 
        stories={viewerStories} 
        startIndex={startIndex} 
        socket={socket} 
      />
      <StoryComposer open={openComposer} onClose={() => setOpenComposer(false)} onCreated={(story) => setStories(prev => [story, ...prev])} />
    </Box>
  );
}