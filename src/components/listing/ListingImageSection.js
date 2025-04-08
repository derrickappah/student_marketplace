import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';

const ListingImageSection = ({ images }) => {
  const theme = useTheme();
  const [mainImage, setMainImage] = useState(0);
  
  // Parse image URLs if they're in JSON format
  const parseImageUrls = (imagesData) => {
    if (!imagesData) return [];
    
    try {
      if (typeof imagesData === 'string') {
        return JSON.parse(imagesData);
      }
      return Array.isArray(imagesData) ? imagesData : [];
    } catch (error) {
      console.error('Error parsing image URLs:', error);
      return [];
    }
  };

  const imageUrls = parseImageUrls(images);
  
  return (
    <Box sx={{ mb: 4 }}>
      {imageUrls.length > 0 ? (
        <>
          <Box
            sx={{
              height: { xs: 300, md: 400 },
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
            }}
          >
            <img
              src={imageUrls[mainImage]}
              alt="Listing main"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
          
          {imageUrls.length > 1 && (
            <Grid container spacing={1}>
              {imageUrls.map((url, index) => (
                <Grid item xs={3} sm={2} key={index}>
                  <Box
                    onClick={() => setMainImage(index)}
                    sx={{
                      height: 70,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: mainImage === index ? `2px solid ${theme.palette.primary.main}` : 'none',
                      opacity: mainImage === index ? 1 : 0.7,
                      transition: 'all 0.2s',
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        <Box
          sx={{
            height: { xs: 300, md: 400 },
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No images available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ListingImageSection;