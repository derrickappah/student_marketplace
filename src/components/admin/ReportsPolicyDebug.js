import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import { supabase } from '../../services/supabase';

/**
 * Debug component for fixing reports access policy issues
 * Add this component to the ReportsManagement page for admin debugging
 */
const ReportsPolicyDebug = () => {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sqlResponse, setSqlResponse] = useState(null);
  const [customSql, setCustomSql] = useState(
`-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;

-- Create the admin access policy for reports
CREATE POLICY "Admins can view all reports" ON reports 
  FOR SELECT
  USING (
    -- Check if the request is coming from the service_role (admin API)
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- Or if the user has admin privileges
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Add update policy for admins
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Add delete policy for admins
CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );`);

  useEffect(() => {
    checkPolicies();
    checkReports();
  }, []);

  const checkPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('admin_check_policies', {
        table_name: 'reports'
      });
      
      if (error) throw error;
      
      setPolicies(data || []);
    } catch (err) {
      console.error('Error checking policies:', err);
      setError('Could not check policies. You may need to create the admin_check_policies function.');
    } finally {
      setLoading(false);
    }
  };

  const checkReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .limit(5);
      
      if (error) throw error;
      
      setReports(data || []);
    } catch (err) {
      console.error('Error checking reports:', err);
      // Don't set error here as it would overwrite the policies error
    } finally {
      setLoading(false);
    }
  };

  const applyPolicies = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error } = await supabase.rpc('admin_execute_sql', {
        sql: customSql
      });
      
      if (error) throw error;
      
      setSqlResponse(data);
      setSuccess('Policies applied successfully. Please refresh the page to see if reports are now visible.');
      
      // Refresh policies and reports
      checkPolicies();
      checkReports();
    } catch (err) {
      console.error('Error applying policies:', err);
      setError('Could not apply policies. You may need to create the admin_execute_sql function or execute this SQL in the Supabase dashboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3, bgcolor: '#f8f9fa', border: '1px dashed #ccc' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <BugReportIcon sx={{ mr: 1, color: 'warning.main' }} />
        <Typography variant="h6">Reports Access Debug Tools</Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        This is a debug component to help troubleshoot issues with the Reports Management page.
        Use these tools to check and fix access policies for the reports table.
      </Alert>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Reports Access
        </Typography>
        <Box sx={{ mb: 2 }}>
          {loading ? (
            <CircularProgress size={24} />
          ) : reports.length > 0 ? (
            <Alert severity="success">
              You can see {reports.length} reports with your current access.
            </Alert>
          ) : (
            <Alert severity="warning">
              You cannot see any reports. This indicates a policy issue.
            </Alert>
          )}
        </Box>
        
        {reports.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Reports Found ({reports.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {reports.map(report => (
                  <ListItem key={report.id}>
                    <ListItemText
                      primary={`Report #${report.id}`}
                      secondary={`${report.reason || 'No reason'} | Status: ${report.status || 'Unknown'} | Created: ${new Date(report.created_at).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Apply SQL to Fix Access Policies
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={12}
          variant="outlined"
          value={customSql}
          onChange={(e) => setCustomSql(e.target.value)}
          sx={{ mb: 2, fontFamily: 'monospace' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={applyPolicies}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Apply SQL Policies'}
          </Button>
        </Box>
        
        {sqlResponse && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              SQL Response:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f1f1f1', maxHeight: 200, overflow: 'auto' }}>
              <pre>{JSON.stringify(sqlResponse, null, 2)}</pre>
            </Paper>
          </Box>
        )}
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        Note: You need to have admin privileges to use these tools. The SQL execution function must also be available.
      </Typography>
    </Paper>
  );
};

export default ReportsPolicyDebug; 