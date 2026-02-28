import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Navigation from '../components/Navigation';
import { useTheme } from '../context/ThemeContext';
import { modernTheme, darkModernTheme } from '../styles/modernTheme';

const MainLayout = ({ children }) => {
  const { darkMode } = useTheme() || {};
  const theme = darkMode ? darkModernTheme : modernTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ 
        display: 'flex', 
        height: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <Navigation />
        <main style={{ 
          flexGrow: 1, 
          padding: 0, 
          overflow: 'auto',
          position: 'relative'
        }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default MainLayout;
