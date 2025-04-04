import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { alpha } from '@mui/material/styles';

const TermsOfUsePage = () => {
  const lastUpdated = "August 15, 2023";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const SectionTitle = ({ children, ...props }) => (
    <Typography 
      variant="h5" 
      component="h2" 
      gutterBottom 
      sx={{ 
        mt: 4, 
        color: 'primary.main',
        fontWeight: 600,
        position: 'relative',
        pb: 1,
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '60px',
          height: '3px',
          background: theme.palette.primary.main,
          borderRadius: '2px',
        },
        ...props.sx
      }}
    >
      {children}
    </Typography>
  );
  
  return (
    <Container maxWidth="md">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<KeyboardArrowRightIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mt: 3, mb: 1 }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: theme.palette.text.primary, textDecoration: 'none' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <GavelIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Terms of Use
        </Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ 
        py: 5, 
        textAlign: 'center',
        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        borderRadius: 2,
        color: theme.palette.primary.contrastText,
        mb: 4,
        mt: 2,
        px: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
        },
      }}>
        <GavelIcon sx={{ fontSize: 64, mb: 2, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
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
          Terms of Use
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            opacity: 0.9, 
            maxWidth: 700, 
            mx: 'auto',
            fontWeight: 500,
          }}
        >
          Last Updated: {lastUpdated}
        </Typography>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          mb: 6, 
          borderRadius: 2,
          boxShadow: '0 6px 24px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Alert 
          severity="info" 
          variant="outlined"
          sx={{ 
            mb: 4,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center',
            },
          }}
        >
          <Typography variant="body1" fontWeight={500}>
            Please read these Terms of Use carefully before using Student Marketplace. By using our platform, you agree to be bound by these terms.
          </Typography>
        </Alert>
        
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            lineHeight: 1.7,
            color: 'text.primary',
            fontSize: '1.05rem',
          }}
        >
          Welcome to Student Marketplace. These Terms of Use govern your use of our website, mobile applications, and services (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use our Platform.
        </Typography>
        
        <SectionTitle>
          1. Account Registration and Eligibility
        </SectionTitle>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          1.1. To use certain features of the Platform, you must register for an account. When you register, you agree to provide accurate, current, and complete information.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          1.2. You must be at least 18 years old and enrolled in or affiliated with an accredited educational institution to use the Platform.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          1.3. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          1.4. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          1.5. We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
        </Typography>
        
        <SectionTitle>
          2. User Conduct and Responsibilities
        </SectionTitle>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          2.1. You agree not to use the Platform to:
        </Typography>
        <List sx={{ backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#f8f9fa', borderRadius: 2, p: 2, mb: 2 }}>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Post or transmit content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable." 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity." 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Upload, post, or transmit content that infringes upon any patent, trademark, trade secret, copyright, or other proprietary rights." 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Upload, post, or transmit unsolicited commercial content or spam." 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Interfere with or disrupt the Platform or servers or networks connected to the Platform." 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          2.2. You are solely responsible for all content that you upload, post, or transmit through the Platform.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          2.3. You agree to comply with all applicable laws and regulations in connection with your use of the Platform.
        </Typography>
        
        <SectionTitle>
          3. Prohibited Items
        </SectionTitle>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          3.1. You agree not to list, offer, or sell the following prohibited items on the Platform:
        </Typography>
        <List sx={{ backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#f8f9fa', borderRadius: 2, p: 2, mb: 2 }}>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Illegal items, controlled substances, drugs, and drug paraphernalia" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Weapons, ammunition, and explosives" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Alcohol, tobacco, and e-cigarettes" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Counterfeit items, stolen goods, or items that infringe upon intellectual property rights" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Pornography, adult content, or sexually explicit materials" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Hazardous materials or recalled products" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Personal or financial information of others" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Items that promote hate, violence, racial intolerance, or organizations that promote such views" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Human remains or body parts" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Academic services that violate academic integrity policies, including essay writing services or exam-taking services" />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          3.2. We reserve the right to remove any listing that we believe violates these prohibitions or other platform policies.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          4. Intellectual Property
        </Typography>
        <Typography variant="body1" paragraph>
          4.1. The Platform and its content, features, and functionality are owned by Student Marketplace and are protected by copyright, trademark, and other intellectual property laws.
        </Typography>
        <Typography variant="body1" paragraph>
          4.2. You may not copy, modify, create derivative works from, publicly display, republish, or distribute any material from our Platform without prior written consent.
        </Typography>
        <Typography variant="body1" paragraph>
          4.3. By posting content on the Platform, you grant us a non-exclusive, royalty-free, perpetual, irrevocable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content throughout the world in any media.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          5. Privacy
        </Typography>
        <Typography variant="body1" paragraph>
          5.1. Our Privacy Policy, which is incorporated into these Terms of Use by reference, explains how we collect, use, and protect your information.
        </Typography>
        <Typography variant="body1" paragraph>
          5.2. By using the Platform, you consent to our collection and use of personal data as outlined in our Privacy Policy.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          6. Transaction Terms
        </Typography>
        <Typography variant="body1" paragraph>
          6.1. The Platform serves as a venue for students to buy, sell, and exchange items and services. We are not a party to any transaction between users.
        </Typography>
        <Typography variant="body1" paragraph>
          6.2. All transactions are conducted between users at their own risk. We do not guarantee the quality, safety, or legality of items listed, the truth or accuracy of listings, or that users will complete transactions.
        </Typography>
        <Typography variant="body1" paragraph>
          6.3. You agree to use our Platform's messaging system for all initial communications regarding transactions. Moving communications off-platform prematurely may increase the risk of fraud.
        </Typography>
        <Typography variant="body1" paragraph>
          6.4. You are responsible for complying with all applicable tax laws, including reporting and paying any taxes due on your transactions.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          7. Disclaimer of Warranties
        </Typography>
        <Typography variant="body1" paragraph>
          7.1. THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
        </Typography>
        <Typography variant="body1" paragraph>
          7.2. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </Typography>
        <Typography variant="body1" paragraph>
          7.3. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          8. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          8.1. TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE PLATFORM.
        </Typography>
        <Typography variant="body1" paragraph>
          8.2. OUR TOTAL LIABILITY TO YOU FOR ANY DAMAGES, REGARDLESS OF THE FORM OF ACTION, SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US, IF ANY, IN THE PAST SIX MONTHS OR (B) $100.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          9. Indemnification
        </Typography>
        <Typography variant="body1" paragraph>
          9.1. You agree to indemnify, defend, and hold harmless Student Marketplace and its officers, directors, employees, agents, and representatives from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or relating to:
        </Typography>
        <List sx={{ backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#f8f9fa', borderRadius: 2, p: 2, mb: 2 }}>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Your violation of these Terms of Use" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Your content posted on the Platform" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Your use of the Platform" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Your violation of any law or the rights of a third party" />
          </ListItem>
        </List>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          10. Termination
        </Typography>
        <Typography variant="body1" paragraph>
          10.1. We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms of Use.
        </Typography>
        <Typography variant="body1" paragraph>
          10.2. Upon termination, your right to use the Platform will immediately cease, and you must cease all use of the Platform and delete any copies of Platform materials in your possession.
        </Typography>
        <Typography variant="body1" paragraph>
          10.3. Sections 4, 5, 7, 8, 9, and any provisions that by their nature should survive, will survive termination of these Terms of Use.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          11. Modifications to Terms of Use
        </Typography>
        <Typography variant="body1" paragraph>
          11.1. We reserve the right to modify these Terms of Use at any time. We will provide notice of significant changes by posting the new Terms of Use on the Platform and updating the "Last Updated" date.
        </Typography>
        <Typography variant="body1" paragraph>
          11.2. Your continued use of the Platform after any changes constitutes your acceptance of the new Terms of Use.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          12. Governing Law and Dispute Resolution
        </Typography>
        <Typography variant="body1" paragraph>
          12.1. These Terms of Use shall be governed by and construed in accordance with the laws of the state where our primary office is located, without regard to its conflict of law provisions.
        </Typography>
        <Typography variant="body1" paragraph>
          12.2. Any dispute arising from these Terms of Use shall first be resolved through informal negotiation. If the dispute cannot be resolved informally, it shall be submitted to binding arbitration in accordance with the rules of the American Arbitration Association.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, color: 'primary.main' }}>
          13. Miscellaneous
        </Typography>
        <Typography variant="body1" paragraph>
          13.1. These Terms of Use constitute the entire agreement between you and Student Marketplace regarding the Platform and supersede all prior agreements and understandings.
        </Typography>
        <Typography variant="body1" paragraph>
          13.2. Our failure to enforce any right or provision of these Terms of Use will not be considered a waiver of such right or provision.
        </Typography>
        <Typography variant="body1" paragraph>
          13.3. If any provision of these Terms of Use is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced.
        </Typography>
        <Typography variant="body1" paragraph>
          13.4. You may not assign or transfer these Terms of Use without our prior written consent, but we may assign or transfer these Terms of Use without your consent.
        </Typography>
        
        <Divider sx={{ my: 5, borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.5) : 'rgba(0, 0, 0, 0.08)' }} />
        
        <Box sx={{ 
          mt: 6, 
          mb: 4, 
          textAlign: 'center',
          p: 3,
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.2) : 'rgba(0, 0, 0, 0.02)',
          borderRadius: 2,
        }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms of Use, please contact us at:
          </Typography>
          <Typography 
            variant="body1" 
            gutterBottom 
            fontWeight="medium"
            sx={{ 
              color: theme.palette.primary.main, 
              fontSize: '1.1rem',
              mb: 2,
            }}
          >
            support@studentmarketplace.com
          </Typography>
          <Button 
            component={Link}
            to="/contact-us"
            variant="contained" 
            color="primary"
            size="large"
            sx={{ 
              mt: 2,
              px: 3,
              py: 1,
              borderRadius: '50px',
              boxShadow: theme.palette.mode === 'dark' 
                ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                : '0 4px 12px rgba(25, 118, 210, 0.2)',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 6px 16px ${alpha(theme.palette.primary.main, 0.5)}`
                  : '0 6px 16px rgba(25, 118, 210, 0.3)',
                transform: 'translateY(-2px)',
              },
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Contact Support
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfUsePage; 