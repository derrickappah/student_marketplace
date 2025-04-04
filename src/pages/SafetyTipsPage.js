import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Chip,
  Fade,
  Zoom,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Public as PublicIcon,
  Payment as PaymentIcon,
  Message as MessageIcon,
  ErrorOutline as WarningIcon,
  CheckCircle as CheckIcon,
  VerifiedUser as VerifiedIcon,
  PersonPin as MeetingIcon,
  Phone as PhoneIcon,
  Block as BlockIcon,
  Home as HomeIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  InfoOutlined as InfoIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

const SafetyTipsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPrintTooltip, setShowPrintTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const isDarkMode = theme.palette.mode === 'dark';
  
  const handlePrint = () => {
    window.print();
  };

  // Color palette adjusted for dark mode awareness
  const getCategoryColor = (baseColor) => {
    return isDarkMode ? alpha(baseColor, 0.2) : baseColor;
  };

  const safetyCategories = [
    {
      title: "Before the Transaction",
      icon: <VerifiedIcon fontSize="large" color="primary" />,
      color: getCategoryColor('#bbdefb'), // light blue
      darkColor: '#1565c0', // darker blue for icon background in dark mode
      tips: [
        "Verify the user profile - check their ratings, reviews, and how long they've been a member",
        "Research the fair market value of items to avoid overpaying",
        "Ask for additional photos or information if the listing doesn't provide enough details",
        "Be wary of deals that seem too good to be true - they usually are",
        "Never share personal financial information like bank details or passwords"
      ]
    },
    {
      title: "Communication Safety",
      icon: <MessageIcon fontSize="large" color="primary" />,
      color: getCategoryColor('#c8e6c9'), // light green
      darkColor: '#2e7d32', // darker green for icon background in dark mode
      tips: [
        "Keep all communication within our platform's messaging system",
        "Don't share personal contact information until you're confident about proceeding",
        "Be cautious of users who pressure you to complete transactions quickly",
        "Trust your instincts - if something feels wrong, it probably is",
        "Report suspicious messages or behavior immediately"
      ]
    },
    {
      title: "Meeting in Person",
      icon: <MeetingIcon fontSize="large" color="primary" />,
      color: getCategoryColor('#ffecb3'), // light amber
      darkColor: '#ff8f00', // darker amber for icon background in dark mode
      tips: [
        "Always meet in public places with plenty of people around",
        "Meet during daylight hours whenever possible",
        "Use your university's designated safe exchange zones if available",
        "Bring a friend or let someone know where you're going, who you're meeting, and when",
        "Trust your instincts - if you feel uncomfortable during a meeting, leave immediately"
      ]
    },
    {
      title: "Payment Safety",
      icon: <PaymentIcon fontSize="large" color="primary" />,
      color: getCategoryColor('#e1bee7'), // light purple
      darkColor: '#7b1fa2', // darker purple for icon background in dark mode
      tips: [
        "Cash is generally the safest payment method for in-person transactions",
        "Inspect items thoroughly before paying",
        "Be wary of sellers who change the price or terms at meetup",
        "Avoid wire transfers, cryptocurrency, gift cards, or payment apps to people you don't know",
        "Get a receipt or written confirmation for expensive items"
      ]
    }
  ];

  const commonScams = [
    {
      title: "Fake Payment Confirmations",
      description: "Scammers send fake payment confirmation emails or screenshots while claiming they've paid for an item.",
      prevention: "Always verify that money has actually been deposited in your account before handing over items."
    },
    {
      title: "Off-Platform Transactions",
      description: "Someone tries to move your transaction off the marketplace platform to avoid security measures.",
      prevention: "Keep all communications and transactions within our platform for better protection."
    },
    {
      title: "Shipping Scams",
      description: "A buyer offers to pay extra for shipping but will send a fraudulent payment or check.",
      prevention: "For in-person marketplace transactions, stick to local pickup and cash payments."
    },
    {
      title: "Identity Verification Scams",
      description: "Someone claims they need to verify your identity by sending a code to your phone (which is actually a password reset code).",
      prevention: "Never share verification codes sent to your phone or email with anyone."
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<KeyboardArrowRightIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mt: 3, mb: 1 }}
      >
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: isDarkMode ? theme.palette.primary.light : 'inherit', 
          textDecoration: 'none' 
        }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Safety Tips
        </Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ 
        py: 5, 
        textAlign: 'center',
        background: isDarkMode 
          ? 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)' 
          : 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
        borderRadius: 2,
        color: 'white',
        mb: 4,
        mt: 2,
        px: 3,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDarkMode
          ? '0 4px 20px rgba(46, 125, 50, 0.4)'
          : '0 4px 20px rgba(76, 175, 80, 0.3)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: isDarkMode
            ? 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)'
            : 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
        },
      }}>
        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
          <Tooltip 
            title="Print this guide" 
            arrow
            open={showPrintTooltip}
            onOpen={() => setShowPrintTooltip(true)}
            onClose={() => setShowPrintTooltip(false)}
          >
            <IconButton 
              onClick={handlePrint} 
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
              onMouseEnter={() => setShowPrintTooltip(true)}
              onMouseLeave={() => setShowPrintTooltip(false)}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip 
            title="Share these tips" 
            arrow
            open={showShareTooltip}
            onOpen={() => setShowShareTooltip(true)}
            onClose={() => setShowShareTooltip(false)}
          >
            <IconButton 
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
              onMouseEnter={() => setShowShareTooltip(true)}
              onMouseLeave={() => setShowShareTooltip(false)}
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip 
            title="Save for later" 
            arrow
            open={showSaveTooltip}
            onOpen={() => setShowSaveTooltip(true)}
            onClose={() => setShowSaveTooltip(false)}
          >
            <IconButton 
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
              onMouseEnter={() => setShowSaveTooltip(true)}
              onMouseLeave={() => setShowSaveTooltip(false)}
            >
              <BookmarkIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <SecurityIcon sx={{ 
            fontSize: 72, 
            mb: 2, 
            filter: isDarkMode
              ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' 
          }} />
        </Zoom>
        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            fontWeight="bold"
            sx={{ 
              textShadow: isDarkMode
                ? '0 2px 10px rgba(0,0,0,0.4)'
                : '0 2px 10px rgba(0,0,0,0.2)',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            Safety Tips
          </Typography>
        </Fade>
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <Typography 
            variant="h6"
            sx={{ 
              maxWidth: 800, 
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.25rem' },
              opacity: 0.9,
              textShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Stay safe while buying and selling in our university marketplace
          </Typography>
        </Fade>
      </Box>
      
      {/* Emergency Alert */}
      <Alert 
        severity="error" 
        variant="filled"
        sx={{ 
          mb: 4, 
          py: 2,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
        }}
        icon={<PhoneIcon fontSize="large" />}
      >
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            In case of emergency or if you feel unsafe:
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Call emergency services immediately: <Box component="span" sx={{ fontSize: '1.2rem', letterSpacing: 1 }}>911</Box>
          </Typography>
        </Box>
      </Alert>
      
      {/* Main Safety Tips */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          fontWeight={600}
          sx={{ 
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
            }
          }}
        >
          Safety Guidelines
        </Typography>
        <Chip 
          label="Important" 
          color="primary" 
          size="small" 
          sx={{ 
            fontWeight: 'bold', 
            bgcolor: theme.palette.primary.main,
            ml: 1,
          }} 
        />
      </Box>
      
      <Typography variant="subtitle1" paragraph color="text.secondary" sx={{ mb: 4, maxWidth: 900 }}>
        Following these safety guidelines will help ensure a positive buying and selling experience on our platform. Each category addresses key aspects of transaction safety.
      </Typography>
      
      {/* Safety Categories */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {safetyCategories.map((category, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: isDarkMode 
                  ? '0 6px 20px rgba(0,0,0,0.3)' 
                  : '0 6px 20px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: isDarkMode 
                    ? '0 12px 28px rgba(0,0,0,0.4)' 
                    : '0 12px 28px rgba(0,0,0,0.15)',
                },
                border: isDarkMode 
                  ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` 
                  : 'none',
                background: isDarkMode 
                  ? alpha(theme.palette.background.paper, 0.6)
                  : theme.palette.background.paper,
              }} 
              elevation={isDarkMode ? 4 : 2}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    bgcolor: category.color,
                    py: 3,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: '50%', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isDarkMode ? category.darkColor : 'white',
                      boxShadow: isDarkMode 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {React.cloneElement(category.icon, { 
                      fontSize: 'large',
                      sx: { 
                        color: isDarkMode ? 'white' : undefined,
                        fontSize: '2rem',
                      } 
                    })}
                  </Box>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    fontWeight="bold"
                    sx={{ 
                      color: isDarkMode ? 'white' : 'text.primary',
                      textShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    {category.title}
                  </Typography>
                </Box>

                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <List disablePadding>
                    {category.tips.map((tip, tipIndex) => (
                      <ListItem 
                        key={tipIndex} 
                        alignItems="flex-start" 
                        sx={{ 
                          px: 0, 
                          mb: 1.5,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, pt: 0.5 }}>
                          <CheckIcon 
                            color="success" 
                            sx={{ 
                              fontSize: '1.5rem',
                              filter: isDarkMode ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' : 'none',
                            }} 
                          />
                        </ListItemIcon>
                        <ListItemText 
                          primary={tip} 
                          primaryTypographyProps={{ 
                            variant: 'body1',
                            fontWeight: 500,
                            color: 'text.primary',
                            lineHeight: 1.5,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Common Scams Section */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          fontWeight={600}
          sx={{ 
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              backgroundColor: theme.palette.error.main,
              borderRadius: 2,
            }
          }}
        >
          Common Scams to Avoid
        </Typography>
        <Chip 
          label="Be Alert" 
          color="error" 
          size="small" 
          sx={{ 
            fontWeight: 'bold', 
            bgcolor: theme.palette.error.main,
            ml: 1,
          }} 
        />
      </Box>
      
      <Typography variant="subtitle1" paragraph color="text.secondary" sx={{ mb: 4, maxWidth: 900 }}>
        Being aware of these common scams will help you recognize potential threats and protect yourself from fraudulent activities. Stay vigilant and report suspicious behavior.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {commonScams.map((scam, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Zoom in={true} style={{ transitionDelay: `${150 * index}ms` }}>
              <Card 
                sx={{ 
                  height: '100%', 
                  borderLeft: '4px solid #f44336',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
                elevation={3}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon color="error" sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {scam.title}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body1" 
                    paragraph 
                    sx={{ 
                      mb: 2, 
                      lineHeight: 1.6,
                      color: 'text.primary',
                    }}
                  >
                    {scam.description}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    bgcolor: 'success.light', 
                    p: 2, 
                    borderRadius: 2,
                    alignItems: 'flex-start',
                  }}>
                    <BlockIcon sx={{ color: 'white', mr: 1, mt: 0.5, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      <strong>Prevention:</strong> {scam.prevention}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>
      
      {/* Safe Meeting Spots */}
      <Paper 
        elevation={isDarkMode ? 4 : 3}
        sx={{ 
          p: 4, 
          mb: 6, 
          borderRadius: 2,
          background: isDarkMode 
            ? 'linear-gradient(to right, #1a2027, #121212)'
            : 'linear-gradient(to right, #f5f7fa, #e4e7eb)',
          position: 'relative',
          overflow: 'hidden',
          border: isDarkMode ? `1px solid ${alpha('#2196f3', 0.2)}` : 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: isDarkMode
              ? 'linear-gradient(to right, #0d47a1, #2196f3)'
              : 'linear-gradient(to right, #2196f3, #4dabf5)',
          }
        }}
      >
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
          fontWeight={600}
          color={isDarkMode ? 'primary.light' : 'text.primary'}
        >
          <PublicIcon color="primary" sx={{ mr: 1.5, fontSize: 30 }} />
          Safe Meeting Locations
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{ 
            mb: 3,
            lineHeight: 1.7,
            maxWidth: 900,
            color: isDarkMode ? alpha(theme.palette.text.primary, 0.9) : theme.palette.text.primary,
          }}
        >
          Always meet in public, well-lit areas with plenty of people around. Here are some recommended meeting spots:
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Fade in={true} style={{ transitionDelay: '100ms' }}>
              <Box sx={{ 
                pl: 2, 
                borderLeft: `3px solid ${isDarkMode ? '#90caf9' : '#1976d2'}`,
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateX(5px)',
                },
                py: 1,
              }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ mb: 1.5 }}
                  color={isDarkMode ? 'primary.light' : 'text.primary'}
                >
                  University Locations
                </Typography>
                <Typography 
                  variant="body2" 
                  color={isDarkMode ? alpha(theme.palette.text.primary, 0.85) : theme.palette.text.secondary} 
                  sx={{ lineHeight: 2 }}
                >
                  • Student centers<br />
                  • Campus libraries<br />
                  • University security offices<br />
                  • Dining commons<br />
                  • Administration buildings
                </Typography>
              </Box>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Fade in={true} style={{ transitionDelay: '200ms' }}>
              <Box sx={{ 
                pl: 2, 
                borderLeft: `3px solid ${isDarkMode ? '#90caf9' : '#1976d2'}`,
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateX(5px)',
                },
                py: 1,
              }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ mb: 1.5 }}
                  color={isDarkMode ? 'primary.light' : 'text.primary'}
                >
                  Public Locations
                </Typography>
                <Typography 
                  variant="body2" 
                  color={isDarkMode ? alpha(theme.palette.text.primary, 0.85) : theme.palette.text.secondary} 
                  sx={{ lineHeight: 2 }}
                >
                  • Coffee shops<br />
                  • Shopping mall food courts<br />
                  • Bank lobbies<br />
                  • Fast food restaurants<br />
                  • Public libraries
                </Typography>
              </Box>
            </Fade>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Fade in={true} style={{ transitionDelay: '300ms' }}>
              <Box sx={{ 
                pl: 2, 
                borderLeft: `3px solid ${isDarkMode ? '#90caf9' : '#1976d2'}`,
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateX(5px)',
                },
                py: 1,
              }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ mb: 1.5 }}
                  color={isDarkMode ? 'primary.light' : 'text.primary'}
                >
                  Safe Exchange Zones
                </Typography>
                <Typography 
                  variant="body2" 
                  color={isDarkMode ? alpha(theme.palette.text.primary, 0.85) : theme.palette.text.secondary} 
                  sx={{ lineHeight: 2 }}
                >
                  • Police station parking lots<br />
                  • Designated campus exchange zones<br />
                  • Well-lit ATM locations<br />
                  • Areas with surveillance cameras<br />
                  • Community centers
                </Typography>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Paper>
      
      {/* What to do if something goes wrong */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          fontWeight={600}
          sx={{ 
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              backgroundColor: theme.palette.warning.main,
              borderRadius: 2,
            }
          }}
        >
          What to Do If Something Goes Wrong
        </Typography>
      </Box>
      
      <Typography variant="subtitle1" paragraph color="text.secondary" sx={{ mb: 4, maxWidth: 900 }}>
        Even with precautions, situations may arise where you need help. Here's what to do in various scenarios.
      </Typography>
      
      <Paper 
        elevation={isDarkMode ? 4 : 3} 
        sx={{ 
          p: 4, 
          mb: 6, 
          borderRadius: 2,
          background: isDarkMode 
            ? alpha(theme.palette.background.paper, 0.6)
            : theme.palette.background.paper,
          border: isDarkMode 
            ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
            : 'none',
        }}
      >
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              gutterBottom 
              sx={{ 
                color: isDarkMode ? theme.palette.error.light : theme.palette.error.dark,
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <PhoneIcon color="error" sx={{ mr: 1.5 }} />
              If You Feel Unsafe
            </Typography>
            <List>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <PhoneIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Leave immediately and go to a safe location" 
                  secondary="Your safety is the top priority - don't hesitate to walk away from any situation where you feel uncomfortable."
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary 
                  }}
                  secondaryTypographyProps={{ 
                    color: isDarkMode ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                    sx: { 
                      mt: 0.5,
                      lineHeight: 1.5 
                    }
                  }}
                />
              </ListItem>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <PhoneIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Call emergency services (911) if needed" 
                  secondary="If you're in immediate danger, call emergency services right away."
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary 
                  }}
                  secondaryTypographyProps={{ 
                    color: isDarkMode ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                    sx: { 
                      mt: 0.5,
                      lineHeight: 1.5 
                    }
                  }}
                />
              </ListItem>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Contact campus security" 
                  secondary="If you're on campus, alert campus security about the situation."
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary 
                  }}
                  secondaryTypographyProps={{ 
                    color: isDarkMode ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                    sx: { 
                      mt: 0.5,
                      lineHeight: 1.5 
                    }
                  }}
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              gutterBottom 
              sx={{ 
                color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <WarningIcon color="primary" sx={{ mr: 1.5 }} />
              Report Issues to Us
            </Typography>
            <List>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Report suspicious users" 
                  secondary="Use the reporting feature on user profiles or listings to flag suspicious behavior."
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary 
                  }}
                  secondaryTypographyProps={{ 
                    color: isDarkMode ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                    sx: { 
                      mt: 0.5,
                      lineHeight: 1.5 
                    }
                  }}
                />
              </ListItem>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <MessageIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Contact our support team" 
                  secondary="For help with problematic transactions or users, reach out to our team."
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary 
                  }}
                  secondaryTypographyProps={{ 
                    color: isDarkMode ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                    sx: { 
                      mt: 0.5,
                      lineHeight: 1.5 
                    }
                  }}
                />
              </ListItem>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <BlockIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Block problematic users" 
                  secondary="You can block users to prevent them from contacting you further."
                  primaryTypographyProps={{ 
                    fontWeight: 600, 
                    color: isDarkMode ? theme.palette.text.primary : theme.palette.text.primary 
                  }}
                  secondaryTypographyProps={{ 
                    color: isDarkMode ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                    sx: { 
                      mt: 0.5,
                      lineHeight: 1.5 
                    }
                  }}
                />
              </ListItem>
            </List>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                component={Link} 
                to="/contact-us" 
                variant="contained" 
                color="primary"
                size="large"
                sx={{ 
                  mt: 2,
                  px: 4,
                  py: 1.2,
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  boxShadow: isDarkMode 
                    ? '0 4px 20px rgba(25, 118, 210, 0.3)' 
                    : '0 4px 12px rgba(25, 118, 210, 0.2)',
                  '&:hover': {
                    boxShadow: isDarkMode 
                      ? '0 6px 22px rgba(25, 118, 210, 0.4)' 
                      : '0 6px 16px rgba(25, 118, 210, 0.3)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                Contact Support
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Final Call to Action */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 6, 
          p: 4, 
          borderRadius: 3,
          background: isDarkMode
            ? alpha(theme.palette.success.main, 0.08)
            : 'linear-gradient(to right, rgba(76, 175, 80, 0.05), rgba(139, 195, 74, 0.1))',
          border: '1px solid',
          borderColor: isDarkMode ? alpha(theme.palette.success.main, 0.2) : 'success.light',
        }}
      >
        <Zoom in={true}>
          <VerifiedIcon 
            sx={{ 
              fontSize: 70, 
              mb: 2, 
              color: 'success.main',
              filter: 'drop-shadow(0 2px 5px rgba(76, 175, 80, 0.3))'
            }} 
          />
        </Zoom>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Remember: Your Safety Comes First
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            mb: 4,
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          We want everyone to have a positive experience on Student Marketplace. By following these safety guidelines, 
          you can help ensure that your buying and selling experiences are safe and successful.
        </Typography>
        <Button 
          component={Link}
          to="/help-center"
          variant="outlined" 
          color="success" 
          size="large"
          startIcon={<InfoIcon />}
          sx={{ 
            px: 4,
            py: 1.2,
            borderRadius: '50px',
            fontWeight: 'bold',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
            },
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          Visit Our Help Center
        </Button>
      </Box>
    </Container>
  );
};

export default SafetyTipsPage; 