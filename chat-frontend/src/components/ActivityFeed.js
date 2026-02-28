import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Person,
  Message,
  Call,
  Videocam,
  Games,
  Photo,
  LocationOn,
  Favorite,
  Group,
  Settings,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityFeed = ({ user, socket }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [settings, setSettings] = useState({
    showMessages: true,
    showCalls: true,
    showGames: true,
    showMedia: true,
    showLocation: true,
    showFriends: true,
    showGroups: true,
  });

  const activityTypes = [
    { value: 'all', label: 'All Activities', icon: null },
    { value: 'messages', label: 'Messages', icon: <Message /> },
    { value: 'calls', label: 'Calls', icon: <Call /> },
    { value: 'games', label: 'Games', icon: <Games /> },
    { value: 'media', label: 'Media', icon: <Photo /> },
    { value: 'social', label: 'Social', icon: <Person /> },
  ];

  useEffect(() => {
    loadActivities();
    
    if (socket) {
      socket.on('activity_update', handleActivityUpdate);
      return () => socket.off('activity_update', handleActivityUpdate);
    }
  }, [socket]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Mock activities - replace with actual API call
      const mockActivities = [
        {
          id: '1',
          type: 'message',
          user: 'alice',
          avatar: null,
          action: 'sent a message',
          target: 'General Chat',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          content: 'Hey everyone! How\'s it going?',
          metadata: { room: 'general', messageCount: 1 }
        },
        {
          id: '2',
          type: 'call',
          user: 'bob',
          avatar: null,
          action: 'had a video call',
          target: 'alice',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          content: null,
          metadata: { duration: 1200, type: 'video' }
        },
        {
          id: '3',
          type: 'game',
          user: 'charlie',
          avatar: null,
          action: 'won a game of',
          target: 'Tic-Tac-Toe',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          content: null,
          metadata: { opponent: 'diana', score: '3-1' }
        },
        {
          id: '4',
          type: 'media',
          user: 'diana',
          avatar: null,
          action: 'shared a photo',
          target: 'Travel Photos',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          content: null,
          metadata: { mediaType: 'image', likes: 5 }
        },
        {
          id: '5',
          type: 'location',
          user: 'eve',
          avatar: null,
          action: 'shared location',
          target: 'Central Park',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          content: null,
          metadata: { live: true, accuracy: 10 }
        },
        {
          id: '6',
          type: 'friend',
          user: 'frank',
          avatar: null,
          action: 'became friends with',
          target: 'grace',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          content: null,
          metadata: { mutualFriends: 3 }
        },
        {
          id: '7',
          type: 'group',
          user: 'grace',
          avatar: null,
          action: 'created a group',\n          target: 'Weekend Plans',\n          timestamp: new Date(Date.now() - 7200000).toISOString(),\n          content: null,\n          metadata: { members: 5 }\n        },\n      ];\n      \n      setActivities(mockActivities);\n    } catch (error) {\n      console.error('Failed to load activities:', error);\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  const handleActivityUpdate = (activity) => {\n    setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities\n  };\n\n  const getActivityIcon = (type, metadata = {}) => {\n    switch (type) {\n      case 'message':\n        return <Message sx={{ color: 'primary.main' }} />;\n      case 'call':\n        return metadata.type === 'video' \n          ? <Videocam sx={{ color: 'success.main' }} />\n          : <Call sx={{ color: 'info.main' }} />;\n      case 'game':\n        return <Games sx={{ color: 'warning.main' }} />;\n      case 'media':\n        return <Photo sx={{ color: 'secondary.main' }} />;\n      case 'location':\n        return <LocationOn sx={{ color: 'error.main' }} />;\n      case 'friend':\n        return <Person sx={{ color: 'success.main' }} />;\n      case 'group':\n        return <Group sx={{ color: 'info.main' }} />;\n      default:\n        return <Message sx={{ color: 'text.secondary' }} />;\n    }\n  };\n\n  const formatTimestamp = (timestamp) => {\n    const now = new Date();\n    const time = new Date(timestamp);\n    const diffMs = now - time;\n    const diffMins = Math.floor(diffMs / 60000);\n    const diffHours = Math.floor(diffMins / 60);\n    const diffDays = Math.floor(diffHours / 24);\n\n    if (diffMins < 1) return 'Just now';\n    if (diffMins < 60) return `${diffMins}m ago`;\n    if (diffHours < 24) return `${diffHours}h ago`;\n    if (diffDays < 7) return `${diffDays}d ago`;\n    return time.toLocaleDateString();\n  };\n\n  const getActivityDescription = (activity) => {\n    const { type, action, target, metadata = {} } = activity;\n    \n    switch (type) {\n      case 'call':\n        const duration = metadata.duration ? ` (${Math.floor(metadata.duration / 60)}m ${metadata.duration % 60}s)` : '';\n        return `${action} with ${target}${duration}`;\n      case 'game':\n        const score = metadata.score ? ` - Score: ${metadata.score}` : '';\n        return `${action} ${target} against ${metadata.opponent}${score}`;\n      case 'media':\n        const likes = metadata.likes ? ` (${metadata.likes} likes)` : '';\n        return `${action} in ${target}${likes}`;\n      case 'location':\n        const live = metadata.live ? ' (Live)' : '';\n        return `${action} at ${target}${live}`;\n      case 'friend':\n        const mutual = metadata.mutualFriends ? ` (${metadata.mutualFriends} mutual friends)` : '';\n        return `${action} ${target}${mutual}`;\n      case 'group':\n        const members = metadata.members ? ` (${metadata.members} members)` : '';\n        return `${action} \"${target}\"${members}`;\n      default:\n        return `${action} ${target}`;\n    }\n  };\n\n  const filteredActivities = activities.filter(activity => {\n    if (filter === 'all') return true;\n    \n    const typeMap = {\n      messages: ['message'],\n      calls: ['call'],\n      games: ['game'],\n      media: ['media'],\n      social: ['friend', 'group', 'location'],\n    };\n    \n    return typeMap[filter]?.includes(activity.type);\n  }).filter(activity => {\n    // Apply settings filter\n    const settingsMap = {\n      message: settings.showMessages,\n      call: settings.showCalls,\n      game: settings.showGames,\n      media: settings.showMedia,\n      location: settings.showLocation,\n      friend: settings.showFriends,\n      group: settings.showGroups,\n    };\n    \n    return settingsMap[activity.type] !== false;\n  });\n\n  return (\n    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>\n      {/* Header */}\n      <Box sx={{ \n        p: 2, \n        borderBottom: '1px solid', \n        borderColor: 'divider',\n        display: 'flex',\n        alignItems: 'center',\n        justifyContent: 'space-between'\n      }}>\n        <Typography variant=\"h6\" sx={{ display: 'flex', alignItems: 'center' }}>\n          <Favorite sx={{ mr: 1, color: 'primary.main' }} />\n          Activity Feed\n        </Typography>\n        \n        <Box sx={{ display: 'flex', gap: 1 }}>\n          <Tooltip title=\"Refresh\">\n            <IconButton onClick={loadActivities} disabled={loading}>\n              <Refresh />\n            </IconButton>\n          </Tooltip>\n          \n          <Tooltip title=\"Filter\">\n            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>\n              <FilterList />\n            </IconButton>\n          </Tooltip>\n        </Box>\n      </Box>\n\n      {/* Filter Chips */}\n      <Box sx={{ p: 2, pb: 1 }}>\n        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>\n          {activityTypes.map((type) => (\n            <Chip\n              key={type.value}\n              label={type.label}\n              onClick={() => setFilter(type.value)}\n              color={filter === type.value ? 'primary' : 'default'}\n              variant={filter === type.value ? 'filled' : 'outlined'}\n              size=\"small\"\n              icon={type.icon}\n            />\n          ))}\n        </Box>\n      </Box>\n\n      {/* Activities List */}\n      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>\n        <List sx={{ p: 0 }}>\n          <AnimatePresence>\n            {filteredActivities.map((activity, index) => (\n              <motion.div\n                key={activity.id}\n                initial={{ opacity: 0, y: 20 }}\n                animate={{ opacity: 1, y: 0 }}\n                exit={{ opacity: 0, y: -20 }}\n                transition={{ delay: index * 0.05 }}\n              >\n                <ListItem sx={{ py: 1.5 }}>\n                  <ListItemAvatar>\n                    <Avatar src={activity.avatar}>\n                      {activity.user.charAt(0).toUpperCase()}\n                    </Avatar>\n                  </ListItemAvatar>\n                  \n                  <ListItemText\n                    primary={\n                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>\n                        <Typography variant=\"body2\" sx={{ fontWeight: 'medium' }}>\n                          {activity.user}\n                        </Typography>\n                        {getActivityIcon(activity.type, activity.metadata)}\n                        <Typography variant=\"caption\" color=\"text.secondary\">\n                          {formatTimestamp(activity.timestamp)}\n                        </Typography>\n                      </Box>\n                    }\n                    secondary={\n                      <Typography variant=\"body2\" color=\"text.secondary\">\n                        {getActivityDescription(activity)}\n                      </Typography>\n                    }\n                  />\n                </ListItem>\n                \n                {index < filteredActivities.length - 1 && (\n                  <Divider variant=\"inset\" component=\"li\" />\n                )}\n              </motion.div>\n            ))}\n          </AnimatePresence>\n          \n          {filteredActivities.length === 0 && (\n            <Box sx={{ textAlign: 'center', py: 4 }}>\n              <Typography color=\"text.secondary\">\n                {filter === 'all' ? 'No recent activities' : `No ${filter} activities`}\n              </Typography>\n            </Box>\n          )}\n        </List>\n      </Box>\n\n      {/* Filter Menu */}\n      <Menu\n        anchorEl={anchorEl}\n        open={Boolean(anchorEl)}\n        onClose={() => setAnchorEl(null)}\n      >\n        <MenuItem onClick={() => setSettings(prev => ({ ...prev, showMessages: !prev.showMessages }))}>\n          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>\n            {settings.showMessages ? <Visibility /> : <VisibilityOff />}\n            Messages\n          </Box>\n        </MenuItem>\n        \n        <MenuItem onClick={() => setSettings(prev => ({ ...prev, showCalls: !prev.showCalls }))}>\n          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>\n            {settings.showCalls ? <Visibility /> : <VisibilityOff />}\n            Calls\n          </Box>\n        </MenuItem>\n        \n        <MenuItem onClick={() => setSettings(prev => ({ ...prev, showGames: !prev.showGames }))}>\n          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>\n            {settings.showGames ? <Visibility /> : <VisibilityOff />}\n            Games\n          </Box>\n        </MenuItem>\n        \n        <MenuItem onClick={() => setSettings(prev => ({ ...prev, showMedia: !prev.showMedia }))}>\n          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>\n            {settings.showMedia ? <Visibility /> : <VisibilityOff />}\n            Media\n          </Box>\n        </MenuItem>\n        \n        <MenuItem onClick={() => setSettings(prev => ({ ...prev, showFriends: !prev.showFriends }))}>\n          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>\n            {settings.showFriends ? <Visibility /> : <VisibilityOff />}\n            Friends\n          </Box>\n        </MenuItem>\n      </Menu>\n    </Paper>\n  );\n};\n\nexport default ActivityFeed;