import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Sell as SellIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Chat as ChatIcon,
  Report as ReportIcon,
  HelpOutline as HelpOutlineIcon,
  Article as ArticleIcon,
  VideoLibrary as VideoLibraryIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('account');

  const handleSearch = (e) => {
    e.preventDefault();
    // In a real implementation, this would filter or search through help content
    console.log('Searching for:', searchQuery);
  };

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategory(isExpanded ? category : false);
  };

  // Help categories with FAQs
  const helpCategories = [
    {
      id: 'account',
      title: 'Account & Profile',
      icon: <PersonIcon />,
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'To create an account, click on the "Sign Up" button in the top right corner of the homepage. Fill in your student email, password, and other required information. Verify your email, and your account will be active.',
        },
        {
          question: 'How do I reset my password?',
          answer: 'Click on "Login", then "Forgot Password". Enter your email address, and we\'ll send you a link to reset your password. Follow the instructions in the email to create a new password.',
        },
        {
          question: 'How do I edit my profile information?',
          answer: 'After logging in, click on your profile icon in the top right corner, then select "Profile Settings". Here you can edit your personal information, change your password, and manage your notification preferences.',
        },
        {
          question: 'How do I delete my account?',
          answer: 'Go to "Profile Settings", scroll to the bottom and click on "Delete Account". Please note that this action is irreversible and all your listings and messages will be permanently deleted.',
        },
      ],
    },
    {
      id: 'buying',
      title: 'Buying Items',
      icon: <ShoppingCartIcon />,
      faqs: [
        {
          question: 'How do I search for items?',
          answer: 'Use the search bar at the top of the page to find specific items. You can also browse categories by clicking on them from the homepage.',
        },
        {
          question: 'How do I contact a seller?',
          answer: 'On an item listing page, click the "Contact Seller" button to send a message. You can discuss details, ask questions, or negotiate the price.',
        },
        {
          question: 'How do I make an offer?',
          answer: 'On the listing page, click "Make an Offer". Enter your proposed price and any message to the seller. They can accept, decline, or counter your offer.',
        },
        {
          question: 'What should I do if an item is not as described?',
          answer: 'Contact the seller first to resolve the issue. If that doesn\'t work, report the issue to us through the "Report a Problem" button on the listing page.',
        },
      ],
    },
    {
      id: 'selling',
      title: 'Selling Items',
      icon: <SellIcon />,
      faqs: [
        {
          question: 'How do I create a listing?',
          answer: 'Click on "Sell" in the navigation bar. Fill out the form with details about your item, upload photos, set a price, and select a category. Then click "Publish Listing".',
        },
        {
          question: 'How do I edit or delete my listing?',
          answer: 'Go to "My Listings" in your profile. Find the listing you want to modify, and click "Edit" or "Delete". Make your changes and save, or confirm the deletion.',
        },
        {
          question: 'How should I price my items?',
          answer: 'Research similar items on the platform to see typical prices. Consider factors like the item\'s condition, original price, age, and demand among students.',
        },
        {
          question: 'How can I promote my listing?',
          answer: 'Take clear, high-quality photos, write detailed descriptions, choose the correct category, and respond quickly to inquiries. Keep your listings updated and consider lowering the price if it doesn\'t sell.',
        },
      ],
    },
    {
      id: 'payments',
      title: 'Payments & Transactions',
      icon: <PaymentIcon />,
      faqs: [
        {
          question: 'What payment methods are accepted?',
          answer: 'Our platform is primarily for connecting buyers and sellers. You and the other party can agree on payment methods like cash, mobile money, or bank transfers. Always prioritize secure transactions.',
        },
        {
          question: 'Is it safe to pay with cash?',
          answer: 'Cash payments in person are common for student marketplaces. Meet in a safe, public location on campus, and consider bringing a friend for larger transactions.',
        },
        {
          question: 'What should I do if I encounter a payment issue?',
          answer: 'First, try to resolve it directly with the other party. If that fails, contact our support team with details of the transaction for assistance.',
        },
        {
          question: 'Does the platform charge any fees?',
          answer: 'Currently, there are no fees for basic listings and transactions. Premium features like promoted listings may have associated costs, which will be clearly indicated.',
        },
      ],
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      icon: <SecurityIcon />,
      faqs: [
        {
          question: 'How can I ensure safe transactions?',
          answer: 'Always meet in public places on campus, like the student center or library. Inform a friend about your meeting. Inspect items before payment. Use our in-app messaging for all communications.',
        },
        {
          question: 'How do I report suspicious activity?',
          answer: 'Use the "Report" button on listings or user profiles. Provide detailed information about why you\'re reporting, and our moderation team will review it promptly.',
        },
        {
          question: 'What items are prohibited on the platform?',
          answer: 'Prohibited items include illegal goods, weapons, alcohol, tobacco, drugs, counterfeit items, adult content, and services that violate academic integrity. See our Terms of Use for the complete list.',
        },
        {
          question: 'What personal information should I avoid sharing?',
          answer: 'Never share your password, financial information like bank details, or personal identification like ID numbers. Limit sharing your phone number or address until you\'re comfortable with the other party.',
        },
      ],
    },
    {
      id: 'messaging',
      title: 'Messaging & Communication',
      icon: <ChatIcon />,
      faqs: [
        {
          question: 'How do I message another user?',
          answer: 'On a listing page, click "Contact Seller" or on a user profile, click "Send Message". You can view and respond to all your conversations in the "Messages" section.',
        },
        {
          question: 'Can I block a user from messaging me?',
          answer: 'Yes, in any conversation, click on the user\'s name to view their profile, then click "Block User". They will no longer be able to contact you, and you won\'t see their listings.',
        },
        {
          question: 'Are my messages private?',
          answer: 'Yes, your messages are private between you and the other user. However, in case of reported violations, our moderation team may review message content.',
        },
        {
          question: 'Why am I not receiving message notifications?',
          answer: 'Check your notification settings in your profile. Ensure you haven\'t disabled email or push notifications. Also, check your spam folder if using email notifications.',
        },
      ],
    },
  ];

  // Popular help topics
  const popularTopics = [
    {
      title: 'Creating Your First Listing',
      icon: <ArticleIcon fontSize="large" color="primary" />,
      description: 'Learn how to create attractive listings that sell quickly',
      link: '#',
    },
    {
      title: 'Safe Meeting Locations',
      icon: <SecurityIcon fontSize="large" color="primary" />,
      description: 'Best places on campus to meet for item exchanges',
      link: '/safety-tips',
    },
    {
      title: 'Understanding User Ratings',
      icon: <PersonIcon fontSize="large" color="primary" />,
      description: 'How the rating system works and why it matters',
      link: '#',
    },
    {
      title: 'Reporting Problems',
      icon: <ReportIcon fontSize="large" color="primary" />,
      description: 'When and how to report issues with users or listings',
      link: '#',
    },
  ];

  // Video tutorials
  const videoTutorials = [
    {
      title: 'How to Create a Perfect Listing',
      thumbnail: 'https://via.placeholder.com/300x170',
      duration: '3:45',
      link: '#',
    },
    {
      title: 'Tips for Safe Transactions',
      thumbnail: 'https://via.placeholder.com/300x170',
      duration: '4:20',
      link: '#',
    },
    {
      title: 'Negotiating Prices Successfully',
      thumbnail: 'https://via.placeholder.com/300x170',
      duration: '5:15',
      link: '#',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <HelpOutlineIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Help Center
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Get answers to your questions and learn how to make the most of Student Marketplace
        </Typography>
        
        {/* Search bar */}
        <Box component="form" onSubmit={handleSearch} sx={{ 
          display: 'flex',
          maxWidth: 600,
          mx: 'auto',
          mb: 6,
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px 0 0 50px',
              },
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: '0 50px 50px 0',
              px: 3,
            }}
          >
            Search
          </Button>
        </Box>
      </Box>
      
      {/* Popular topics section */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
        Popular Help Topics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {popularTopics.map((topic, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              component={Link}
              to={topic.link}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textDecoration: 'none',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {topic.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {topic.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {topic.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* FAQ section */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
        Frequently Asked Questions
      </Typography>
      <Paper elevation={2} sx={{ mb: 6, overflow: 'hidden', borderRadius: 2 }}>
        {helpCategories.map((category) => (
          <Accordion 
            key={category.id}
            expanded={expandedCategory === category.id}
            onChange={handleCategoryChange(category.id)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${category.id}-content`}
              id={`${category.id}-header`}
              sx={{ 
                backgroundColor: expandedCategory === category.id ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {category.icon}
                <Typography variant="h6">{category.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pb: 3, pt: 1 }}>
              {category.faqs.map((faq, index) => (
                <Box key={index} sx={{ mb: index < category.faqs.length - 1 ? 3 : 0 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {faq.question}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                  {index < category.faqs.length - 1 && (
                    <Divider sx={{ mt: 3 }} />
                  )}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
      
      {/* Video tutorials section */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
        Video Tutorials
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {videoTutorials.map((video, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6,
              },
            }}>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="170"
                  image={video.thumbnail}
                  alt={video.title}
                />
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 10, 
                  right: 10,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  px: 1,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                }}>
                  {video.duration}
                </Box>
                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                  },
                }}>
                  <VideoLibraryIcon sx={{ 
                    color: 'white', 
                    fontSize: 50,
                    opacity: 0.8,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      opacity: 1,
                    },
                  }} />
                </Box>
              </Box>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  {video.title}
                </Typography>
                <Button 
                  component="a" 
                  href={video.link}
                  variant="outlined" 
                  size="small"
                  endIcon={<VideoLibraryIcon />}
                >
                  Watch Video
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Contact support */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 6, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
              Can't find what you're looking for?
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Our support team is here to help with any questions or issues you might have.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary="Contact us through our support form" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: 'primary.contrastText' }}>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary="Response time: Usually within 24 hours" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Button 
              component={Link}
              to="/contact-us"
              variant="contained" 
              color="secondary"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Contact Support
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Resources */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
        Additional Resources
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Safety Tips
            </Typography>
            <Typography variant="body2" paragraph>
              Learn how to stay safe while buying and selling items with other students.
            </Typography>
            <Button 
              component={Link} 
              to="/safety-tips" 
              variant="text" 
              color="primary"
              endIcon={<SecurityIcon />}
            >
              View Safety Tips
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Terms of Use
            </Typography>
            <Typography variant="body2" paragraph>
              Understand the rules and policies that govern the use of our platform.
            </Typography>
            <Button 
              component={Link} 
              to="/terms-of-use" 
              variant="text" 
              color="primary"
              endIcon={<ArticleIcon />}
            >
              View Terms
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Community Guidelines
            </Typography>
            <Typography variant="body2" paragraph>
              Learn about our community standards and how to be a good marketplace citizen.
            </Typography>
            <Button 
              variant="text" 
              color="primary"
              endIcon={<PersonIcon />}
            >
              View Guidelines
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HelpCenterPage; 