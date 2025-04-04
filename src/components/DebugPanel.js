import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MessageIcon from '@mui/icons-material/Message';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { testDatabaseConnection, supabase, fixConversationParticipantsRLS, fixNotificationSystem as diagnoseNotificationSystem } from "../services/supabase";
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

const DebugPanel = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    badgeCounts, 
    debugNotifications 
  } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [checkingNotifications, setCheckingNotifications] = useState(false);

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message || "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if notification system is working properly
  const checkNotificationSystem = async () => {
    setCheckingNotifications(true);
    try {
      // Call the debugNotifications method from NotificationsContext
      debugNotifications();
      
      // Manually check notification badge counts
      const { data, error } = await supabase.rpc(
        'get_notification_badges',
        { user_uuid: user.id }
      );
      
      if (error) {
        throw error;
      }
      
      // Query the actual notifications table to verify
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('id, type, read, is_seen, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (notificationError) {
        throw notificationError;
      }
      
      // Count notifications by type
      const messageCount = notificationData.filter(n => n.type === 'message' && !n.read).length;
      const offerCount = notificationData.filter(n => (n.type === 'offer' || n.type === 'offer_response') && !n.read).length;
      const otherCount = notificationData.filter(n => n.type !== 'message' && n.type !== 'offer' && n.type !== 'offer_response' && !n.read).length;
      const total = notificationData.filter(n => !n.read).length;
      
      setNotificationStatus({
        success: true,
        rpcResponse: data,
        badgeCounts,
        unreadCount,
        actualCounts: {
          total,
          messages: messageCount,
          offers: offerCount,
          other: otherCount
        },
        notifications: notificationData
      });
    } catch (error) {
      setNotificationStatus({
        success: false,
        error: error.message || "Unknown error occurred"
      });
    } finally {
      setCheckingNotifications(false);
    }
  };
  
  // Fix notification issues
  const [fixingNotifications, setFixingNotifications] = useState(false);
  const [fixResults, setFixResults] = useState(null);
  
  const fixNotificationSystem = async () => {
    if (!user) return;
    
    setFixingNotifications(true);
    try {
      // Use the imported helper function
      const result = await diagnoseNotificationSystem(user.id);
      
      setFixResults(result);
      
      // Refresh notification status
      await checkNotificationSystem();
      
      return result;
    } catch (error) {
      setFixResults({
        success: false,
        error: error.message,
        steps: ['Error occurred during fix process']
      });
    } finally {
      setFixingNotifications(false);
    }
  };

  // Mask sensitive values if needed
  const maskValue = (value) => {
    if (!value) return 'Not defined';
    if (value.includes('eyJ')) {
      return value.substring(0, 10) + '...' + value.substring(value.length - 5);
    }
    return value;
  };

  const environmentVariables = [
    { name: 'REACT_APP_SUPABASE_URL', value: process.env.REACT_APP_SUPABASE_URL || 'Not defined' },
    { name: 'REACT_APP_SUPABASE_ANON_KEY', value: maskValue(process.env.REACT_APP_SUPABASE_ANON_KEY) },
    { name: 'NODE_ENV', value: process.env.NODE_ENV || 'Not defined' },
  ];

  const hardcodedVariables = [
    { name: 'supabaseUrl', value: 'https://ivdsmrlcbhanwafntncx.supabase.co' },
    { name: 'supabaseAnonKey', value: maskValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUyNTcsImV4cCI6MjA1OTAzMTI1N30.e6fflcrC6rsiiWVoThX_8qTYVcVXCPCSfjI7O_vUesM') }
  ];

  // Function to get user auth status
  const getAuthStatus = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      return {
        isAuthenticated: !!data.user,
        userId: data.user?.id || null,
        email: data.user?.email || null,
        metadata: data.user?.user_metadata || null
      };
    } catch (error) {
      console.error("Error checking auth status:", error);
      return { isAuthenticated: false, error: error.message };
    }
  };

  const [authState, setAuthState] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [autoRunComplete, setAutoRunComplete] = useState(false);
  const [creatingTestNotification, setCreatingTestNotification] = useState(false);
  const [testNotificationResult, setTestNotificationResult] = useState(null);

  const checkAuthStatus = async () => {
    setCheckingAuth(true);
    try {
      const status = await getAuthStatus();
      setAuthState(status);
    } catch (error) {
      setAuthState({ isAuthenticated: false, error: error.message });
    } finally {
      setCheckingAuth(false);
    }
  };

  const createTestNotification = async () => {
    if (!user) return;
    
    setCreatingTestNotification(true);
    try {
      // Create a test notification directly in the database
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          message: 'This is a test notification created from the Debug Panel',
          read: false,
          is_seen: false,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        setTestNotificationResult({
          success: false,
          error: error.message
        });
        throw error;
      }
      
      setTestNotificationResult({
        success: true,
        notification: data[0]
      });
      
      // Refresh notification status
      debugNotifications();
      await checkNotificationSystem();
      
    } catch (error) {
      console.error('Error creating test notification:', error);
      setTestNotificationResult({
        success: false,
        error: error.message
      });
    } finally {
      setCreatingTestNotification(false);
    }
  };

  // Create different types of test notifications
  const createTypedTestNotification = async (type) => {
    if (!user) return;
    
    setCreatingTestNotification(true);
    try {
      // Create message depending on type
      let message = '';
      let additionalFields = {};
      
      switch (type) {
        case 'message':
          message = 'You have a new test message';
          additionalFields = {
            conversation_id: '00000000-0000-0000-0000-000000000000', // placeholder UUID
            sender_id: user.id, // using the same user as sender for test
            preview: 'This is a preview of the test message'
          };
          break;
        case 'offer':
          message = 'You have a new test offer';
          additionalFields = {
            listing_id: '00000000-0000-0000-0000-000000000000' // placeholder UUID
          };
          break;
        case 'other':
          message = 'System notification for testing';
          break;
        default:
          message = `Test notification of type: ${type}`;
      }
      
      // Create a test notification directly in the database
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: type,
          message: message,
          read: false,
          is_seen: false,
          created_at: new Date().toISOString(),
          ...additionalFields
        })
        .select();
      
      if (error) {
        setTestNotificationResult({
          success: false,
          error: error.message,
          type: type
        });
        throw error;
      }
      
      setTestNotificationResult({
        success: true,
        notification: data[0],
        type: type
      });
      
      // Refresh notification status
      debugNotifications();
      await checkNotificationSystem();
      
    } catch (error) {
      console.error(`Error creating ${type} test notification:`, error);
      setTestNotificationResult({
        success: false,
        error: error.message,
        type: type
      });
    } finally {
      setCreatingTestNotification(false);
    }
  };

  // Automatically run diagnostics when the component loads
  useEffect(() => {
    if (user && !autoRunComplete) {
      const runAutoDiagnostics = async () => {
        try {
          console.log('Running automatic diagnostics...');
          await checkNotificationSystem();
          setAutoRunComplete(true);
        } catch (err) {
          console.error('Error during auto-diagnostics:', err);
        }
      };
      
      runAutoDiagnostics();
    }
  }, [user, autoRunComplete]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Supabase Connection Debug
        </Typography>

        <Divider sx={{ my: 2 }} />
        
        {/* Authentication Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Authentication Status
          </Typography>
          
          <Button 
            variant="outlined" 
            onClick={checkAuthStatus}
            disabled={checkingAuth}
            sx={{ mb: 2 }}
          >
            {checkingAuth ? 'Checking...' : 'Check Auth Status'}
          </Button>
          
          {authState && (
            <Alert 
              severity={authState.isAuthenticated ? "success" : "warning"}
              sx={{ mt: 1 }}
            >
              {authState.isAuthenticated 
                ? `Authenticated as ${authState.email}` 
                : 'Not authenticated'
              }
            </Alert>
          )}
          
          {authState && authState.isAuthenticated && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">User Info:</Typography>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '0.8rem',
                overflowX: 'auto'
              }}>
                {JSON.stringify(authState, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Configuration Variables</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h6" gutterBottom>
              Environment Variables
            </Typography>
            
            <List>
              {environmentVariables.map((variable) => (
                <ListItem key={variable.name} divider>
                  <ListItemText
                    primary={variable.name}
                    secondary={variable.value}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Hardcoded Values
            </Typography>
            
            <List>
              {hardcodedVariables.map((variable) => (
                <ListItem key={variable.name} divider>
                  <ListItemText
                    primary={variable.name}
                    secondary={variable.value}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Box>
              <Button 
                variant="contained" 
                onClick={runConnectionTest}
                disabled={isLoading}
                fullWidth
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'Testing...' : 'Test Database Connection'}
              </Button>

              {testResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={testResult.success ? 'success' : 'error'}>
                    {testResult.success 
                      ? 'Connection successful!'
                      : `Connection failed: ${testResult.error}`
                    }
                  </Alert>
                  
                  {testResult.success && testResult.data && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">
                        Response Data:
                      </Typography>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        overflowX: 'auto'
                      }}>
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </Box>
                  )}
                  
                  {!testResult.success && testResult.stage && (
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Failed at: ${testResult.stage}`} 
                        color="error" 
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <Button 
                variant="contained" 
                onClick={checkNotificationSystem}
                disabled={checkingNotifications || !user}
                fullWidth
                color="secondary"
                startIcon={checkingNotifications ? 
                  <CircularProgress size={20} color="inherit" /> : 
                  <NotificationsIcon />
                }
              >
                {checkingNotifications ? 'Checking...' : 'Test Notification System'}
              </Button>

              {notificationStatus && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={notificationStatus.success ? 'info' : 'error'}>
                    {notificationStatus.success 
                      ? 'Notification system check completed'
                      : `Notification check failed: ${notificationStatus.error}`
                    }
                  </Alert>
                  
                  {notificationStatus.success && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">
                        Badge Counts from Context:
                      </Typography>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        overflowX: 'auto'
                      }}>
                        {JSON.stringify(notificationStatus.badgeCounts, null, 2)}
                      </pre>
                      
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>
                        Actual Notification Counts:
                      </Typography>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        overflowX: 'auto'
                      }}>
                        {JSON.stringify(notificationStatus.actualCounts, null, 2)}
                      </pre>
                      
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>
                        RPC Response:
                      </Typography>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        overflowX: 'auto'
                      }}>
                        {JSON.stringify(notificationStatus.rpcResponse, null, 2)}
                      </pre>
                      
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>
                        Recent Notifications ({notificationStatus.notifications.length}):
                      </Typography>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        overflowX: 'auto',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(notificationStatus.notifications.slice(0, 10), null, 2)}
                      </pre>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Fix Notifications Button and Results */}
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={fixNotificationSystem}
                  disabled={fixingNotifications || !user}
                  fullWidth
                  startIcon={fixingNotifications ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {fixingNotifications ? 'Fixing Notifications...' : 'Fix Notification System'}
                </Button>
                
                {fixResults && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity={fixResults.success ? 'success' : 'warning'}>
                      {fixResults.success 
                        ? 'Notification system diagnosis complete' 
                        : 'Issues detected in notification system'
                      }
                    </Alert>
                    
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Diagnostic Steps:
                    </Typography>
                    <List dense sx={{ 
                      bgcolor: '#f5f5f5', 
                      borderRadius: '4px',
                      mt: 1,
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {fixResults.steps.map((step, index) => (
                        <ListItem key={index} divider={index < fixResults.steps.length - 1}>
                          <ListItemText 
                            primary={step}
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              fontFamily: 'monospace'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    {fixResults.errors.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2, color: 'error.main' }}>
                          Errors:
                        </Typography>
                        <List dense sx={{ 
                          bgcolor: '#fff0f0', 
                          borderRadius: '4px',
                          mt: 1,
                          mb: 2
                        }}>
                          {fixResults.errors.map((error, index) => (
                            <ListItem key={index} divider={index < fixResults.errors.length - 1}>
                              <ListItemText 
                                primary={error}
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  fontFamily: 'monospace',
                                  color: 'error.main'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </Box>
                )}
              </Box>
              
              {/* Create Test Notification Button */}
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={createTestNotification}
                  disabled={creatingTestNotification || !user}
                  fullWidth
                  startIcon={creatingTestNotification ? <CircularProgress size={20} color="inherit" /> : <NotificationsIcon />}
                >
                  {creatingTestNotification ? 'Creating...' : 'Create Test Notification'}
                </Button>
                
                {/* Buttons for specific notification types */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    disabled={creatingTestNotification || !user}
                    onClick={() => createTypedTestNotification('message')}
                    startIcon={<MessageIcon />}
                  >
                    Add Message Notification
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    disabled={creatingTestNotification || !user}
                    onClick={() => createTypedTestNotification('offer')}
                    startIcon={<LocalOfferIcon />}
                  >
                    Add Offer Notification
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    disabled={creatingTestNotification || !user}
                    onClick={() => createTypedTestNotification('other')}
                    startIcon={<NotificationsIcon />}
                  >
                    Add Other Notification
                  </Button>
                </Box>
                
                {testNotificationResult && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity={testNotificationResult.success ? 'success' : 'error'}>
                      {testNotificationResult.success 
                        ? `Test ${testNotificationResult.type || ''} notification created successfully!` 
                        : `Failed to create ${testNotificationResult.type || 'test'} notification: ${testNotificationResult.error}`
                      }
                    </Alert>
                    
                    {testNotificationResult.success && testNotificationResult.notification && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">
                          Created Notification:
                        </Typography>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          overflowX: 'auto'
                        }}>
                          {JSON.stringify(testNotificationResult.notification, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DebugPanel; 