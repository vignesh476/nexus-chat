import React, { useEffect, useState } from 'react';
import { Box, Avatar, IconButton, Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { getStories } from '../api/stories';
import StoryViewer from './StoryViewer';
import StoryComposer from './StoryComposer';

export default function StoriesSidebar({ compact = true, socket }) {
  const [stories, setStories] = useState([]);
  const [openViewer, setOpenViewer] = useState(false);
  const [viewerStories, setViewerStories] = useState([]);
  const [openComposer, setOpenComposer] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getStories();
        const arr = Array.isArray(res) ? res.filter(Boolean) : [];
        if (mounted) setStories(arr);
      } catch (e) {
        if (mounted) setStories([]);
      }
    };
    load();

    if (!socket) return;
    const handler = (payload) => {
      if (!payload || !payload.event) return;
      if (payload.event === 'story_created') {
        if (payload.story && payload.story._id) {
          setStories(prev => [payload.story, ...prev.filter(s => s && s._id !== payload.story._id)]);
        }
      } else if (payload.event === 'story_deleted') {
        setStories(prev => prev.filter(s => s && s._id !== payload.story_id));
      } else if (payload.event === 'story_interaction') {
        if (payload.story && payload.story._id) {
          setStories(prev => prev.map(s => s && s._id === payload.story._id ? payload.story : s));
        }
      }
    };
    socket.on('story_event', handler);
    return () => { mounted = false; socket.off('story_event', handler); };
  }, [socket]);

  const openUserStories = (username) => {
    if (!username) return;
    const userStories = stories.filter(s => s && s.username === username);
    if (userStories.length === 0) return;
    setViewerStories(userStories);
    setOpenViewer(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1 }}>
      <Tooltip title="Add Story">
        <IconButton size="small" onClick={() => setOpenComposer(true)}>
          <AddCircleOutlineIcon />
        </IconButton>
      </Tooltip>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {stories.slice(0, 6).filter(Boolean).map((s, i) => (
          <Tooltip key={s._id || `story-${i}-${s?.username || 'unknown'}`} title={`${s?.username || 'Unknown'} - ${s?.story_type || ''}`}>
            <Avatar src={s?.metadata?.thumbnail || ''} sx={{ cursor: 'pointer', width: 40, height: 40 }} onClick={() => openUserStories(s?.username)}>
              {s?.username?.[0] || '?'}
            </Avatar>
          </Tooltip>
        ))}
      </Box>

      <StoryViewer 
        open={openViewer} 
        onClose={() => setOpenViewer(false)} 
        stories={viewerStories} 
        startIndex={0} 
        socket={socket} 
      />

      <StoryComposer open={openComposer} onClose={() => setOpenComposer(false)} onCreated={(story) => setStories(prev => [story, ...prev])} />
    </Box>
  );
}