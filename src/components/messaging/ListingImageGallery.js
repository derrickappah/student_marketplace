import React, { useState } from 'react';
import { Box, IconButton, Dialog } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import SafeImage from './SafeImage';

/**
 * Component to display listing images, handling both single images and comma-separated URLs
 * 
 * @param {Object} props
 * @param {string|Array} props.images - Image URL(s) or comma-separated URLs
 * @param {string} props.alt - Alt text for images
 * @param {Object} props.sx - Additional styling
 */
const ListingImageGallery = ({ images, alt = "Listing image", sx = {} }) => {
  const [openGallery, setOpenGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Parse images to ensure we always have an array
  const imageArray = React.useMemo(() => {
    if (!images) return [];
    
    // If already an array, use it
    if (Array.isArray(images)) return images;
    
    // If it's a comma-separated string, split it
    if (typeof images === 'string' && images.includes(',')) {
      return images.split(',').filter(url => url.trim());
    }
    
    // Otherwise, treat as a single image
    return [images];
  }, [images]);
  
  // If no images, render nothing
  if (!imageArray.length) return null;
  
  const handleOpenGallery = () => {
    setOpenGallery(true);
  };
  
  const handleCloseGallery = () => {
    setOpenGallery(false);
  };
  
  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % imageArray.length);
  };
  
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };
  
  return (
    <>
      <Box 
        onClick={handleOpenGallery}
        sx={{ 
          cursor: 'pointer',
          position: 'relative',
          ...sx
        }}
      >
        <SafeImage 
          src={imageArray[0]}
          alt={alt}
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            borderRadius: 1
          }}
        />
        {imageArray.length > 1 && (
          <Box 
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              fontSize: '0.75rem'
            }}
          >
            +{imageArray.length - 1}
          </Box>
        )}
      </Box>
      
      {/* Full-screen gallery */}
      <Dialog
        open={openGallery}
        onClose={handleCloseGallery}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ position: 'relative', height: '80vh', bgcolor: 'black' }}>
          <IconButton
            onClick={handleCloseGallery}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <SafeImage
            src={imageArray[currentImageIndex]}
            alt={`${alt} ${currentImageIndex + 1} of ${imageArray.length}`}
            sx={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />
          
          {imageArray.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
              
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {currentImageIndex + 1} / {imageArray.length}
              </Box>
            </>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default ListingImageGallery; 