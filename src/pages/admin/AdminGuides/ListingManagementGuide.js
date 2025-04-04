import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  AlertTitle,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Dangerous as DangerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ListingManagementGuide = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Administrator Listing Management Guide
      </Typography>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Prerequisites
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Before using the listing deletion functionality, you need to run a database migration to set up the required permissions.
        </Alert>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Step 1: Run the Admin Listing Policies migration
          </Typography>
          <Typography variant="body2" paragraph>
            Visit the Database Migrations page and run the "Admin Listing Management Policies" migration. This will add the necessary database permissions for administrators to manage all listings.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/admin/run-migrations')}
            sx={{ mt: 1 }}
          >
            Go to Database Migrations
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Step 2: Run the Admin Listing Deletion Functions migration
          </Typography>
          <Typography variant="body2" paragraph>
            After running the permissions migration, also run the "Admin Listing Deletion Functions" migration. This creates special database functions that avoid the ambiguous column reference errors when deleting listings.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This step is critical for resolving the "column reference 'seller_id' is ambiguous" error.
          </Alert>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Troubleshooting Migration Issues
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>If you encounter errors while running the migration:</AlertTitle>
            <Typography variant="body2">
              • If you see an error about "null value in column admin_id", the migration has been updated to fix this issue. Refresh the page and try again.
            </Typography>
            <Typography variant="body2">
              • If you encounter the "column reference 'seller_id' is ambiguous" error when deleting listings, make sure you've run the "Admin Listing Deletion Functions" migration.
            </Typography>
            <Typography variant="body2">
              • If policies already exist, you may see an error about duplicate policies. This is normal and can be ignored.
            </Typography>
            <Typography variant="body2">
              • Make sure you have admin privileges to access the listing management section.
            </Typography>
          </Alert>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" gutterBottom>
          Listing Deletion Features
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Warning</AlertTitle>
          Listing deletion is permanent and cannot be undone. Use this functionality with caution.
        </Alert>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Individual Listings" 
              secondary="You can delete individual listings using the delete button in the actions column or from the listing details dialog." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Bulk Delete Listings" 
              secondary="Select multiple listings using the checkboxes and use the 'Delete Selected' button to delete them in a single operation." 
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Audit Logging
        </Typography>
        
        <Typography variant="body2" paragraph>
          All listing deletion actions are automatically logged in the admin audit log for accountability and tracking purposes. Each log entry includes:
        </Typography>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip icon={<InfoIcon />} label="Admin who performed the action" />
          <Chip icon={<InfoIcon />} label="Date and time" />
          <Chip icon={<InfoIcon />} label="Listing details" />
          <Chip icon={<InfoIcon />} label="Listing ID" />
        </Stack>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<CheckCircleIcon />}
          onClick={() => navigate('/admin/audit-log')}
          sx={{ mt: 1 }}
        >
          View Audit Log
        </Button>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/admin/listings')}
          sx={{ mr: 2 }}
        >
          Go to Listing Management
        </Button>
        <Button 
          variant="outlined"
          onClick={() => navigate('/admin')}
        >
          Back to Admin Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default ListingManagementGuide; 