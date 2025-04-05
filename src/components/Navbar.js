import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Container,
  useScrollTrigger,
  useMediaQuery,
  useTheme,
  Tooltip,
  ListItemIcon,
  ListItemText,
  alpha,
  Badge,
  Modal,
  Paper,
  List,
  ListItem,
  Slide,
  Fade,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  LocalOffer as OfferIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  ShoppingBag as ShoppingBagIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Close as CloseIcon,
  AddCircle as AddCircleIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import NavigationBadges from './NavigationBadges';
import DarkModeToggle from './DarkModeToggle';

// Slide down on scroll
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Navbar component
const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Animation styles
  const fadeIn = {
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0.3,
        transform: 'translateY(-10px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)'
      }
    }
  };
  
  const navItemAnimation = (delay) => ({
    animation: `fadeIn 0.5s ease-out ${delay}s forwards`,
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0.3,
        transform: 'translateY(-10px)'
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)'
      }
    }
  });
  
  // Handle account menu
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
    navigate('/login');
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Check if a navigation link is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <HideOnScroll>
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{
          backgroundColor: isDarkMode 
            ? 'rgba(32, 76, 192, 0.95)'
            : 'rgba(25, 118, 210, 0.95)',
          backgroundImage: isDarkMode
            ? 'linear-gradient(to right, #1a4ba8, #2962ff)'
            : 'linear-gradient(to right, #1976d2, #42a5f5)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${isDarkMode 
            ? alpha(theme.palette.common.white, 0.1) 
            : alpha(theme.palette.common.white, 0.2)}`,
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0.5, sm: 2 }, py: 1 }}>
            {/* Logo */}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: { xs: 1, md: 0 },
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                fontWeight: 700,
                letterSpacing: '-0.5px',
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.3s ease, transform 0.3s ease',
                '&:hover': {
                  color: alpha(theme.palette.common.white, 0.85),
                  transform: 'scale(1.02)',
                }
              }}
            >
              <ShoppingBagIcon 
                sx={{ 
                  mr: 1.5, 
                  fontSize: { xs: '1.4rem', md: '1.6rem' },
                  color: 'white',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(10deg)',
                  },
                }} 
              />
              Student Marketplace
            </Typography>

            {/* Desktop Navigation Links */}
            {!isMobile && (
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  justifyContent: 'center',
                  mx: 2
                }}
              >
                {user && (
                  <>
                    <Button
                      component={Link}
                      to="/"
                      color="inherit"
                      sx={{
                        mx: 1,
                        color: isActive('/') ? 'white' : alpha(theme.palette.common.white, 0.85),
                        fontWeight: 500,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: isActive('/') ? '100%' : '0%',
                          height: '3px',
                          bottom: -1,
                          left: 0,
                          backgroundColor: 'white',
                          transition: 'width 0.3s ease',
                          borderRadius: '3px 3px 0 0',
                        },
                        '&:hover::after': {
                          width: '100%',
                        }
                      }}
                    >
                      Home
                    </Button>
                    
                    <Button
                      component={Link}
                      to="/saved-listings"
                      color="inherit"
                      sx={{
                        mx: 1,
                        color: isActive('/saved-listings') ? 'white' : alpha(theme.palette.common.white, 0.85),
                        fontWeight: 500,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: isActive('/saved-listings') ? '100%' : '0%',
                          height: '3px',
                          bottom: -1,
                          left: 0,
                          backgroundColor: 'white',
                          transition: 'width 0.3s ease',
                          borderRadius: '3px 3px 0 0',
                        },
                        '&:hover::after': {
                          width: '100%',
                        }
                      }}
                      startIcon={<FavoriteIcon />}
                    >
                      Saved
                    </Button>
                    
                    <Button
                      component={Link}
                      to="/offers"
                      color="inherit"
                      sx={{
                        mx: 1,
                        color: isActive('/offers') ? 'white' : alpha(theme.palette.common.white, 0.85),
                        fontWeight: 500,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: isActive('/offers') ? '100%' : '0%',
                          height: '3px',
                          bottom: -1,
                          left: 0,
                          backgroundColor: 'white',
                          transition: 'width 0.3s ease',
                          borderRadius: '3px 3px 0 0',
                        },
                        '&:hover::after': {
                          width: '100%',
                        }
                      }}
                      startIcon={<OfferIcon />}
                    >
                      Offers
                    </Button>
                    
                    <Button
                      component={Link}
                      to="/messages"
                      color="inherit"
                      sx={{
                        mx: 1,
                        color: isActive('/messages') ? 'white' : alpha(theme.palette.common.white, 0.85),
                        fontWeight: 500,
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: isActive('/messages') ? '100%' : '0%',
                          height: '3px',
                          bottom: -1,
                          left: 0,
                          backgroundColor: 'white',
                          transition: 'width 0.3s ease',
                          borderRadius: '3px 3px 0 0',
                        },
                        '&:hover::after': {
                          width: '100%',
                        }
                      }}
                      startIcon={<ChatIcon />}
                    >
                      Messages
                    </Button>
                  </>
                )}
              </Box>
            )}

            {/* Right side actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Dark Mode Toggle */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center'
              }}>
                <DarkModeToggle size={isMobile ? 'small' : 'medium'} />
              </Box>

              {/* Post listing button (desktop) */}
              {user && !isMobile && (
                <Button
                  component={Link}
                  to="/create-listing"
                  variant="contained"
                  disableElevation
                  color="secondary"
                  startIcon={<AddIcon />}
                  sx={{
                    ml: 1,
                    fontWeight: 600,
                    px: 2,
                    py: 0.8,
                    borderRadius: '50px',
                    textTransform: 'none',
                    backgroundColor: theme.palette.secondary.main,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      transform: 'translateY(-3px)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: '-100%',
                      background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.2)}, transparent)`,
                      transition: 'all 0.5s ease',
                    },
                    '&:hover:after': {
                      left: '100%',
                    }
                  }}
                >
                  Post Listing
                </Button>
              )}
              
              {/* Mobile Navigation Badges */}
              {user && isMobile && <NavigationBadges />}
              
              {/* Notifications Menu */}
              {user && (
                <Box sx={{ mx: 0.5 }}>
                  <NotificationsMenu />
                </Box>
              )}
              
              {/* User Account Menu (Desktop only) */}
              {user && !isMobile ? (
                <Box>
                  <Tooltip title="Account Menu">
                    <IconButton
                      onClick={handleMenu}
                      edge="end"
                      aria-label="account menu"
                      size="medium"
                      sx={{ 
                        ml: 0.5,
                        bgcolor: alpha(theme.palette.common.white, 0.15),
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 0.25),
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      {user.user_metadata?.avatar_url ? (
                        <Avatar
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata.name || user.email}
                          sx={{ 
                            width: 32, 
                            height: 32,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 0 0 2px white',
                            },
                          }}
                        />
                      ) : (
                        <AccountIcon fontSize="small" sx={{ color: 'white' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Account Menu Popup */}
                  <Menu
                    id="account-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      elevation: 6,
                      sx: {
                        mt: 1.5,
                        mb: 1,
                        overflow: 'visible',
                        border: isDarkMode ? `1px solid ${alpha('#3f51b5', 0.3)}` : 'none',
                        filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.25))',
                        borderRadius: '12px',
                        minWidth: 200,
                        backgroundColor: isDarkMode ? '#1a2b55' : '#ffffff',
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 18,
                          width: 10,
                          height: 10,
                          bgcolor: isDarkMode ? '#1a2b55' : '#ffffff',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                          borderTop: isDarkMode ? `1px solid ${alpha('#3f51b5', 0.3)}` : 'none',
                          borderLeft: isDarkMode ? `1px solid ${alpha('#3f51b5', 0.3)}` : 'none',
                        },
                      },
                    }}
                  >
                    <MenuItem 
                      component={Link} 
                      to="/profile" 
                      onClick={handleClose}
                      sx={{
                        color: isDarkMode ? 'white' : 'inherit',
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: isDarkMode 
                            ? alpha('#1e88e5', 0.2) 
                            : alpha('#bbdefb', 0.5),
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: isDarkMode ? '#90caf9' : '#1976d2' }}>
                        <AccountIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Your Profile" />
                    </MenuItem>
                    
                    <MenuItem 
                      component={Link} 
                      to="/listings" 
                      onClick={handleClose}
                      sx={{
                        color: isDarkMode ? 'white' : 'inherit',
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: isDarkMode 
                            ? alpha('#1e88e5', 0.2) 
                            : alpha('#bbdefb', 0.5),
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: isDarkMode ? '#90caf9' : '#1976d2' }}>
                        <ShoppingBagIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Your Listings" />
                    </MenuItem>
                    
                    <MenuItem 
                      component={Link} 
                      to="/my-reports" 
                      onClick={handleClose}
                      sx={{
                        color: isDarkMode ? 'white' : 'inherit',
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: isDarkMode 
                            ? alpha('#1e88e5', 0.2) 
                            : alpha('#bbdefb', 0.5),
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: isDarkMode ? '#90caf9' : '#1976d2' }}>
                        <ReportIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Your Reports" />
                    </MenuItem>
                    
                    <Divider sx={{ 
                      my: 1,
                      borderColor: isDarkMode 
                        ? alpha(theme.palette.common.white, 0.1)
                        : alpha(theme.palette.common.black, 0.1),
                    }} />
                    
                    <MenuItem 
                      onClick={handleSignOut}
                      sx={{
                        color: isDarkMode ? '#ef9a9a' : '#f44336',
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: isDarkMode 
                            ? alpha('#ef5350', 0.15) 
                            : alpha('#ffcdd2', 0.7),
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: isDarkMode ? '#ef9a9a' : '#f44336' }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Sign Out" />
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <>
                  {!isMobile ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        component={Link}
                        to="/login"
                        variant="text"
                        color="inherit"
                        sx={{
                          color: 'white',
                          fontWeight: 500,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.common.white, 0.1),
                            transform: 'translateY(-2px)',
                          }
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        component={Link}
                        to="/register"
                        variant="contained"
                        disableElevation
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '50px',
                          px: 2,
                          backgroundColor: '#f06292',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: '#ec407a',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            transform: 'translateY(-3px)'
                          },
                          position: 'relative',
                          overflow: 'hidden',
                          '&:after': {
                            content: '""',
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: '-100%',
                            background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.2)}, transparent)`,
                            transition: 'all 0.5s ease',
                          },
                          '&:hover:after': {
                            left: '100%',
                          }
                        }}
                      >
                        Sign Up
                      </Button>
                    </Box>
                  ) : null}
                </>
              )}
              
              {/* Combined Mobile Menu Button */}
              {isMobile && (
                <Tooltip title="Menu">
                  <IconButton
                    color="inherit"
                    onClick={toggleMobileMenu}
                    edge="end"
                    sx={{ 
                      color: 'white',
                      ml: 0.5,
                      bgcolor: alpha(theme.palette.common.white, 0.15),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.common.white, 0.25),
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {user && user.user_metadata?.avatar_url ? (
                      <Avatar
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata.name || user.email}
                        sx={{ 
                          width: 28, 
                          height: 28,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ) : (
                      <MenuIcon sx={{ 
                        transition: 'transform 0.3s ease',
                        transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                      }} />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Toolbar>
        </Container>
        
        {/* Mobile Menu Modal */}
        <Modal
          open={mobileMenuOpen}
          onClose={toggleMobileMenu}
          closeAfterTransition
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <Fade in={mobileMenuOpen} timeout={{ enter: 400, exit: 300 }}>
            <Paper
              elevation={6}
              sx={{
                width: '94%',
                maxWidth: '400px',
                maxHeight: '80vh',
                mt: '60px',
                borderRadius: '16px',
                overflowY: 'auto',
                backgroundColor: isDarkMode 
                  ? '#1a2b55'
                  : '#ffffff',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: isDarkMode 
                  ? `1px solid ${alpha('#3f51b5', 0.3)}` 
                  : '1px solid rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                animation: 'slideUpFade 0.3s forwards',
                '@keyframes slideUpFade': {
                  '0%': {
                    opacity: 0.3,
                    transform: 'translateY(20px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              <List sx={{ py: 1 }}>
                {[
                  { path: '/', icon: <HomeIcon />, label: 'Home', index: 0 },
                  { path: '/profile', icon: <AccountIcon />, label: 'Your Profile', index: 1 },
                  { path: '/listings', icon: <ShoppingBagIcon />, label: 'Your Listings', index: 2 },
                  { path: '/my-reports', icon: <ReportIcon />, label: 'Your Reports', index: 3 },
                  { path: '/saved-listings', icon: <FavoriteIcon />, label: 'Saved Listings', index: 4 },
                  { path: '/offers', icon: <OfferIcon />, label: 'Offers', index: 5 },
                  { path: '/messages', icon: <ChatIcon />, label: 'Messages', index: 6 },
                  { divider: true, index: 7 },
                  { 
                    path: '/create-listing', 
                    icon: <AddCircleIcon color="secondary" />, 
                    label: 'Post a Listing', 
                    special: 'secondary',
                    index: 8
                  },
                  { divider: true, index: 9 },
                  { 
                    action: handleSignOut, 
                    icon: <LogoutIcon />, 
                    label: 'Sign Out', 
                    special: 'error',
                    index: 10
                  },
                ].map((item, i) => 
                  item.divider ? (
                    <Divider 
                      key={`divider-${i}`}
                      sx={{ 
                        my: 1.5,
                        borderColor: isDarkMode 
                          ? alpha(theme.palette.common.white, 0.1)
                          : alpha(theme.palette.common.black, 0.1),
                        animation: `fadeIn 0.5s ease forwards ${0.1 + (item.index * 0.05)}s`,
                        opacity: 0.5,
                        '@keyframes fadeIn': {
                          to: { opacity: 1 }
                        }
                      }} 
                    />
                  ) : (
                    <ListItem 
                      key={item.path || `action-${i}`}
                      component={item.path ? Link : 'li'}
                      to={item.path}
                      onClick={() => {
                        if (item.action) item.action();
                        toggleMobileMenu();
                      }}
                      sx={{
                        py: 1.8,
                        color: item.special === 'error' 
                          ? (isDarkMode ? '#ef9a9a' : '#f44336') 
                          : item.special === 'secondary' 
                            ? (isDarkMode ? '#f48fb1' : '#e91e63') 
                            : isActive(item.path) 
                              ? (isDarkMode ? '#90caf9' : '#1976d2')
                              : (isDarkMode ? 'white' : '#424242'),
                        borderLeft: '4px solid transparent',
                        backgroundColor: isActive(item.path) 
                          ? (isDarkMode 
                              ? alpha('#1e88e5', 0.15) 
                              : alpha('#bbdefb', 0.7))
                          : 'transparent',
                        transition: 'all 0.3s ease',
                        animation: `slideInRight 0.5s ease forwards ${0.1 + (item.index * 0.05)}s`,
                        transform: 'translateX(0)',
                        opacity: 0.95,
                        '@keyframes slideInRight': {
                          to: { 
                            transform: 'translateX(0)',
                            opacity: 1
                          }
                        },
                        '&:hover': {
                          backgroundColor: isDarkMode 
                            ? alpha('#1e88e5', 0.2) 
                            : alpha('#bbdefb', 0.5),
                        }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: item.special === 'error' 
                          ? (isDarkMode ? '#ef9a9a' : '#f44336') 
                          : item.special === 'secondary' 
                            ? (isDarkMode ? '#f48fb1' : '#e91e63') 
                            : isActive(item.path) 
                              ? (isDarkMode ? '#90caf9' : '#1976d2')
                              : (isDarkMode ? 'white' : '#424242'),
                        minWidth: '40px'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label} 
                        primaryTypographyProps={{ 
                          fontWeight: isActive(item.path) ? 500 : 400,
                          fontSize: '0.95rem'
                        }}
                      />
                    </ListItem>
                  )
                )}
              </List>
            </Paper>
          </Fade>
        </Modal>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar; 