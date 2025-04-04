import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { checkNotificationsTable, createNotificationsTable } from "../services/supabase";
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createSystemNotification } from "../services/notificationService";

const WelcomeNotification = () => {
  const { user } = useAuth();
  const { debugNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosticResults, setDiagnosticResults] = useState(null);

  const sendWelcomeNotification = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await createSystemNotification({
        userId: user.id,
        message: "Welcome to Student Marketplace! We're excited to have you join our community.",
        type: 'system'
      });
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send notification');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  const runNotificationDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setDiagnosticResults(null);
    
    try {
      // Check if notifications table exists
      const tableCheck = await checkNotificationsTable();
      
      // Run the context debugging
      debugNotifications();
      
      setDiagnosticResults({
        timestamp: new Date().toISOString(),
        tableCheck,
        user: user ? {
          id: user.id,
          email: user.email,
          isAuthenticated: !!user
        } : null,
      });
    } catch (err) {
      setError(`Diagnostics error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const attemptCreateTable = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createNotificationsTable();
      
      if (result.success) {
        setSuccess(true);
        // Run diagnostics again to verify
        await runNotificationDiagnostics();
      } else {
        setError(result.error || 'Failed to create notifications table');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Testing & Diagnostics
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Send yourself test notifications or run diagnostics to troubleshoot notification issues.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={sendWelcomeNotification}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Send Test Notification
            </Button>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={runNotificationDiagnostics}
              disabled={loading}
              color="info"
            >
              Run Diagnostics
            </Button>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={attemptCreateTable}
              disabled={loading}
              color="warning"
            >
              Create Table
            </Button>
          </Grid>
        </Grid>
        
        {diagnosticResults && (
          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Diagnostic Results</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Notifications Table Check:
                </Typography>
                <Alert 
                  severity={diagnosticResults.tableCheck.exists ? "success" : "error"}
                  sx={{ mb: 2 }}
                >
                  {diagnosticResults.tableCheck.exists 
                    ? "Notifications table exists" 
                    : "Notifications table does not exist or is not accessible"}
                </Alert>
                
                {diagnosticResults.tableCheck.error && (
                  <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                    Error: {diagnosticResults.tableCheck.error}
                  </Typography>
                )}
                
                {diagnosticResults.tableCheck.hint && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Hint: {diagnosticResults.tableCheck.hint}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  User Authentication:
                </Typography>
                {diagnosticResults.user ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    User is authenticated
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    User is not authenticated
                  </Alert>
                )}
                
                {diagnosticResults.user && (
                  <Typography variant="body2">
                    User ID: {diagnosticResults.user.id}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="caption" color="text.secondary">
                Diagnostics run at: {new Date(diagnosticResults.timestamp).toLocaleString()}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
      
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message="Operation completed successfully!"
      />
    </Card>
  );
};

export default WelcomeNotification; 