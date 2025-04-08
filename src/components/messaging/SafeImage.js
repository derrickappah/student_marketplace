import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { supabase } from '../../supabaseClient';

/**
 * SafeImage component for CORS-friendly image display
 * Handles loading states and errors gracefully
 * Includes special handling for Supabase URLs
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for the image
 * @param {Object} props.sx - Additional styles
 * @param {Function} props.onError - Optional error callback
 */
const SafeImage = ({ 
  src, 
  alt = 'Image', 
  sx = {}, 
  onError,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  // Process Supabase URLs if needed
  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }
    
    const processSupabaseUrl = async () => {
      try {
        // Check if this is a Supabase storage URL
        if (src.includes('supabase.co/storage/v1/object/public')) {
          // Extract the bucket and file path from the URL
          const urlParts = src.split('/storage/v1/object/public/');
          
          if (urlParts.length === 2) {
            const [baseUrl, path] = urlParts;
            const [bucket, ...filePath] = path.split('/');
            
            // If this appears to be a comma-separated list of URLs, fix it
            if (src.includes(',http')) {
              // Take just the first URL
              const firstUrl = src.split(',')[0];
              setImageSrc(firstUrl);
              return;
            }
            
            // Get a signed URL with the proper headers
            const { data, error: signedUrlError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath.join('/'), 60); // 60 seconds expiry
              
            if (signedUrlError || !data?.signedUrl) {
              console.error('Error getting signed URL:', signedUrlError);
              setImageSrc(src); // Fall back to original URL
            } else {
              setImageSrc(data.signedUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error processing Supabase URL:', err);
        // Keep using the original source if there's an error
      }
    };
    
    processSupabaseUrl();
  }, [src]);
  
  // Handle successful image load
  const handleLoad = () => {
    setLoading(false);
  };
  
  // Handle image loading error
  const handleError = () => {
    setLoading(false);
    setError(true);
    if (onError && typeof onError === 'function') {
      onError();
    }
  };
  
  // Common box styles
  const boxStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...sx
  };
  
  // Show loading indicator while image loads
  if (loading && !error) {
    return (
      <Box sx={boxStyles}>
        <img
          src={imageSrc}
          alt={alt}
          style={{ display: 'none' }}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
        <CircularProgress size={24} thickness={2} />
      </Box>
    );
  }
  
  // Show error state if image failed to load
  if (error) {
    return (
      <Box sx={{ 
        ...boxStyles, 
        backgroundColor: (theme) => theme.palette.action.hover,
        flexDirection: 'column',
        padding: 1
      }}>
        <BrokenImageIcon color="action" sx={{ mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Image unavailable
        </Typography>
      </Box>
    );
  }
  
  // Show the image if loaded successfully
  return (
    <Box sx={boxStyles}>
      <img
        src={imageSrc}
        alt={alt}
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%',
          objectFit: 'contain'
        }}
        onError={handleError}
        {...props}
      />
    </Box>
  );
};

export default SafeImage; 