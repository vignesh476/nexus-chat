import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Upload,
  Close
} from '@mui/icons-material';
import { useFileUpload } from '../hooks/useFileUpload';
import { usersAPI } from '../api';

const ProfilePictureDialog = ({ 
  open, 
  onClose, 
  currentPicture, 
  onUpdate,
  privacy = 'public',
  onPrivacyChange 
}) => {
  const fileInputRef = useRef(null);
  
  const {
    file,
    preview,
    uploading,
    error,
    handleFileSelect,
    uploadFile,
    reset
  } = useFileUpload({
    onUpload: async (formData) => {
      const response = await usersAPI.uploadProfilePicture(formData);
      onUpdate?.(response.data.profile_picture);
      onClose();
    },
    onError: (error) => console.error('Upload error:', error)
  });

  const handleFileInputChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDeletePicture = async () => {
    try {
      await usersAPI.deleteProfilePicture();
      onUpdate?.(null);
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePrivacyUpdate = async (newPrivacy) => {
    try {
      await usersAPI.updateProfilePicturePrivacy(newPrivacy);
      onPrivacyChange?.(newPrivacy);
    } catch (error) {
      console.error('Privacy update error:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Profile Picture
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {/* Current/Preview Picture */}
          <Avatar
            src={preview || currentPicture}
            sx={{ 
              width: 120, 
              height: 120,
              border: '4px solid',
              borderColor: 'primary.main'
            }}
          >
            {!preview && !currentPicture && <PhotoCamera sx={{ fontSize: 40 }} />}
          </Avatar>

          {/* File Selection */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose Photo
            </Button>
            
            {currentPicture && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeletePicture}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Uploading...</Typography>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* File Info */}
          {file && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Selected: {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Size: {Math.round(file.size / 1024)}KB
              </Typography>
            </Box>
          )}

          <Divider sx={{ width: '100%' }} />

          {/* Privacy Settings */}
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend">Who can see your profile picture?</FormLabel>
            <RadioGroup
              value={privacy}
              onChange={(e) => handlePrivacyUpdate(e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel 
                value="public" 
                control={<Radio />} 
                label="Everyone" 
              />
              <FormControlLabel 
                value="friends" 
                control={<Radio />} 
                label="Friends only" 
              />
              <FormControlLabel 
                value="private" 
                control={<Radio />} 
                label="Only me" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        {file && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={uploadFile}
            disabled={uploading}
          >
            Upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProfilePictureDialog;