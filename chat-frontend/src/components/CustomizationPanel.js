import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  TextField
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { Palette, Brush, TextFields, BorderStyle } from '@mui/icons-material';

const CustomizationPanel = () => {
  const {
    darkMode,
    messageStyle,
    chatBackground,
    primaryColor,
    accentColor,
    fontSize,
    borderRadius,
    toggleDarkMode,
    updateMessageStyle,
    updateChatBackground,
    updatePrimaryColor,
    updateAccentColor,
    updateFontSize,
    updateBorderRadius
  } = useTheme();

  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
  const [tempAccentColor, setTempAccentColor] = useState(accentColor);

  const presetColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fa709a', '#fee140', '#a8edea', '#fed6e3',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'
  ];

  const handleColorPreset = (color, type) => {
    if (type === 'primary') {
      setTempPrimaryColor(color);
      updatePrimaryColor(color);
    } else {
      setTempAccentColor(color);
      updateAccentColor(color);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Palette sx={{ mr: 1 }} />
        Advanced Customization
      </Typography>

      {/* Theme Toggle */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={toggleDarkMode} />}
          label="Dark Mode"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Color Customization */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Brush sx={{ mr: 1 }} />
        Colors
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Primary Color</Typography>
          <TextField
            type="color"
            value={tempPrimaryColor}
            onChange={(e) => {
              setTempPrimaryColor(e.target.value);
              updatePrimaryColor(e.target.value);
            }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {presetColors.slice(0, 8).map(color => (
              <Box
                key={color}
                onClick={() => handleColorPreset(color, 'primary')}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: tempPrimaryColor === color ? '3px solid #000' : '1px solid #ccc'
                }}
              />
            ))}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Accent Color</Typography>
          <TextField
            type="color"
            value={tempAccentColor}
            onChange={(e) => {
              setTempAccentColor(e.target.value);
              updateAccentColor(e.target.value);
            }}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {presetColors.slice(8).map(color => (
              <Box
                key={color}
                onClick={() => handleColorPreset(color, 'accent')}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: tempAccentColor === color ? '3px solid #000' : '1px solid #ccc'
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Message Style */}
      <Typography variant="h6" gutterBottom>Message Style</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Style</InputLabel>
        <Select value={messageStyle} onChange={(e) => updateMessageStyle(e.target.value)}>
          <MenuItem value="bubble">Bubble (Modern)</MenuItem>
          <MenuItem value="box">Box (Classic)</MenuItem>
          <MenuItem value="minimal">Minimal</MenuItem>
        </Select>
      </FormControl>

      {/* Background */}
      <Typography variant="h6" gutterBottom>Chat Background</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Background</InputLabel>
        <Select value={chatBackground} onChange={(e) => updateChatBackground(e.target.value)}>
          <MenuItem value="default">Default</MenuItem>
          <MenuItem value="gradient">Gradient</MenuItem>
          <MenuItem value="dark">Dark Pattern</MenuItem>
          <MenuItem value="colorful">Colorful</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* Typography */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <TextFields sx={{ mr: 1 }} />
        Typography
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Font Size</Typography>
          <FormControl fullWidth>
            <Select value={fontSize} onChange={(e) => updateFontSize(e.target.value)}>
              <MenuItem value="small">Small (14px)</MenuItem>
              <MenuItem value="medium">Medium (16px)</MenuItem>
              <MenuItem value="large">Large (18px)</MenuItem>
              <MenuItem value="xlarge">Extra Large (20px)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BorderStyle sx={{ mr: 1 }} />
            Border Radius
          </Typography>
          <FormControl fullWidth>
            <Select value={borderRadius} onChange={(e) => updateBorderRadius(e.target.value)}>
              <MenuItem value="none">None (0px)</MenuItem>
              <MenuItem value="small">Small (8px)</MenuItem>
              <MenuItem value="medium">Medium (16px)</MenuItem>
              <MenuItem value="large">Large (24px)</MenuItem>
              <MenuItem value="round">Round (50px)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Preview */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom>Preview</Typography>
      <Box sx={{ 
        p: 2, 
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
        borderRadius: borderRadius === 'none' ? 0 : borderRadius === 'small' ? 1 : borderRadius === 'large' ? 3 : borderRadius === 'round' ? 6 : 2,
        color: 'white',
        mb: 2
      }}>
        <Typography sx={{ fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px' }}>
          This is how your messages will look!
        </Typography>
      </Box>
      
      <Box sx={{ 
        p: 2, 
        background: darkMode ? '#2f2f2f' : '#ffffff',
        borderRadius: borderRadius === 'none' ? 0 : borderRadius === 'small' ? 1 : borderRadius === 'large' ? 3 : borderRadius === 'round' ? 6 : 2,
        color: darkMode ? 'white' : 'black',
        border: `1px solid ${darkMode ? '#555' : '#e0e0e0'}`
      }}>
        <Typography sx={{ fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px' }}>
          This is how received messages will look!
        </Typography>
      </Box>
    </Paper>
  );
};

export default CustomizationPanel;