const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0'
};

export default config;