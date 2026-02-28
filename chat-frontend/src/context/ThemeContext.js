import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [messageStyle, setMessageStyle] = useState(() => localStorage.getItem('messageStyle') || 'bubble');
  const [chatBackground, setChatBackground] = useState(() => localStorage.getItem('chatBackground') || 'default');
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('primaryColor') || '#667eea');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#764ba2');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');
  const [borderRadius, setBorderRadius] = useState(() => localStorage.getItem('borderRadius') || 'medium');
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('animationsEnabled') !== 'false');

  // Debounced localStorage updates
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('darkMode', darkMode);
      localStorage.setItem('messageStyle', messageStyle);
      localStorage.setItem('chatBackground', chatBackground);
      localStorage.setItem('primaryColor', primaryColor);
      localStorage.setItem('accentColor', accentColor);
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('borderRadius', borderRadius);
      localStorage.setItem('animationsEnabled', animationsEnabled);
      
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--accent-color', accentColor);
      document.documentElement.style.setProperty('--font-size', getFontSizeValue());
      document.documentElement.style.setProperty('--border-radius', getBorderRadiusValue());
    }, 100);
    
    return () => clearTimeout(timer);
  }, [darkMode, messageStyle, chatBackground, primaryColor, accentColor, fontSize, borderRadius, animationsEnabled]);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);
  const updateMessageStyle = useCallback((style) => setMessageStyle(style), []);
  const updateChatBackground = useCallback((bg) => setChatBackground(bg), []);
  const updatePrimaryColor = useCallback((color) => setPrimaryColor(color), []);
  const updateAccentColor = useCallback((color) => setAccentColor(color), []);
  const updateFontSize = useCallback((size) => setFontSize(size), []);
  const updateBorderRadius = useCallback((radius) => setBorderRadius(radius), []);

  const getBackgroundStyle = useMemo(() => () => {
    const backgrounds = {
      default: darkMode ? '#121212' : '#f5f5f5',
      gradient: `linear-gradient(135deg, ${primaryColor}20 0%, ${accentColor}20 100%)`,
      dark: darkMode ? '#0a0a0a' : '#e0e0e0',
      colorful: `linear-gradient(45deg, ${primaryColor}15, ${accentColor}15, #ff6b6b15, #4ecdc415)`,
      custom: `linear-gradient(135deg, ${primaryColor}10 0%, ${accentColor}10 100%)`
    };
    return backgrounds[chatBackground] || backgrounds.default;
  }, [darkMode, primaryColor, accentColor, chatBackground]);

  const getFontSizeValue = useCallback(() => {
    const sizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
    return sizes[fontSize] || sizes.medium;
  }, [fontSize]);

  const getBorderRadiusValue = useCallback(() => {
    const radii = { none: '0px', small: '8px', medium: '16px', large: '24px', round: '50px' };
    return radii[borderRadius] || radii.medium;
  }, [borderRadius]);

  const getMessageBubbleStyle = useCallback((isOwn, msg) => {
    const baseStyle = {
      background: isOwn 
        ? `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`
        : darkMode ? '#2f2f2f' : '#ffffff',
      borderRadius: getBorderRadiusValue(),
      fontSize: getFontSizeValue(),
      transition: animationsEnabled ? 'all 0.3s ease' : 'none'
    };

    if (msg?.content?.includes('?')) {
      baseStyle.background = `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`;
      baseStyle.borderRadius = '25px 25px 5px 25px';
    }
    if (msg?.content?.includes('!')) {
      baseStyle.background = `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`;
      if (animationsEnabled) baseStyle.animation = 'pulse 2s infinite';
    }
    if (msg?.message_type === 'game' || msg?.game_type) {
      baseStyle.background = `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`;
      baseStyle.transform = 'scale(1.02)';
      baseStyle.boxShadow = `0 8px 25px ${primaryColor}50`;
    }

    return baseStyle;
  }, [primaryColor, accentColor, darkMode, getBorderRadiusValue, getFontSizeValue, animationsEnabled]);

  const value = useMemo(() => ({
    darkMode, messageStyle, chatBackground, primaryColor, accentColor, fontSize, borderRadius, animationsEnabled,
    toggleDarkMode, updateMessageStyle, updateChatBackground, updatePrimaryColor, updateAccentColor,
    updateFontSize, updateBorderRadius, getBackgroundStyle, getFontSizeValue, getBorderRadiusValue, getMessageBubbleStyle
  }), [darkMode, messageStyle, chatBackground, primaryColor, accentColor, fontSize, borderRadius, animationsEnabled,
       toggleDarkMode, updateMessageStyle, updateChatBackground, updatePrimaryColor, updateAccentColor,
       updateFontSize, updateBorderRadius, getBackgroundStyle, getFontSizeValue, getBorderRadiusValue, getMessageBubbleStyle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};