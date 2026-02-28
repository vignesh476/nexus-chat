import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh, BugReport } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
          <BugReport sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We're sorry for the inconvenience. The application encountered an unexpected error.
          </Typography>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              disabled={this.state.retryCount >= 3}
            >
              {this.state.retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Box>
          
          {this.state.retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Retry attempts: {this.state.retryCount}/3
            </Typography>
          )}
        </Box>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;