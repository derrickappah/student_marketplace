import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { supabase } from '../../services/supabase';

const ReportsDebugPage = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sql, setSql] = useState(`
-- Drop any existing policies
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
  );
  `);
  const [sqlResult, setSqlResult] = useState(null);

  useEffect(() => {
    checkReports();
  }, []);

  const checkReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, reason, status, created_at, user_id')
        .limit(10);
      
      if (error) throw error;
      
      setReports(data || []);
    } catch (err) {
      setError('Error accessing reports: ' + err.message);
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeSql = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSqlResult(null);
    
    try {
      const { data, error } = await supabase.rpc('admin_execute_sql', {
        sql: sql
      });
      
      if (error) throw error;
      
      setSqlResult(data);
      setSuccess('SQL executed successfully.');
      
      // Check if reports are now accessible
      checkReports();
    } catch (err) {
      setError('Error executing SQL: ' + err.message);
      console.error('Error executing SQL:', err);
      
      // Try direct SQL execution with service role
      try {
        console.log('Attempting direct SQL execution...');
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: sql 
        });
        
        if (error) throw error;
        
        setSqlResult(data);
        setSuccess('SQL executed with exec_sql successfully.');
        
        // Check if reports are now accessible
        checkReports();
      } catch (directErr) {
        console.error('Error with direct SQL execution:', directErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const directCheckReports = async () => {
    setLoading(true);
    try {
      // Try using a raw SQL select instead
      const directSql = `SELECT * FROM reports LIMIT 10;`;
      
      try {
        const { data, error } = await supabase.rpc('admin_execute_sql', {
          sql: directSql
        });
        
        if (error) throw error;
        
        setSqlResult(data);
        setSuccess('Direct SQL query successful.');
      } catch (err) {
        console.error('Error with admin_execute_sql:', err);
        
        // Try alternate function name
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: directSql 
          });
          
          if (error) throw error;
          
          setSqlResult(data);
          setSuccess('Direct SQL query with exec_sql successful.');
        } catch (directErr) {
          console.error('Error with exec_sql:', directErr);
          setError('Could not execute SQL directly: ' + directErr.message);
        }
      }
    } catch (err) {
      setError('Error with direct check: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkRlsPolicies = async () => {
    setLoading(true);
    try {
      const policySql = `
        SELECT 
          schemaname, 
          tablename, 
          policyname, 
          roles, 
          cmd, 
          qual
        FROM 
          pg_policies 
        WHERE 
          tablename = 'reports';
      `;
      
      try {
        const { data, error } = await supabase.rpc('admin_execute_sql', {
          sql: policySql
        });
        
        if (error) throw error;
        
        setSqlResult(data);
        setSuccess('RLS policy check successful.');
      } catch (err) {
        console.error('Error checking RLS policies with admin_execute_sql:', err);
        
        // Try alternate function name
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: policySql 
          });
          
          if (error) throw error;
          
          setSqlResult(data);
          setSuccess('RLS policy check with exec_sql successful.');
        } catch (directErr) {
          console.error('Error checking RLS policies with exec_sql:', directErr);
          setError('Could not check RLS policies: ' + directErr.message);
        }
      }
    } catch (err) {
      setError('Error checking RLS policies: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Reports Debug Tools
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page provides direct access to database tools for debugging the reports system.
        Use these tools to check and fix issues with reports access.
      </Alert>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Current Reports Access
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {loading ? (
            <CircularProgress size={24} />
          ) : reports.length > 0 ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              You can see {reports.length} reports with your current access.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You cannot see any reports. This indicates a policy issue.
            </Alert>
          )}
        </Box>
        
        <Button 
          variant="outlined" 
          onClick={checkReports} 
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Refresh Reports
        </Button>

        <Button 
          variant="outlined" 
          onClick={directCheckReports} 
          disabled={loading}
          color="secondary"
        >
          Direct SQL Check
        </Button>
        
        {reports.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Reports:
            </Typography>
            <List dense>
              {reports.map(report => (
                <ListItem key={report.id} divider>
                  <ListItemText
                    primary={`Report ID: ${report.id}`}
                    secondary={`Type: ${report.reason || 'Unknown'} | Status: ${report.status || 'Unknown'} | Created: ${new Date(report.created_at).toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Check RLS Policies
        </Typography>
        
        <Button 
          variant="outlined" 
          onClick={checkRlsPolicies} 
          disabled={loading}
          color="primary"
          sx={{ mb: 2 }}
        >
          Check RLS Policies
        </Button>
        
        {sqlResult && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Result:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
              <pre>{JSON.stringify(sqlResult, null, 2)}</pre>
            </Paper>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Apply SQL to Fix Access Policies
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={20}
          variant="outlined"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          sx={{ mb: 2, fontFamily: 'monospace' }}
        />
        
        <Button
          variant="contained"
          onClick={executeSql}
          disabled={loading}
          color="primary"
        >
          Execute SQL
        </Button>
      </Paper>
    </Container>
  );
};

export default ReportsDebugPage; 