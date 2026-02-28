import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  Translate,
  Language,
  AutoAwesome,
  Settings,
  Check,
} from '@mui/icons-material';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

const TranslationSettings = ({ open, onClose, settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState({
    autoTranslate: false,
    targetLanguage: 'en',
    showOriginal: true,
    detectLanguage: true,
    ...settings,
  });

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <Language sx={{ mr: 1 }} />
        Translation Settings
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Translation is powered by Google Translate API. Some messages may not translate perfectly.
        </Alert>

        <FormControlLabel
          control={
            <Switch
              checked={localSettings.autoTranslate}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, autoTranslate: e.target.checked }))}
            />
          }
          label="Auto-translate messages"
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Target Language</InputLabel>
          <Select
            value={localSettings.targetLanguage}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, targetLanguage: e.target.value }))}
            label="Target Language"
          >
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={localSettings.showOriginal}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, showOriginal: e.target.checked }))}
            />
          }
          label="Show original text"
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={localSettings.detectLanguage}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, detectLanguage: e.target.checked }))}
            />
          }
          label="Auto-detect language"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MessageTranslation = ({ message, settings }) => {
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const translateMessage = async (text, targetLang = settings.targetLanguage) => {
    if (!text || !text.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock translation API call - replace with actual service
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          target: targetLang,
          source: settings.detectLanguage ? 'auto' : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslation(data.translatedText);
      setDetectedLanguage(data.detectedLanguage);
      setShowTranslation(true);
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation failed');
      
      // Fallback to mock translation for demo
      const mockTranslation = `[Translated from ${detectedLanguage || 'auto'}] ${text}`;
      setTranslation(mockTranslation);
      setShowTranslation(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (settings.autoTranslate && message?.content && !message.isTranslated) {
      translateMessage(message.content);
    }
  }, [message, settings.autoTranslate]);

  const getLanguageInfo = (langCode) => {
    return languages.find(lang => lang.code === langCode) || { name: langCode, flag: '🌐' };
  };

  const needsTranslation = () => {
    if (!message?.content) return false;
    if (message.isTranslated) return false;
    
    // Simple language detection (in real app, use proper detection)
    const hasNonLatin = /[^\u0000-\u007F]/.test(message.content);
    const targetLang = getLanguageInfo(settings.targetLanguage);
    
    return hasNonLatin || (detectedLanguage && detectedLanguage !== settings.targetLanguage);
  };

  if (!message?.content || message.isTranslated) return null;

  return (
    <Box sx={{ mt: 1 }}>
      {!showTranslation && needsTranslation() && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Translate message">
            <IconButton
              size="small"
              onClick={() => translateMessage(message.content)}
              disabled={loading}
              sx={{ 
                color: 'primary.main',
                '&:hover': { backgroundColor: 'primary.light' },
              }}
            >
              <Translate sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          
          {detectedLanguage && (
            <Chip
              label={getLanguageInfo(detectedLanguage).name}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>
      )}

      {showTranslation && translation && (
        <Box sx={{ 
          mt: 1, 
          p: 1.5, 
          bgcolor: 'action.hover', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Translate sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography variant="caption" color="primary.main">
                Translated to {getLanguageInfo(settings.targetLanguage).name}
              </Typography>
              {detectedLanguage && (
                <Chip
                  label={`from ${getLanguageInfo(detectedLanguage).name}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: 18 }}
                />
              )}
            </Box>
            
            <IconButton
              size="small"
              onClick={() => setShowTranslation(false)}
              sx={{ color: 'text.secondary' }}
            >
              <Check sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
          
          <Typography variant="body2" sx={{ mb: settings.showOriginal ? 1 : 0 }}>
            {translation}
          </Typography>
          
          {settings.showOriginal && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontStyle: 'italic',
                display: 'block',
                borderTop: '1px solid',
                borderColor: 'divider',
                pt: 1,
              }}
            >
              Original: {message.content}
            </Typography>
          )}
        </Box>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

const TranslationButton = ({ onOpenSettings, settings }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Translation">
        <IconButton onClick={handleClick} size="small">
          <Language />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => { onOpenSettings(); handleClose(); }}>
          <Settings sx={{ mr: 1 }} />
          Translation Settings
        </MenuItem>
        
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              Auto-translate: {settings.autoTranslate ? 'On' : 'Off'}
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>{languages.find(l => l.code === settings.targetLanguage)?.flag}</span>
            <Typography variant="body2">
              Target: {languages.find(l => l.code === settings.targetLanguage)?.name}
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};

const useTranslation = () => {
  const [settings, setSettings] = useState({
    autoTranslate: false,
    targetLanguage: 'en',
    showOriginal: true,
    detectLanguage: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('translationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('translationSettings', JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSettings,
  };
};

export { 
  TranslationSettings, 
  MessageTranslation, 
  TranslationButton, 
  useTranslation 
};

export default MessageTranslation;