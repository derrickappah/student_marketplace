import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { supabase } from '../../services/supabase';

/**
 * Admin Diagnostics Component
 * This is a standalone component to diagnose various admin panel issues
 */
const AdminDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [dbTables, setDbTables] = useState([]);
  const [reports, setReports] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sql, setSql] = useState(`
-- Simple reports access test query
SELECT * FROM reports LIMIT 10;
  `);
  const [sqlResult, setSqlResult] = useState(null);
  const [supabaseDetails, setSupabaseDetails] = useState(null);

  useEffect(() => {
    getUserInfo();
    listTables();
    checkReports();
    checkPolicies();
    getSupabaseDetails();
  }, []);

  const getUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      setUserInfo(user);
      
      // Check if user is in admin table
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserInfo(prevInfo => ({ ...prevInfo, dbDetails: data }));
        }
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const listTables = async () => {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (error) throw error;
      setDbTables(data || []);
    } catch (error) {
      console.error('Error listing tables:', error);
    }
  };

  const checkReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Basic select
      console.log('Attempting to fetch reports...');
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .limit(10);
        
      if (error) {
        console.error('Error fetching reports:', error);
        setError(`Error fetching reports: ${error.message}`);
      } else {
        console.log(`Found ${data?.length || 0} reports`);
        setReports(data || []);
        if (data?.length > 0) {
          setSuccess(`Successfully found ${data.length} reports`);
        }
      }
    } catch (error) {
      console.error('Error in checkReports:', error);
      setError(`Error in checkReports: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .filter('tablename', 'eq', 'reports');
        
      if (!error && data) {
        setPolicies(data);
      } else {
        console.log('Could not fetch policies directly');
        // Try alternative approach using SQL
        const sqlQuery = `
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
          const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', { 
            sql: sqlQuery 
          });
          
          if (!sqlError && sqlData) {
            setPolicies(sqlData);
          }
        } catch (sqlErr) {
          console.error('Error checking policies with SQL:', sqlErr);
        }
      }
    } catch (error) {
      console.error('Error checking policies:', error);
    }
  };

  const getSupabaseDetails = () => {
    try {
      const details = {
        url: supabase.supabaseUrl,
        authUrl: supabase.authUrl,
        storageUrl: supabase.storageUrl,
        realtimeUrl: supabase.realtimeUrl,
        restUrl: supabase.restUrl,
      };
      setSupabaseDetails(details);
    } catch (error) {
      console.error('Error getting Supabase details:', error);
    }
  };

  const executeSql = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSqlResult(null);
    
    try {
      console.log('Executing SQL:', sql);
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Error executing SQL:', error);
        setError(`Error executing SQL: ${error.message}`);
        
        // Try alternative format
        try {
          console.log('Trying alternative format...');
          const { data: altData, error: altError } = await supabase.rpc('exec_sql', { 
            sql_query: sql 
          });
          
          if (altError) {
            console.error('Error with alternative format:', altError);
          } else {
            console.log('Alternative format result:', altData);
            setSqlResult(altData);
            setSuccess('SQL executed successfully with alternative format');
          }
        } catch (altErr) {
          console.error('Error with alternative try:', altErr);
        }
      } else {
        console.log('SQL result:', data);
        setSqlResult(data);
        setSuccess('SQL executed successfully');
      }
    } catch (error) {
      console.error('Exception executing SQL:', error);
      setError(`Exception executing SQL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disableRls = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const disableRlsSql = `
        ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
      `;
      
      console.log('Disabling RLS...');
      const { error } = await supabase.rpc('exec_sql', { sql: disableRlsSql });
      
      if (error) {
        console.error('Error disabling RLS:', error);
        setError(`Error disabling RLS: ${error.message}`);
      } else {
        console.log('RLS disabled successfully');
        setSuccess('RLS disabled successfully. Please refresh the page to verify reports are now accessible.');
        
        // Verify by fetching reports
        await checkReports();
      }
    } catch (error) {
      console.error('Exception disabling RLS:', error);
      setError(`Exception disabling RLS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admin Diagnostics Panel
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This panel provides diagnostic tools to help troubleshoot issues with admin functionality.
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
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={checkReports} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Check Reports'}
        </Button>
        
        <Button 
          variant="outlined" 
          color="warning"
          onClick={disableRls} 
          disabled={loading}
        >
          Disable RLS (Emergency Fix)
        </Button>
      </Box>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>User Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {userInfo ? (
            <Box>
              <Typography variant="subtitle2">User ID:</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>{userInfo.id}</Typography>
              
              <Typography variant="subtitle2">Email:</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>{userInfo.email}</Typography>
              
              <Typography variant="subtitle2">Role:</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>{userInfo.role || 'Not specified'}</Typography>
              
              {userInfo.dbDetails && (
                <>
                  <Typography variant="subtitle2">Database User Details:</Typography>
                  <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                    {JSON.stringify(userInfo.dbDetails, null, 2)}
                  </pre>
                </>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">No user information available</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Database Tables ({dbTables.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {dbTables.map((table, index) => (
              <ListItem key={index} divider>
                <ListItemText primary={table.table_name} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            Reports ({reports.length})
            {reports.length > 0 && <Chip size="small" color="success" label="Found" sx={{ ml: 1 }} />}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {reports.length > 0 ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Found {reports.length} reports:
              </Typography>
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {reports.map((report, index) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={`ID: ${report.id}`}
                      secondary={`Reporter: ${report.reporter_id || 'Unknown'} | Reason: ${report.reason || 'Not specified'} | Status: ${report.status || 'Unknown'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography color="text.secondary">No reports found</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>RLS Policies for Reports</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {policies.length > 0 ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Found {policies.length} policies:
              </Typography>
              <List dense>
                {policies.map((policy, index) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={policy.policyname}
                      secondary={`Command: ${policy.cmd} | Roles: ${policy.roles} | Using: ${policy.qual}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography color="text.secondary">No policies found for reports table</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Supabase Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {supabaseDetails ? (
            <pre style={{ maxHeight: 200, overflow: 'auto' }}>
              {JSON.stringify(supabaseDetails, null, 2)}
            </pre>
          ) : (
            <Typography color="text.secondary">No Supabase details available</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Execute Custom SQL
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={5}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        variant="outlined"
        sx={{ mb: 2, fontFamily: 'monospace' }}
      />
      
      <Button 
        variant="contained" 
        onClick={executeSql}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Execute SQL'}
      </Button>
      
      {sqlResult && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            SQL Result:
          </Typography>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 300, overflow: 'auto' }}>
            <pre>{JSON.stringify(sqlResult, null, 2)}</pre>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default AdminDiagnostics; 