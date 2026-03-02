// Configuration for API URLs - supports both local development and production (Vercel)
// Environment variables:
// - REACT_APP_API_URL: Backend API URL
// - REACT_APP_SOCKET_URL: WebSocket URL
// - REACT_APP_ENVIRONMENT: 'development' or 'production'

const getApiUrl = () => {
  // Check for environment variable
  const envUrl = process.env.REACT_APP_API_URL;
  
  if (envUrl) {
    return envUrl.replace(/\/+$/, ''); // Remove trailing slashes
  }
  
  // Fallback for local development
  // Check if we're running on localhost
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // If running on same host, use relative path
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  
  return 'http://localhost:8000';
};

const getSocketUrl = () => {
  // Check for environment variable
  const envUrl = process.env.REACT_APP_SOCKET_URL;
  
  if (envUrl) {
    return envUrl.replace(/\/+$/, ''); // Remove trailing slashes
  }
  
  // Fallback to API_URL
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
