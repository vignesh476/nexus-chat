// Configuration for API URLs - supports both local development and production (Vercel)
// Environment variables:
// - REACT_APP_API_URL: Backend API URL (REQUIRED for production)
// - REACT_APP_SOCKET_URL: WebSocket URL (optional, defaults to API_URL with ws:// protocol)
// - REACT_APP_ENVIRONMENT: 'development' or 'production'

// Default fallback for local development - this should only be used in development
const DEFAULT_LOCAL_API_URL = 'http://localhost:8000';

const getApiUrl = () => {
  // Check for environment variable
  const envUrl = process.env.REACT_APP_API_URL;
  
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, ''); // Remove trailing slashes
    console.log('[Config] Using API URL from environment:', cleanUrl);
    return cleanUrl;
  }
  
  // Development fallback - warn in console
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Config] WARNING: REACT_APP_API_URL not set, using default fallback. This should only be used in local development!');
    console.warn('[Config] For production, please set REACT_APP_API_URL environment variable.');
  }
  
  return DEFAULT_LOCAL_API_URL;
};

// Helper to convert HTTP URL to WebSocket URL
const convertToWebSocketUrl = (url) => {
  if (!url) return url;
  
  // If already ws:// or wss://, return as-is
  if (url.startsWith('ws://') || url.startsWith('wss://')) {
    return url;
  }
  
  // Convert http:// to ws://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }
  
  // Convert https:// to wss://
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }
  
  return url;
};

const getSocketUrl = () => {
  // Check for environment variable
  const envUrl = process.env.REACT_APP_SOCKET_URL;
  
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, ''); // Remove trailing slashes
    console.log('[Config] Using Socket URL from environment:', cleanUrl);
    return cleanUrl;
  }
  
  // Fallback to API_URL but convert HTTP to WebSocket protocol
  const apiUrl = getApiUrl();
  const wsUrl = convertToWebSocketUrl(apiUrl);
  console.log('[Config] Using WebSocket URL derived from API URL:', wsUrl);
  return wsUrl;
};

const config = {
  API_URL: getApiUrl(),
  SOCKET_URL: getSocketUrl(),
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  // Helper to build full URLs for media/files
  getMediaUrl: (path) => {
    const baseUrl = config.API_URL;
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  }
};

export default config;
