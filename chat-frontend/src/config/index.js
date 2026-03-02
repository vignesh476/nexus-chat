// Configuration for API URLs - supports both local development and production (Vercel)
// Environment variables:
// - REACT_APP_API_URL: Backend API URL (REQUIRED for production)
// - REACT_APP_SOCKET_URL: WebSocket URL (optional, defaults to API_URL)
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

const getSocketUrl = () => {
  // Check for environment variable
  const envUrl = process.env.REACT_APP_SOCKET_URL;
  
  if (envUrl) {
    return envUrl.replace(/\/+$/, ''); // Remove trailing slashes
  }
  
  // Fallback to API_URL if SOCKET_URL not set
  return getApiUrl();
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
