import { Box, Container, Typography, Grid, Link, IconButton, Divider, useTheme, alpha } from '@mui/material';
import { 
  Facebook as FacebookIcon, 
  Twitter as TwitterIcon, 
  Instagram as InstagramIcon, 
  LinkedIn as LinkedInIcon,
  ShoppingBag as ShoppingBagIcon
} from '@mui/icons-material';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Footer Component
const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        backgroundColor: (theme) => theme.palette.mode === 'light' 
          ? alpha(theme.palette.primary.main, 0.05)
          : alpha(theme.palette.background.paper, 0.5),
        color: theme.palette.text.secondary,
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: (theme) => `linear-gradient(90deg, 
            ${alpha(theme.palette.primary.dark, 0.8)}, 
            ${alpha(theme.palette.primary.main, 0.9)}, 
            ${alpha(theme.palette.primary.light, 0.7)})`,
        },
      }}
    >
      {/* Wave decoration */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%231976D2' fill-opacity='1' d='M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,224C672,245,768,235,864,202.7C960,171,1056,117,1152,106.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          zIndex: 0,
        }}
      />

      {/* Main footer content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 1, 
          pt: 6, 
          pb: 3
        }}
      >
        {/* Top row with logo and social links */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 5,
            pb: 4,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Logo and tagline */}
          <Box sx={{ mb: { xs: 3, md: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <ShoppingBagIcon 
                sx={{ 
                  mr: 1, 
                  color: 'primary.main',
                  fontSize: 32,
                  filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.3))',
                }} 
              />
              <Typography 
                variant="h5" 
                fontWeight="bold"
                sx={{ 
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Student Marketplace
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
              The premier marketplace for university students to buy, sell, and trade items within their campus community.
            </Typography>
          </Box>

          {/* Social media icons */}
          <Box>
            <Typography 
              variant="subtitle2" 
              fontWeight="medium" 
              color="text.primary" 
              gutterBottom
              sx={{ mb: 1.5 }}
            >
              Connect with us
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <IconButton 
                size="medium" 
                sx={{ 
                  color: 'white',
                  bgcolor: 'primary.main',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  },
                }}
                aria-label="facebook"
              >
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="medium" 
                sx={{ 
                  color: 'white',
                  bgcolor: 'primary.main',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  },
                }}
                aria-label="twitter"
              >
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="medium" 
                sx={{ 
                  color: 'white',
                  bgcolor: 'primary.main',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  },
                }}
                aria-label="instagram"
              >
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="medium" 
                sx={{ 
                  color: 'white',
                  bgcolor: 'primary.main',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  },
                }}
                aria-label="linkedin"
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Navigation links */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          {/* Marketplace links */}
          <Grid item xs={6} sm={3}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              color="primary" 
              gutterBottom
              sx={{
                position: 'relative',
                display: 'inline-block',
                pb: 1,
                mb: 2,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '30px',
                  height: 3,
                  backgroundColor: 'primary.main',
                  borderRadius: 4,
                },
              }}
            >
              Marketplace
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Home
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/search" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Browse
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/create-listing" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Sell an Item
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/saved-listings" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Saved Items
                </Link>
              </Box>
            </Box>
          </Grid>
          
          {/* Account links */}
          <Grid item xs={6} sm={3}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              color="primary" 
              gutterBottom
              sx={{
                position: 'relative',
                display: 'inline-block',
                pb: 1,
                mb: 2,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '30px',
                  height: 3,
                  backgroundColor: 'primary.main',
                  borderRadius: 4,
                },
              }}
            >
              Account
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Sign In
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Register
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/profile" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  My Profile
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/offers" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  My Offers
                </Link>
              </Box>
            </Box>
          </Grid>
          
          {/* Support links */}
          <Grid item xs={6} sm={3}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              color="primary" 
              gutterBottom
              sx={{
                position: 'relative',
                display: 'inline-block',
                pb: 1,
                mb: 2,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '30px',
                  height: 3,
                  backgroundColor: 'primary.main',
                  borderRadius: 4,
                },
              }}
            >
              Support
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/help-center" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Help Center
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/safety-tips" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Safety Tips
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/contact-us" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Contact Us
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  component={RouterLink} 
                  to="/terms-of-use" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  Terms of Use
                </Link>
              </Box>
            </Box>
          </Grid>
          
          {/* Newsletter subscription */}
          <Grid item xs={6} sm={3}>
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              color="primary" 
              gutterBottom
              sx={{
                position: 'relative',
                display: 'inline-block',
                pb: 1,
                mb: 2,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '30px',
                  height: 3,
                  backgroundColor: 'primary.main',
                  borderRadius: 4,
                },
              }}
            >
              Campus Locations
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  href="#" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  University of Ghana
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  href="#" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  KNUST
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  href="#" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  University of Cape Coast
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1.5 }}>
                <Link 
                  href="#" 
                  underline="none" 
                  color="text.primary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform 0.15s, color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  UPSA
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {/* Bottom copyright and links section */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: { xs: 2, sm: 0 },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            © {year} Student Marketplace. All rights reserved.
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: { xs: 3, sm: 4 },
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <Link 
              href="#" 
              variant="body2" 
              color="text.secondary" 
              underline="none"
              sx={{
                transition: 'color 0.2s',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Privacy Policy
            </Link>
            <Link 
              component={RouterLink}
              to="/terms-of-use" 
              variant="body2" 
              color="text.secondary" 
              underline="none"
              sx={{
                transition: 'color 0.2s',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Terms of Service
            </Link>
            <Link 
              href="#" 
              variant="body2" 
              color="text.secondary" 
              underline="none"
              sx={{
                transition: 'color 0.2s',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Cookies
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// HeaderLayout Component
const HeaderLayout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 0,
          pb: { xs: 4, md: 6 },
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default HeaderLayout; 