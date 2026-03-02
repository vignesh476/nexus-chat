import { useState, useCallback } from 'react';

export const useFileUpload = (options = {}) => {
  const { 
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    onUpload,
    onError
  } = options;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    if (!file) return false;
    
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError(`File type must be one of: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    return true;
  }, [maxSize, allowedTypes]);

  const handleFileSelect = useCallback((selectedFile) => {
    setError(null);
    
    if (!validateFile(selectedFile)) {
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, [validateFile]);

  const uploadFile = useCallback(async () => {
    if (!file || !onUpload) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await onUpload(formData);
      
      // Reset after successful upload
      setFile(null);
      setPreview(null);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  }, [file, onUpload, onError]);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploading(false);
  }, []);

  return {
    file,
    preview,
    uploading,
    error,
    handleFileSelect,
    uploadFile,
    reset
  };
};

export default useFileUpload;