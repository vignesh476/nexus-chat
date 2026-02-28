import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Popover,
  Paper,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Reply,
  Schedule,
  Favorite,
  FavoriteBorder,
  Search,
} from '@mui/icons-material';

const MessageTemplates = ({ open, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('messageTemplates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      // Default templates
      const defaultTemplates = [
        { id: '1', title: 'Thanks', text: 'Thank you!', favorite: false, usage: 0 },
        { id: '2', title: 'Meeting', text: 'Let\'s schedule a meeting to discuss this.', favorite: false, usage: 0 },
        { id: '3', title: 'On my way', text: 'I\'m on my way, will be there in 10 minutes.', favorite: false, usage: 0 },
        { id: '4', title: 'Good morning', text: 'Good morning! Hope you have a great day!', favorite: false, usage: 0 },
        { id: '5', title: 'Running late', text: 'Sorry, I\'m running a bit late. Will be there soon!', favorite: false, usage: 0 },
      ];
      setTemplates(defaultTemplates);
      saveTemplates(defaultTemplates);
    }
  };

  const saveTemplates = (templatesData) => {
    localStorage.setItem('messageTemplates', JSON.stringify(templatesData));
  };

  const addTemplate = () => {
    if (!newTitle.trim() || !newText.trim()) return;
    
    const newTemplate = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      text: newText.trim(),
      favorite: false,
      usage: 0,
      created: new Date().toISOString(),
    };
    
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
    
    setNewTitle('');
    setNewText('');
    setShowAddForm(false);
  };

  const editTemplate = (id) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setEditingId(id);
      setEditTitle(template.title);
      setEditText(template.text);
    }
  };

  const saveEdit = () => {
    if (!editTitle.trim() || !editText.trim()) return;
    
    const updated = templates.map(t => 
      t.id === editingId 
        ? { ...t, title: editTitle.trim(), text: editText.trim() }
        : t
    );
    
    setTemplates(updated);
    saveTemplates(updated);
    setEditingId(null);
    setEditTitle('');
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditText('');
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const toggleFavorite = (id) => {
    const updated = templates.map(t => 
      t.id === id ? { ...t, favorite: !t.favorite } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleTemplateSelect = (template) => {
    const updated = templates.map(t => 
      t.id === template.id ? { ...t, usage: (t.usage || 0) + 1 } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
    
    onSelectTemplate(template.text);
    onClose();
  };

  const filteredTemplates = templates
    .filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by favorite first, then by usage
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return (b.usage || 0) - (a.usage || 0);
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Reply sx={{ mr: 1 }} />
          Message Templates
        </Box>
        <Button
          startIcon={<Add />}
          onClick={() => setShowAddForm(true)}
          variant="contained"
          size="small"
        >
          Add Template
        </Button>
      </DialogTitle>
      
      <DialogContent>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Add Form */}
        {showAddForm && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Add New Template</Typography>
            <TextField
              fullWidth
              label="Template Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Template Text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={addTemplate}
                variant="contained"
                size="small"
                startIcon={<Save />}
                disabled={!newTitle.trim() || !newText.trim()}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle('');
                  setNewText('');
                }}
                size="small"
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        )}

        {/* Templates List */}
        <List>
          {filteredTemplates.map((template) => (
            <ListItem
              key={template.id}
              sx={{
                borderRadius: 2,
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {editingId === template.id ? (
                <Box sx={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    sx={{ mb: 1 }}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: 1 }}
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={saveEdit} size="small" startIcon={<Save />}>
                      Save
                    </Button>
                    <Button onClick={cancelEdit} size="small" startIcon={<Cancel />}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{template.title}</Typography>
                        {template.favorite && (
                          <Favorite sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        {template.usage > 0 && (
                          <Chip
                            label={`${template.usage} uses`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        {template.text}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title={template.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                        <IconButton
                          onClick={() => toggleFavorite(template.id)}
                          size="small"
                        >
                          {template.favorite ? <Favorite color="error" /> : <FavoriteBorder />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit template">
                        <IconButton
                          onClick={() => editTemplate(template.id)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete template">
                        <IconButton
                          onClick={() => deleteTemplate(template.id)}
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </>
              )}
            </ListItem>
          ))}
          
          {filteredTemplates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {searchQuery ? 'No templates found' : 'No templates yet'}
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const QuickTemplates = ({ anchorEl, open, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('messageTemplates');
    if (saved) {
      const allTemplates = JSON.parse(saved);
      // Show only favorites and most used
      const quickTemplates = allTemplates
        .filter(t => t.favorite || (t.usage || 0) > 2)
        .sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return (b.usage || 0) - (a.usage || 0);
        })
        .slice(0, 6);
      setTemplates(quickTemplates);
    }
  }, [open]);

  const handleTemplateSelect = (template) => {
    // Update usage count
    const saved = localStorage.getItem('messageTemplates');
    if (saved) {
      const allTemplates = JSON.parse(saved);
      const updated = allTemplates.map(t => 
        t.id === template.id ? { ...t, usage: (t.usage || 0) + 1 } : t
      );
      localStorage.setItem('messageTemplates', JSON.stringify(updated));
    }
    
    onSelectTemplate(template.text);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Paper sx={{ p: 2, minWidth: 250, maxWidth: 350 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Quick Templates</Typography>
        
        {templates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No quick templates available
          </Typography>
        ) : (
          <Grid container spacing={1}>
            {templates.map((template) => (
              <Grid item xs={12} key={template.id}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => handleTemplateSelect(template)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    textTransform: 'none',
                  }}
                >
                  <Box>
                    <Typography variant="caption" display="block">
                      {template.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                      }}
                    >
                      {template.text}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Popover>
  );
};

export { MessageTemplates, QuickTemplates };
export default MessageTemplates;