import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Button,
  Link,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  Storage as DatabaseIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const AuditLogGuide = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';

  const codeStyle = isDarkMode ? vs2015 : undefined;

  const logActionExample = `// Import the logging function
import { logAdminAction } from './pages/admin/AdminAuditLog';

// Example function with logging
const handleDeleteUser = async (userId) => {
  try {
    // Get user details before deleting
    const user = users.find(u => u.id === userId);
    
    // Perform the action
    const { error } = await supabase
      .from('users')
      .update({ status: 'deleted' })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the action
    await logAdminAction(
      'delete',           // action type
      \`Deleted user: \${user.email}\`,  // details
      userId,             // target ID
      'user'              // target type
    );
    
    // Update UI or show success message
    showNotification('User deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};`;

  const sqlExample = `-- Example query to find all actions by a specific admin
SELECT * FROM admin_logs
WHERE admin_id = 'admin-user-id'
ORDER BY created_at DESC;

-- Example query to find all delete actions in the last week
SELECT * FROM admin_logs
WHERE action_type = 'delete'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;`;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/audit-log')}
          sx={{ mr: 2 }}
        >
          Back to Audit Log
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Audit Log System Guide
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HelpIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="medium">
            What is the Audit Log System?
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          The audit log system provides a complete record of administrative actions performed in the Student Marketplace platform.
          It helps maintain accountability, security, and compliance by tracking who did what, when, and to which entities.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          All administrative actions are automatically logged and cannot be modified or deleted
          (except by a super_admin for compliance with data retention policies).
        </Alert>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Paper
            elevation={2}
            sx={{ 
              p: 2, 
              flex: '1 1 calc(33% - 16px)', 
              minWidth: '250px',
              borderRadius: 2,
              backgroundColor: theme.palette.background.default
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="medium">
                Security
              </Typography>
            </Box>
            <Typography variant="body2">
              Ensures accountability by tracking who performed each action and when.
              Helps detect unauthorized access or suspicious activity patterns.
            </Typography>
          </Paper>
          
          <Paper
            elevation={2}
            sx={{ 
              p: 2, 
              flex: '1 1 calc(33% - 16px)', 
              minWidth: '250px',
              borderRadius: 2,
              backgroundColor: theme.palette.background.default
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <HistoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="medium">
                Compliance
              </Typography>
            </Box>
            <Typography variant="body2">
              Maintains records required for regulatory compliance and audits.
              Provides evidence of proper oversight and controls.
            </Typography>
          </Paper>
          
          <Paper
            elevation={2}
            sx={{ 
              p: 2, 
              flex: '1 1 calc(33% - 16px)', 
              minWidth: '250px',
              borderRadius: 2,
              backgroundColor: theme.palette.background.default
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VisibilityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="medium">
                Transparency
              </Typography>
            </Box>
            <Typography variant="body2">
              Creates transparency in administrative operations.
              Allows for review of past actions and decision-making.
            </Typography>
          </Paper>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CodeIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="medium">
            How to Use the Logging System
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          The audit log system provides a simple API to log actions from anywhere in the admin code.
          Import the <code>logAdminAction</code> function and call it after successful operations.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            The logAdminAction Function Parameters:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="primary.contrastText">1</Typography>
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="actionType" 
                secondary="The type of action performed: create, update, delete, view, settings, etc."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="primary.contrastText">2</Typography>
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="details" 
                secondary="A descriptive message explaining what was done."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="primary.contrastText">3</Typography>
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="targetId (optional)" 
                secondary="The ID of the entity being acted upon (user_id, listing_id, etc.)."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="primary.contrastText">4</Typography>
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary="targetType (optional)" 
                secondary="The type of entity being acted upon (user, listing, report, etc.)."
              />
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Example Code:
          </Typography>
          
          <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <SyntaxHighlighter
              language="javascript"
              style={codeStyle}
              customStyle={{ 
                borderRadius: '4px',
                padding: '16px',
                margin: 0
              }}
            >
              {logActionExample}
            </SyntaxHighlighter>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DatabaseIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="medium">
            Database Structure & Queries
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          The audit logs are stored in the <code>admin_logs</code> table in the database. 
          This table is optimized with indexes for fast querying and includes row-level security 
          policies to restrict access to admin users only.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Table Structure:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText 
                primary="id" 
                secondary="UUID primary key"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="admin_id" 
                secondary="UUID of the admin who performed the action (references users.id)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="action_type" 
                secondary="Type of action (create, update, delete, view, settings, etc.)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="details" 
                secondary="Descriptive message about the action"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="target_id" 
                secondary="ID of the entity acted upon"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="target_type" 
                secondary="Type of entity acted upon"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="ip_address" 
                secondary="IP address of the admin user"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="created_at" 
                secondary="Timestamp when the action occurred"
              />
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Example SQL Queries:
          </Typography>
          
          <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <SyntaxHighlighter
              language="sql"
              style={codeStyle}
              customStyle={{ 
                borderRadius: '4px',
                padding: '16px',
                margin: 0
              }}
            >
              {sqlExample}
            </SyntaxHighlighter>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BuildIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight="medium">
            Best Practices
          </Typography>
        </Box>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Log after successful actions" 
              secondary="Only log actions that were successfully completed, not attempts that failed."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Be descriptive but concise" 
              secondary="Include relevant details but avoid logging sensitive data or overly verbose information."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Use consistent action types" 
              secondary="Stick to the standard action types: create, update, delete, view, settings, bulk_action, etc."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Include target information" 
              secondary="Always provide target_id and target_type when acting on specific entities."
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Regularly review logs" 
              secondary="Set up a routine to review logs for unusual activities or patterns."
            />
          </ListItem>
        </List>
      </Paper>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/audit-log')}
        >
          Back to Audit Log
        </Button>
        
        <Link href="https://supabase.com/docs" target="_blank" rel="noopener">
          <Button>
            Supabase Documentation
          </Button>
        </Link>
      </Box>
    </Container>
  );
};

export default AuditLogGuide; 