import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Fab, Zoom, useScrollTrigger } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// This component will automatically scroll to top when route changes
export function ScrollToTopOnMount() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// This component adds a scroll-to-top button when the user scrolls down
export default function ScrollToTop() {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 200,
  });

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <ScrollToTopOnMount />
      <Zoom in={trigger}>
        <Fab
          color="primary"
          size="small"
          aria-label="scroll back to top"
          onClick={handleClick}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
            transition: 'all 0.3s',
            background: 'linear-gradient(45deg, #1565c0 0%, #1976d2 35%, #2196f3 100%)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 20px rgba(25, 118, 210, 0.4)',
              background: 'linear-gradient(45deg, #0d47a1 0%, #1565c0 35%, #1976d2 100%)',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </>
  );
} 