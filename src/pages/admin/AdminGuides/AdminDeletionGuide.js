import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  AlertTitle,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Code,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as RunIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Help as HelpIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminDeletionGuide = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/admin/listings')}
          sx={{ mr: 2 }}
        >
          Back to Listings
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Admin Listing Deletion Guide
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Step 1: Run the Database Migration
        </Typography>
        
        <Typography variant="body1" paragraph>
          This simple solution will help you delete listings without encountering the "ambiguous seller_id" error.
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><PlayArrow color="primary" /></ListItemIcon>
            <ListItemText primary="Go to Admin Dashboard → Run Migrations" />
          </ListItem>
          <ListItem>
            <ListItemIcon><PlayArrow color="primary" /></ListItemIcon>
            <ListItemText primary="Find the 'Admin Listing Deletion Functions' migration" />
          </ListItem>
          <ListItem>
            <ListItemIcon><PlayArrow color="primary" /></ListItemIcon>
            <ListItemText primary="Click 'Run' to install the database functions" />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<RunIcon />}
            onClick={() => navigate('/admin/run-migrations')}
          >
            Go to Migrations
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          What This Does
        </Typography>
        
        <Typography variant="body1" paragraph>
          This creates two special functions in the database:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon><CodeIcon color="primary" /></ListItemIcon>
            <ListItemText 
              primary="admin_delete_listing" 
              secondary="Deletes a single listing safely" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CodeIcon color="primary" /></ListItemIcon>
            <ListItemText 
              primary="admin_bulk_delete_listings" 
              secondary="Deletes multiple listings at once" 
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Troubleshooting
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Function not found errors</AlertTitle>
          <Box component="pre" sx={{ 
            bgcolor: 'background.paper', 
            p: 1, 
            borderRadius: 1,
            fontSize: '0.8rem',
            overflowX: 'auto'
          }}>
            Error: Could not find the function public.admin_delete_listing(p_listing_id) in the schema cache
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This means the migration hasn't been run yet. Go to Admin Dashboard → Run Migrations and run the "Admin Listing Deletion Functions" migration.
          </Typography>
        </Alert>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Ambiguous column reference errors</AlertTitle>
          <Box component="pre" sx={{ 
            bgcolor: 'background.paper', 
            p: 1, 
            borderRadius: 1,
            fontSize: '0.8rem',
            overflowX: 'auto'
          }}>
            Error: column reference "seller_id" is ambiguous
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This happens when there's a conflict in the database. Our solution avoids this by:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Using fully qualified column names (listings.id instead of just id)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Using parameter names with prefixes (p_listing_id instead of listing_id)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Providing automatic fallbacks if the functions fail" />
            </ListItem>
          </List>
        </Alert>

        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Permission errors</AlertTitle>
          <Typography variant="body2">
            Make sure your admin user has the correct permissions. Check that:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><ErrorIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="The user has the 'admin' or 'super_admin' role in the database" />
            </ListItem>
            <ListItem>
              <ListItemIcon><ErrorIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="The user is properly authenticated" />
            </ListItem>
          </List>
        </Alert>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/admin/run-migrations')}
          sx={{ mr: 2 }}
        >
          Go to Migrations
        </Button>
        <Button 
          variant="outlined"
          onClick={() => navigate('/admin/listings')}
        >
          Back to Listings
        </Button>
      </Box>
    </Container>
  );
};

export default AdminDeletionGuide; 