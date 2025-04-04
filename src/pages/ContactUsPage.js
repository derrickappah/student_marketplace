import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Send as SendIcon,
  Home as HomeIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Help as HelpIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { submitContactForm } from "../services/supabase";

const ContactUsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintTooltip, setShowPrintTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  
  const handlePrint = () => {
    window.print();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.topic) {
      newErrors.topic = 'Please select a topic';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setShowError(false);
      
      try {
        const { success, error } = await submitContactForm(formData);
        
        if (success) {
          console.log('Form submitted successfully');
          setShowSuccess(true);
          setFormData({
            name: '',
            email: '',
            topic: '',
            message: '',
          });
        } else {
          console.error('Error submitting form:', error);
          setErrorMessage(error || 'Failed to submit your message. Please try again later.');
          setShowError(true);
        }
      } catch (error) {
        console.error('Exception while submitting form:', error);
        setErrorMessage('An unexpected error occurred. Please try again later.');
        setShowError(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const topics = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Issue' },
    { value: 'safety', label: 'Safety Concern' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<KeyboardArrowRightIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mt: 3, mb: 1 }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Contact Us
        </Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ 
        py: 5, 
        textAlign: 'center',
        background: isDarkMode 
          ? 'linear-gradient(45deg, #1565C0 30%, #0D47A1 90%)'
          : 'linear-gradient(45deg, #2196F3 30%, #64B5F6 90%)',
        borderRadius: 2,
        color: 'white',
        mb: 4,
        mt: 2,
        px: 3,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.4)'
          : '0 4px 20px rgba(33, 150, 243, 0.3)',
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
            title="Print contact info" 
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
            title="Share contact info" 
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
            title="Save contact info" 
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
          <MessageIcon sx={{ fontSize: 72, mb: 2, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
        </Zoom>
        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            fontWeight="bold"
            sx={{ 
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            Contact Us
          </Typography>
        </Fade>
        <Fade in={true} style={{ transitionDelay: '300ms' }}>
          <Typography variant="h6" sx={{ 
            mb: 3, 
            maxWidth: 800, 
            mx: 'auto', 
            opacity: 0.9,
            fontWeight: 400,
            lineHeight: 1.5,
          }}>
            Have questions or need assistance? We're here to help. Choose the best way to reach us below.
          </Typography>
        </Fade>
      </Box>
      
      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Fade in={true} style={{ transitionDelay: '100ms' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                height: '100%',
                borderRadius: 2,
                background: isDarkMode 
                  ? 'linear-gradient(to bottom right, #1E1E1E, #2D2D2D)'
                  : 'linear-gradient(to bottom right, #f8f9fa, #e9ecef)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '6px',
                  background: isDarkMode
                    ? 'linear-gradient(to right, #1565C0, #1976D2)'
                    : 'linear-gradient(to right, #2196F3, #64B5F6)',
                }
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                <HelpIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                Get in Touch
              </Typography>
              
              <List>
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email Support"
                    secondary={
                      <Typography 
                        component="a" 
                        href="mailto:support@studentmarketplace.com"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        support@studentmarketplace.com
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone Support"
                    secondary={
                      <Typography 
                        component="a" 
                        href="tel:+1234567890"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        (123) 456-7890
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <LocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Campus Office"
                    secondary="Student Center, Room 123"
                  />
                </ListItem>
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <TimeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Support Hours"
                    secondary="Monday - Friday: 9:00 AM - 5:00 PM"
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  fontWeight: 500,
                  color: 'text.secondary',
                }}
              >
                Need immediate assistance?
              </Typography>
              <Button 
                component={Link}
                to="/help-center"
                variant="outlined" 
                color="primary"
                startIcon={<HelpIcon />}
                fullWidth
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
                  },
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                Visit Help Center
              </Button>
            </Paper>
          </Fade>
        </Grid>
        
        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Fade in={true} style={{ transitionDelay: '200ms' }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                background: theme.palette.background.paper,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '6px',
                  background: isDarkMode
                    ? 'linear-gradient(to right, #1565C0, #1976D2)'
                    : 'linear-gradient(to right, #2196F3, #64B5F6)',
                }
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                <SendIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                Send Us a Message
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl 
                      fullWidth 
                      error={!!errors.topic}
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    >
                      <InputLabel>Topic</InputLabel>
                      <Select
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        label="Topic"
                      >
                        {topics.map((topic) => (
                          <MenuItem key={topic.value} value={topic.value}>
                            {topic.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.topic && (
                        <FormHelperText>{errors.topic}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      error={!!errors.message}
                      helperText={errors.message}
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      startIcon={!isSubmitting && <SendIcon />}
                      disabled={isSubmitting}
                      sx={{ 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(33, 150, 243, 0.3)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                    >
                      {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Fade>
        </Grid>
      </Grid>
      
      {/* FAQs Section */}
      <Box sx={{ mt: 6, mb: 2 }}>
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
          Frequently Asked Questions
        </Typography>
        
        <Typography 
          variant="subtitle1" 
          paragraph 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: 900 }}
        >
          Find quick answers to common questions about contacting our support team.
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Fade in={true} style={{ transitionDelay: '100ms' }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: isDarkMode
                    ? '0 8px 24px rgba(0,0,0,0.3)'
                    : '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                What are your response times?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                We typically respond to all inquiries within 24-48 hours during business days. For urgent matters, 
                please call our support line or visit our campus office.
              </Typography>
            </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Fade in={true} style={{ transitionDelay: '200ms' }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: isDarkMode
                    ? '0 8px 24px rgba(0,0,0,0.3)'
                    : '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Can I visit the office in person?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Yes, our campus office is open Monday through Friday from 9:00 AM to 5:00 PM. 
                We're located in the Student Center, Room 123.
              </Typography>
            </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Fade in={true} style={{ transitionDelay: '300ms' }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: isDarkMode
                    ? '0 8px 24px rgba(0,0,0,0.3)'
                    : '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                How do I report inappropriate content?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                You can report inappropriate content through the reporting feature on any listing or user profile. 
                For immediate concerns, contact our support team directly.
              </Typography>
            </Paper>
          </Fade>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Fade in={true} style={{ transitionDelay: '400ms' }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: isDarkMode
                    ? '0 8px 24px rgba(0,0,0,0.3)'
                    : '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                What if I have account issues?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                For account-related issues, please use our contact form and select "Technical Support" as the topic. 
                Our team will assist you in resolving any account problems.
              </Typography>
            </Paper>
          </Fade>
        </Grid>
      </Grid>
      
      {/* Success Message */}
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
          }}
        >
          Thank you for your message! We'll get back to you soon.
        </Alert>
      </Snackbar>
      
      {/* Error Message */}
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContactUsPage; 