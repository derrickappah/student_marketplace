import React from 'react';
import { IconButton, Tooltip, useTheme, Box, Zoom } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useColorMode } from '../contexts/ThemeContext';

const DarkModeToggle = ({ size = 'medium' }) => {
  const theme = useTheme();
  const { toggleColorMode, mode } = useColorMode();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Tooltip 
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      placement="bottom"
      arrow
      TransitionComponent={Zoom}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <IconButton 
          onClick={toggleColorMode}
          color="inherit"
          aria-label="toggle dark/light mode"
          size={size}
          sx={{ 
            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              transform: 'scale(1.05)',
            },
            borderRadius: '50%',
          }}
        >
          {isDark ? (
            <LightMode fontSize={size === 'small' ? 'small' : 'medium'} />
          ) : (
            <DarkMode fontSize={size === 'small' ? 'small' : 'medium'} />
          )}
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default DarkModeToggle; 