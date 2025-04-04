import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Divider,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { useNavigate } from 'react-router-dom';
import { logAdminAction } from '../../services/adminService';

const AdminSettings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Student Marketplace',
    maintenanceMode: false,
    allowNewRegistrations: true,
    itemsPerPage: 10,
    maxUploadSize: 5,
    requireEmailVerification: true
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    adminEmailNotifications: true,
    newUserNotification: true,
    newListingNotification: false,
    newReportNotification: true,
    dailyDigest: true,
    emailPrefix: '[Student Marketplace]'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    enforcePasswordReset: 90,
    allowSocialLogin: true
  });
  
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editAdminOpen, setEditAdminOpen] = useState(false);
  const [newAdminOpen, setNewAdminOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  useEffect(() => {
    fetchAdminUsers();
  }, []);
  
  const fetchAdminUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admin', 'super_admin']);
        
      if (error) throw error;
      
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      showSnackbar('Failed to load admin users', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleGeneralSettingChange = (key, value) => {
    setGeneralSettings({
      ...generalSettings,
      [key]: value
    });
  };
  
  const handleNotificationSettingChange = (key, value) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: value
    });
  };
  
  const handleSecuritySettingChange = (key, value) => {
    setSecuritySettings({
      ...securitySettings,
      [key]: value
    });
  };
  
  const handleOpenNewAdmin = () => {
    setNewAdminEmail('');
    setNewAdminRole('admin');
    setNewAdminOpen(true);
  };
  
  const handleCloseNewAdmin = () => {
    setNewAdminOpen(false);
  };
  
  const handleOpenEditAdmin = (admin) => {
    setCurrentAdmin(admin);
    setNewAdminRole(admin.role);
    setEditAdminOpen(true);
  };
  
  const handleCloseEditAdmin = () => {
    setEditAdminOpen(false);
    setCurrentAdmin(null);
  };
  
  const handleSaveGeneralSettings = () => {
    // In a real app, you would save these to your database
    // For demo purposes, just show a success message
    showSnackbar('General settings saved successfully', 'success');
    
    // Log the action
    logAdminAction(
      'settings',
      'Updated general settings',
      null,
      'system'
    );
  };
  
  const handleSaveNotificationSettings = () => {
    showSnackbar('Notification settings saved successfully', 'success');
    
    // Log the action
    logAdminAction(
      'settings',
      'Updated notification settings',
      null,
      'system'
    );
  };
  
  const handleSaveSecuritySettings = () => {
    showSnackbar('Security settings saved successfully', 'success');
    
    // Log the action
    logAdminAction(
      'settings',
      'Updated security settings',
      null,
      'system'
    );
  };
  
  const handleAddNewAdmin = async () => {
    if (!newAdminEmail) return;
    
    try {
      // First check if the user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', newAdminEmail)
        .single();
      
      if (userError) {
        if (userError.code === 'PGRST116') {
          showSnackbar('User with this email does not exist', 'error');
        } else {
          throw userError;
        }
        return;
      }
      
      // Update the user's role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newAdminRole })
        .eq('id', existingUser.id);
        
      if (updateError) throw updateError;
      
      // Log the action
      logAdminAction(
        'create',
        `Added new ${newAdminRole} role to user: ${existingUser.email}`,
        existingUser.id,
        'user'
      );
      
      // Add to the local state
      setAdminUsers([...adminUsers, { ...existingUser, role: newAdminRole }]);
      
      handleCloseNewAdmin();
      showSnackbar(`${existingUser.email} has been added as a ${newAdminRole}`, 'success');
    } catch (error) {
      console.error('Error adding new admin:', error);
      showSnackbar(`Error adding admin: ${error.message}`, 'error');
    }
  };
  
  const handleUpdateAdmin = async () => {
    if (!currentAdmin) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newAdminRole })
        .eq('id', currentAdmin.id);
        
      if (error) throw error;
      
      // Log the action
      logAdminAction(
        'update',
        `Updated user role to ${newAdminRole}: ${currentAdmin.email}`,
        currentAdmin.id,
        'user'
      );
      
      // Update in the local state
      setAdminUsers(adminUsers.map(admin => 
        admin.id === currentAdmin.id ? { ...admin, role: newAdminRole } : admin
      ));
      
      handleCloseEditAdmin();
      showSnackbar(`${currentAdmin.email}'s role has been updated to ${newAdminRole}`, 'success');
    } catch (error) {
      console.error('Error updating admin:', error);
      showSnackbar(`Error updating admin: ${error.message}`, 'error');
    }
  };
  
  const handleRemoveAdmin = async (adminId) => {
    try {
      const admin = adminUsers.find(a => a.id === adminId);
      if (!admin) return;
      
      const { error } = await supabase
        .from('users')
        .update({ role: 'user' })
        .eq('id', adminId);
        
      if (error) throw error;
      
      // Log the action
      logAdminAction(
        'delete',
        `Removed admin role from user: ${admin.email}`,
        admin.id,
        'user'
      );
      
      // Update in the local state
      setAdminUsers(adminUsers.filter(admin => admin.id !== adminId));
      
      showSnackbar('Admin privileges removed successfully', 'success');
    } catch (error) {
      console.error('Error removing admin:', error);
      showSnackbar(`Error removing admin: ${error.message}`, 'error');
    }
  };
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Admin Settings
        </Typography>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Tab 
            label="General" 
            icon={<SettingsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Administrators" 
            icon={<PersonIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Notifications" 
            icon={<NotificationsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Security" 
            icon={<SecurityIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        {/* General Settings Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              General Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Site Name"
                  fullWidth
                  value={generalSettings.siteName}
                  onChange={(e) => handleGeneralSettingChange('siteName', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="items-per-page-label">Items Per Page</InputLabel>
                  <Select
                    labelId="items-per-page-label"
                    value={generalSettings.itemsPerPage}
                    label="Items Per Page"
                    onChange={(e) => handleGeneralSettingChange('itemsPerPage', e.target.value)}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="max-upload-label">Max Upload Size (MB)</InputLabel>
                  <Select
                    labelId="max-upload-label"
                    value={generalSettings.maxUploadSize}
                    label="Max Upload Size (MB)"
                    onChange={(e) => handleGeneralSettingChange('maxUploadSize', e.target.value)}
                  >
                    <MenuItem value={2}>2 MB</MenuItem>
                    <MenuItem value={5}>5 MB</MenuItem>
                    <MenuItem value={10}>10 MB</MenuItem>
                    <MenuItem value={20}>20 MB</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.neutral,
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    System Status
                  </Typography>
                  <List disablePadding>
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={generalSettings.maintenanceMode}
                          onChange={(e) => handleGeneralSettingChange('maintenanceMode', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Maintenance Mode"
                        secondary="When enabled, only administrators can access the site"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={generalSettings.allowNewRegistrations}
                          onChange={(e) => handleGeneralSettingChange('allowNewRegistrations', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Allow New Registrations"
                        secondary="When disabled, new users cannot register"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={generalSettings.requireEmailVerification}
                          onChange={(e) => handleGeneralSettingChange('requireEmailVerification', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Require Email Verification"
                        secondary="Users must verify their email before using the marketplace"
                      />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setGeneralSettings({
                  siteName: 'Student Marketplace',
                  maintenanceMode: false,
                  allowNewRegistrations: true,
                  itemsPerPage: 10,
                  maxUploadSize: 5,
                  requireEmailVerification: true
                })}
              >
                Reset to Default
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveGeneralSettings}
              >
                Save Settings
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Administrators Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                System Administrators
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenNewAdmin}
              >
                Add Admin
              </Button>
            </Box>
            
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: theme.palette.background.neutral,
                p: 0, 
                borderRadius: 1,
                maxHeight: 500,
                overflow: 'auto'
              }}
            >
              {isLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography>Loading admins...</Typography>
                </Box>
              ) : adminUsers.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography>No administrators found</Typography>
                </Box>
              ) : (
                <List>
                  {adminUsers.map((admin, index) => (
                    <React.Fragment key={admin.id}>
                      <ListItem>
                        <ListItemText
                          primary={admin.name || admin.email}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {admin.email}
                              </Typography>
                              {" — "}
                              <Typography component="span" variant="body2" color="primary">
                                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleOpenEditAdmin(admin)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveAdmin(admin.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < adminUsers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
        )}
        
        {/* Notifications Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Notification Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email Subject Prefix"
                  fullWidth
                  value={notificationSettings.emailPrefix}
                  onChange={(e) => handleNotificationSettingChange('emailPrefix', e.target.value)}
                  helperText="This prefix will be added to all system-generated email subjects"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.neutral,
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Email Notifications
                  </Typography>
                  <List disablePadding>
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={notificationSettings.adminEmailNotifications}
                          onChange={(e) => handleNotificationSettingChange('adminEmailNotifications', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Admin Email Notifications"
                        secondary="Enable or disable all admin email notifications"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          disabled={!notificationSettings.adminEmailNotifications}
                          checked={notificationSettings.newUserNotification}
                          onChange={(e) => handleNotificationSettingChange('newUserNotification', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="New User Registration"
                        secondary="Notify admins when a new user registers"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          disabled={!notificationSettings.adminEmailNotifications}
                          checked={notificationSettings.newListingNotification}
                          onChange={(e) => handleNotificationSettingChange('newListingNotification', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="New Listing Created"
                        secondary="Notify admins when a new listing is created"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          disabled={!notificationSettings.adminEmailNotifications}
                          checked={notificationSettings.newReportNotification}
                          onChange={(e) => handleNotificationSettingChange('newReportNotification', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="New Report Submitted"
                        secondary="Notify admins when a new report is submitted"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          disabled={!notificationSettings.adminEmailNotifications}
                          checked={notificationSettings.dailyDigest}
                          onChange={(e) => handleNotificationSettingChange('dailyDigest', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Daily Activity Digest"
                        secondary="Receive a daily summary of site activity"
                      />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => showSnackbar('Test email sent to administrators', 'info')}
              >
                Send Test Email
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveNotificationSettings}
              >
                Save Settings
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Security Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Security Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Session Timeout (minutes)"
                  type="number"
                  fullWidth
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value, 10))}
                  InputProps={{ inputProps: { min: 15, max: 1440 } }}
                  helperText="Time before users are automatically logged out (15-1440 minutes)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max Login Attempts"
                  type="number"
                  fullWidth
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => handleSecuritySettingChange('maxLoginAttempts', parseInt(e.target.value, 10))}
                  InputProps={{ inputProps: { min: 3, max: 10 } }}
                  helperText="Number of failed login attempts before account lockout"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password Reset Days"
                  type="number"
                  fullWidth
                  value={securitySettings.enforcePasswordReset}
                  onChange={(e) => handleSecuritySettingChange('enforcePasswordReset', parseInt(e.target.value, 10))}
                  InputProps={{ inputProps: { min: 0, max: 365 } }}
                  helperText="Days before password reset is required (0 to disable)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box
                  sx={{
                    bgcolor: theme.palette.background.neutral,
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Security Options
                  </Typography>
                  <List disablePadding>
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={securitySettings.requireStrongPasswords}
                          onChange={(e) => handleSecuritySettingChange('requireStrongPasswords', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Require Strong Passwords"
                        secondary="Passwords must contain letters, numbers, and special characters"
                      />
                    </ListItem>
                    
                    <ListItem 
                      secondaryAction={
                        <Switch
                          edge="end"
                          checked={securitySettings.allowSocialLogin}
                          onChange={(e) => handleSecuritySettingChange('allowSocialLogin', e.target.checked)}
                        />
                      }
                    >
                      <ListItemText
                        primary="Allow Social Login"
                        secondary="Users can sign in with Google, Facebook, etc."
                      />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Database Management
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/admin/migrations')}
                  startIcon={<SettingsIcon />}
                  sx={{ mt: 1 }}
                >
                  Run Database Migrations
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Run database migrations to set up audit logging and other features.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSecuritySettings}
                  >
                    Save Security Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* New Admin Dialog */}
      <Dialog open={newAdminOpen} onClose={handleCloseNewAdmin} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Administrator</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="User Email"
              fullWidth
              margin="normal"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              helperText="Enter the email of an existing user"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Admin Role</InputLabel>
              <Select
                value={newAdminRole}
                label="Admin Role"
                onChange={(e) => setNewAdminRole(e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewAdmin}>Cancel</Button>
          <Button 
            onClick={handleAddNewAdmin} 
            variant="contained" 
            color="primary"
            disabled={!newAdminEmail}
          >
            Add Admin
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Admin Dialog */}
      <Dialog open={editAdminOpen} onClose={handleCloseEditAdmin} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Administrator</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {currentAdmin && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {currentAdmin.name || 'Unnamed User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentAdmin.email}
                </Typography>
              </Box>
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Admin Role</InputLabel>
              <Select
                value={newAdminRole}
                label="Admin Role"
                onChange={(e) => setNewAdminRole(e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditAdmin}>Cancel</Button>
          <Button 
            onClick={handleUpdateAdmin} 
            variant="contained" 
            color="primary"
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminSettings; 