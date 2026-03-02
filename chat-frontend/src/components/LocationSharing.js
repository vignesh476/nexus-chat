import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { 
  LocationOn, 
  MyLocation, 
  Share, 
  Close,
  AccessTime,
  Navigation
} from '@mui/icons-material';

const LocationPicker = ({ open, onClose, onShareLocation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveSharing, setLiveSharing] = useState(false);
  const [duration, setDuration] = useState(15);

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    if (open) {
      getCurrentLocation();
    }
  }, [open]);

  const handleShareLocation = () => {
    if (!currentLocation) return;

    const locationData = {
      type: 'location',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      live: liveSharing,
      duration: liveSharing ? duration : null,
      timestamp: new Date().toISOString(),
    };

    onShareLocation(locationData);
    onClose();
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getMapUrl = (lat, lng) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOn sx={{ mr: 1 }} />
          Share Location
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Getting your location...</Typography>
          </Box>
        )}

        {currentLocation && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MyLocation sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Current Location</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Coordinates: {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Accuracy: ±{Math.round(currentLocation.accuracy)}m
            </Typography>

            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(getMapUrl(currentLocation.latitude, currentLocation.longitude), '_blank')}
              startIcon={<Navigation />}
            >
              View on Map
            </Button>
          </Paper>
        )}

        {currentLocation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Note: Live location sharing coming soon
            </Typography>
          </Box>
        )}

        {!loading && !currentLocation && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button
              variant="contained"
              onClick={getCurrentLocation}
              startIcon={<MyLocation />}
            >
              Get Current Location
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleShareLocation}
          disabled={!currentLocation}
          variant="contained"
          startIcon={<Share />}
        >
          Share Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const LocationMessage = ({ location, sender, timestamp }) => {
  const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const isLiveLocation = location.live && location.duration;
  const isExpired = isLiveLocation && new Date() > new Date(new Date(timestamp).getTime() + location.duration * 60000);

  return (
    <Paper
      sx={{
        p: 2,
        maxWidth: 320,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        border: '1px solid #2196f3',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle2">
          {isLiveLocation ? 'Live Location' : 'Location'}
        </Typography>
        {isLiveLocation && (
          <Box sx={{ ml: 'auto' }}>
            {isExpired ? (
              <Typography variant="caption" color="error">
                Expired
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    mr: 0.5,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
                <Typography variant="caption" color="success.main">
                  Live
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Map Preview */}
      <Box
        sx={{
          width: '100%',
          height: 150,
          bgcolor: 'grey.200',
          borderRadius: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
        }}
        onClick={() => window.open(mapUrl, '_blank')}
      >
        <Typography variant="body2" color="text.secondary">
          📍 Map Preview
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {formatCoordinates(location.latitude, location.longitude)}
      </Typography>

      {location.accuracy && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Accuracy: ±{Math.round(location.accuracy)}m
        </Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        size="small"
        onClick={() => window.open(mapUrl, '_blank')}
        startIcon={<Navigation />}
      >
        Open in Maps
      </Button>
    </Paper>
  );
};

export { LocationPicker, LocationMessage };
export default LocationPicker;