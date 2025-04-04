import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  Code as CodeIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { useNavigate } from 'react-router-dom';
import { logAdminAction } from '../../services/adminService';

// Import the SQL migration scripts
import adminLogsTable from '../../sql/create_admin_logs_table.sql';
import optimizeAdminLogs from '../../sql/optimize_admin_logs.sql';
import execSqlFunction from '../../sql/create_exec_sql_function.sql';
import adminListingPolicies from '../../sql/add_admin_listing_policies.sql';
import adminDeleteFunctions from '../../sql/admin_delete_functions.sql';

const RunMigrations = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [migrationStatus, setMigrationStatus] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  const migrations = [
    {
      id: 'exec_sql_function',
      name: 'Create SQL Execution Function',
      description: 'Creates a function to safely execute SQL migrations (required first)',
      sql: execSqlFunction
    },
    {
      id: 'admin_logs_table',
      name: 'Create Admin Logs Table',
      description: 'Creates the admin_logs table for tracking administrative actions',
      sql: adminLogsTable
    },
    {
      id: 'optimize_admin_logs',
      name: 'Optimize Admin Logs',
      description: 'Adds indexes and optimizations for the admin_logs table',
      sql: optimizeAdminLogs
    },
    {
      id: 'admin_listing_policies',
      name: 'Admin Listing Management Policies',
      description: 'Creates policies allowing administrators to manage all listings',
      sql: adminListingPolicies
    },
    {
      id: 'admin_delete_functions',
      name: 'Admin Listing Deletion Functions',
      description: 'Creates functions to safely delete listings without ambiguity errors',
      sql: adminDeleteFunctions
    }
  ];

  const runMigration = async (migration) => {
    try {
      setMigrationStatus(prev => ({
        ...prev,
        [migration.id]: { status: 'running' }
      }));

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: migration.sql
      });

      if (error) throw error;

      // Log the successful migration
      await logAdminAction(
        'settings',
        `Ran database migration: ${migration.name}`,
        migration.id,
        'database'
      );

      // Add more detailed logging for admin listing policies
      if (migration.id === 'admin_listing_policies') {
        await logAdminAction(
          'create',
          'Created admin policies for managing listings',
          null,
          'policy'
        );
      }
      
      // Add logging for admin deletion functions
      if (migration.id === 'admin_delete_functions') {
        await logAdminAction(
          'create',
          'Created admin functions for safe listing deletion',
          null,
          'function'
        );
      }

      setMigrationStatus(prev => ({
        ...prev,
        [migration.id]: { status: 'success' }
      }));

      return true;
    } catch (error) {
      console.error(`Error running migration ${migration.name}:`, error);
      
      setMigrationStatus(prev => ({
        ...prev,
        [migration.id]: { status: 'error', message: error.message }
      }));
      
      return false;
    }
  };

  const runAllMigrations = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      for (const migration of migrations) {
        const success = await runMigration(migration);
        if (!success) {
          setError(`Failed to run migration: ${migration.name}`);
          break;
        }
      }
    } catch (error) {
      setError(`Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusChip = (status) => {
    if (!status) return null;
    
    switch (status.status) {
      case 'running':
        return (
          <Chip
            icon={<CircularProgress size={16} />}
            label="Running"
            color="warning"
            variant="outlined"
            size="small"
          />
        );
      case 'success':
        return (
          <Chip
            icon={<SuccessIcon />}
            label="Success"
            color="success"
            variant="outlined"
            size="small"
          />
        );
      case 'error':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Error"
            color="error"
            variant="outlined"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/admin/settings')}
          sx={{ mr: 2 }}
        >
          Back to Settings
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Database Migrations
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Available Migrations
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Run these migrations to set up and optimize the admin logs database structure.
          Always backup your database before running migrations in production.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <List>
          {migrations.map((migration, index) => (
            <React.Fragment key={migration.id}>
              <ListItem
                secondaryAction={getStatusChip(migrationStatus[migration.id])}
              >
                <ListItemIcon>
                  <CodeIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={migration.name}
                  secondary={migration.description}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
              {index < migrations.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={isRunning ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={runAllMigrations}
            disabled={isRunning}
          >
            {isRunning ? 'Running Migrations...' : 'Run All Migrations'}
          </Button>
        </Box>
      </Paper>
      
      <Alert severity="info">
        <Typography variant="subtitle2">Important Note</Typography>
        <Typography variant="body2">
          These migrations require appropriate database permissions. If you encounter errors,
          make sure your Supabase SQL function permissions are configured correctly.
        </Typography>
      </Alert>
    </Container>
  );
};

export default RunMigrations; 