import React, { useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  IconButton,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import Undo from '@mui/icons-material/Undo';
import Redo from '@mui/icons-material/Redo';
import Brush from '@mui/icons-material/Brush';
import Clear from '@mui/icons-material/Clear';
import Save from '@mui/icons-material/Save';
import Close from '@mui/icons-material/Close';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
];

const BACKGROUND_COLORS = [
  '#FFFFFF', // White
  '#F5F5F5', // Light Gray
  '#000000', // Black
  '#FFF8DC', // Cream
  '#E6E6FA', // Lavender
  '#F0E68C', // Khaki
];

export default function DrawingPad({ open, onClose, onSave, socket, room, user }) {
  const canvasRef = useRef(null);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [eraserMode, setEraserMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [error, setError] = useState(null);

  const debounceRef = React.useRef(null);

  // Send current paths to server (debounced)
  const sendPaths = useCallback(async () => {
    if (!canvasRef.current || !socket || !room) return;
    try {
      const paths = await canvasRef.current.exportPaths();
      socket.emit('drawing_event', { room_id: room.id, sender: user?.username, action: 'paths', payload: { paths } });
    } catch (e) {
      console.warn('Failed to export paths', e);
    }
  }, [socket, room, user]);

  const updateUndoRedoState = useCallback(async () => {
    if (canvasRef.current) {
      const paths = await canvasRef.current.exportPaths();
      setCanUndo(paths.length > 0);
      // Debounced send to server
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        sendPaths();
      }, 500);
    }
  }, [sendPaths]);

  // Listen for incoming drawing events (paths/clear/sync)
  React.useEffect(() => {
    if (!socket || !room) return;
    const handler = (ev) => {
      try {
        if (ev.room_id !== room.id) return;
        const action = ev.action;
        const payload = ev.payload || {};
        if (action === 'paths' && payload.paths && canvasRef.current?.importPaths) {
          canvasRef.current.importPaths(payload.paths);
          updateUndoRedoState();
        } else if (action === 'clear' && canvasRef.current?.clearCanvas) {
          canvasRef.current.clearCanvas();
          updateUndoRedoState();
        } else if (action === 'sync' && payload.image) {
          setBackgroundImage(payload.image);
        }
      } catch (e) {
        console.warn('Error applying drawing event', e);
      }
    };
    socket.on('drawing_event', handler);
    return () => {
      socket.off('drawing_event', handler);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [socket, room, updateUndoRedoState]);


  const handleStrokeChange = (event, newValue) => {
    setStrokeWidth(newValue);
  };

  const handleColorSelect = useCallback((color) => {
    setStrokeColor(color);
    setEraserMode(false);
  }, []);

  const handleBackgroundColorSelect = useCallback((color) => {
    setBackgroundColor(color);
  }, []);

  const handleEraserToggle = () => {
    setEraserMode(!eraserMode);
  };

  const handleUndo = useCallback(async () => {
    if (canvasRef.current) {
      await canvasRef.current.undo();
      updateUndoRedoState();
    }
  }, [updateUndoRedoState]);

  const handleRedo = useCallback(async () => {
    if (canvasRef.current) {
      await canvasRef.current.redo();
      updateUndoRedoState();
    }
  }, [updateUndoRedoState]);

  const handleClear = useCallback(async () => {
    if (canvasRef.current) {
      await canvasRef.current.clearCanvas();
      updateUndoRedoState();
    }
  }, [updateUndoRedoState]);

  const handleSync = useCallback(async () => {
    try {
      if (!canvasRef.current) return;
      const image = await canvasRef.current.exportImage('png');
      // send sync to server
      if (socket && room) socket.emit('drawing_event', { room_id: room.id, sender: user?.username, action: 'sync', payload: { image } });
      // optionally keep local background
      setBackgroundImage(image);
    } catch (e) {
      console.warn('Sync failed', e);
    }
  }, [socket, room, user]);

  const handleSave = useCallback(async () => {
    if (canvasRef.current) {
      try {
        const imageData = await canvasRef.current.exportImage('png');
        const response = await fetch(imageData);
        const blob = await response.blob();
        onSave(blob);
      } catch (error) {
        console.error('Error exporting drawing:', error);
        setError('Failed to save drawing');
      }
    }
  }, [onSave]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: '800px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Drawing Pad</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Tools */}
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Brush Size */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Brush Size: {strokeWidth}px
              </Typography>
              <Slider
                value={strokeWidth}
                onChange={handleStrokeChange}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                size="small"
              />
            </Grid>

            {/* Eraser Toggle */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={eraserMode}
                    onChange={handleEraserToggle}
                    color="primary"
                  />
                }
                label="Eraser"
              />
            </Grid>

            {/* Undo/Redo/Clear */}
            <Grid item xs={12} sm={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <IconButton onClick={handleUndo} disabled={!canUndo} size="small">
                  <Undo />
                </IconButton>
                <IconButton onClick={handleRedo} disabled={!canRedo} size="small">
                  <Redo />
                </IconButton>
                <IconButton onClick={handleClear} size="small">
                  <Clear />
                </IconButton>
                <Button size="small" onClick={handleSync}>Sync</Button>
              </Box>
            </Grid>
          </Grid>

          {/* Colors */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Colors
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {COLORS.map((color) => {
                const handleClick = () => handleColorSelect(color);
                return (
                  <IconButton
                    key={color}
                    onClick={handleClick}
                    sx={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      backgroundColor: color,
                      border: strokeColor === color ? '2px solid #1976d2' : '2px solid transparent',
                      '&:hover': {
                        border: '2px solid #1976d2',
                      },
                    }}
                  >
                    {strokeColor === color && <Brush sx={{ color: color === '#FFFFFF' ? '#000' : '#fff', fontSize: 16 }} />}
                  </IconButton>
                );
              })}
            </Box>
          </Box>

          {/* Background Colors */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Background
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {BACKGROUND_COLORS.map((color) => {
                const handleClick = () => handleBackgroundColorSelect(color);
                return (
                  <IconButton
                    key={color}
                    onClick={handleClick}
                    sx={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      backgroundColor: color,
                      border: backgroundColor === color ? '2px solid #1976d2' : '2px solid #ccc',
                      '&:hover': {
                        border: '2px solid #1976d2',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </Paper>

        {/* Canvas */}
        <Box sx={{ flex: 1, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
          {backgroundImage && (
            <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${backgroundImage})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', opacity: 0.8 }} />
          )}
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={strokeWidth}
            strokeColor={eraserMode ? backgroundColor : strokeColor}
            canvasColor={backgroundColor}
            width="100%"
            height="400px"
            onChange={updateUndoRedoState}
            style={{ border: 'none', position: 'relative' }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
          Save Drawing
        </Button>
      </DialogActions>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
