import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 6, 
          borderRadius: 3,
          textAlign: 'center',
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 30% 20%, rgba(25, 118, 210, 0.05), transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box 
          sx={{ 
            mb: 3, 
            width: 100, 
            height: 100, 
            borderRadius: '50%', 
            bgcolor: 'rgba(25, 118, 210, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <ErrorOutlineIcon 
            sx={{ 
              fontSize: 60, 
              color: 'primary.main',
              filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.2))',
            }} 
          />
        </Box>

        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '4rem', sm: '5rem' },
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}
        >
          404
        </Typography>

        <Typography 
          variant="h5" 
          component="h2" 
          fontWeight="bold" 
          sx={{ mb: 2 }}
        >
          Page Not Found
        </Typography>

        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '80%', mx: 'auto' }}
        >
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              transition: 'all 0.2s',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Back to Home
          </Button>
          
          <Button 
            variant="outlined" 
            component={RouterLink} 
            to="/search"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              borderWidth: 1.5,
              transition: 'all 0.2s',
              '&:hover': {
                borderWidth: 1.5,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
              },
            }}
          >
            Browse Listings
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage; 