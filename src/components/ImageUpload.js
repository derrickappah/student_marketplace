import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { uploadImage, deleteImage } from "../services/supabase";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUpload = ({ images = [], onChange, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit.');
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setLoading(true);
    setError('');

    try {
      if (images.length + files.length > MAX_FILES) {
        throw new Error(`Maximum ${MAX_FILES} images allowed.`);
      }

      // Validate all files first
      files.forEach(validateFile);

      // Upload files
      const uploadPromises = files.map(async (file) => {
        const { data, error } = await uploadImage(file);
        if (error) throw error;
        return data.path;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      onChange([...images, ...newImageUrls]);
    } catch (err) {
      setError(err.message);
      console.error('Error uploading images:', err);
    } finally {
      setLoading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (index) => {
    try {
      const imageUrl = images[index];
      await deleteImage(imageUrl);
      
      const newImages = [...images];
      newImages.splice(index, 1);
      onChange(newImages);
    } catch (err) {
      setError('Error deleting image');
      console.error('Error:', err);
    }
  };

  return (
    <Box>
      <input
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        ref={fileInputRef}
        disabled={disabled || loading}
      />

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading || images.length >= MAX_FILES}
        >
          Upload Images
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Max {MAX_FILES} images. JPEG, PNG or WebP. Max 5MB each.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {images.map((image, index) => (
          <Grid item key={index} xs={6} sm={4} md={3}>
            <Box
              sx={{
                position: 'relative',
                paddingTop: '100%',
                backgroundColor: 'grey.100',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {!disabled && (
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                  onClick={() => handleDelete(index)}
                >
                  <DeleteIcon sx={{ color: 'white' }} />
                </IconButton>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ImageUpload; 